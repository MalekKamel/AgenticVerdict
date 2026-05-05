import { describe, it, expect, vi } from "vitest";
import type {
  HookContext,
  BeforeChatContext,
  OnChatCompleteContext,
  OnChatErrorContext,
  BeforeChatHook,
  OnChatCompleteHook,
  OnChatErrorHook,
  HookRegistry,
  ConditionalHook,
  HookExecutionResult,
} from "../types/hooks";

describe("Hook Types", () => {
  const baseContext: HookContext = {
    tenantId: "tenant-123",
    providerId: "openai",
    modelId: "gpt-4o",
    requestId: "req-456",
    startedAt: Date.now(),
  };

  describe("HookContext", () => {
    it("should have required properties", () => {
      expect(baseContext.tenantId).toBe("tenant-123");
      expect(baseContext.providerId).toBe("openai");
      expect(baseContext.modelId).toBe("gpt-4o");
      expect(baseContext.requestId).toBe("req-456");
      expect(typeof baseContext.startedAt).toBe("number");
    });

    it("should maintain tenant isolation", () => {
      const context1: HookContext = { ...baseContext, tenantId: "tenant-1" };
      const context2: HookContext = { ...baseContext, tenantId: "tenant-2" };

      expect(context1.tenantId).not.toBe(context2.tenantId);
    });
  });

  describe("BeforeChatContext", () => {
    it("should extend HookContext with payload", () => {
      const beforeContext: BeforeChatContext = {
        ...baseContext,
        payload: { messages: [{ role: "user", content: "Hello" }] },
      };

      expect(beforeContext.payload).toBeDefined();
      expect(beforeContext.tenantId).toBe("tenant-123");
    });
  });

  describe("OnChatCompleteContext", () => {
    it("should include response and duration", () => {
      const completeContext: OnChatCompleteContext = {
        ...baseContext,
        response: { id: "chat-123", choices: [] },
        durationMs: 1500,
        tokenUsage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
      };

      expect(completeContext.durationMs).toBe(1500);
      expect(completeContext.tokenUsage?.totalTokens).toBe(150);
    });

    it("should have optional tokenUsage", () => {
      const completeContext: OnChatCompleteContext = {
        ...baseContext,
        response: { id: "chat-123" },
        durationMs: 1200,
      };

      expect(completeContext.tokenUsage).toBeUndefined();
    });
  });

  describe("OnChatErrorContext", () => {
    it("should include error and duration", () => {
      const error = new Error("Provider timeout");
      const errorContext: OnChatErrorContext = {
        ...baseContext,
        error,
        durationMs: 5000,
      };

      expect(errorContext.error).toBe(error);
      expect(errorContext.durationMs).toBe(5000);
    });
  });

  describe("Hook Functions", () => {
    it("BeforeChatHook should accept BeforeChatContext", async () => {
      const beforeHook: BeforeChatHook = vi.fn().mockResolvedValue(undefined);

      const context: BeforeChatContext = {
        ...baseContext,
        payload: { messages: [] },
      };

      await beforeHook(context);
      expect(beforeHook).toHaveBeenCalledWith(context);
    });

    it("OnChatCompleteHook should accept OnChatCompleteContext", async () => {
      const completeHook: OnChatCompleteHook = vi.fn().mockResolvedValue(undefined);

      const context: OnChatCompleteContext = {
        ...baseContext,
        response: {},
        durationMs: 1000,
      };

      await completeHook(context);
      expect(completeHook).toHaveBeenCalledWith(context);
    });

    it("OnChatErrorHook should accept OnChatErrorContext", async () => {
      const errorHook: OnChatErrorHook = vi.fn().mockResolvedValue(undefined);

      const context: OnChatErrorContext = {
        ...baseContext,
        error: new Error("Test error"),
        durationMs: 2000,
      };

      await errorHook(context);
      expect(errorHook).toHaveBeenCalledWith(context);
    });

    it("should support synchronous hooks", () => {
      const syncHook: BeforeChatHook = () => {
        // Synchronous operation
      };

      expect(() => syncHook({ ...baseContext, payload: {} })).not.toThrow();
    });

    it("should support asynchronous hooks", async () => {
      const asyncHook: BeforeChatHook = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      };

      await expect(asyncHook({ ...baseContext, payload: {} })).resolves.not.toThrow();
    });
  });

  describe("HookRegistry", () => {
    it("should initialize with empty arrays", () => {
      const registry: HookRegistry = {
        beforeChat: [],
        onChatComplete: [],
        onChatError: [],
      };

      expect(registry.beforeChat).toHaveLength(0);
      expect(registry.onChatComplete).toHaveLength(0);
      expect(registry.onChatError).toHaveLength(0);
    });

    it("should support multiple hooks per event", () => {
      const hook1: BeforeChatHook = vi.fn();
      const hook2: BeforeChatHook = vi.fn();
      const hook3: BeforeChatHook = vi.fn();

      const registry: HookRegistry = {
        beforeChat: [hook1, hook2, hook3],
        onChatComplete: [],
        onChatError: [],
      };

      expect(registry.beforeChat).toHaveLength(3);
    });
  });

  describe("ConditionalHook", () => {
    it("should support hooks with conditions", async () => {
      const conditionalHook: ConditionalHook<BeforeChatHook> = {
        hook: vi.fn(),
        condition: (context) => context.tenantId === "tenant-123",
        optional: true,
      };

      const shouldExecute = await conditionalHook.condition?.(baseContext);
      expect(shouldExecute).toBe(true);

      const differentTenant = { ...baseContext, tenantId: "other-tenant" };
      const shouldSkip = await conditionalHook.condition?.(differentTenant);
      expect(shouldSkip).toBe(false);
    });

    it("should support async conditions", async () => {
      const conditionalHook: ConditionalHook<BeforeChatHook> = {
        hook: vi.fn(),
        condition: async (context) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return context.tenantId === "tenant-123";
        },
      };

      const result = await conditionalHook.condition?.(baseContext);
      expect(result).toBe(true);
    });

    it("should work without condition (always execute)", async () => {
      const conditionalHook: ConditionalHook<BeforeChatHook> = {
        hook: vi.fn(),
      };

      expect(conditionalHook.condition).toBeUndefined();
    });
  });

  describe("HookExecutionResult", () => {
    it("should track successful execution", () => {
      const result: HookExecutionResult = {
        hookName: "billing-hook",
        success: true,
        durationMs: 50,
      };

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.skipped).toBeUndefined();
    });

    it("should track failed execution", () => {
      const error = new Error("Hook failed");
      const result: HookExecutionResult = {
        hookName: "tracing-hook",
        success: false,
        durationMs: 100,
        error,
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it("should track skipped execution", () => {
      const result: HookExecutionResult = {
        hookName: "optional-hook",
        success: true,
        durationMs: 0,
        skipped: true,
        skipReason: "Condition not met",
      };

      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe("Condition not met");
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct context types", () => {
      // This should compile without errors
      const beforeHook: BeforeChatHook = (context: BeforeChatContext) => {
        // Has access to payload
        void context.payload;
      };

      const completeHook: OnChatCompleteHook = (context: OnChatCompleteContext) => {
        // Has access to response and tokenUsage
        void context.response;
        void context.tokenUsage;
      };

      const errorHook: OnChatErrorHook = (context: OnChatErrorContext) => {
        // Has access to error
        void context.error;
      };

      expect(typeof beforeHook).toBe("function");
      expect(typeof completeHook).toBe("function");
      expect(typeof errorHook).toBe("function");
    });

    it("should support ChatHook union type", () => {
      const hooks: ChatHook[] = [
        vi.fn() as BeforeChatHook,
        vi.fn() as OnChatCompleteHook,
        vi.fn() as OnChatErrorHook,
      ];

      expect(hooks).toHaveLength(3);
    });
  });
});
