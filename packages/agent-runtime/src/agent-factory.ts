import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

import type { AgentFactoryConfig } from "./agent-config";
import { parseAgentFactoryConfig } from "./agent-config";
import type { AgentLlmEnv } from "./llm-env";
import {
  createChatModelForPreference,
  DEFAULT_AGENT_MODEL_PRESETS,
  resolveProviderWithAvailableKeys,
  type AgentLlmRole,
  type LlmPrimaryPreference,
} from "./chat-models";
import { ConfigurableLlmAgent, type ConfigurableLlmAgentOptions } from "./configurable-llm-agent";
import { createAgentMemory } from "./memory";
import { AgentMockChatModel, type AgentMockChatModelFields } from "./mock-chat-model";
import type { IAgent, ITool } from "./interfaces";
import { ToolRegistry } from "./tools";

export interface AgentFactoryDeps {
  /**
   * Used when {@link AgentFactoryConfig.runtimeMode} is `production` to build primary/fallback models.
   */
  llmEnv: Pick<AgentLlmEnv, "anthropicApiKey" | "openAiApiKey">;
}

function createChatModelsForRole(
  role: AgentLlmRole,
  env: Pick<AgentLlmEnv, "anthropicApiKey" | "openAiApiKey">,
  temperature?: number,
): { primary: BaseChatModel; fallback?: BaseChatModel } {
  const preset = DEFAULT_AGENT_MODEL_PRESETS[role];
  const primaryPref = resolveProviderWithAvailableKeys(preset.primary, env);
  const secondaryPref: LlmPrimaryPreference = primaryPref === "anthropic" ? "openai" : "anthropic";
  const temp = temperature ?? preset.temperature;
  const opts = {
    anthropicApiKey: env.anthropicApiKey,
    openAiApiKey: env.openAiApiKey,
    anthropicModel: preset.anthropicModel,
    openAiModel: preset.openAiModel,
    temperature: temp,
  };

  const primary = createChatModelForPreference(primaryPref, opts);

  const secondaryKeyOk =
    secondaryPref === "anthropic"
      ? env.anthropicApiKey !== undefined
      : env.openAiApiKey !== undefined;

  const fallback =
    secondaryKeyOk && secondaryPref !== primaryPref
      ? createChatModelForPreference(secondaryPref, opts)
      : undefined;

  return { primary, fallback };
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
    primary: BaseChatModel;
    fallback?: BaseChatModel;
  } {
    if (config.runtimeMode === "test") {
      throw new Error('Use createTestChatModel() or createTestAgent() when runtimeMode is "test".');
    }
    return createChatModelsForRole(config.role, this.deps.llmEnv, config.temperature);
  }

  createTestChatModel(overrides?: AgentMockChatModelFields): AgentMockChatModel {
    return new AgentMockChatModel(overrides ?? {});
  }

  /**
   * Production agent: real providers from {@link AgentFactoryDeps.llmEnv} (or throws from LangChain if keys missing).
   */
  createAgent(
    config: unknown,
    agentOptions?: Pick<ConfigurableLlmAgentOptions, "invocationCache">,
  ): IAgent {
    const cfg = parseAgentFactoryConfig(config);
    if (cfg.runtimeMode === "test") {
      throw new Error(
        'createAgent() requires runtimeMode "production"; use createTestAgent() for tests.',
      );
    }
    const { primary, fallback } = createChatModelsForRole(
      cfg.role,
      this.deps.llmEnv,
      cfg.temperature,
    );
    const memory = this.createMemory(cfg);
    return new ConfigurableLlmAgent({
      factoryConfig: cfg,
      memory,
      primary,
      fallback,
      invocationCache: agentOptions?.invocationCache,
    });
  }

  /**
   * Deterministic agent for CI: uses {@link AgentMockChatModel} unless a mock is supplied.
   */
  createTestAgent(
    config: unknown,
    mockLlm?: BaseChatModel,
    agentOptions?: Pick<ConfigurableLlmAgentOptions, "invocationCache">,
  ): IAgent {
    const cfg = parseAgentFactoryConfig({
      ...(typeof config === "object" && config !== null ? config : {}),
      runtimeMode: "test",
    });
    const primary = mockLlm ?? new AgentMockChatModel({});
    const memory = this.createMemory(cfg);
    return new ConfigurableLlmAgent({
      factoryConfig: cfg,
      memory,
      primary,
      fallback: undefined,
      invocationCache: agentOptions?.invocationCache,
    });
  }

  /**
   * Builds a tool registry plus an {@link IAgent}. When `runtimeMode` is `test`, uses {@link AgentMockChatModel}
   * like {@link createTestAgent}; otherwise uses production chat models (requires provider keys).
   */
  createAgentWithTools(
    config: unknown,
    tools: readonly ITool[],
  ): { agent: IAgent; tools: ToolRegistry } {
    const registry = this.createToolRegistry(tools);
    const cfg = parseAgentFactoryConfig(config);
    const memory = this.createMemory(cfg);
    if (cfg.runtimeMode === "test") {
      return {
        tools: registry,
        agent: new ConfigurableLlmAgent({
          factoryConfig: cfg,
          memory,
          primary: new AgentMockChatModel({}),
          fallback: undefined,
        }),
      };
    }
    const { primary, fallback } = createChatModelsForRole(
      cfg.role,
      this.deps.llmEnv,
      cfg.temperature,
    );
    return {
      tools: registry,
      agent: new ConfigurableLlmAgent({ factoryConfig: cfg, memory, primary, fallback }),
    };
  }
}
