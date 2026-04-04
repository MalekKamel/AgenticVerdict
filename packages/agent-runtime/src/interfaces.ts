/**
 * Phase 0 contracts for Phase 2 orchestration. No LangChain/LangGraph runtime here.
 */

/**
 * Optional hints plus an optional high-volume tool/metrics blob (trimmed under assembled prompt budget).
 */
export type AgentRunContext = Readonly<Record<string, string>> & {
  toolContext?: string;
};

export interface AgentRunInput {
  goal: string;
  /** Optional structured hints (tenant-safe, non-secret). */
  context?: AgentRunContext;
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

/**
 * Correlation handles for a single agent run. Built by `runAgentJob` from the active tenant
 * scope. Tools should use `getTenantContext()` from `@agenticverdict/core` for full config
 * while executing under the same async continuation as the job.
 */
export interface AgentInvocationContext {
  runId: string;
  tenantId: string;
  requestId: string;
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
