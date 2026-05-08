import { parseAgentConfig, parseAgentFactoryConfig, type AgentFactoryConfig } from "./agent-config";
import { ProviderAgent, type ProviderAgentOptions } from "./provider-agent";
import type { LlmInvocationCache } from "./llm-invocation-cache";
import { createAgentMemory } from "./memory";
import type { IAgent, ITool } from "./interfaces";
import { ToolRegistry } from "./tools";
import { getTenantContextFromAsyncLocalStorage } from "./deployment/trafficManager";
import { requireTenantContext } from "@agenticverdict/core";
import { defaultTenantAIConfig } from "@agenticverdict/core/tenant/config-schema";
import type { AgentLlmEnv } from "./llm-env";

export interface AgentFactoryDeps {
  /**
   * Used when {@link AgentFactoryConfig.runtimeMode} is `production` to build primary/fallback models.
   * Note: Production mode now requires tenant context via AsyncLocalStorage for multi-tenant credential isolation.
   */
  llmEnv?: AgentLlmEnv;
}

/**
 * Category 4 factory: validated config, explicit prod vs test wiring, memory mode selection, and tool registry helpers.
 */
export class AgentFactory {
  constructor(private readonly deps: AgentFactoryDeps) {}

  /**
   * Parses and freezes logical config (callers may pass partials; Zod applies defaults).
   */
  normalizeConfig(input: unknown): AgentFactoryConfig {
    return parseAgentFactoryConfig(input);
  }

  createMemory(config: AgentFactoryConfig): ReturnType<typeof createAgentMemory> {
    return createAgentMemory(config);
  }

  /**
   * Registers the provided tools on a new {@link ToolRegistry} (duplicate names throw).
   */
  createToolRegistry(tools: readonly ITool[]): ToolRegistry {
    const registry = new ToolRegistry();
    for (const t of tools) {
      registry.register(t);
    }
    return registry;
  }

  /**
   * Selects provider and model based on tenant AI configuration and agent role.
   * Falls back to default configuration if tenant has no custom settings.
   */
  private selectProviderFromTenantConfig(role: AgentFactoryConfig["role"]): {
    providerId: string;
    modelId: string;
    fallbackProviderId?: string;
    fallbackModelId?: string;
  } {
    const tenantContext = requireTenantContext();
    const aiConfig = tenantContext.config.ai || defaultTenantAIConfig;

    // Try role-based model configuration first
    if (aiConfig.roleBasedModels) {
      if (role === "analysis" && aiConfig.roleBasedModels.analysis) {
        return {
          providerId: aiConfig.roleBasedModels.analysis.providerId,
          modelId: aiConfig.roleBasedModels.analysis.modelId,
        };
      }
      if (role === "insights" && aiConfig.roleBasedModels.insights) {
        return {
          providerId: aiConfig.roleBasedModels.insights.providerId,
          modelId: aiConfig.roleBasedModels.insights.modelId,
        };
      }
      if (role === "verdict" && aiConfig.roleBasedModels.reports) {
        return {
          providerId: aiConfig.roleBasedModels.reports.providerId,
          modelId: aiConfig.roleBasedModels.reports.modelId,
        };
      }
    }

    // Fall back to default model
    if (aiConfig.defaultModel) {
      return {
        providerId: aiConfig.defaultModel.providerId,
        modelId: aiConfig.defaultModel.modelId,
      };
    }

    // Ultimate fallback: use primary provider with sensible defaults
    const primaryProvider = aiConfig.primaryProvider || "anthropic";
    const defaultModelsByRole: Record<AgentFactoryConfig["role"], string> = {
      analysis: "claude-3-5-sonnet-20241022",
      insights: "claude-3-5-sonnet-20241022",
      verdict: "claude-3-5-sonnet-20241022",
    };

    return {
      providerId: primaryProvider,
      modelId: defaultModelsByRole[role],
    };
  }

  /**
   * Selects fallback provider from tenant failover configuration.
   */
  private selectFallbackProvider(): {
    fallbackProviderId?: string;
    fallbackModelId?: string;
  } | null {
    const tenantContext = requireTenantContext();
    const aiConfig = tenantContext.config.ai || defaultTenantAIConfig;

    if (!aiConfig.failover?.enabled || !aiConfig.failover.fallbackProviders?.length) {
      return null;
    }

    // Use first fallback provider from tenant config
    const fallbackProviderId = aiConfig.failover.fallbackProviders[0];

    // Try to get model for this provider from roleBasedModels or use default
    let fallbackModelId: string | undefined;

    if (aiConfig.roleBasedModels) {
      // Try to find a model for this provider in any role
      const roles = ["analysis", "insights", "reports"] as const;
      for (const role of roles) {
        if (aiConfig.roleBasedModels[role]?.providerId === fallbackProviderId) {
          fallbackModelId = aiConfig.roleBasedModels[role]?.modelId;
          break;
        }
      }
    }

    // If no specific model found, use a sensible default
    if (!fallbackModelId) {
      fallbackModelId =
        fallbackProviderId === "openai"
          ? "gpt-4o"
          : fallbackProviderId === "google"
            ? "gemini-1.5-pro"
            : "claude-3-5-sonnet-20241022";
    }

    return {
      fallbackProviderId,
      fallbackModelId,
    };
  }

  createChatModels(config: AgentFactoryConfig): {
    providerId: string;
    modelId: string;
    fallbackProviderId?: string;
    fallbackModelId?: string;
  } {
    if (config.runtimeMode === "test") {
      throw new Error('Use createTestAgent() with a mock provider when runtimeMode is "test".');
    }

    const tenantId = getTenantContextFromAsyncLocalStorage();

    if (!tenantId) {
      throw new Error(
        "Production mode requires tenant context for multi-tenant credential isolation. " +
          "Ensure tenant context is set via AsyncLocalStorage before creating production agents.",
      );
    }

    const primary = this.selectProviderFromTenantConfig(config.role);
    const fallback = this.selectFallbackProvider();

    return {
      ...primary,
      ...fallback,
    };
  }

  /**
   * Deterministic agent for CI: uses ProviderAgent with mock configuration.
   */
  createTestAgent(
    config: unknown,
    mockLlm?: unknown,
    agentOptions?: Pick<ProviderAgentOptions, "invocationCache">,
  ): IAgent {
    const cfg = parseAgentFactoryConfig({
      ...(typeof config === "object" && config !== null ? config : {}),
      runtimeMode: "test",
    });
    const memory = this.createMemory(cfg);
    return new ProviderAgent({
      factoryConfig: cfg,
      memory,
      providerId: "mock",
      modelId: "mock-model",
      invocationCache: agentOptions?.invocationCache,
      mockLlm,
    });
  }

  /**
   * Production agent: real providers from ProviderFactory with tenant-scoped credentials.
   * Requires tenant context to be set via AsyncLocalStorage for multi-tenant credential isolation.
   */
  createAgent(config: unknown): IAgent {
    const cfg = parseAgentConfig(config);
    if (cfg.runtimeMode === "test") {
      throw new Error(
        'createAgent() requires runtimeMode "production"; use createTestAgent() for tests.',
      );
    }

    const tenantId = getTenantContextFromAsyncLocalStorage();

    if (!tenantId) {
      throw new Error(
        "Production mode requires tenant context for multi-tenant credential isolation. " +
          "Ensure tenant context is set via AsyncLocalStorage before creating production agents.",
      );
    }

    const memory = this.createMemory(cfg);
    const primary = this.selectProviderFromTenantConfig(cfg.role);
    const fallback = this.selectFallbackProvider();

    return new ProviderAgent({
      factoryConfig: cfg,
      memory,
      ...primary,
      ...fallback,
    });
  }

  /**
   * Builds a tool registry plus an {@link IAgent}. When `runtimeMode` is `test`, uses ProviderAgent with mock configuration.
   * Production mode requires tenant context for multi-tenant credential isolation.
   */
  createAgentWithTools(
    config: unknown,
    tools: readonly ITool[],
    options?: { invocationCache?: LlmInvocationCache },
  ): { agent: IAgent; tools: ToolRegistry } {
    const registry = this.createToolRegistry(tools);
    const cfg = parseAgentFactoryConfig(config);
    const memory = this.createMemory(cfg);
    const defaultAutoToolsByRole: Record<AgentFactoryConfig["role"], readonly string[]> = {
      analysis: [
        "get_tenant_profile",
        "get_business_rules",
        "get_config",
        "fetch_meta_metrics",
        "fetch_ga4_metrics",
        "fetch_gsc_metrics",
        "fetch_gbp_metrics",
        "fetch_tiktok_metrics",
        "calculate_metrics",
        "compute_b2b_kpis_from_snapshots",
      ],
      insights: ["get_config", "analyze_trends", "statistical_analysis"],
      verdict: ["get_tenant_profile", "get_business_rules", "generate_summary", "format_report"],
    };
    const autoToolNames = defaultAutoToolsByRole[cfg.role];
    if (cfg.runtimeMode === "test") {
      return {
        tools: registry,
        agent: new ProviderAgent({
          factoryConfig: cfg,
          memory,
          providerId: "mock",
          modelId: "mock-model",
          toolRegistry: registry,
          autoToolNames,
          invocationCache: options?.invocationCache,
        }),
      };
    }

    const tenantId = getTenantContextFromAsyncLocalStorage();

    if (!tenantId) {
      throw new Error(
        "Production mode requires tenant context for multi-tenant credential isolation. " +
          "Ensure tenant context is set via AsyncLocalStorage before creating production agents.",
      );
    }

    const primary = this.selectProviderFromTenantConfig(cfg.role);
    const fallback = this.selectFallbackProvider();

    return {
      tools: registry,
      agent: new ProviderAgent({
        factoryConfig: cfg,
        memory,
        ...primary,
        ...fallback,
        toolRegistry: registry,
        autoToolNames,
        invocationCache: options?.invocationCache,
      }),
    };
  }
}
