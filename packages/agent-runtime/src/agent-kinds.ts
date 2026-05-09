import { parseAgentConfig, substituteVariables } from "./agent-config";
import type { AgentConfig, PromptVariable } from "./agent-config";
import type { ITool } from "./interfaces";
import { createPhase4ToolRegistry } from "./agent-tools/phase4-tool-registry";
import type { Phase4AgentToolingDeps } from "./agent-tools/phase4-tool-registry";
import type { PlatformFetchToolDeps } from "./agent-tools/platform-fetch-tools";
import type { TenantContextToolDeps } from "./agent-tools/tenant-context-tools";

export type PipelineAgentKind = "analysis" | "insights" | "verdict";

export interface CreatePipelineAgentOptions {
  tenantName: string;
  factoryConfig?: AgentConfig;
  promptVars?: Record<string, string>;
  templateVersion?: string;
  outputLanguage?: string;
  platformDeps?: {
    getPlatforms: () => Promise<string[]>;
    platformFetch?: PlatformFetchToolDeps;
  };
  tenantContextDeps?: {
    getTenantContext: () => Promise<Record<string, unknown>>;
    tenantContext?: TenantContextToolDeps;
  };
  metricsStore?: Phase4AgentToolingDeps["metricsStore"];
}

/**
 * Create a pipeline agent config from kind and options.
 * System messages are domain-agnostic; override via factoryConfig.systemMessage.
 */
export function createPipelineAgentConfig(
  kind: PipelineAgentKind,
  options: CreatePipelineAgentOptions,
): AgentConfig {
  const baseMessages: Record<PipelineAgentKind, string> = {
    analysis: "You are a cross-platform analysis agent analyzing marketing data for {tenantName}.",
    insights: "You are an insights generation agent creating actionable insights for {tenantName}.",
    verdict: "You are a verdict generation agent evaluating performance for {tenantName}.",
  };

  let systemMessage = baseMessages[kind].replace("{tenantName}", options.tenantName);

  if (options.outputLanguage) {
    const languageName = options.outputLanguage;
    systemMessage += `\nRespond entirely in ${languageName}. All analysis text, titles, descriptions, and recommendations must be in ${languageName}.`;
  }

  if (options.factoryConfig?.systemMessage) {
    systemMessage = options.factoryConfig.systemMessage;
  }

  if (options.promptVars && Object.keys(options.promptVars).length > 0) {
    systemMessage = substituteVariables(systemMessage, options.promptVars);
  }

  const variables: PromptVariable[] = options.promptVars
    ? Object.entries(options.promptVars).map(([name, defaultValue]) => ({
        name,
        description: `Variable: ${name}`,
        required: !defaultValue,
        defaultValue,
      }))
    : [];

  const partialConfig: Partial<AgentConfig> = {
    name: `${kind.charAt(0).toUpperCase() + kind.slice(1)} Agent for ${options.tenantName}`,
    role: kind,
    systemMessage,
    variables,
    metadata: options.templateVersion ? { templateVersion: options.templateVersion } : undefined,
  };

  return parseAgentConfig({
    ...partialConfig,
    runtimeMode: "test",
    memoryMode: "buffer",
    maxHistoryLength: 10,
    timeoutMs: 60000,
  });
}

/**
 * Create pipeline agent tools based on options.
 * Uses createPhase4ToolRegistry when platformDeps or metricsStore are provided.
 */
export function createPipelineAgentTools(options: CreatePipelineAgentOptions): ITool[] {
  const hasPlatformDeps = !!options.platformDeps?.platformFetch;
  const hasTenantContext = !!options.tenantContextDeps?.tenantContext;
  const hasMetricsStore = !!options.metricsStore;

  if (!hasPlatformDeps && !hasMetricsStore && !hasTenantContext) {
    const missing = [];
    if (!hasPlatformDeps) missing.push("platformDeps.platformFetch");
    if (!hasMetricsStore) missing.push("metricsStore");
    if (!hasTenantContext) missing.push("tenantContextDeps.tenantContext");
    console.warn(
      "[createPipelineAgentTools] No tools created — missing required deps:",
      missing.join(", "),
    );
    return [];
  }

  const phase4Deps: Partial<Phase4AgentToolingDeps> = {};

  if (options.metricsStore) {
    phase4Deps.metricsStore = options.metricsStore;
  }

  if (options.platformDeps?.platformFetch) {
    phase4Deps.platform = options.platformDeps.platformFetch;
  }

  if (options.tenantContextDeps?.tenantContext) {
    phase4Deps.tenantContext = options.tenantContextDeps.tenantContext;
  }

  if (!phase4Deps.metricsStore || !phase4Deps.platform) {
    const missing = [];
    if (!phase4Deps.metricsStore) missing.push("metricsStore");
    if (!phase4Deps.platform) missing.push("platformDeps.platformFetch");
    console.warn(
      "[createPipelineAgentTools] No tools created — missing required deps:",
      missing.join(", "),
    );
    return [];
  }

  const registry = createPhase4ToolRegistry(phase4Deps as Phase4AgentToolingDeps);
  return registry.list();
}

export type { CreatedAgent } from "./agent-execution-context";
