/**
 * Agent-facing types, tool registry, and stubs. LangChain/LangGraph orchestration is Phase 2.
 */
export type {
  AgentInvocationContext,
  AgentRunInput,
  AgentRunResult,
  AgentToolCallRecord,
  IAgent,
  IMemory,
  ITool,
} from "./interfaces";
export {
  AgentLifecycleController,
  type AgentLifecycle,
  type AgentLifecycleState,
} from "./lifecycle";
export { loadLlmEnvFromProcess, type LlmProviderEnv } from "./llm-env";
export { InMemoryAgentMemory } from "./memory";
export { createRuleBasedEchoAgent, type RuleBasedAgentOptions } from "./rule-based-agent";
export { withPrimaryFallback, withRetries, type RetryOptions } from "./resilience";
export { defineTool, ToolRegistry, type ToolDefinition, type ToolHandler } from "./tools";

export const AGENT_RUNTIME_PACKAGE_VERSION = "0.1.0";
