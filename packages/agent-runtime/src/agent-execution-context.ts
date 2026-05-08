import type { LlmInvocationCache } from "./llm-invocation-cache";
import type { ITool } from "./interfaces";
import type { ToolRegistry } from "./tools";
import type { IAgent } from "./interfaces";
import type { AgentConfig } from "./agent-config";

/**
 * Runtime execution context for agent creation.
 *
 * Values that cannot be known at configuration time
 * and must be provided at agent creation time.
 */
export interface AgentExecutionContext {
  /** Variable substitutions for system message templates. */
  variables?: Record<string, string>;

  /** Additional tools to inject (beyond configured tools). */
  tools?: ITool[];

  /** LLM invocation cache for performance. */
  cache?: LlmInvocationCache;

  /** Abort signal for cancellation. */
  abortSignal?: AbortSignal;

  /** Override provider for this execution. */
  providerOverride?: string;

  /** Override model for this execution. */
  modelOverride?: string;
}

/**
 * Result of agent creation.
 */
export interface CreatedAgent {
  /** The agent instance ready for execution. */
  agent: IAgent;

  /** The configuration used (for reference). */
  config: AgentConfig;

  /** Tool registry with all enabled tools. */
  registry: ToolRegistry;
}
