import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AgentMockChatModel } from "@agenticverdict/testing";

import type { AgentFactoryConfig } from "./agent-config";
import { parseAgentFactoryConfig } from "./agent-config";
import { createPrimaryAndFallbackChatModels, type AgentLlmCredentialEnv } from "./chat-models";
import { ConfigurableLlmAgent, type ConfigurableLlmAgentOptions } from "./configurable-llm-agent";
import { createAgentMemory } from "./memory";
import type { IAgent, ITool } from "./interfaces";
import { ToolRegistry } from "./tools";

export interface AgentFactoryDeps {
  /**
   * Used when {@link AgentFactoryConfig.runtimeMode} is `production` to build primary/fallback models.
   */
  llmEnv: AgentLlmCredentialEnv;
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
      throw new Error(
        'Use createTestAgent() with a mock BaseChatModel from `@agenticverdict/testing` when runtimeMode is "test".',
      );
    }
    return createPrimaryAndFallbackChatModels(config.role, this.deps.llmEnv, config.temperature);
  }

  /**
   * Deterministic agent for CI: pass a mock {@link BaseChatModel} (for example `AgentMockChatModel` from `@agenticverdict/testing`) or omit to use that package default.
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
    const { primary, fallback } = createPrimaryAndFallbackChatModels(
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
   * Builds a tool registry plus an {@link IAgent}. When `runtimeMode` is `test`, uses the default mock chat model
   * from `@agenticverdict/testing` unless you pass `testChatModel`.
   */
  createAgentWithTools(
    config: unknown,
    tools: readonly ITool[],
    options?: { testChatModel?: BaseChatModel },
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
          primary: options?.testChatModel ?? new AgentMockChatModel({}),
          fallback: undefined,
        }),
      };
    }
    const { primary, fallback } = createPrimaryAndFallbackChatModels(
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
