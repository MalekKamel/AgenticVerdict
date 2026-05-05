import type { AgentFactoryConfig } from "./agent-config";
import { parseAgentFactoryConfig } from "./agent-config";
import { ProviderAgent, type ProviderAgentOptions } from "./provider-agent";
import type { LlmInvocationCache } from "./llm-invocation-cache";
import { createAgentMemory } from "./memory";
import type { IAgent, ITool } from "./interfaces";
import { ToolRegistry } from "./tools";
import { getTenantContextFromAsyncLocalStorage } from "./deployment/trafficManager";

export interface AgentFactoryDeps {
  /**
   * Used when {@link AgentFactoryConfig.runtimeMode} is `production` to build primary/fallback models.
   * Note: Production mode now requires tenant context via AsyncLocalStorage for multi-tenant credential isolation.
   */
  llmEnv?: Record<string, never>;
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

    return {
      providerId: "openai",
      modelId: config.role === "verdict" ? "gpt-4-turbo" : "gpt-4o",
      fallbackProviderId: "anthropic",
      fallbackModelId: "claude-3-5-sonnet-20241022",
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
    });
  }

  /**
   * Production agent: real providers from ProviderFactory with tenant-scoped credentials.
   * Requires tenant context to be set via AsyncLocalStorage for multi-tenant credential isolation.
   */
  createAgent(
    config: unknown,
    agentOptions?: Pick<ProviderAgentOptions, "invocationCache">,
  ): IAgent {
    const cfg = parseAgentFactoryConfig(config);
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
    return new ProviderAgent({
      factoryConfig: cfg,
      memory,
      providerId: cfg.role === "verdict" ? "openai" : "openai",
      modelId: cfg.role === "verdict" ? "gpt-4-turbo" : "gpt-4o",
      fallbackProviderId: "anthropic",
      fallbackModelId: "claude-3-5-sonnet-20241022",
      invocationCache: agentOptions?.invocationCache,
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

    return {
      tools: registry,
      agent: new ProviderAgent({
        factoryConfig: cfg,
        memory,
        providerId: "openai",
        modelId: cfg.role === "verdict" ? "gpt-4-turbo" : "gpt-4o",
        fallbackProviderId: "anthropic",
        fallbackModelId: "claude-3-5-sonnet-20241022",
        toolRegistry: registry,
        autoToolNames,
        invocationCache: options?.invocationCache,
      }),
    };
  }
}
