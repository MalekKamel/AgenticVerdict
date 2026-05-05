import { describe, it, expect, vi } from "vitest";
import {
  composeBeforeChatHooks,
  composeOnChatCompleteHooks,
  composeOnChatErrorHooks,
  createConditionalHook,
} from "./hook-composition";
import type { BeforeChatContext, OnChatCompleteContext, OnChatErrorContext } from "../types/hooks";

describe("Hook Composition", () => {
  describe("composeBeforeChatHooks", () => {
    it("should execute hooks in order", async () => {
      const executionOrder: number[] = [];

      const hook1 = vi.fn().mockImplementation(() => {
        executionOrder.push(1);
      });
      const hook2 = vi.fn().mockImplementation(() => {
        executionOrder.push(2);
      });
      const hook3 = vi.fn().mockImplementation(() => {
        executionOrder.push(3);
      });

      const composed = composeBeforeChatHooks(hook1, hook2, hook3);

      const context: BeforeChatContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      };

      await composed(context);

      expect(executionOrder).toEqual([1, 2, 3]);
      expect(hook1).toHaveBeenCalledWith(context);
      expect(hook2).toHaveBeenCalledWith(context);
      expect(hook3).toHaveBeenCalledWith(context);
    });

    it("should stop execution if a hook throws", async () => {
      const executionOrder: number[] = [];

      const hook1 = vi.fn().mockImplementation(() => {
        executionOrder.push(1);
      });
      const hook2 = vi.fn().mockImplementation(() => {
        executionOrder.push(2);
        throw new Error("Hook 2 failed");
      });
      const hook3 = vi.fn().mockImplementation(() => {
        executionOrder.push(3);
      });

      const composed = composeBeforeChatHooks(hook1, hook2, hook3);

      const context: BeforeChatContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      };

      await expect(composed(context)).rejects.toThrow("Hook 2 failed");
      expect(executionOrder).toEqual([1, 2]);
      expect(hook3).not.toHaveBeenCalled();
    });

    it("should skip hooks when condition is false", async () => {
      const hook1 = vi.fn();
      const hook2 = vi.fn();
      const hook3 = vi.fn();

      const conditionalHook2 = createConditionalHook(hook2, () => false);

      const composed = composeBeforeChatHooks(hook1, conditionalHook2, hook3);

      const context: BeforeChatContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      };

      await composed(context);

      expect(hook1).toHaveBeenCalled();
      expect(hook2).not.toHaveBeenCalled();
      expect(hook3).toHaveBeenCalled();
    });

    it("should support async conditions", async () => {
      const hook1 = vi.fn();
      const hook2 = vi.fn();

      const conditionalHook = createConditionalHook(hook2, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return true;
      });

      const composed = composeBeforeChatHooks(hook1, conditionalHook);

      const context: BeforeChatContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      };

      await composed(context);

      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
    });

    it("should skip hook if condition throws", async () => {
      const hook1 = vi.fn();
      const hook2 = vi.fn();

      const conditionalHook = createConditionalHook(hook2, () => {
        throw new Error("Condition failed");
      });

      const composed = composeBeforeChatHooks(hook1, conditionalHook);

      const context: BeforeChatContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      };

      await expect(composed(context)).resolves.not.toThrow();
      expect(hook1).toHaveBeenCalled();
      expect(hook2).not.toHaveBeenCalled();
    });
  });

  describe("composeOnChatCompleteHooks", () => {
    it("should execute all hooks even if some fail", async () => {
      const executionOrder: number[] = [];

      const hook1 = vi.fn().mockImplementation(() => {
        executionOrder.push(1);
      });
      const hook2 = vi.fn().mockImplementation(() => {
        executionOrder.push(2);
        throw new Error("Hook 2 failed");
      });
      const hook3 = vi.fn().mockImplementation(() => {
        executionOrder.push(3);
      });

      const composed = composeOnChatCompleteHooks(hook1, hook2, hook3);

      const context: OnChatCompleteContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        response: { content: "Test" },
        durationMs: 100,
      };

      await expect(composed(context)).resolves.not.toThrow();
      expect(executionOrder).toEqual([1, 2, 3]);
      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
      expect(hook3).toHaveBeenCalled();
    });

    it("should skip hooks when condition is false", async () => {
      const hook1 = vi.fn();
      const hook2 = vi.fn();
      const hook3 = vi.fn();

      const conditionalHook2 = createConditionalHook(hook2, () => false);

      const composed = composeOnChatCompleteHooks(hook1, conditionalHook2, hook3);

      const context: OnChatCompleteContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        response: { content: "Test" },
        durationMs: 100,
      };

      await composed(context);

      expect(hook1).toHaveBeenCalled();
      expect(hook2).not.toHaveBeenCalled();
      expect(hook3).toHaveBeenCalled();
    });

    it("should log errors but not throw", async () => {
      const hook1 = vi.fn().mockImplementation(() => {
        throw new Error("Hook 1 failed");
      });

      const composed = composeOnChatCompleteHooks(hook1);

      const context: OnChatCompleteContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        response: { content: "Test" },
        durationMs: 100,
      };

      // Should not throw
      await expect(composed(context)).resolves.not.toThrow();
    });
  });

  describe("composeOnChatErrorHooks", () => {
    it("should execute all hooks even if some fail", async () => {
      const executionOrder: number[] = [];

      const hook1 = vi.fn().mockImplementation(() => {
        executionOrder.push(1);
      });
      const hook2 = vi.fn().mockImplementation(() => {
        executionOrder.push(2);
        throw new Error("Hook 2 failed");
      });
      const hook3 = vi.fn().mockImplementation(() => {
        executionOrder.push(3);
      });

      const composed = composeOnChatErrorHooks(hook1, hook2, hook3);

      const context: OnChatErrorContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        error: new Error("Test error"),
        durationMs: 100,
      };

      await expect(composed(context)).resolves.not.toThrow();
      expect(executionOrder).toEqual([1, 2, 3]);
      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
      expect(hook3).toHaveBeenCalled();
    });

    it("should skip hooks when condition is false", async () => {
      const hook1 = vi.fn();
      const hook2 = vi.fn();
      const hook3 = vi.fn();

      const conditionalHook2 = createConditionalHook(hook2, () => false);

      const composed = composeOnChatErrorHooks(hook1, conditionalHook2, hook3);

      const context: OnChatErrorContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        error: new Error("Test error"),
        durationMs: 100,
      };

      await composed(context);

      expect(hook1).toHaveBeenCalled();
      expect(hook2).not.toHaveBeenCalled();
      expect(hook3).toHaveBeenCalled();
    });
  });

  describe("createConditionalHook", () => {
    it("should create a conditional hook with all properties", () => {
      const hook = vi.fn();
      const condition = vi.fn().mockReturnValue(true);

      const conditional = createConditionalHook(hook, condition, true);

      expect(conditional).toEqual({
        hook,
        condition,
        optional: true,
      });
    });

    it("should default optional to false", () => {
      const hook = vi.fn();
      const condition = vi.fn().mockReturnValue(true);

      const conditional = createConditionalHook(hook, condition);

      expect(conditional.optional).toBe(false);
    });

    it("should work with beforeChat context", async () => {
      const hook = vi.fn();
      const condition = vi.fn().mockImplementation((ctx: BeforeChatContext) => {
        return ctx.providerId === "openai";
      });

      const conditional = createConditionalHook(hook, condition);

      const context: BeforeChatContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      };

      if (conditional.condition) {
        await Promise.resolve(conditional.condition(context));
      }

      expect(condition).toHaveBeenCalledWith(context);
    });

    it("should work with onChatComplete context", async () => {
      const hook = vi.fn();
      const condition = vi.fn().mockImplementation((ctx: OnChatCompleteContext) => {
        return ctx.durationMs > 1000;
      });

      const conditional = createConditionalHook(hook, condition);

      const context: OnChatCompleteContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        response: { content: "Test" },
        durationMs: 1500,
      };

      if (conditional.condition) {
        await Promise.resolve(conditional.condition(context));
      }

      expect(condition).toHaveBeenCalledWith(context);
    });
  });

  describe("integration", () => {
    it("should compose billing and logging hooks together", async () => {
      const billingHook = vi.fn();
      const loggingHook = vi.fn();
      const tracingHook = vi.fn();

      const composed = composeBeforeChatHooks(billingHook, loggingHook, tracingHook);

      const context: BeforeChatContext = {
        tenantId: "test-tenant",
        providerId: "openai",
        modelId: "gpt-4o",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      };

      await composed(context);

      expect(billingHook).toHaveBeenCalledWith(context);
      expect(loggingHook).toHaveBeenCalledWith(context);
      expect(tracingHook).toHaveBeenCalledWith(context);
    });

    it("should handle mixed conditional and regular hooks", async () => {
      const hook1 = vi.fn();
      const hook2 = vi.fn();
      const hook3 = vi.fn();

      const conditionalHook = createConditionalHook(
        hook2,
        (ctx: BeforeChatContext) => ctx.providerId === "openai",
      );

      const composed = composeBeforeChatHooks(hook1, conditionalHook, hook3);

      const context: BeforeChatContext = {
        tenantId: "test-tenant",
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet",
        requestId: "req-123",
        startedAt: Date.now(),
        payload: {},
      };

      await composed(context);

      expect(hook1).toHaveBeenCalled();
      expect(hook2).not.toHaveBeenCalled(); // Condition not met
      expect(hook3).toHaveBeenCalled();
    });
  });
});
