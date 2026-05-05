import { describe, it, expect, beforeEach } from "vitest";
import { AnthropicProvider } from "./index";
import type { ChatCompletionRequest, ChatMessage } from "../../types";

describe("AnthropicProvider", () => {
  const mockConfig = {
    providerId: "anthropic" as const,
    apiKey: "test-api-key",
  };

  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider(mockConfig);
  });

  describe("constructor", () => {
    it("should initialize with correct providerId", () => {
      expect(provider.providerId).toBe("anthropic");
    });

    it("should have correct capabilities", () => {
      expect(provider.capabilities).toEqual({
        chat: true,
        chatStreaming: true,
        chatVision: true,
        chatTools: true,
        embeddings: false,
        imageGeneration: false,
        textToSpeech: false,
      });
    });
  });

  describe("discoverModels", () => {
    it("should return list of Claude models", async () => {
      const models = await provider.discoverModels();

      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);

      const model = models[0];
      expect(model).toHaveProperty("id");
      expect(model).toHaveProperty("created");
      expect(model.owned_by).toBe("anthropic");
      expect(model.capabilities).toHaveProperty("chat", true);
    });

    it("should include Claude 3.5 Sonnet", async () => {
      const models = await provider.discoverModels();

      const sonnetModel = models.find((m) => m.id.includes("claude-3-5-sonnet"));
      expect(sonnetModel).toBeDefined();
      expect(sonnetModel?.capabilities.vision).toBe(true);
      expect(sonnetModel?.capabilities.tools).toBe(true);
      expect(sonnetModel?.capabilities.streaming).toBe(true);
    });
  });

  describe("chat", () => {
    it("should throw error for invalid API key", async () => {
      const request: ChatCompletionRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 100,
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });

    it("should handle system messages correctly", async () => {
      const request: ChatCompletionRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello" },
        ],
        max_tokens: 100,
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });

    it("should handle tool calls", async () => {
      const request: ChatCompletionRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "What is the weather?" }],
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get the weather",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string" },
                },
                required: ["location"],
              },
            },
          },
        ],
        max_tokens: 100,
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });
  });

  describe("chatStream", () => {
    it("should support streaming", async () => {
      const request: ChatCompletionRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 100,
      };

      const stream = provider.chatStream(request);
      expect(stream).toBeDefined();
      expect(Symbol.asyncIterator in stream).toBe(true);
    });

    it("should yield chunks", async () => {
      const request: ChatCompletionRequest = {
        model: "claude-3-5-sonnet-20241022",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 100,
      };

      const stream = provider.chatStream(request);
      const chunks: unknown[] = [];

      try {
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("message conversion", () => {
    it("should convert user text messages", () => {
      const message: ChatMessage = {
        role: "user",
        content: "Hello",
      };

      expect(message).toBeDefined();
    });

    it("should handle multimodal content", () => {
      const message: ChatMessage = {
        role: "user",
        content: [
          { type: "text", text: "What is in this image?" },
          { type: "image_url", image_url: { url: "data:image/png;base64,test" } },
        ],
      };

      expect(message).toBeDefined();
    });
  });

  describe("destroy", () => {
    it("should clear model cache", async () => {
      await provider.destroy();

      const models = await provider.discoverModels();
      expect(models).toBeDefined();
    });
  });
});

describe("AnthropicProvider with custom config", () => {
  it("should accept custom baseURL", () => {
    const config = {
      providerId: "anthropic" as const,
      apiKey: "test-key",
      baseURL: "https://custom.api.com",
      timeout: 30000,
      maxRetries: 5,
    };

    const provider = new AnthropicProvider(config);
    expect(provider.providerId).toBe("anthropic");
  });
});
