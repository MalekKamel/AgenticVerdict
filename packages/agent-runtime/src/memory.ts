import type { AgentFactoryConfig, AgentMemoryMode } from "./agent-config";
import type { IMemory } from "./interfaces";

type MemoryTurn = { role: "user" | "assistant" | "system"; content: string };

/** Unbounded buffer (legacy); prefer {@link BoundedBufferMemory} for production agents. */
export class InMemoryAgentMemory implements IMemory {
  private readonly turns: MemoryTurn[] = [];

  append(role: MemoryTurn["role"], content: string): void {
    this.turns.push({ role, content });
  }

  snapshot(): readonly MemoryTurn[] {
    return [...this.turns];
  }

  clear(): void {
    this.turns.length = 0;
  }
}

/** No retained conversation state (factory `memoryMode: "none"`). */
export class NullAgentMemory implements IMemory {
  append(role: MemoryTurn["role"], content: string): void {
    void role;
    void content;
  }

  snapshot(): readonly MemoryTurn[] {
    return [];
  }

  clear(): void {}
}

/**
 * FIFO short-term buffer with a hard turn cap. Oldest turns drop first (no long-term summary).
 */
export class BoundedBufferMemory implements IMemory {
  private readonly turns: MemoryTurn[] = [];

  constructor(private readonly maxTurns: number) {}

  append(role: MemoryTurn["role"], content: string): void {
    this.turns.push({ role, content });
    const max = this.maxTurns;
    while (this.turns.length > max) {
      this.turns.shift();
    }
  }

  snapshot(): readonly MemoryTurn[] {
    return [...this.turns];
  }

  clear(): void {
    this.turns.length = 0;
  }
}

const ENTITY_LINE = /^ENTITY:([^=]+)=(.+)$/;

function trimToMaxChars(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(text.length - maxChars);
}

function extractEntityLines(content: string): Array<{ key: string; value: string }> {
  const out: Array<{ key: string; value: string }> = [];
  for (const line of content.split("\n")) {
    const m = ENTITY_LINE.exec(line.trim());
    if (m?.[1] !== undefined && m[2] !== undefined) {
      out.push({ key: m[1].trim(), value: m[2].trim() });
    }
  }
  return out;
}

/**
 * Short-term buffer plus rolling long-term text, optional keyword “semantic” snippets, and ENTITY lines.
 * Evicted buffer turns append to the long-term summary (trimmed) when enabled.
 */
export class CompositeAgentMemory implements IMemory {
  private readonly buffer: MemoryTurn[] = [];

  private longTermSummary = "";

  private readonly snippets: string[] = [];

  private readonly entities = new Map<string, string>();

  constructor(
    private readonly mode: "buffer_summary" | "full",
    private readonly limits: {
      maxBufferTurns: number;
      maxLongTermChars: number;
      mergeEvictedTurnsIntoSummary: boolean;
      maxSemanticSnippets: number;
      maxEntities: number;
    },
  ) {}

  append(role: MemoryTurn["role"], content: string): void {
    if (this.mode === "full" && role === "assistant") {
      const snippet = content.trim().slice(0, 160);
      if (snippet.length > 0 && this.snippets[this.snippets.length - 1] !== snippet) {
        this.snippets.push(snippet);
        while (this.snippets.length > this.limits.maxSemanticSnippets) {
          this.snippets.shift();
        }
      }
      for (const { key, value } of extractEntityLines(content)) {
        if (this.entities.has(key)) {
          this.entities.delete(key);
        }
        this.entities.set(key, value);
        while (this.entities.size > this.limits.maxEntities) {
          const first = this.entities.keys().next().value;
          if (first === undefined) {
            break;
          }
          this.entities.delete(first);
        }
      }
    }

    this.buffer.push({ role, content });
    const maxBuf = this.limits.maxBufferTurns;
    while (this.buffer.length > maxBuf) {
      const dropped = this.buffer.shift();
      if (
        dropped !== undefined &&
        this.limits.mergeEvictedTurnsIntoSummary &&
        (this.mode === "buffer_summary" || this.mode === "full")
      ) {
        const piece = `${dropped.role}: ${dropped.content}`;
        this.longTermSummary = trimToMaxChars(
          this.longTermSummary.length > 0 ? `${this.longTermSummary}\n${piece}` : piece,
          this.limits.maxLongTermChars,
        );
      }
    }
  }

  snapshot(): readonly MemoryTurn[] {
    const head: MemoryTurn[] = [];
    if (this.longTermSummary.trim().length > 0) {
      head.push({ role: "system", content: `[prior conversation]\n${this.longTermSummary}` });
    }
    if (this.mode === "full" && this.entities.size > 0) {
      const lines = [...this.entities.entries()].map(([k, v]) => `${k}=${v}`);
      head.push({ role: "system", content: `[entities]\n${lines.join("\n")}` });
    }
    if (this.mode === "full" && this.snippets.length > 0) {
      const tail = this.snippets.slice(-8).join("\n---\n");
      head.push({ role: "system", content: `[memory snippets]\n${tail}` });
    }
    return [...head, ...this.buffer];
  }

  clear(): void {
    this.buffer.length = 0;
    this.longTermSummary = "";
    this.snippets.length = 0;
    this.entities.clear();
  }

  /**
   * Lightweight retrieval without embeddings: returns up to `k` snippets containing any query token.
   */
  findSemanticSnippets(query: string, k: number): readonly string[] {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (tokens.length === 0 || this.snippets.length === 0) {
      return [];
    }
    const hits = this.snippets.filter((s) => {
      const sl = s.toLowerCase();
      return tokens.some((w) => sl.includes(w));
    });
    return hits.slice(-k);
  }

  getLongTermSummaryForTests(): string {
    return this.longTermSummary;
  }
}

export function createAgentMemory(factoryConfig: AgentFactoryConfig): IMemory {
  return createMemoryForMode(factoryConfig.memoryMode, factoryConfig);
}

export function createMemoryForMode(
  mode: AgentMemoryMode,
  factoryConfig: AgentFactoryConfig,
): IMemory {
  const limits = factoryConfig.memoryLimits;
  switch (mode) {
    case "none":
      return new NullAgentMemory();
    case "buffer":
      return new BoundedBufferMemory(limits.maxBufferTurns);
    case "buffer_summary":
      return new CompositeAgentMemory("buffer_summary", limits);
    case "full":
      return new CompositeAgentMemory("full", limits);
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}
