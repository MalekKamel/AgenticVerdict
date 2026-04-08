import type { BaseMessage } from "@langchain/core/messages";
import {
  type BaseChatModelParams,
  SimpleChatModel,
} from "@langchain/core/language_models/chat_models";

import { MOCK_LLM_LIBRARY, type MockLlmLibraryEntry } from "./mock-llm-library";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function messageText(message: BaseMessage): string {
  const { content } = message;
  return typeof content === "string" ? content : JSON.stringify(content);
}

function lastHumanText(messages: BaseMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m !== undefined && m._getType() === "human") {
      return messageText(m);
    }
  }
  return "";
}

function randomInRangeInclusive(min: number, max: number, rng: () => number): number {
  if (max <= min) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

export type AgentMockChatModelFailureKind = "none" | "transient_http" | "timeout";

export interface AgentMockChatModelFields extends BaseChatModelParams {
  /** Matched before bundled {@link MOCK_LLM_LIBRARY} entries. */
  customEntries?: readonly MockLlmLibraryEntry[];
  /** When no substring matches. */
  defaultResponse?: string;
  failureKind?: AgentMockChatModelFailureKind;
  /** Used when {@link failureKind} is `timeout` (reject after this delay). */
  timeoutAfterMs?: number;
  /** Inclusive artificial latency bounds before success path (deterministic if {@link rng} fixed). */
  delayMsRange?: readonly [number, number];
  rng?: () => number;
}

/**
 * LangChain {@link SimpleChatModel} for deterministic CI: library matching, optional delays, and failure injection.
 */
export class AgentMockChatModel extends SimpleChatModel {
  private readonly customEntries: readonly MockLlmLibraryEntry[];

  private readonly defaultResponse: string;

  private readonly failureKind: AgentMockChatModelFailureKind;

  private readonly timeoutAfterMs: number;

  private readonly delayMsRange: readonly [number, number];

  private readonly rng: () => number;

  private callCount = 0;

  constructor(fields: AgentMockChatModelFields = {}) {
    super(fields);
    this.customEntries = fields.customEntries ?? [];
    this.defaultResponse =
      fields.defaultResponse ?? "MOCK_DEFAULT: No canned match for this prompt.";
    this.failureKind = fields.failureKind ?? "none";
    this.timeoutAfterMs = fields.timeoutAfterMs ?? 5;
    this.delayMsRange = fields.delayMsRange ?? [0, 0];
    this.rng = fields.rng ?? Math.random;
  }

  _llmType(): string {
    return "agenticverdict-mock-chat";
  }

  getCallCount(): number {
    return this.callCount;
  }

  resetCallCount(): void {
    this.callCount = 0;
  }

  private pickResponse(haystack: string): string {
    const lower = haystack.toLowerCase();
    const merged = [...this.customEntries, ...MOCK_LLM_LIBRARY];
    for (const entry of merged) {
      if (lower.includes(entry.matchSubstring.toLowerCase())) {
        return entry.response;
      }
    }
    return this.defaultResponse;
  }

  async _call(messages: BaseMessage[]): Promise<string> {
    this.callCount += 1;
    const [dMin, dMax] = this.delayMsRange;
    const delayMs = randomInRangeInclusive(dMin, dMax, this.rng);
    if (delayMs > 0) {
      await sleep(delayMs);
    }

    if (this.failureKind === "timeout") {
      await sleep(this.timeoutAfterMs);
      const err = new Error("mock LLM timeout");
      Object.assign(err, { code: "ETIMEDOUT" });
      throw err;
    }

    if (this.failureKind === "transient_http") {
      const err = new Error("mock rate limit");
      Object.assign(err, { status: 429 });
      throw err;
    }

    return this.pickResponse(lastHumanText(messages));
  }
}
