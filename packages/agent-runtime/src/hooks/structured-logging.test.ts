import { describe, it, expect, vi, beforeEach } from "vitest";
import { StructuredLoggingHook, createStructuredLoggingHook } from "./structured-logging";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors";

describe("StructuredLoggingHook", () => {
  let logger: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };

  const baseConfig = {
    logger: {} as typeof logger,
    tenantId: "test-tenant-123",
  };

  beforeEach(() => {
    logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
  });

  describe("constructor", () => {
    it("should initialize with required config", () => {
      const hook = new StructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      expect(hook).toBeDefined();
    });

    it("should default requestLogLevel to debug", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      expect(hook).toBeDefined();
    });

    it("should default includeTokenUsage to true", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      expect(hook).toBeDefined();
    });

    it("should default includeDuration to true", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      expect(hook).toBeDefined();
    });

    it("should accept custom options", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
        requestLogLevel: "info",
        includeTokenUsage: false,
        includeDuration: false,
      });
      expect(hook).toBeDefined();
    });
  });

  describe("createBeforeChatHook", () => {
    it("should log request start with metadata", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        payload: {},
      };

      beforeChatHook(context);

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Starting request req-456"),
        expect.objectContaining({
          event: "ai_request_start",
          tenant_id: "test-tenant-123",
          provider_id: "openai",
          model_id: "gpt-4o",
          request_id: "req-456",
        }),
      );
    });

    it("should use custom log level", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
        requestLogLevel: "info",
      });
      const beforeChatHook = hook.createBeforeChatHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        payload: {},
      };

      beforeChatHook(context);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Starting request req-456"),
        expect.any(Object),
      );
      expect(logger.debug).not.toHaveBeenCalled();
    });

    it("should include timestamp in ISO format", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();

      const startTime = Date.now();
      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: startTime,
        payload: {},
      };

      beforeChatHook(context);

      const loggedData = logger.debug.mock.calls[0]?.[1];
      expect(loggedData).toHaveProperty("timestamp");
      expect(typeof loggedData?.timestamp).toBe("string");
      expect(new Date(loggedData?.timestamp as string).getTime()).toBeGreaterThanOrEqual(
        startTime - 100,
      );
    });
  });

  describe("createOnChatCompleteHook", () => {
    it("should log successful completion with duration and token usage", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      const onChatCompleteHook = hook.createOnChatCompleteHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        response: { content: "Hello!" },
        durationMs: 1500,
        tokenUsage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      };

      onChatCompleteHook(context);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Completed request req-456"),
        expect.objectContaining({
          event: "ai_request_complete",
          tenant_id: "test-tenant-123",
          provider_id: "openai",
          model_id: "gpt-4o",
          request_id: "req-456",
          status: "success",
          duration_ms: 1500,
          token_usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
        }),
      );
    });

    it("should exclude token usage when disabled", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
        includeTokenUsage: false,
      });
      const onChatCompleteHook = hook.createOnChatCompleteHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        response: { content: "Hello!" },
        durationMs: 1500,
        tokenUsage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      };

      onChatCompleteHook(context);

      const loggedData = logger.info.mock.calls[0]?.[1];
      expect(loggedData).not.toHaveProperty("token_usage");
    });

    it("should exclude duration when disabled", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
        includeDuration: false,
      });
      const onChatCompleteHook = hook.createOnChatCompleteHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        response: { content: "Hello!" },
        durationMs: 1500,
      };

      onChatCompleteHook(context);

      const loggedData = logger.info.mock.calls[0]?.[1];
      expect(loggedData).not.toHaveProperty("duration_ms");
    });

    it("should handle missing token usage gracefully", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      const onChatCompleteHook = hook.createOnChatCompleteHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        response: { content: "Hello!" },
        durationMs: 1500,
        tokenUsage: undefined,
      };

      onChatCompleteHook(context);

      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: "success",
          duration_ms: 1500,
        }),
      );
    });
  });

  describe("createOnChatErrorHook", () => {
    it("should log error with metadata", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      const onErrorHook = hook.createOnChatErrorHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        error: new AgentRuntimeError({
          code: AgentRuntimeErrorCode.INTERNAL_ERROR,
          providerId: "openai",
          tenantId: "test-tenant-123",
          message: "Provider API error",
          statusCode: 500,
        }),
        durationMs: 500,
      };

      onErrorHook(context);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed request req-456"),
        expect.objectContaining({
          event: "ai_request_error",
          tenant_id: "test-tenant-123",
          provider_id: "openai",
          model_id: "gpt-4o",
          request_id: "req-456",
          status: "error",
          error_message: "Provider API error",
          duration_ms: 500,
        }),
      );
    });

    it("should include error stack trace", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      const onErrorHook = hook.createOnChatErrorHook();

      const error = new Error("Test error");
      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        error,
        durationMs: 500,
      };

      onErrorHook(context);

      const loggedData = logger.error.mock.calls[0]?.[1];
      expect(loggedData).toHaveProperty("error_stack");
      expect(typeof loggedData?.error_stack).toBe("string");
    });

    it("should handle non-Error objects", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      const onErrorHook = hook.createOnChatErrorHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        error: "String error message",
        durationMs: 500,
      };

      onErrorHook(context);

      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          error_message: "String error message",
          status: "error",
        }),
      );
    });

    it("should exclude duration when disabled", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
        includeDuration: false,
      });
      const onErrorHook = hook.createOnChatErrorHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        error: new Error("Test error"),
        durationMs: 500,
      };

      onErrorHook(context);

      const loggedData = logger.error.mock.calls[0]?.[1];
      expect(loggedData).not.toHaveProperty("duration_ms");
    });
  });

  describe("integration", () => {
    it("should log complete request lifecycle", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();
      const onChatCompleteHook = hook.createOnChatCompleteHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        requestId: "req-789",
        startedAt: Date.now(),
        payload: {},
      };

      // Before chat
      beforeChatHook(context);
      expect(logger.debug).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Starting request req-789"),
        expect.any(Object),
      );

      // Complete chat
      const completeContext = {
        ...context,
        response: { content: "Test response" },
        durationMs: 2000,
        tokenUsage: {
          promptTokens: 20,
          completionTokens: 10,
          totalTokens: 30,
        },
      };

      onChatCompleteHook(completeContext);
      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Completed request req-789"),
        expect.any(Object),
      );
    });

    it("should log error lifecycle", () => {
      const hook = createStructuredLoggingHook({
        ...baseConfig,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();
      const onErrorHook = hook.createOnChatErrorHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-error",
        startedAt: Date.now(),
        payload: {},
      };

      // Before chat
      beforeChatHook(context);
      expect(logger.debug).toHaveBeenCalledTimes(1);

      // Error
      const errorContext = {
        ...context,
        error: new AgentRuntimeError({
          code: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
          providerId: "openai",
          tenantId: "test-tenant-123",
          message: "Rate limit exceeded",
          statusCode: 429,
        }),
        durationMs: 100,
      };

      onErrorHook(errorContext);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed request req-error"),
        expect.any(Object),
      );
    });
  });
});
