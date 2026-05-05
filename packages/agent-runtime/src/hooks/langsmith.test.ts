import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LangSmithTracingHook, createLangSmithTracingHook } from "./langsmith";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors";

// Mock LangSmith Client
vi.mock("langsmith", () => ({
  Client: vi.fn().mockImplementation(() => ({
    createRun: vi.fn(),
    updateRun: vi.fn(),
  })),
}));

import { Client } from "langsmith";

describe("LangSmithTracingHook", () => {
  let mockClient: {
    createRun: ReturnType<typeof vi.fn>;
    updateRun: ReturnType<typeof vi.fn>;
  };

  let logger: {
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };

  const baseConfig = {
    apiKey: "test-api-key",
    projectName: "test-project",
    tenantId: "test-tenant-123",
  };

  beforeEach(() => {
    mockClient = {
      createRun: vi.fn().mockResolvedValue({ id: "run-123" }),
      updateRun: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Client).mockImplementation(() => mockClient as unknown as Client);

    logger = {
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with required config", () => {
      const hook = new LangSmithTracingHook(baseConfig);
      expect(hook).toBeDefined();
      expect(Client).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        apiUrl: undefined,
      });
    });

    it("should initialize with optional apiUrl", () => {
      const hook = new LangSmithTracingHook({
        ...baseConfig,
        apiUrl: "https://api.smith.langchain.com",
      });
      expect(hook).toBeDefined();
      expect(Client).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        apiUrl: "https://api.smith.langchain.com",
      });
    });

    it("should default includePayloads to false", () => {
      const hook = new LangSmithTracingHook(baseConfig);
      expect(hook).toBeDefined();
    });

    it("should accept includePayloads option", () => {
      const hook = new LangSmithTracingHook({
        ...baseConfig,
        includePayloads: true,
      });
      expect(hook).toBeDefined();
    });
  });

  describe("createBeforeChatHook", () => {
    it("should create a trace on beforeChat", async () => {
      const hook = createLangSmithTracingHook({
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
        payload: { messages: [{ role: "user", content: "Hello" }] },
      };

      await beforeChatHook(context);

      expect(mockClient.createRun).toHaveBeenCalledWith({
        name: "chat.openai.gpt-4o",
        run_type: "llm",
        inputs: { requestId: "req-456" },
        metadata: {
          tenant_id: "test-tenant-123",
          provider_id: "openai",
          model_id: "gpt-4o",
          request_id: "req-456",
        },
        tags: ["provider:openai", "model:gpt-4o", "tenant:test-tenant-123"],
        project_name: "test-project",
      });
    });

    it("should include payloads when includePayloads is true", async () => {
      const hook = createLangSmithTracingHook({
        ...baseConfig,
        includePayloads: true,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        payload: { messages: [{ role: "user", content: "Hello" }] },
      };

      await beforeChatHook(context);

      expect(mockClient.createRun).toHaveBeenCalledWith(
        expect.objectContaining({
          inputs: { messages: [{ role: "user", content: "Hello" }] },
        }),
      );
    });

    it("should log errors but not throw on trace creation failure", async () => {
      mockClient.createRun.mockRejectedValue(new Error("LangSmith API error"));

      const hook = createLangSmithTracingHook({
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

      await expect(beforeChatHook(context)).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to start trace"),
        expect.any(Error),
      );
    });
  });

  describe("createOnChatCompleteHook", () => {
    beforeEach(() => {
      // Pre-populate run map by calling beforeChat first
      mockClient.createRun.mockResolvedValue({ id: "run-123" });
    });

    it("should update trace with response and token usage", async () => {
      const hook = createLangSmithTracingHook({
        ...baseConfig,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();
      const onChatCompleteHook = hook.createOnChatCompleteHook();

      const beforeContext = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        payload: {},
      };

      await beforeChatHook(beforeContext);

      const completeContext = {
        ...beforeContext,
        response: { content: "Hello!" },
        durationMs: 1500,
        tokenUsage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      };

      await onChatCompleteHook(completeContext);

      expect(mockClient.updateRun).toHaveBeenCalledWith("run-123", {
        outputs: {},
        end_time: expect.any(String),
        extra: {
          metadata: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
            duration_ms: 1500,
          },
        },
      });
    });

    it("should include response when includePayloads is true", async () => {
      const hook = createLangSmithTracingHook({
        ...baseConfig,
        includePayloads: true,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();
      const onChatCompleteHook = hook.createOnChatCompleteHook();

      const beforeContext = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        payload: {},
      };

      await beforeChatHook(beforeContext);

      const completeContext = {
        ...beforeContext,
        response: { content: "Hello!" },
        durationMs: 1500,
        tokenUsage: undefined,
      };

      await onChatCompleteHook(completeContext);

      expect(mockClient.updateRun).toHaveBeenCalledWith(
        "run-123",
        expect.objectContaining({
          outputs: { response: { content: "Hello!" } },
        }),
      );
    });

    it("should handle missing run gracefully", async () => {
      const hook = createLangSmithTracingHook({
        ...baseConfig,
        logger,
      });
      const onChatCompleteHook = hook.createOnChatCompleteHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-nonexistent",
        startedAt: Date.now(),
        response: { content: "Hello!" },
        durationMs: 1500,
      };

      await onChatCompleteHook(context);

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("No trace found"));
      expect(mockClient.updateRun).not.toHaveBeenCalled();
    });

    it("should log errors but not throw on update failure", async () => {
      mockClient.updateRun.mockRejectedValue(new Error("LangSmith API error"));

      const hook = createLangSmithTracingHook({
        ...baseConfig,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();
      const onChatCompleteHook = hook.createOnChatCompleteHook();

      const beforeContext = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        payload: {},
      };

      await beforeChatHook(beforeContext);
      mockClient.updateRun.mockRejectedValue(new Error("LangSmith API error"));

      const completeContext = {
        ...beforeContext,
        response: { content: "Hello!" },
        durationMs: 1500,
      };

      await expect(onChatCompleteHook(completeContext)).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to complete trace"),
        expect.any(Error),
      );
    });
  });

  describe("createOnChatErrorHook", () => {
    beforeEach(() => {
      mockClient.createRun.mockResolvedValue({ id: "run-123" });
    });

    it("should update trace with error information", async () => {
      const hook = createLangSmithTracingHook({
        ...baseConfig,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();
      const onErrorHook = hook.createOnChatErrorHook();

      const beforeContext = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        payload: {},
      };

      await beforeChatHook(beforeContext);

      const errorContext = {
        ...beforeContext,
        error: new AgentRuntimeError({
          code: AgentRuntimeErrorCode.INTERNAL_ERROR,
          providerId: "openai",
          tenantId: "test-tenant-123",
          message: "Provider API error",
          statusCode: 500,
        }),
        durationMs: 500,
      };

      await onErrorHook(errorContext);

      expect(mockClient.updateRun).toHaveBeenCalledWith("run-123", {
        end_time: expect.any(String),
        error: "Provider API error",
        extra: {
          metadata: {
            error_code: AgentRuntimeErrorCode.INTERNAL_ERROR,
            error_status_code: 500,
            duration_ms: 500,
          },
        },
      });
    });

    it("should handle plain Error objects", async () => {
      const hook = createLangSmithTracingHook({
        ...baseConfig,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();
      const onErrorHook = hook.createOnChatErrorHook();

      const beforeContext = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        payload: {},
      };

      await beforeChatHook(beforeContext);

      const errorContext = {
        ...beforeContext,
        error: new Error("Something went wrong"),
        durationMs: 500,
      };

      await onErrorHook(errorContext);

      expect(mockClient.updateRun).toHaveBeenCalledWith("run-123", {
        end_time: expect.any(String),
        error: "Something went wrong",
        extra: expect.objectContaining({
          metadata: expect.objectContaining({
            duration_ms: 500,
          }),
        }),
      });
    });

    it("should handle non-Error objects", async () => {
      const hook = createLangSmithTracingHook({
        ...baseConfig,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();
      const onErrorHook = hook.createOnChatErrorHook();

      const beforeContext = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        payload: {},
      };

      await beforeChatHook(beforeContext);

      const errorContext = {
        ...beforeContext,
        error: "String error message",
        durationMs: 500,
      };

      await onErrorHook(errorContext);

      expect(mockClient.updateRun).toHaveBeenCalledWith("run-123", {
        end_time: expect.any(String),
        error: "String error message",
        extra: expect.any(Object),
      });
    });

    it("should handle missing run gracefully", async () => {
      const hook = createLangSmithTracingHook({
        ...baseConfig,
        logger,
      });
      const onErrorHook = hook.createOnChatErrorHook();

      const context = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-nonexistent",
        startedAt: Date.now(),
        error: new Error("Test error"),
        durationMs: 500,
      };

      await onErrorHook(context);

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("No trace found"));
      expect(mockClient.updateRun).not.toHaveBeenCalled();
    });

    it("should log errors but not throw on update failure", async () => {
      mockClient.updateRun.mockRejectedValue(new Error("LangSmith API error"));

      const hook = createLangSmithTracingHook({
        ...baseConfig,
        logger,
      });
      const beforeChatHook = hook.createBeforeChatHook();
      const onErrorHook = hook.createOnChatErrorHook();

      const beforeContext = {
        tenantId: "test-tenant-123",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-456",
        startedAt: Date.now(),
        payload: {},
      };

      await beforeChatHook(beforeContext);
      mockClient.updateRun.mockRejectedValue(new Error("LangSmith API error"));

      const errorContext = {
        ...beforeContext,
        error: new Error("Test error"),
        durationMs: 500,
      };

      await expect(onErrorHook(errorContext)).resolves.not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to record error"),
        expect.any(Error),
      );
    });
  });

  describe("integration", () => {
    it("should handle complete request lifecycle", async () => {
      const hook = createLangSmithTracingHook({
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
        payload: { messages: [{ role: "user", content: "Test" }] },
      };

      // Before chat
      await beforeChatHook(context);
      expect(mockClient.createRun).toHaveBeenCalledTimes(1);

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

      await onChatCompleteHook(completeContext);
      expect(mockClient.updateRun).toHaveBeenCalledTimes(1);

      // Verify run map is cleaned up
      expect(mockClient.createRun).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "chat.anthropic.claude-3-5-sonnet",
        }),
      );
    });

    it("should handle error after successful trace start", async () => {
      const hook = createLangSmithTracingHook({
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
      await beforeChatHook(context);
      expect(mockClient.createRun).toHaveBeenCalledTimes(1);

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

      await onErrorHook(errorContext);
      expect(mockClient.updateRun).toHaveBeenCalledTimes(1);
      expect(mockClient.updateRun).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          error: "Rate limit exceeded",
          extra: expect.objectContaining({
            metadata: expect.objectContaining({
              error_code: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
              error_status_code: 429,
            }),
          }),
        }),
      );
    });
  });
});
