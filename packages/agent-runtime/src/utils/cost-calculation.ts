import type { CostTier } from "@agenticverdict/core/types/ai-models";

/**
 * Cost Calculation Utilities
 *
 * Provides configurable pricing calculations for AI provider usage.
 * Supports tier-based pricing (economy/standard/premium) and custom pricing.
 */

export interface PricingConfig {
  /** Input tokens cost per 1000 tokens */
  inputCostPer1k: number;
  /** Output tokens cost per 1000 tokens */
  outputCostPer1k: number;
  /** Cost tier */
  tier?: CostTier;
  /** Custom pricing flag */
  isCustom?: boolean;
}

export interface DefaultPricingByTier {
  economy: PricingConfig;
  standard: PricingConfig;
  premium: PricingConfig;
}

/**
 * Default pricing configurations by tier
 *
 * These are base prices that can be overridden per tenant/provider
 */
const DEFAULT_PRICING: DefaultPricingByTier = {
  economy: {
    inputCostPer1k: 0.0005, // $0.0005 per 1k input tokens
    outputCostPer1k: 0.0015, // $0.0015 per 1k output tokens
    tier: "economy" as CostTier,
    isCustom: false,
  },
  standard: {
    inputCostPer1k: 0.001, // $0.001 per 1k input tokens
    outputCostPer1k: 0.003, // $0.003 per 1k output tokens
    tier: "standard" as CostTier,
    isCustom: false,
  },
  premium: {
    inputCostPer1k: 0.003, // $0.003 per 1k input tokens
    outputCostPer1k: 0.009, // $0.009 per 1k output tokens
    tier: "premium" as CostTier,
    isCustom: false,
  },
};

/**
 * Calculate cost for a single request
 */
export function calculateRequestCost(params: {
  inputTokens: number;
  outputTokens: number;
  pricing: PricingConfig;
}): number {
  const { inputTokens, outputTokens, pricing } = params;

  const inputCost = (inputTokens / 1000) * pricing.inputCostPer1k;
  const outputCost = (outputTokens / 1000) * pricing.outputCostPer1k;

  return inputCost + outputCost;
}

/**
 * Calculate cost with tier-based pricing
 */
export function calculateTieredCost(params: {
  inputTokens: number;
  outputTokens: number;
  tier: CostTier;
  customPricing?: PricingConfig;
}): number {
  const { inputTokens, outputTokens, tier, customPricing } = params;

  // Use custom pricing if provided
  const pricing = customPricing || getDefaultPricing(tier);

  return calculateRequestCost({
    inputTokens,
    outputTokens,
    pricing,
  });
}

/**
 * Get default pricing for a tier
 */
export function getDefaultPricing(tier: CostTier): PricingConfig {
  return DEFAULT_PRICING[tier];
}

/**
 * Get all default pricing tiers
 */
export function getAllDefaultPricing(): DefaultPricingByTier {
  return { ...DEFAULT_PRICING };
}

/**
 * Estimate monthly cost based on usage patterns
 */
export function estimateMonthlyCost(params: {
  avgRequestsPerDay: number;
  avgInputTokensPerRequest: number;
  avgOutputTokensPerRequest: number;
  pricing: PricingConfig;
  daysInMonth?: number;
}): number {
  const {
    avgRequestsPerDay,
    avgInputTokensPerRequest,
    avgOutputTokensPerRequest,
    pricing,
    daysInMonth = 30,
  } = params;

  const dailyInputTokens = avgRequestsPerDay * avgInputTokensPerRequest;
  const dailyOutputTokens = avgRequestsPerDay * avgOutputTokensPerRequest;

  const dailyCost = calculateRequestCost({
    inputTokens: dailyInputTokens,
    outputTokens: dailyOutputTokens,
    pricing,
  });

  return dailyCost * daysInMonth;
}

/**
 * Compare costs between tiers
 */
export function compareTierCosts(params: {
  inputTokens: number;
  outputTokens: number;
}): Record<CostTier, { cost: number; savings?: number }> {
  const { inputTokens, outputTokens } = params;

  const costs: Record<CostTier, { cost: number; savings?: number }> = {
    economy: { cost: 0 },
    standard: { cost: 0 },
    premium: { cost: 0 },
  };

  // Calculate cost for each tier
  (Object.keys(DEFAULT_PRICING) as CostTier[]).forEach((tier) => {
    costs[tier] = {
      cost: calculateTieredCost({
        inputTokens,
        outputTokens,
        tier,
      }),
    };
  });

  // Calculate savings compared to premium
  const premiumCost = costs.premium.cost;
  (Object.keys(costs) as CostTier[]).forEach((tier) => {
    if (tier !== "premium") {
      costs[tier].savings = premiumCost - costs[tier].cost;
    }
  });

  return costs;
}

/**
 * Format cost for display
 */
export function formatCost(
  cost: number,
  options?: {
    currency?: string;
    decimals?: number;
  },
): string {
  const { currency = "USD", decimals = 4 } = options || {};

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(cost);
}

/**
 * Calculate cost per token (average)
 */
export function calculateCostPerToken(totalCost: number, totalTokens: number): number {
  if (totalTokens === 0) return 0;
  return totalCost / totalTokens;
}

/**
 * Calculate percentage savings between two costs
 */
export function calculateSavingsPercentage(oldCost: number, newCost: number): number {
  if (oldCost === 0) return 0;
  return ((oldCost - newCost) / oldCost) * 100;
}

/**
 * Project annual cost from monthly cost
 */
export function projectAnnualCost(monthlyCost: number): number {
  return monthlyCost * 12;
}

/**
 * Validate pricing configuration
 */
export function validatePricingConfig(pricing: PricingConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (pricing.inputCostPer1k < 0) {
    errors.push("inputCostPer1k must be non-negative");
  }

  if (pricing.outputCostPer1k < 0) {
    errors.push("outputCostPer1k must be non-negative");
  }

  if (pricing.inputCostPer1k > 1) {
    errors.push("inputCostPer1k seems too high (> $1 per 1k tokens)");
  }

  if (pricing.outputCostPer1k > 1) {
    errors.push("outputCostPer1k seems too high (> $1 per 1k tokens)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
