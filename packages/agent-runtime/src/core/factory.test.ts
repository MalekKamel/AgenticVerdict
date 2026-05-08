import { describe, it, expect, beforeEach } from "vitest";
import { ProviderFactory } from "../core/ProviderFactory";
import { ProviderRegistry } from "../core/ProviderRegistry";
import { BaseProvider, type ProviderConfig, type ProviderCapabilities } from "../core/BaseProvider";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";
import type { ChatCompletionRequest, ChatCompletionResponse } from "../types";

class MockProvider extends BaseProvider {
  readonly providerId = "mock";
  readonly capabilities: ProviderCapabilities = {
    chat: true,
    chatStreaming: false,
    chatVision: false,
    chatTools: false,
    embeddings: false,
    imageGeneration: false,
    textToSpeech: false,
  };

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return {
      id: "mock-completion",
      object: "chat.completion",
      created: Date.now(),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Mock response",
          },
          finish_reason: "stop",
        },
      ],
    };
  }

  async destroy(): Promise<void> {
    // No-op for mock
  }
}

describe("ProviderFactory", () => {
  beforeEach(() => {
    ProviderRegistry.clear();
  });

  describe("register", () => {
    it("should register a provider successfully", () => {
      expect(() => {
        ProviderFactory.register("mock", MockProvider);
      }).not.toThrow();

      expect(ProviderFactory.isRegistered("mock")).toBe(true);
    });

    it("should throw error when registering duplicate provider", () => {
      ProviderFactory.register("mock", MockProvider);

      expect(() => {
        ProviderFactory.register("mock", MockProvider);
      }).toThrow(AgentRuntimeError);

      try {
        ProviderFactory.register("mock", MockProvider);
      } catch (error) {
        expect(AgentRuntimeError.isAgentRuntimeError(error)).toBe(true);
        expect((error as AgentRuntimeError).code).toBe(
          AgentRuntimeErrorCode.PROVIDER_ALREADY_REGISTERED,
        );
        expect((error as AgentRuntimeError).providerId).toBe("mock");
      }
    });
  });

  describe("create", () => {
    it("should create provider instance with valid configuration", () => {
      ProviderFactory.register("mock", MockProvider);

      const config: ProviderConfig = {
        providerId: "mock",
        apiKey: "test-key",
      };

      const provider = ProviderFactory.create("mock", config);

      expect(provider.providerId).toBe("mock");
      expect(provider.capabilities.chat).toBe(true);
    });

    it("should throw error when creating unregistered provider", () => {
      const config: ProviderConfig = {
        providerId: "nonexistent",
        apiKey: "test-key",
      };

      expect(() => {
        ProviderFactory.create("nonexistent", config);
      }).toThrow(AgentRuntimeError);

      try {
        ProviderFactory.create("nonexistent", config);
      } catch (error) {
        expect(AgentRuntimeError.isAgentRuntimeError(error)).toBe(true);
        expect((error as AgentRuntimeError).code).toBe(AgentRuntimeErrorCode.PROVIDER_NOT_FOUND);
        expect((error as AgentRuntimeError).providerId).toBe("nonexistent");
      }
    });
  });

  describe("listProviders", () => {
    it("should return empty array when no providers registered", () => {
      const providers = ProviderFactory.listProviders();
      expect(providers).toEqual([]);
    });

    it("should return all registered provider IDs", () => {
      ProviderFactory.register("mock", MockProvider);
      ProviderFactory.register("mock2", MockProvider);

      const providers = ProviderFactory.listProviders();
      expect(providers).toContain("mock");
      expect(providers).toContain("mock2");
      expect(providers.length).toBe(2);
    });
  });

  describe("registerDefaultProviders", () => {
    it("should register default provider IDs", () => {
      ProviderFactory.registerDefaultProviders();

      expect(ProviderFactory.listProviders().sort()).toEqual([
        "anthropic",
        "bedrock",
        "google",
        "openai",
        "openai-compatible",
      ]);
    });

    it("should be idempotent when called multiple times", () => {
      ProviderFactory.registerDefaultProviders();
      ProviderFactory.registerDefaultProviders();

      expect(ProviderFactory.listProviders().sort()).toEqual([
        "anthropic",
        "bedrock",
        "google",
        "openai",
        "openai-compatible",
      ]);
    });
  });

  describe("unregister", () => {
    it("should remove provider from registry", () => {
      ProviderFactory.register("mock", MockProvider);
      expect(ProviderFactory.isRegistered("mock")).toBe(true);

      ProviderFactory.unregister("mock");
      expect(ProviderFactory.isRegistered("mock")).toBe(false);
    });
  });
});

describe("ProviderRegistry", () => {
  beforeEach(() => {
    ProviderRegistry.clear();
  });

  it("should allow direct registry operations", () => {
    ProviderRegistry.register("mock", MockProvider);
    expect(ProviderRegistry.isRegistered("mock")).toBe(true);

    const config: ProviderConfig = {
      providerId: "mock",
      apiKey: "test-key",
    };

    const provider = ProviderRegistry.create("mock", config);
    expect(provider.providerId).toBe("mock");

    const providers = ProviderRegistry.listProviders();
    expect(providers).toEqual(["mock"]);
  });
});

describe("BaseProvider", () => {
  it("should create mock provider instance", () => {
    const provider = new MockProvider();

    expect(provider.providerId).toBe("mock");
    expect(provider.capabilities.chat).toBe(true);
    expect(provider.capabilities.chatStreaming).toBe(false);
  });

  it("should execute chat method", async () => {
    const provider = new MockProvider();

    const request: ChatCompletionRequest = {
      model: "mock-model",
      messages: [
        {
          role: "user",
          content: "Hello",
        },
      ],
    };

    const response = await provider.chat(request);

    expect(response.id).toBe("mock-completion");
    expect(response.choices[0].message.content).toBe("Mock response");
    expect(response.choices[0].finish_reason).toBe("stop");
  });
});
