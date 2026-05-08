import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { AgentFactory } from "./agent-factory";
import {
  extractVariablesFromTemplate,
  substituteVariables,
  parseAgentConfig,
  safeParseAgentConfig,
} from "./agent-config";
import { ProviderRegistry } from "./core/ProviderRegistry";
import { BaseProvider } from "./core/BaseProvider";
import type { ChatCompletionResponse } from "./types/chat";
import { defineTool } from "./tools";

class MockProvider extends BaseProvider {
  readonly providerId = "mock";
  readonly capabilities = {
    chat: true,
    chatStreaming: false,
    chatVision: false,
    chatTools: true,
    embeddings: false,
    imageGeneration: false,
    textToSpeech: false,
  };

  async chat(): Promise<ChatCompletionResponse> {
    return {
      id: "mock-completion",
      object: "chat.completion",
      created: Date.now(),
      model: "mock-model",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "MOCK_RESPONSE" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };
  }

  async destroy(): Promise<void> {
    // No-op for mock provider
  }
}

beforeEach(() => {
  ProviderRegistry.register("mock", MockProvider);
});

afterEach(() => {
  ProviderRegistry.unregister("mock");
  vi.unstubAllEnvs();
});

describe("Unified AgentFactory", () => {
  describe("parseAgentConfig", () => {
    it("validates minimal config with required fields only", () => {
      const config = {
        name: "Test Agent",
        role: "analysis" as const,
        systemMessage: "You are a test agent",
      };

      const result = parseAgentConfig(config);

      expect(result.name).toBe("Test Agent");
      expect(result.role).toBe("analysis");
      expect(result.systemMessage).toBe("You are a test agent");
      expect(result.runtimeMode).toBe("production");
      expect(result.memoryMode).toBe("buffer");
      expect(result.maxHistoryLength).toBe(10);
      expect(result.timeoutMs).toBe(60000);
    });

    it("validates full config with all optional fields", () => {
      const config = {
        name: "Full Agent",
        role: "insights" as const,
        systemMessage: "Full config test",
        runtimeMode: "test" as const,
        description: "A comprehensive test agent",
        variables: [{ name: "tenant", required: true }],
        tools: [{ name: "test_tool", enabled: true }],
        autoTools: ["test_tool"],
        memoryMode: "buffer_summary" as const,
        memoryLimits: {
          maxBufferTurns: 50,
          maxLongTermChars: 10000,
          mergeEvictedTurnsIntoSummary: true,
          maxSemanticSnippets: 20,
          maxEntities: 30,
        },
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet-20241022",
        modelParams: {
          temperature: 0.5,
          maxTokens: 2048,
          topP: 0.9,
          frequencyPenalty: 0.1,
          presencePenalty: 0.1,
        },
        outputFormat: {
          type: "json" as const,
          strictValidation: true,
          jsonSchema: { type: "object" },
        },
        timeoutMs: 120000,
        retryConfig: {
          maxRetries: 5,
          initialDelayMs: 2000,
          maxDelayMs: 20000,
        },
        tokenBudgets: {
          tenantContextMaxApproxTokens: 2048,
          maxAssembledPromptApproxTokens: 8000,
        },
        isActive: true,
        version: 2,
        metadata: { custom: "value" },
      };

      const result = parseAgentConfig(config);

      expect(result.name).toBe("Full Agent");
      expect(result.role).toBe("insights");
      expect(result.runtimeMode).toBe("test");
      expect(result.description).toBe("A comprehensive test agent");
      expect(result.variables).toHaveLength(1);
      expect(result.tools).toHaveLength(1);
      expect(result.autoTools).toEqual(["test_tool"]);
      expect(result.memoryMode).toBe("buffer_summary");
      expect(result.memoryLimits?.maxBufferTurns).toBe(50);
      expect(result.providerId).toBe("anthropic");
      expect(result.modelId).toBe("claude-3-5-sonnet-20241022");
      expect(result.modelParams.temperature).toBe(0.5);
      expect(result.outputFormat.type).toBe("json");
      expect(result.timeoutMs).toBe(120000);
      expect(result.retryConfig.maxRetries).toBe(5);
      expect(result.metadata).toEqual({ custom: "value" });
    });

    it("rejects invalid role", () => {
      const config = {
        name: "Invalid",
        role: "invalid_role",
        systemMessage: "Test",
      };

      expect(() => parseAgentConfig(config)).toThrow();
    });

    it("rejects empty system message", () => {
      const config = {
        name: "Invalid",
        role: "analysis",
        systemMessage: "",
      };

      expect(() => parseAgentConfig(config)).toThrow();
    });

    it("rejects invalid variable name format", () => {
      const config = {
        name: "Invalid",
        role: "analysis",
        systemMessage: "Test",
        variables: [{ name: "123invalid", required: true }],
      };

      expect(() => parseAgentConfig(config)).toThrow();
    });
  });

  describe("safeParseAgentConfig", () => {
    it("returns success for valid config", () => {
      const config = {
        name: "Test",
        role: "analysis" as const,
        systemMessage: "Test message",
      };

      const result = safeParseAgentConfig(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test");
      }
    });

    it("returns error for invalid config", () => {
      const config = {
        name: "Invalid",
        role: "bad_role",
        systemMessage: "Test",
      };

      const result = safeParseAgentConfig(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe("extractVariablesFromTemplate", () => {
    it("extracts single variable", () => {
      const template = "Hello {{name}}";
      const result = extractVariablesFromTemplate(template);
      expect(result).toEqual(["name"]);
    });

    it("extracts multiple variables", () => {
      const template = "Analyze {{tenant}} from {{start}} to {{end}}";
      const result = extractVariablesFromTemplate(template);
      expect(result).toEqual(["tenant", "start", "end"]);
    });

    it("removes duplicates", () => {
      const template = "{{name}} and {{name}} again";
      const result = extractVariablesFromTemplate(template);
      expect(result).toEqual(["name"]);
    });

    it("returns empty array for no variables", () => {
      const template = "No variables here";
      const result = extractVariablesFromTemplate(template);
      expect(result).toEqual([]);
    });

    it("handles variables with underscores and numbers", () => {
      const template = "{{tenant_name}} {{user_id}} {{var123}}";
      const result = extractVariablesFromTemplate(template);
      expect(result).toEqual(["tenant_name", "user_id", "var123"]);
    });
  });

  describe("substituteVariables", () => {
    it("substitutes single variable", () => {
      const template = "Hello {{name}}";
      const result = substituteVariables(template, { name: "World" });
      expect(result).toBe("Hello World");
    });

    it("substitutes multiple variables", () => {
      const template = "{{tenant}} from {{start}} to {{end}}";
      const result = substituteVariables(template, {
        tenant: "Acme Corp",
        start: "2024-01-01",
        end: "2024-12-31",
      });
      expect(result).toBe("Acme Corp from 2024-01-01 to 2024-12-31");
    });

    it("substitutes all occurrences of same variable", () => {
      const template = "{{name}} is great. {{name}} is the best.";
      const result = substituteVariables(template, { name: "Acme" });
      expect(result).toBe("Acme is great. Acme is the best.");
    });

    it("leaves unmatched variables unchanged", () => {
      const template = "Hello {{name}} and {{other}}";
      const result = substituteVariables(template, { name: "World" });
      expect(result).toBe("Hello World and {{other}}");
    });

    it("handles empty variables object", () => {
      const template = "Hello {{name}}";
      const result = substituteVariables(template, {});
      expect(result).toBe("Hello {{name}}");
    });
  });

  describe("AgentFactory.createTestAgent", () => {
    it("creates test mode agent successfully", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const config = parseAgentConfig({
        name: "Test Agent",
        role: "analysis",
        systemMessage: "You are a test agent",
        runtimeMode: "test",
      });
      const agent = factory.createTestAgent(config);

      expect(agent).toBeDefined();
      expect(config.name).toBe("Test Agent");
      expect(config.role).toBe("analysis");
      expect(config.runtimeMode).toBe("test");
    });

    it("createAgent throws without tenant context in production mode", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      expect(() =>
        factory.createAgent({
          name: "Production Agent",
          role: "insights",
          systemMessage: "You are a production agent",
          runtimeMode: "production",
        }),
      ).toThrow("Production mode requires tenant context");
    });

    it("creates agent with variable config", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const config = parseAgentConfig({
        name: "Variable Agent",
        role: "analysis",
        systemMessage: "Analyze {{tenantName}} data",
        runtimeMode: "test",
        variables: [{ name: "tenantName", required: true }],
      });
      const agent = factory.createTestAgent(config);

      expect(agent).toBeDefined();
      expect(config.variables).toHaveLength(1);
      expect(config.variables[0].name).toBe("tenantName");
      expect(config.variables[0].required).toBe(true);
    });

    it("creates agent with custom tools", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const customTool = defineTool({
        name: "custom_tool",
        description: "A custom tool",
        execute: async () => ({ result: "custom" }),
      });

      const config = parseAgentConfig({
        name: "Tool Agent",
        role: "analysis",
        systemMessage: "You have tools",
        runtimeMode: "test",
      });
      const { agent, tools } = factory.createAgentWithTools(config, [customTool]);

      expect(agent).toBeDefined();
      const tool = tools.get("custom_tool");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("custom_tool");
    });

    it("creates agent with configured builtin tools", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const getConfigTool = defineTool({
        name: "get_config",
        description: "Custom description",
        execute: async () => ({ result: "config" }),
      });
      const analyzeTrendsTool = defineTool({
        name: "analyze_trends",
        description: "Analyze trends",
        execute: async () => ({ result: "trends" }),
      });

      const config = parseAgentConfig({
        name: "Builtin Tool Agent",
        role: "analysis",
        systemMessage: "You have builtin tools",
        runtimeMode: "test",
      });
      const { agent, tools } = factory.createAgentWithTools(config, [
        getConfigTool,
        analyzeTrendsTool,
      ]);

      expect(agent).toBeDefined();
      expect(tools.get("get_config")).toBeDefined();
      expect(tools.get("analyze_trends")).toBeDefined();
    });

    it("applies provider override from config", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const config = parseAgentConfig({
        name: "Override Agent",
        role: "analysis",
        systemMessage: "Test",
        runtimeMode: "test",
        providerId: "custom-provider",
        modelId: "custom-model",
      });
      const agent = factory.createTestAgent(config);

      expect(agent).toBeDefined();
    });

    it("creates agent with custom memory settings", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const config = parseAgentConfig({
        name: "Memory Agent",
        role: "analysis",
        systemMessage: "Test",
        runtimeMode: "test",
        memoryMode: "buffer_summary",
        maxHistoryLength: 20,
        memoryLimits: {
          maxBufferTurns: 100,
          maxLongTermChars: 50000,
          mergeEvictedTurnsIntoSummary: true,
          maxSemanticSnippets: 100,
          maxEntities: 200,
        },
      });
      const agent = factory.createTestAgent(config);

      expect(agent).toBeDefined();
      expect(config.memoryMode).toBe("buffer_summary");
      expect(config.maxHistoryLength).toBe(20);
      expect(config.memoryLimits?.maxBufferTurns).toBe(100);
    });

    it("creates agent with JSON output format", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const config = parseAgentConfig({
        name: "JSON Agent",
        role: "analysis",
        systemMessage: "Return JSON",
        runtimeMode: "test",
        outputFormat: {
          type: "json",
          strictValidation: true,
          jsonSchema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              insights: { type: "array" },
            },
            required: ["summary", "insights"],
          },
        },
      });
      const agent = factory.createTestAgent(config);

      expect(agent).toBeDefined();
      expect(config.outputFormat.type).toBe("json");
      expect(config.outputFormat.strictValidation).toBe(true);
    });

    it("validates JSON output correctly", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const config = parseAgentConfig({
        name: "JSON Validator",
        role: "analysis",
        systemMessage: "Test",
        runtimeMode: "test",
        outputFormat: {
          type: "json" as const,
          strictValidation: true,
          jsonSchema: { type: "object" as const },
        },
      });
      const agent = factory.createTestAgent(config);

      expect(agent).toBeDefined();
      expect(config.outputFormat.type).toBe("json");
      expect(config.outputFormat.strictValidation).toBe(true);
    });

    it("creates agent with retry configuration", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const config = parseAgentConfig({
        name: "Retry Agent",
        role: "analysis",
        systemMessage: "Test",
        runtimeMode: "test",
        retryConfig: {
          maxRetries: 5,
          initialDelayMs: 2000,
          maxDelayMs: 30000,
        },
        timeoutMs: 180000,
      });
      const agent = factory.createTestAgent(config);

      expect(agent).toBeDefined();
      expect(config.retryConfig.maxRetries).toBe(5);
      expect(config.retryConfig.initialDelayMs).toBe(2000);
      expect(config.timeoutMs).toBe(180000);
    });

    it("creates agent with metadata", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const config = parseAgentConfig({
        name: "Metadata Agent",
        role: "analysis",
        systemMessage: "Test",
        runtimeMode: "test",
        metadata: {
          environment: "test",
          version: "1.0.0",
          tags: ["test", "agent"],
        },
      });
      const agent = factory.createTestAgent(config);

      expect(agent).toBeDefined();
      expect(config.metadata).toEqual({
        environment: "test",
        version: "1.0.0",
        tags: ["test", "agent"],
      });
    });
  });

  describe("AgentFactory edge cases", () => {
    it("handles agent with no tools", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const config = parseAgentConfig({
        name: "No Tool Agent",
        role: "analysis",
        systemMessage: "No tools",
        runtimeMode: "test",
        tools: [],
      });
      const { agent, tools } = factory.createAgentWithTools(config, []);

      expect(agent).toBeDefined();
      expect(tools.list()).toHaveLength(0);
    });

    it("handles agent with disabled tools", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const analyzeTrendsTool = defineTool({
        name: "analyze_trends",
        description: "Analyze trends",
        execute: async () => ({ result: "trends" }),
      });

      const config = parseAgentConfig({
        name: "Disabled Tool Agent",
        role: "analysis",
        systemMessage: "Disabled tools",
        runtimeMode: "test",
      });
      const { agent, tools } = factory.createAgentWithTools(config, [analyzeTrendsTool]);

      expect(agent).toBeDefined();
      expect(tools.get("get_config")).toBeUndefined();
      expect(tools.get("analyze_trends")).toBeDefined();
    });

    it("handles agent with empty variables array", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const config = parseAgentConfig({
        name: "Empty Vars Agent",
        role: "analysis",
        systemMessage: "No variables",
        runtimeMode: "test",
        variables: [],
      });
      const agent = factory.createTestAgent(config);

      expect(agent).toBeDefined();
      expect(config.variables).toHaveLength(0);
    });

    it("handles agent with optional variables", () => {
      const factory = new AgentFactory({ llmEnv: {} });

      const config = parseAgentConfig({
        name: "Optional Vars Agent",
        role: "analysis",
        systemMessage: "Hello {{name}}",
        runtimeMode: "test",
        variables: [{ name: "name", required: false, defaultValue: "World" }],
      });
      const agent = factory.createTestAgent(config);

      expect(agent).toBeDefined();
      expect(config.variables[0].required).toBe(false);
      expect(config.variables[0].defaultValue).toBe("World");
    });
  });
});
