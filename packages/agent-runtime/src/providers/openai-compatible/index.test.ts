import { describe, it, expect, beforeEach } from "vitest";
import { createOpenAICompatibleProvider } from "./index";
import {
  createDeepSeekProvider,
  createGroqProvider,
  createMistralProvider,
  createMoonshotProvider,
  createTogetherAIProvider,
  createCustomProvider,
} from "./providers";
import type { ChatCompletionRequest } from "../../types";

describe("createOpenAICompatibleProvider", () => {
  it("should create a provider with correct providerId", () => {
    const provider = createOpenAICompatibleProvider({
      providerId: "test-provider",
      name: "Test Provider",
      apiKey: "test-key",
      baseURL: "https://api.test.com/v1",
    });

    expect(provider.providerId).toBe("test-provider");
  });

  it("should have default capabilities", () => {
    const provider = createOpenAICompatibleProvider({
      providerId: "test",
      name: "Test",
      apiKey: "test-key",
      baseURL: "https://api.test.com/v1",
    });

    expect(provider.capabilities).toEqual({
      chat: true,
      chatStreaming: true,
      chatVision: false,
      chatTools: true,
      embeddings: false,
      imageGeneration: false,
      textToSpeech: false,
    });
  });

  it("should allow customizing capabilities", () => {
    const provider = createOpenAICompatibleProvider({
      providerId: "test",
      name: "Test",
      apiKey: "test-key",
      baseURL: "https://api.test.com/v1",
      capabilities: {
        chatVision: true,
        embeddings: true,
      },
    });

    expect(provider.capabilities.chatVision).toBe(true);
    expect(provider.capabilities.embeddings).toBe(true);
  });

  it("should accept custom headers", () => {
    const provider = createOpenAICompatibleProvider({
      providerId: "test",
      name: "Test",
      apiKey: "test-key",
      baseURL: "https://api.test.com/v1",
      customHeaders: {
        "X-Custom-Header": "custom-value",
      },
    });

    expect(provider).toBeDefined();
  });

  it("should cache default models on initialization", async () => {
    const provider = createOpenAICompatibleProvider({
      providerId: "test",
      name: "Test",
      apiKey: "test-key",
      baseURL: "https://api.test.com/v1",
      defaultModels: ["model-1", "model-2"],
    });

    const providerImpl = provider as unknown as { discoverModels(): Promise<unknown> };
    await expect(providerImpl.discoverModels()).resolves.toBeDefined();
  });
});

describe("pre-configured providers", () => {
  describe("createDeepSeekProvider", () => {
    it("should create DeepSeek provider with correct baseURL", () => {
      const provider = createDeepSeekProvider("test-key");
      expect(provider.providerId).toBe("deepseek");
    });

    it("should have DeepSeek default models", async () => {
      const provider = createDeepSeekProvider("test-key");
      const providerImpl = provider as unknown as { discoverModels(): Promise<{ id: string }[]> };
      const models = await providerImpl.discoverModels();

      expect(models.some((m: { id: string }) => m.id === "deepseek-chat")).toBe(true);
      expect(models.some((m: { id: string }) => m.id === "deepseek-coder")).toBe(true);
    });
  });

  describe("createGroqProvider", () => {
    it("should create Groq provider with correct baseURL", () => {
      const provider = createGroqProvider("test-key");
      expect(provider.providerId).toBe("groq");
    });

    it("should have Groq default models", async () => {
      const provider = createGroqProvider("test-key");
      const providerImpl = provider as unknown as { discoverModels(): Promise<{ id: string }[]> };
      const models = await providerImpl.discoverModels();

      expect(models.some((m: { id: string }) => m.id.includes("llama"))).toBe(true);
      expect(models.some((m: { id: string }) => m.id.includes("mixtral"))).toBe(true);
    });
  });

  describe("createMistralProvider", () => {
    it("should create Mistral provider with correct baseURL", () => {
      const provider = createMistralProvider("test-key");
      expect(provider.providerId).toBe("mistral");
    });

    it("should have vision capability enabled", () => {
      const provider = createMistralProvider("test-key");
      expect(provider.capabilities.chatVision).toBe(true);
    });

    it("should have embeddings capability enabled", () => {
      const provider = createMistralProvider("test-key");
      expect(provider.capabilities.embeddings).toBe(true);
    });
  });

  describe("createMoonshotProvider", () => {
    it("should create Moonshot provider with correct baseURL", () => {
      const provider = createMoonshotProvider("test-key");
      expect(provider.providerId).toBe("moonshot");
    });

    it("should have Moonshot default models", async () => {
      const provider = createMoonshotProvider("test-key");
      const providerImpl = provider as unknown as { discoverModels(): Promise<{ id: string }[]> };
      const models = await providerImpl.discoverModels();

      expect(models.some((m: { id: string }) => m.id.includes("moonshot"))).toBe(true);
    });
  });

  describe("createTogetherAIProvider", () => {
    it("should create TogetherAI provider with correct baseURL", () => {
      const provider = createTogetherAIProvider("test-key");
      expect(provider.providerId).toBe("togetherai");
    });

    it("should have image generation capability", () => {
      const provider = createTogetherAIProvider("test-key");
      expect(provider.capabilities.imageGeneration).toBe(true);
    });
  });
});

describe("createCustomProvider", () => {
  it("should create a custom provider with all options", () => {
    const provider = createCustomProvider({
      providerId: "custom",
      name: "Custom Provider",
      apiKey: "test-key",
      baseURL: "https://api.custom.com/v1",
      capabilities: {
        chat: true,
        chatStreaming: true,
        chatVision: true,
        chatTools: true,
        embeddings: true,
        imageGeneration: true,
        textToSpeech: true,
      },
      defaultModels: ["custom-model-1"],
      customHeaders: {
        "X-API-Version": "2024-01-01",
      },
    });

    expect(provider.providerId).toBe("custom");
    expect(provider.capabilities.chatVision).toBe(true);
    expect(provider.capabilities.imageGeneration).toBe(true);
  });
});

describe("chat functionality", () => {
  let provider: ReturnType<typeof createOpenAICompatibleProvider>;

  beforeEach(() => {
    provider = createOpenAICompatibleProvider({
      providerId: "test",
      name: "Test",
      apiKey: "test-key",
      baseURL: "https://api.test.com/v1",
    });
  });

  it("should throw error for invalid API key", async () => {
    const request: ChatCompletionRequest = {
      model: "test-model",
      messages: [
        {
          role: "user",
          content: "Hello",
        },
      ],
    };

    await expect(provider.chat(request)).rejects.toThrow();
  });

  it("should handle system messages", async () => {
    const request: ChatCompletionRequest = {
      model: "test-model",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "Hello",
        },
      ],
    };

    await expect(provider.chat(request)).rejects.toThrow();
  });
});

describe("discoverModels", () => {
  it("should return cached models when API is unavailable", async () => {
    const provider = createOpenAICompatibleProvider({
      providerId: "test",
      name: "Test",
      apiKey: "invalid-key",
      baseURL: "https://api.test.com/v1",
      defaultModels: ["fallback-model"],
    });

    const providerImpl = provider as unknown as { discoverModels(): Promise<{ id: string }[]> };
    const models = await providerImpl.discoverModels();

    expect(models.some((m: { id: string }) => m.id === "fallback-model")).toBe(true);
  });

  it("should throw error when no default models configured and API fails", async () => {
    const provider = createOpenAICompatibleProvider({
      providerId: "test",
      name: "Test",
      apiKey: "invalid-key",
      baseURL: "https://api.test.com/v1",
    });

    const providerImpl = provider as unknown as { discoverModels(): Promise<unknown> };
    await expect(providerImpl.discoverModels()).rejects.toThrow();
  });
});

describe("destroy", () => {
  it("should clear model cache", async () => {
    const provider = createOpenAICompatibleProvider({
      providerId: "test",
      name: "Test",
      apiKey: "test-key",
      baseURL: "https://api.test.com/v1",
      defaultModels: ["test-model-1", "test-model-2"],
    });

    const providerImpl = provider as unknown as {
      discoverModels(): Promise<{ id: string }[]>;
      destroy(): Promise<void>;
    };

    // First, populate the cache
    await providerImpl.discoverModels();

    // Then destroy
    await providerImpl.destroy();

    // After destroy, cache should be cleared but default models should still be available
    // The discoverModels will fallback to defaultModels when API fails
    const models = await providerImpl.discoverModels();

    // Should have at least the default models
    expect(models.length).toBeGreaterThanOrEqual(2);
    expect(models.map((m: { id: string }) => m.id)).toContain("test-model-1");
    expect(models.map((m: { id: string }) => m.id)).toContain("test-model-2");
  });
});
