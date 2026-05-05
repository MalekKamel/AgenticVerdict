import { describe, it, expect, beforeEach } from "vitest";
import { GoogleProvider } from "./index";
import type { ChatCompletionRequest } from "../../types";

describe("GoogleProvider", () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    provider = new GoogleProvider({
      providerId: "google",
      apiKey: "test-api-key",
    });
  });

  describe("constructor", () => {
    it("should initialize with correct providerId", () => {
      expect(provider.providerId).toBe("google");
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

    it("should cache default models on initialization", () => {
      const models = [
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.0-pro",
      ];

      models.forEach(() => {
        expect(() => provider.discoverModels()).not.toThrow();
      });
    });
  });

  describe("discoverModels", () => {
    it("should return list of available models", async () => {
      const models = await provider.discoverModels();

      expect(models).toHaveLength(4);
      expect(models.map((m) => m.id)).toEqual([
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.0-pro",
      ]);
    });

    it("should mark all models with chat capability", async () => {
      const models = await provider.discoverModels();

      models.forEach((model) => {
        expect(model.capabilities.chat).toBe(true);
      });
    });

    it("should mark vision capability correctly", async () => {
      const models = await provider.discoverModels();

      const visionModels = models.filter((m) => m.capabilities.vision);
      const nonVisionModels = models.filter((m) => !m.capabilities.vision);

      expect(visionModels.map((m) => m.id)).toEqual([
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
      ]);

      expect(nonVisionModels.map((m) => m.id)).toEqual(["gemini-1.0-pro"]);
    });
  });

  describe("chat", () => {
    it("should throw error for invalid API key", async () => {
      const request: ChatCompletionRequest = {
        model: "gemini-1.5-flash",
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });

    it("should handle system messages correctly", async () => {
      const request: ChatCompletionRequest = {
        model: "gemini-1.5-flash",
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

    it("should handle text-only messages", async () => {
      const request: ChatCompletionRequest = {
        model: "gemini-1.5-flash",
        messages: [
          {
            role: "user",
            content: "Hello, how are you?",
          },
        ],
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should handle authentication errors", async () => {
      const invalidProvider = new GoogleProvider({
        providerId: "google",
        apiKey: "invalid-key",
      });

      const request: ChatCompletionRequest = {
        model: "gemini-1.5-flash",
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      };

      await expect(invalidProvider.chat(request)).rejects.toThrow();
    });

    it("should handle invalid model errors", async () => {
      const request: ChatCompletionRequest = {
        model: "nonexistent-model",
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      };

      await expect(provider.chat(request)).rejects.toThrow();
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
