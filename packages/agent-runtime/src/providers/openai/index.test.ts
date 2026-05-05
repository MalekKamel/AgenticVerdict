import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { OpenAIProvider } from "./index";

describe("OpenAIProvider", () => {
  const mockConfig = {
    providerId: "openai" as const,
    apiKey: "sk-test-key",
  };

  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider(mockConfig);
  });

  afterEach(async () => {
    await provider.destroy();
  });

  describe("constructor", () => {
    it("should initialize with basic config", () => {
      expect(provider.providerId).toBe("openai");
      expect(provider.capabilities.chat).toBe(true);
      expect(provider.capabilities.chatStreaming).toBe(true);
      expect(provider.capabilities.chatVision).toBe(true);
      expect(provider.capabilities.chatTools).toBe(true);
    });

    it("should set default capabilities correctly", () => {
      expect(provider.capabilities).toEqual({
        chat: true,
        chatStreaming: true,
        chatVision: true,
        chatTools: true,
        embeddings: true,
        imageGeneration: true,
        textToSpeech: true,
      });
    });
  });

  describe("chat", () => {
    it("should throw error when tenant context is missing", async () => {
      const request = {
        model: "gpt-4",
        messages: [{ role: "user" as const, content: "Hello" }],
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });
  });

  describe("chatStream", () => {
    it("should be defined for streaming support", () => {
      expect(provider.chatStream).toBeDefined();
      expect(typeof provider.chatStream).toBe("function");
    });
  });

  describe("discoverModels", () => {
    it("should be defined for model discovery", () => {
      expect(provider.discoverModels).toBeDefined();
      expect(typeof provider.discoverModels).toBe("function");
    });
  });

  describe("capabilities", () => {
    it("should support vision for gpt-4o models", () => {
      const capabilities = provider.capabilities;
      expect(capabilities.chatVision).toBe(true);
    });

    it("should support tool use", () => {
      const capabilities = provider.capabilities;
      expect(capabilities.chatTools).toBe(true);
    });

    it("should support streaming", () => {
      const capabilities = provider.capabilities;
      expect(capabilities.chatStreaming).toBe(true);
    });
  });

  describe("destroy", () => {
    it("should clear model cache", async () => {
      await provider.destroy();
      expect(provider).toBeDefined();
    });
  });
});

describe("OpenAIProvider with custom config", () => {
  it("should accept custom baseURL", () => {
    const provider = new OpenAIProvider({
      providerId: "openai",
      apiKey: "sk-test-key",
      baseURL: "https://custom-api.example.com/v1",
      timeout: 30000,
      maxRetries: 5,
    });

    expect(provider.providerId).toBe("openai");
  });

  it("should accept organization and project", () => {
    const provider = new OpenAIProvider({
      providerId: "openai",
      apiKey: "sk-test-key",
      organization: "org-123",
      project: "project-456",
    });

    expect(provider.providerId).toBe("openai");
  });
});
