import { describe, it, expect, vi, beforeEach } from "vitest";
import { BillingHook, createBillingHook } from "./billing";
import type { BillingHookConfig, ModelPricing, TenantBudget } from "./billing";
import type { OnChatCompleteContext, BeforeChatContext } from "../types/hooks";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors";

describe("BillingHook", () => {
  const mockPricing: ModelPricing = {
    inputCostPer1K: 0.0001,
    outputCostPer1K: 0.0003,
  };

  const mockBudget: TenantBudget = {
    totalBudget: 100.0,
    remainingBudget: 50.0,
    hardLimit: true,
    alertThreshold: 0.8,
  };

  const mockConfig: BillingHookConfig = {
    getPricing: vi.fn().mockReturnValue(mockPricing),
    getTenantBudget: vi.fn().mockResolvedValue(mockBudget),
    updateTenantBudget: vi.fn().mockResolvedValue(undefined),
    recordUsage: vi.fn().mockResolvedValue(undefined),
    logger: {
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseContext = {
    tenantId: "tenant-123",
    providerId: "openai",
    modelId: "gpt-4o",
    requestId: "req-456",
    startedAt: Date.now(),
  };

  describe("constructor", () => {
    it("should create billing hook with config", () => {
      const hook = new BillingHook(mockConfig);
      expect(hook).toBeDefined();
    });
  });

  describe("createOnChatCompleteHook", () => {
    it("should calculate cost from token usage", async () => {
      const hook = new BillingHook(mockConfig);
      const completeHook = hook.createOnChatCompleteHook();

      const context: OnChatCompleteContext = {
        ...baseContext,
        response: {},
        durationMs: 1000,
        tokenUsage: {
          promptTokens: 1000,
          completionTokens: 500,
          totalTokens: 1500,
        },
      };

      await completeHook(context);

      expect(mockConfig.recordUsage).toHaveBeenCalledWith(
        "tenant-123",
        "openai",
        "gpt-4o",
        expect.any(Number),
        context.tokenUsage,
      );

      expect(mockConfig.updateTenantBudget).toHaveBeenCalledWith("tenant-123", expect.any(Number));
    });

    it("should skip billing if no token usage", async () => {
      const hook = new BillingHook(mockConfig);
      const completeHook = hook.createOnChatCompleteHook();

      const context: OnChatCompleteContext = {
        ...baseContext,
        response: {},
        durationMs: 1000,
      };

      await completeHook(context);

      expect(mockConfig.recordUsage).not.toHaveBeenCalled();
      expect(mockConfig.updateTenantBudget).not.toHaveBeenCalled();
    });

    it("should skip billing if no pricing found", async () => {
      const config: BillingHookConfig = {
        ...mockConfig,
        getPricing: vi.fn().mockReturnValue(null),
      };
      const hook = new BillingHook(config);
      const completeHook = hook.createOnChatCompleteHook();

      const context: OnChatCompleteContext = {
        ...baseContext,
        response: {},
        durationMs: 1000,
        tokenUsage: {
          promptTokens: 1000,
          completionTokens: 500,
          totalTokens: 1500,
        },
      };

      await completeHook(context);

      expect(mockConfig.recordUsage).not.toHaveBeenCalled();
    });

    it("should not throw on billing errors", async () => {
      const config: BillingHookConfig = {
        ...mockConfig,
        recordUsage: vi.fn().mockRejectedValue(new Error("Billing failed")),
      };
      const hook = new BillingHook(config);
      const completeHook = hook.createOnChatCompleteHook();

      const context: OnChatCompleteContext = {
        ...baseContext,
        response: {},
        durationMs: 1000,
        tokenUsage: {
          promptTokens: 1000,
          completionTokens: 500,
          totalTokens: 1500,
        },
      };

      await expect(completeHook(context)).resolves.not.toThrow();
      expect(mockConfig.logger?.error).toHaveBeenCalled();
    });

    it("should log cost information", async () => {
      const hook = new BillingHook(mockConfig);
      const completeHook = hook.createOnChatCompleteHook();

      const context: OnChatCompleteContext = {
        ...baseContext,
        response: {},
        durationMs: 1000,
        tokenUsage: {
          promptTokens: 1000,
          completionTokens: 500,
          totalTokens: 1500,
        },
      };

      await completeHook(context);

      expect(mockConfig.logger?.info).toHaveBeenCalledWith(expect.stringContaining("$"));
    });
  });

  describe("createBeforeChatHook", () => {
    it("should allow requests when budget is available", async () => {
      const hook = new BillingHook(mockConfig);
      const beforeHook = hook.createBeforeChatHook();

      const context: BeforeChatContext = {
        ...baseContext,
        payload: {},
      };

      await expect(beforeHook(context)).resolves.not.toThrow();
    });

    it("should block requests when budget exceeded with hard limit", async () => {
      const budget: TenantBudget = {
        ...mockBudget,
        remainingBudget: 0,
        hardLimit: true,
      };

      const config: BillingHookConfig = {
        ...mockConfig,
        getTenantBudget: vi.fn().mockResolvedValue(budget),
      };

      const hook = new BillingHook(config);
      const beforeHook = hook.createBeforeChatHook();

      const context: BeforeChatContext = {
        ...baseContext,
        payload: {},
      };

      await expect(beforeHook(context)).rejects.toThrow(AgentRuntimeError);
      await expect(beforeHook(context)).rejects.toHaveProperty(
        "code",
        AgentRuntimeErrorCode.BUDGET_EXCEEDED,
      );
    });

    it("should allow requests when budget exceeded with soft limit", async () => {
      const budget: TenantBudget = {
        ...mockBudget,
        remainingBudget: 0,
        hardLimit: false,
      };

      const config: BillingHookConfig = {
        ...mockConfig,
        getTenantBudget: vi.fn().mockResolvedValue(budget),
      };

      const hook = new BillingHook(config);
      const beforeHook = hook.createBeforeChatHook();

      const context: BeforeChatContext = {
        ...baseContext,
        payload: {},
      };

      await expect(beforeHook(context)).resolves.not.toThrow();
      expect(mockConfig.logger?.warn).toHaveBeenCalled();
    });

    it("should warn when approaching budget limit", async () => {
      const budget: TenantBudget = {
        totalBudget: 100.0,
        remainingBudget: 15.0, // 85% used
        hardLimit: true,
        alertThreshold: 0.8,
      };

      const config: BillingHookConfig = {
        ...mockConfig,
        getTenantBudget: vi.fn().mockResolvedValue(budget),
      };

      const hook = new BillingHook(config);
      const beforeHook = hook.createBeforeChatHook();

      const context: BeforeChatContext = {
        ...baseContext,
        payload: {},
      };

      await beforeHook(context);

      expect(mockConfig.logger?.warn).toHaveBeenCalledWith(expect.stringContaining("85.0%"));
    });

    it("should not block on budget check errors", async () => {
      const config: BillingHookConfig = {
        ...mockConfig,
        getTenantBudget: vi.fn().mockRejectedValue(new Error("Budget service down")),
      };

      const hook = new BillingHook(config);
      const beforeHook = hook.createBeforeChatHook();

      const context: BeforeChatContext = {
        ...baseContext,
        payload: {},
      };

      await expect(beforeHook(context)).resolves.not.toThrow();
      expect(mockConfig.logger?.error).toHaveBeenCalled();
    });

    it("should throw AgentRuntimeError with proper metadata", async () => {
      const budget: TenantBudget = {
        ...mockBudget,
        remainingBudget: 0,
      };

      const config: BillingHookConfig = {
        ...mockConfig,
        getTenantBudget: vi.fn().mockResolvedValue(budget),
      };

      const hook = new BillingHook(config);
      const beforeHook = hook.createBeforeChatHook();

      const context: BeforeChatContext = {
        ...baseContext,
        payload: {},
      };

      try {
        await beforeHook(context);
        expect.fail("Should have thrown");
      } catch (error) {
        if (error instanceof AgentRuntimeError) {
          expect(error.code).toBe(AgentRuntimeErrorCode.BUDGET_EXCEEDED);
          expect(error.tenantId).toBe("tenant-123");
          expect(error.providerId).toBe("openai");
          expect(error.metadata).toMatchObject({
            remainingBudget: 0,
            totalBudget: 100.0,
          });
        } else {
          throw error;
        }
      }
    });
  });

  describe("cost calculation", () => {
    it("should calculate cost correctly for GPT-4 pricing", async () => {
      const pricing: ModelPricing = {
        inputCostPer1K: 0.03,
        outputCostPer1K: 0.06,
      };

      const config: BillingHookConfig = {
        ...mockConfig,
        getPricing: vi.fn().mockReturnValue(pricing),
      };

      const hook = new BillingHook(config);
      const completeHook = hook.createOnChatCompleteHook();

      const context: OnChatCompleteContext = {
        ...baseContext,
        response: {},
        durationMs: 1000,
        tokenUsage: {
          promptTokens: 1000,
          completionTokens: 1000,
          totalTokens: 2000,
        },
      };

      await completeHook(context);

      expect(mockConfig.recordUsage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        0.09, // 0.03 + 0.06
        expect.anything(),
      );
    });

    it("should handle zero token usage", async () => {
      const hook = new BillingHook(mockConfig);
      const completeHook = hook.createOnChatCompleteHook();

      const context: OnChatCompleteContext = {
        ...baseContext,
        response: {},
        durationMs: 1000,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      };

      await completeHook(context);

      expect(mockConfig.recordUsage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        0,
        expect.anything(),
      );
    });
  });

  describe("tenant isolation", () => {
    it("should maintain tenant-specific budgets", async () => {
      const tenantABudget: TenantBudget = {
        ...mockBudget,
        remainingBudget: 100.0,
      };

      const tenantBBudget: TenantBudget = {
        ...mockBudget,
        remainingBudget: 10.0,
      };

      const config: BillingHookConfig = {
        ...mockConfig,
        getTenantBudget: vi.fn().mockImplementation((tenantId) => {
          if (tenantId === "tenant-A") {
            return Promise.resolve(tenantABudget);
          }
          if (tenantId === "tenant-B") {
            return Promise.resolve(tenantBBudget);
          }
          return Promise.resolve(null);
        }),
      };

      const hook = new BillingHook(config);
      const beforeHook = hook.createBeforeChatHook();

      // Tenant A should be allowed
      await expect(
        beforeHook({ ...baseContext, tenantId: "tenant-A", payload: {} }),
      ).resolves.not.toThrow();

      // Tenant B should be warned (approaching limit)
      await beforeHook({ ...baseContext, tenantId: "tenant-B", payload: {} });

      expect(config.getTenantBudget).toHaveBeenCalledWith("tenant-A");
      expect(config.getTenantBudget).toHaveBeenCalledWith("tenant-B");
    });
  });

  describe("createBillingHook factory", () => {
    it("should create billing hook instance", () => {
      const hook = createBillingHook(mockConfig);
      expect(hook).toBeInstanceOf(BillingHook);
    });
  });
});
