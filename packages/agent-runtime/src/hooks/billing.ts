import type { OnChatCompleteHook, OnChatCompleteContext } from "../types/hooks";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors";

/**
 * Pricing information for a model.
 */
export interface ModelPricing {
  /** Cost per 1K input tokens in USD */
  inputCostPer1K: number;
  /** Cost per 1K output tokens in USD */
  outputCostPer1K: number;
  /** Optional cost per 1K image tokens (for vision models) */
  imageCostPer1K?: number;
  /** Optional cost per 1K audio tokens (for audio models) */
  audioCostPer1K?: number;
}

/**
 * Budget configuration for a tenant.
 */
export interface TenantBudget {
  /** Total budget allocated in USD */
  totalBudget: number;
  /** Remaining budget in USD */
  remainingBudget: number;
  /** Budget reset date (ISO 8601) */
  resetDate?: string;
  /** Whether to block requests when budget is exceeded */
  hardLimit: boolean;
  /** Alert threshold (0-1, e.g., 0.8 for 80%) */
  alertThreshold: number;
}

/**
 * Cost calculation result.
 */
export interface CostCalculation {
  /** Total cost in USD */
  totalCost: number;
  /** Input token cost in USD */
  inputCost: number;
  /** Output token cost in USD */
  outputCost: number;
  /** Breakdown of costs */
  breakdown: {
    inputTokens: number;
    outputTokens: number;
    inputRate: number;
    outputRate: number;
  };
}

/**
 * Billing hook configuration.
 */
export interface BillingHookConfig {
  /** Function to get model pricing */
  getPricing: (providerId: string, modelId: string) => ModelPricing | null;
  /** Function to get tenant budget */
  getTenantBudget: (tenantId: string) => Promise<TenantBudget | null>;
  /** Function to update tenant budget */
  updateTenantBudget: (tenantId: string, cost: number) => Promise<void>;
  /** Function to record usage for billing */
  recordUsage: (
    tenantId: string,
    providerId: string,
    modelId: string,
    cost: number,
    tokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    },
  ) => Promise<void>;
  /** Optional logger */
  logger?: {
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
  };
}

/**
 * Built-in hook for cost tracking and billing.
 *
 * Features:
 * - Calculate cost based on token usage and model pricing
 * - Check budget before allowing requests
 * - Update tenant budget after successful requests
 * - Record usage for billing and analytics
 */
export class BillingHook {
  private readonly config: BillingHookConfig;

  constructor(config: BillingHookConfig) {
    this.config = config;
  }

  /**
   * Create the onChatComplete hook for cost tracking.
   */
  createOnChatCompleteHook(): OnChatCompleteHook {
    return async (context: OnChatCompleteContext) => {
      const { tenantId, providerId, modelId, requestId } = context;
      const { tokenUsage, durationMs } = context;

      try {
        // Skip if no token usage data available
        if (!tokenUsage) {
          this.config.logger?.warn(`[BillingHook] No token usage data for request ${requestId}`);
          return;
        }

        // Get pricing for this model
        const pricing = this.config.getPricing(providerId, modelId);
        if (!pricing) {
          this.config.logger?.warn(`[BillingHook] No pricing found for ${providerId}/${modelId}`);
          return;
        }

        // Calculate cost
        const costCalculation = this.calculateCost(tokenUsage, pricing);

        // Record usage for billing
        await this.config.recordUsage(
          tenantId,
          providerId,
          modelId,
          costCalculation.totalCost,
          tokenUsage,
        );

        // Update tenant budget
        await this.config.updateTenantBudget(tenantId, costCalculation.totalCost);

        this.config.logger?.info(
          `[BillingHook] Request ${requestId}: $${costCalculation.totalCost.toFixed(6)} ` +
            `(${tokenUsage.totalTokens} tokens, ${durationMs}ms)`,
        );
      } catch (error) {
        this.config.logger?.error(
          `[BillingHook] Failed to process billing for request ${requestId}:`,
          error,
        );
        // Don't throw - billing errors shouldn't affect main operation
      }
    };
  }

  /**
   * Create the beforeChat hook for budget checking.
   */
  createBeforeChatHook(): import("../types/hooks").BeforeChatHook {
    return async (context) => {
      const { tenantId, providerId } = context;

      try {
        // Get tenant budget
        const budget = await this.config.getTenantBudget(tenantId);

        if (!budget) {
          this.config.logger?.warn(`[BillingHook] No budget found for tenant ${tenantId}`);
          return;
        }

        // Check if budget is exceeded
        if (budget.remainingBudget <= 0) {
          if (budget.hardLimit) {
            throw AgentRuntimeError.fromError({
              code: AgentRuntimeErrorCode.BUDGET_EXCEEDED,
              providerId,
              tenantId,
              metadata: {
                remainingBudget: budget.remainingBudget,
                totalBudget: budget.totalBudget,
              },
            });
          } else {
            this.config.logger?.warn(
              `[BillingHook] Tenant ${tenantId} budget exceeded (soft limit)`,
            );
          }
        }

        // Check alert threshold
        const usedPercentage = 1 - budget.remainingBudget / budget.totalBudget;
        if (usedPercentage >= budget.alertThreshold) {
          this.config.logger?.warn(
            `[BillingHook] Tenant ${tenantId} at ${(usedPercentage * 100).toFixed(1)}% of budget`,
          );
        }

        this.config.logger?.info(`[BillingHook] Budget check passed for tenant ${tenantId}`);
      } catch (error) {
        if (error instanceof AgentRuntimeError) {
          throw error;
        }

        this.config.logger?.error(
          `[BillingHook] Failed to check budget for tenant ${tenantId}:`,
          error,
        );
        // Don't block on budget check errors unless it's a hard budget exceeded error
      }
    };
  }

  /**
   * Calculate cost based on token usage and pricing.
   */
  private calculateCost(
    tokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    },
    pricing: ModelPricing,
  ): CostCalculation {
    const inputCost = (tokenUsage.promptTokens / 1000) * pricing.inputCostPer1K;
    const outputCost = (tokenUsage.completionTokens / 1000) * pricing.outputCostPer1K;
    const totalCost = inputCost + outputCost;

    return {
      totalCost,
      inputCost,
      outputCost,
      breakdown: {
        inputTokens: tokenUsage.promptTokens,
        outputTokens: tokenUsage.completionTokens,
        inputRate: pricing.inputCostPer1K,
        outputRate: pricing.outputCostPer1K,
      },
    };
  }
}

/**
 * Factory function to create a billing hook with configuration.
 */
export function createBillingHook(config: BillingHookConfig): BillingHook {
  return new BillingHook(config);
}
