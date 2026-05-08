import { parseAgentConfig } from "./agent-config";
import type { AgentConfig } from "./agent-config";
import type { ITool } from "./interfaces";

export type PipelineAgentKind = "analysis" | "insights" | "verdict";

export interface CreatePipelineAgentOptions {
  tenantName: string;
  factoryConfig?: AgentConfig;
  promptVars?: Record<string, string>;
  templateVersion?: string;
  platformDeps?: {
    getPlatforms: () => Promise<string[]>;
  };
  tenantContextDeps?: {
    getTenantContext: () => Promise<Record<string, unknown>>;
  };
}

/**
 * Create a pipeline agent config from kind and options.
 * System messages are domain-agnostic; override via factoryConfig.systemMessage.
 */
export function createPipelineAgentConfig(
  kind: PipelineAgentKind,
  options: CreatePipelineAgentOptions,
): AgentConfig {
  void options;
  const configs: Record<PipelineAgentKind, Partial<AgentConfig>> = {
    analysis: {
      name: "Cross-Platform Analysis Agent",
      role: "analysis",
      systemMessage: "You are a cross-platform analysis agent.",
    },
    insights: {
      name: "Insights Generation Agent",
      role: "insights",
      systemMessage: "You are an insights generation agent.",
    },
    verdict: {
      name: "Verdict Agent",
      role: "verdict",
      systemMessage: "You are a verdict generation agent.",
    },
  };

  const partialConfig = configs[kind];
  return parseAgentConfig({
    ...partialConfig,
    runtimeMode: "test",
    variables: [],
    memoryMode: "buffer",
    maxHistoryLength: 10,
    timeoutMs: 60000,
  });
}

/**
 * Create pipeline agent tools based on options.
 */
export function createPipelineAgentTools(options: CreatePipelineAgentOptions): ITool[] {
  void options;
  return [];
}

export type { CreatedAgent } from "./agent-execution-context";
