import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LangfuseTracingHook, createLangfuseTracingHook } from "./langfuse";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors";

// Mock Langfuse client
const mockTrace = vi.fn().mockImplementation((data) => ({
  id: data.id || "trace-123",
  span: vi.fn().mockReturnValue({ id: "span-123" }),
  generation: vi.fn(),
}));

const mockGeneration = vi.fn();
const mockShutdownAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("langfuse", () => {
  const Langfuse = vi.fn().mockImplementation(() => ({
    trace: mockTrace,
    span: vi.fn().mockReturnValue({ id: "span-123", generation: mockGeneration }),
    generation: mockGeneration,
    shutdownAsync: mockShutdownAsync,
  }));

  return { Langfuse };
});

describe("LangfuseTracingHook", () => {
  const mockConfig = {
    publicKey: "test-public-key",
    secretKey: "test-secret-key",
    tenantId: "tenant-123",
    logger: {
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    },
  };

  let hook: LangfuseTracingHook;

  beforeEach(() => {
    vi.clearAllMocks();
    hook = createLangfuseTracingHook(mockConfig);
  });

  afterEach(async () => {
    await hook.shutdown();
  });

  describe("constructor", () => {
    it("should initialize with required config", () => {
      expect(hook).toBeDefined();
    });

    it("should log initialization message", () => {
      expect(mockConfig.logger.info).toHaveBeenCalledWith(
        "[LangfuseTracing] Initialized for tenant: tenant-123",
      );
    });

    it("should default includePayloads to false", () => {
      const hookWithoutPayloads = createLangfuseTracingHook({
        ...mockConfig,
        includePayloads: undefined,
      });
      expect(hookWithoutPayloads).toBeDefined();
    });

    it("should respect includePayloads config", () => {
      const hookWithPayloads = createLangfuseTracingHook({
        ...mockConfig,
        includePayloads: true,
      });
      expect(hookWithPayloads).toBeDefined();
    });
  });

  describe("createBeforeChatHook", () => {
    it("should create a beforeChat hook", () => {
      const beforeChatHook = hook.createBeforeChatHook();
      expect(beforeChatHook).toBeDefined();
      expect(typeof beforeChatHook).toBe("function");
    });

    it("should start a trace with correct metadata", async () => {
      const beforeChatHook = hook.createBeforeChatHook();

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: { messages: [{ role: "user", content: "Hello" }] },
      };

      await beforeChatHook(context);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "req-123",
          name: "chat.openai.gpt-4",
          userId: "tenant-123",
          metadata: {
            tenantId: "tenant-123",
            providerId: "openai",
            modelId: "gpt-4",
            requestId: "req-123",
          },
          tags: ["provider:openai", "model:gpt-4", "tenant:tenant-123"],
          input: { requestId: "req-123" },
        }),
      );
    });

    it("should exclude payload by default", async () => {
      const beforeChatHook = hook.createBeforeChatHook();

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: { messages: [{ role: "user", content: "Hello" }] },
      };

      await beforeChatHook(context);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { requestId: "req-123" },
        }),
      );
    });

    it("should include payload when configured", async () => {
      const hookWithPayloads = createLangfuseTracingHook({
        ...mockConfig,
        includePayloads: true,
      });
      const beforeChatHook = hookWithPayloads.createBeforeChatHook();

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: { messages: [{ role: "user", content: "Hello" }] },
      };

      await beforeChatHook(context);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { messages: [{ role: "user", content: "Hello" }] },
        }),
      );
    });

    it("should not throw on tracing errors", async () => {
      mockTrace.mockImplementationOnce(() => {
        throw new Error("Tracing error");
      });

      const beforeChatHook = hook.createBeforeChatHook();

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: { messages: [{ role: "user", content: "Hello" }] },
      };

      await expect(beforeChatHook(context)).resolves.not.toThrow();
      expect(mockConfig.logger.error).toHaveBeenCalled();
    });

    it("should exclude payload by default", async () => {
      const beforeChatHook = hook.createBeforeChatHook();

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: { messages: [{ role: "user", content: "Hello" }] },
      };

      await beforeChatHook(context);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { requestId: "req-123" },
        }),
      );
    });

    it("should include payload when configured", async () => {
      const hookWithPayloads = createLangfuseTracingHook({
        ...mockConfig,
        includePayloads: true,
      });
      const beforeChatHook = hookWithPayloads.createBeforeChatHook();

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: { messages: [{ role: "user", content: "Hello" }] },
      };

      await beforeChatHook(context);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { messages: [{ role: "user", content: "Hello" }] },
        }),
      );
    });

    it("should not throw on tracing errors", async () => {
      mockTrace.mockImplementationOnce(() => {
        throw new Error("Langfuse API error");
      });

      const beforeChatHook = hook.createBeforeChatHook();

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      };

      await expect(beforeChatHook(context)).resolves.not.toThrow();
      expect(mockConfig.logger.error).toHaveBeenCalled();
    });
  });

  describe("createOnChatCompleteHook", () => {
    it("should create an onChatComplete hook", () => {
      const onCompleteHook = hook.createOnChatCompleteHook();
      expect(onCompleteHook).toBeDefined();
      expect(typeof onCompleteHook).toBe("function");
    });

    it("should complete trace with token usage", async () => {
      // First start a trace
      const beforeChatHook = hook.createBeforeChatHook();
      await beforeChatHook({
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      });

      // Then complete it
      const onCompleteHook = hook.createOnChatCompleteHook();

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        response: { message: "Hello!" },
        durationMs: 100,
        tokenUsage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      };

      await onCompleteHook(context);

      expect(mockGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          usage: {
            input: 10,
            output: 20,
            total: 30,
            unit: "TOKENS",
          },
        }),
      );
    });

    it("should handle missing trace gracefully", async () => {
      const onCompleteHook = hook.createOnChatCompleteHook();

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "non-existent-req",
        response: { message: "Hello!" },
        durationMs: 100,
        startedAt: Date.now(),
        tokenUsage: undefined,
      };

      await onCompleteHook(context);

      expect(mockConfig.logger.warn).toHaveBeenCalledWith(
        "[LangfuseTracing] No trace found for request non-existent-req",
      );
    });

    it("should exclude response payload by default", async () => {
      const beforeChatHook = hook.createBeforeChatHook();
      await beforeChatHook({
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      });

      const onCompleteHook = hook.createOnChatCompleteHook();

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        response: { message: "Hello!" },
        durationMs: 100,
        tokenUsage: undefined,
      };

      await onCompleteHook(context);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          output: {},
        }),
      );
    });
  });

  describe("createOnChatErrorHook", () => {
    it("should create an onChatError hook", () => {
      const onErrorHook = hook.createOnChatErrorHook();
      expect(onErrorHook).toBeDefined();
      expect(typeof onErrorHook).toBe("function");
    });

    it("should record AgentRuntimeError with metadata", async () => {
      const beforeChatHook = hook.createBeforeChatHook();
      await beforeChatHook({
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      });

      const onErrorHook = hook.createOnChatErrorHook();

      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.PROVIDER_NOT_FOUND,
        message: "Provider failed",
        providerId: "openai",
        tenantId: "tenant-123",
        statusCode: 500,
      });

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        error,
        durationMs: 100,
      };

      await onErrorHook(context);

      // The implementation updates the span with level/statusMessage,
      // and updates the trace with metadata.errorMessage
      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "req-123",
          metadata: {
            errorMessage: "Provider failed",
          },
        }),
      );
    });

    it("should handle generic errors", async () => {
      const beforeChatHook = hook.createBeforeChatHook();
      await beforeChatHook({
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      });

      const onErrorHook = hook.createOnChatErrorHook();

      const error = new Error("Something went wrong");

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        error,
        durationMs: 100,
      };

      await onErrorHook(context);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "req-123",
          metadata: {
            errorMessage: "Something went wrong",
          },
        }),
      );
    });

    it("should handle non-Error objects", async () => {
      const beforeChatHook = hook.createBeforeChatHook();
      await beforeChatHook({
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      });

      const onErrorHook = hook.createOnChatErrorHook();

      const error = "String error";

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        error,
        durationMs: 100,
      };

      await onErrorHook(context);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "req-123",
          metadata: {
            errorMessage: "String error",
          },
        }),
      );
    });

    it("should handle missing trace gracefully", async () => {
      const onErrorHook = hook.createOnChatErrorHook();

      const error = new Error("Test error");

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "non-existent-req",
        error,
        durationMs: 100,
        startedAt: Date.now(),
      };

      await onErrorHook(context);

      expect(mockConfig.logger.warn).toHaveBeenCalledWith(
        "[LangfuseTracing] No trace found for request non-existent-req",
      );
    });
  });

  describe("shutdown", () => {
    it("should shutdown Langfuse client", async () => {
      await hook.shutdown();

      expect(mockShutdownAsync).toHaveBeenCalled();
    });

    it("should log shutdown message", async () => {
      await hook.shutdown();
      expect(mockConfig.logger.info).toHaveBeenCalledWith("[LangfuseTracing] Shutdown complete");
    });
  });

  describe("PII Safety", () => {
    it("should include tenant ID in metadata for multi-tenant tracing", async () => {
      const beforeChatHook = hook.createBeforeChatHook();

      const context = {
        tenantId: "tenant-456",
        providerId: "anthropic",
        modelId: "claude-3",
        requestId: "req-789",
        startedAt: Date.now(),
        payload: {},
      };

      await beforeChatHook(context);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "tenant-456",
          metadata: expect.objectContaining({
            tenantId: "tenant-456",
          }),
        }),
      );
    });

    it("should not include sensitive payload data by default", async () => {
      const beforeChatHook = hook.createBeforeChatHook();

      const context = {
        tenantId: "tenant-123",
        providerId: "openai",
        modelId: "gpt-4",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {
          messages: [{ role: "user", content: "My SSN is 123-45-6789" }],
        },
      };

      await beforeChatHook(context);

      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { requestId: "req-123" },
        }),
      );
    });
  });
});

describe("createLangfuseTracingHook factory", () => {
  it("should create a new instance", () => {
    const config = {
      publicKey: "pk-123",
      secretKey: "sk-123",
      tenantId: "tenant-123",
    };

    const hook = createLangfuseTracingHook(config);
    expect(hook).toBeInstanceOf(LangfuseTracingHook);
  });
});
