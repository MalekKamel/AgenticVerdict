import { describe, it, expect, vi, beforeEach } from "vitest";
import { HookExecutor, createHookExecutor } from "./HookExecutor";
import type {
  BeforeChatHook,
  OnChatCompleteHook,
  OnChatErrorHook,
  ConditionalHook,
  HookContext,
} from "../types/hooks";
import { AgentRuntimeError } from "../errors";

describe("HookExecutor", () => {
  const baseContext: HookContext = {
    tenantId: "tenant-123",
    providerId: "openai",
    modelId: "gpt-4o",
    requestId: "req-456",
    startedAt: Date.now(),
  };

  const mockLogger = {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create executor with empty registry", () => {
      const executor = new HookExecutor({
        beforeChat: [],
        onChatComplete: [],
        onChatError: [],
      });

      expect(executor).toBeDefined();
    });

    it("should accept optional logger", () => {
      const executor = new HookExecutor(
        {
          beforeChat: [],
          onChatComplete: [],
          onChatError: [],
        },
        { logger: mockLogger },
      );

      expect(executor).toBeDefined();
    });
  });

  describe("executeBeforeChat", () => {
    it("should execute hooks in registration order", async () => {
      const executionOrder: number[] = [];

      const hook1: BeforeChatHook = vi.fn().mockImplementation(() => {
        executionOrder.push(1);
      });
      const hook2: BeforeChatHook = vi.fn().mockImplementation(() => {
        executionOrder.push(2);
      });
      const hook3: BeforeChatHook = vi.fn().mockImplementation(() => {
        executionOrder.push(3);
      });

      const executor = new HookExecutor({
        beforeChat: [hook1, hook2, hook3],
        onChatComplete: [],
        onChatError: [],
      });

      await executor.executeBeforeChat({
        ...baseContext,
        payload: { messages: [] },
      });

      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it("should pass correct context to hooks", async () => {
      const hook: BeforeChatHook = vi.fn();
      const executor = new HookExecutor({
        beforeChat: [hook],
        onChatComplete: [],
        onChatError: [],
      });

      const payload = { messages: [{ role: "user", content: "Hello" }] };
      await executor.executeBeforeChat({
        ...baseContext,
        payload,
      });

      expect(hook).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-123",
          providerId: "openai",
          payload,
        }),
      );
    });

    it("should throw on required hook failure", async () => {
      const error = new Error("Hook failed");
      const hook: BeforeChatHook = vi.fn().mockRejectedValue(error);

      const executor = new HookExecutor(
        {
          beforeChat: [hook],
          onChatComplete: [],
          onChatError: [],
        },
        { logger: mockLogger },
      );

      await expect(
        executor.executeBeforeChat({
          ...baseContext,
          payload: {},
        }),
      ).rejects.toThrow(AgentRuntimeError);

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should log but not throw on optional hook failure", async () => {
      const error = new Error("Optional hook failed");
      const optionalHook: ConditionalHook<BeforeChatHook> = {
        hook: vi.fn().mockRejectedValue(error),
        optional: true,
      };

      const executor = new HookExecutor(
        {
          beforeChat: [optionalHook],
          onChatComplete: [],
          onChatError: [],
        },
        { logger: mockLogger },
      );

      await expect(
        executor.executeBeforeChat({
          ...baseContext,
          payload: {},
        }),
      ).resolves.not.toThrow();

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should skip hooks when condition is not met", async () => {
      const hook: BeforeChatHook = vi.fn();
      const conditionalHook: ConditionalHook<BeforeChatHook> = {
        hook,
        condition: (ctx) => ctx.tenantId === "other-tenant",
      };

      const executor = new HookExecutor({
        beforeChat: [conditionalHook],
        onChatComplete: [],
        onChatError: [],
      });

      await executor.executeBeforeChat({
        ...baseContext,
        payload: {},
      });

      expect(hook).not.toHaveBeenCalled();
    });

    it("should execute hooks when condition is met", async () => {
      const hook: BeforeChatHook = vi.fn();
      const conditionalHook: ConditionalHook<BeforeChatHook> = {
        hook,
        condition: (ctx) => ctx.tenantId === "tenant-123",
      };

      const executor = new HookExecutor({
        beforeChat: [conditionalHook],
        onChatComplete: [],
        onChatError: [],
      });

      await executor.executeBeforeChat({
        ...baseContext,
        payload: {},
      });

      expect(hook).toHaveBeenCalled();
    });

    it("should support async conditions", async () => {
      const hook: BeforeChatHook = vi.fn();
      const conditionalHook: ConditionalHook<BeforeChatHook> = {
        hook,
        condition: async (ctx) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return ctx.tenantId === "tenant-123";
        },
      };

      const executor = new HookExecutor({
        beforeChat: [conditionalHook],
        onChatComplete: [],
        onChatError: [],
      });

      await executor.executeBeforeChat({
        ...baseContext,
        payload: {},
      });

      expect(hook).toHaveBeenCalled();
    });
  });

  describe("executeOnChatComplete", () => {
    it("should execute all hooks even if one fails", async () => {
      const hook1: OnChatCompleteHook = vi.fn().mockRejectedValue(new Error("First failed"));
      const hook2: OnChatCompleteHook = vi.fn().mockResolvedValue(undefined);

      const executor = new HookExecutor(
        {
          beforeChat: [],
          onChatComplete: [hook1, hook2],
          onChatError: [],
        },
        { logger: mockLogger },
      );

      const results = await executor.executeOnChatComplete({
        ...baseContext,
        response: {},
        durationMs: 1000,
      });

      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
      expect(results).toHaveLength(2);
    });

    it("should return execution results", async () => {
      const hook: OnChatCompleteHook = vi.fn().mockResolvedValue(undefined);
      const executor = new HookExecutor({
        beforeChat: [],
        onChatComplete: [hook],
        onChatError: [],
      });

      const results = await executor.executeOnChatComplete({
        ...baseContext,
        response: {},
        durationMs: 1000,
      });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].hookName).toBe("onChatComplete-0");
    });

    it("should pass token usage to hooks", async () => {
      const hook: OnChatCompleteHook = vi.fn();
      const executor = new HookExecutor({
        beforeChat: [],
        onChatComplete: [hook],
        onChatError: [],
      });

      const tokenUsage = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      };

      await executor.executeOnChatComplete({
        ...baseContext,
        response: {},
        durationMs: 1000,
        tokenUsage,
      });

      expect(hook).toHaveBeenCalledWith(expect.objectContaining({ tokenUsage }));
    });
  });

  describe("executeOnChatError", () => {
    it("should execute error hooks when main operation fails", async () => {
      const errorHook: OnChatErrorHook = vi.fn();
      const executor = new HookExecutor({
        beforeChat: [],
        onChatComplete: [],
        onChatError: [errorHook],
      });

      const error = new Error("Chat failed");
      const results = await executor.executeOnChatError({
        ...baseContext,
        error,
        durationMs: 5000,
      });

      expect(errorHook).toHaveBeenCalled();
      expect(results).toHaveLength(1);
    });

    it("should pass error to hooks", async () => {
      const errorHook: OnChatErrorHook = vi.fn();
      const executor = new HookExecutor({
        beforeChat: [],
        onChatComplete: [],
        onChatError: [errorHook],
      });

      const error = new Error("Specific error message");
      await executor.executeOnChatError({
        ...baseContext,
        error,
        durationMs: 3000,
      });

      expect(errorHook).toHaveBeenCalledWith(expect.objectContaining({ error }));
    });

    it("should continue even if error hook fails", async () => {
      const hook1: OnChatErrorHook = vi.fn().mockRejectedValue(new Error("Hook 1 failed"));
      const hook2: OnChatErrorHook = vi.fn().mockResolvedValue(undefined);

      const executor = new HookExecutor(
        {
          beforeChat: [],
          onChatComplete: [],
          onChatError: [hook1, hook2],
        },
        { logger: mockLogger },
      );

      const results = await executor.executeOnChatError({
        ...baseContext,
        error: new Error("Original error"),
        durationMs: 2000,
      });

      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
      expect(results.some((r) => !r.success)).toBe(true);
    });
  });

  describe("createHookExecutor", () => {
    it("should create executor with typed hooks", () => {
      const beforeHook: BeforeChatHook = vi.fn();
      const completeHook: OnChatCompleteHook = vi.fn();
      const errorHook: OnChatErrorHook = vi.fn();

      const executor = createHookExecutor({
        beforeChat: [beforeHook],
        onChatComplete: [completeHook],
        onChatError: [errorHook],
      });

      expect(executor).toBeInstanceOf(HookExecutor);
    });

    it("should work with conditional hooks", () => {
      const conditionalHook: ConditionalHook<BeforeChatHook> = {
        hook: vi.fn(),
        condition: (ctx) => ctx.tenantId === "tenant-123",
      };

      const executor = createHookExecutor({
        beforeChat: [conditionalHook],
      });

      expect(executor).toBeInstanceOf(HookExecutor);
    });

    it("should accept logger", () => {
      const executor = createHookExecutor({
        logger: mockLogger,
      });

      expect(executor).toBeInstanceOf(HookExecutor);
    });

    it("should work with no hooks", () => {
      const executor = createHookExecutor();

      expect(executor).toBeInstanceOf(HookExecutor);
    });
  });

  describe("logging", () => {
    it("should log successful hook execution", async () => {
      const hook: BeforeChatHook = vi.fn().mockResolvedValue(undefined);
      const executor = new HookExecutor(
        {
          beforeChat: [hook],
          onChatComplete: [],
          onChatError: [],
        },
        { logger: mockLogger },
      );

      await executor.executeBeforeChat({
        ...baseContext,
        payload: {},
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("executed successfully"),
      );
    });

    it("should log hook errors", async () => {
      const hook: BeforeChatHook = vi.fn().mockRejectedValue(new Error("Failed"));
      const executor = new HookExecutor(
        {
          beforeChat: [hook],
          onChatComplete: [],
          onChatError: [],
        },
        { logger: mockLogger },
      );

      await expect(
        executor.executeBeforeChat({
          ...baseContext,
          payload: {},
        }),
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("tenant isolation", () => {
    it("should maintain tenant context in hooks", async () => {
      const capturedTenantIds: string[] = [];
      const hook: BeforeChatHook = vi.fn().mockImplementation((ctx) => {
        capturedTenantIds.push(ctx.tenantId);
      });

      const executor = new HookExecutor({
        beforeChat: [hook],
        onChatComplete: [],
        onChatError: [],
      });

      // Simulate requests from different tenants
      await executor.executeBeforeChat({
        ...baseContext,
        tenantId: "tenant-A",
        payload: {},
      });

      await executor.executeBeforeChat({
        ...baseContext,
        tenantId: "tenant-B",
        payload: {},
      });

      expect(capturedTenantIds).toEqual(["tenant-A", "tenant-B"]);
      expect(capturedTenantIds[0]).not.toBe(capturedTenantIds[1]);
    });
  });
});
