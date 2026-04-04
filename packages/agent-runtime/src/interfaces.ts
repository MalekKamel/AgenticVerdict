/**
 * Phase 0 contracts for Phase 2 orchestration. No LangChain/LangGraph runtime here.
 */

export interface AgentRunInput {
  goal: string;
  /** Optional structured hints (tenant-safe, non-secret). */
  context?: Readonly<Record<string, string>>;
}

export interface AgentToolCallRecord {
  toolName: string;
  args: Readonly<Record<string, unknown>>;
  result: unknown;
}

export interface AgentRunResult {
  answer: string;
  steps: readonly AgentToolCallRecord[];
}

export interface AgentInvocationContext {
  runId: string;
}

export interface ITool {
  readonly name: string;
  readonly description: string;
  execute(args: Readonly<Record<string, unknown>>, ctx: AgentInvocationContext): Promise<unknown>;
}

export interface IMemory {
  append(role: "user" | "assistant" | "system", content: string): void;
  snapshot(): readonly { role: "user" | "assistant" | "system"; content: string }[];
  clear(): void;
}

export interface IAgent {
  run(input: AgentRunInput, ctx: AgentInvocationContext): Promise<AgentRunResult>;
}
