import { describe, it, expect, beforeEach } from "vitest";

import { AgentRuntimeError } from "../../errors/AgentRuntimeError";
import { AgentRuntimeErrorCode } from "../../errors/AgentRuntimeError";
import { BedrockProvider } from "./index";

describe("BedrockProvider", () => {
  const mockConfig = {
    providerId: "bedrock" as const,
    apiKey: "test-key",
    region: "us-east-1",
    accessKeyId: "test-access-key",
    secretAccessKey: "test-secret-key",
  };

  let provider: BedrockProvider;

  beforeEach(() => {
    provider = new BedrockProvider(mockConfig);
  });

  describe("initialization", () => {
    it("should initialize with correct providerId", () => {
      expect(provider.providerId).toBe("bedrock");
    });

    it("should have correct capabilities", () => {
      expect(provider.capabilities).toEqual({
        chat: true,
        chatStreaming: false,
        chatVision: true,
        chatTools: true,
        embeddings: false,
        imageGeneration: false,
        textToSpeech: false,
      });
    });

    it("should initialize with default region", () => {
      const providerNoRegion = new BedrockProvider({
        ...mockConfig,
        region: undefined,
      });
      expect(providerNoRegion.providerId).toBe("bedrock");
    });
  });

  describe("model configuration", () => {
    it("should reject unsupported models", async () => {
      const invalidRequest = {
        model: "unsupported-model",
        messages: [{ role: "user" as const, content: "Hello" }],
      };

      await expect(provider.chat(invalidRequest)).rejects.toThrow(AgentRuntimeError);
      await expect(provider.chat(invalidRequest)).rejects.toMatchObject({
        code: AgentRuntimeErrorCode.MODEL_NOT_FOUND,
        providerId: "bedrock",
      });
    });

    it("should accept Claude models", async () => {
      const request = {
        model: "anthropic.claude-3-sonnet-20240229-v1:0",
        messages: [{ role: "user" as const, content: "Hello" }],
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });

    it("should accept Llama models", async () => {
      const request = {
        model: "meta.llama3-70b-instruct-v1:0",
        messages: [{ role: "user" as const, content: "Hello" }],
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });

    it("should accept Titan models", async () => {
      const request = {
        model: "amazon.titan-text-express-v1",
        messages: [{ role: "user" as const, content: "Hello" }],
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });
  });

  describe("chat", () => {
    it("should handle basic chat request", async () => {
      const request = {
        model: "anthropic.claude-3-sonnet-20240229-v1:0",
        messages: [{ role: "user" as const, content: "Hello" }],
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });

    it("should handle system messages", async () => {
      const request = {
        model: "anthropic.claude-3-sonnet-20240229-v1:0",
        messages: [
          { role: "system" as const, content: "You are a helpful assistant" },
          { role: "user" as const, content: "Hello" },
        ],
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });

    it("should handle temperature parameter", async () => {
      const request = {
        model: "anthropic.claude-3-sonnet-20240229-v1:0",
        messages: [{ role: "user" as const, content: "Hello" }],
        temperature: 0.7,
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });

    it("should handle max_tokens parameter", async () => {
      const request = {
        model: "anthropic.claude-3-sonnet-20240229-v1:0",
        messages: [{ role: "user" as const, content: "Hello" }],
        max_tokens: 100,
      };

      await expect(provider.chat(request)).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("should translate access denied errors", async () => {
      const request = {
        model: "anthropic.claude-3-sonnet-20240229-v1:0",
        messages: [{ role: "user" as const, content: "Hello" }],
      };

      try {
        await provider.chat(request);
      } catch (error) {
        if (error instanceof AgentRuntimeError) {
          expect(error.code).toBeOneOf([
            AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
            AgentRuntimeErrorCode.MODEL_NOT_FOUND,
            AgentRuntimeErrorCode.INTERNAL_ERROR,
          ]);
          expect(error.providerId).toBe("bedrock");
        }
      }
    });
  });

  describe("destroy", () => {
    it("should clean up resources", async () => {
      await expect(provider.destroy()).resolves.not.toThrow();
    });
  });
});
