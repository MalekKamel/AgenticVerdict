import { CostTier } from "@agenticverdict/core/types/ai-models";

/**
 * Cost Calculation Utilities
 *
 * Provides cost calculation functions with tier pricing support.
 * Used by AI Usage Service and Agent Runtime.
 */

/**
 * Default pricing per 1K tokens (USD cents)
 * These are base prices that get multiplied by cost tier
 */
const DEFAULT_PRICING = {
  [CostTier.PREMIUM]: {
    inputCostPer1k: 3.0, // $0.03 per 1K input tokens
    outputCostPer1k: 15.0, // $0.15 per 1K output tokens
  },
  [CostTier.STANDARD]: {
    inputCostPer1k: 1.0, // $0.01 per 1K input tokens
    outputCostPer1k: 5.0, // $0.05 per 1K output tokens
  },
  [CostTier.ECONOMY]: {
    inputCostPer1k: 0.3, // $0.003 per 1K input tokens
    outputCostPer1k: 1.5, // $0.015 per 1K output tokens
  },
};

/**
 * Provider-specific pricing overrides
 * In production, this would come from configuration/database
 */
const PROVIDER_PRICING: Record<string, (typeof DEFAULT_PRICING)[CostTier.STANDARD]> = {
  anthropic: {
    inputCostPer1k: 3.0,
    outputCostPer1k: 15.0,
  },
  openai: {
    inputCostPer1k: 3.0,
    outputCostPer1k: 15.0,
  },
  google: {
    inputCostPer1k: 1.0,
    outputCostPer1k: 5.0,
  },
};

/**
 * Calculate cost for AI usage
 *
 * @param promptTokens - Number of input/prompt tokens
 * @param completionTokens - Number of output/completion tokens
 * @param costTier - Cost tier (premium/standard/economy)
 * @param customPricing - Optional custom pricing override
 * @returns Cost in USD cents
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  costTier: CostTier = CostTier.STANDARD,
  customPricing?: {
    inputCostPer1k: number;
    outputCostPer1k: number;
  },
): number {
  // Use custom pricing if provided
  const pricing = customPricing || DEFAULT_PRICING[costTier];

  // Calculate input cost
  const inputCost = (promptTokens / 1000) * pricing.inputCostPer1k;

  // Calculate output cost
  const outputCost = (completionTokens / 1000) * pricing.outputCostPer1k;

  // Total cost in cents
  const totalCost = inputCost + outputCost;

  return Math.round(totalCost * 100);
}

/**
 * Calculate cost with provider-specific pricing
 *
 * @param promptTokens - Number of input/prompt tokens
 * @param completionTokens - Number of output/completion tokens
 * @param providerId - Provider identifier
 * @param costTier - Cost tier (falls back to standard if provider not found)
 * @returns Cost in USD cents
 */
export function calculateCostWithProvider(
  promptTokens: number,
  completionTokens: number,
  providerId: string,
  costTier: CostTier = CostTier.STANDARD,
): number {
  // Get provider-specific pricing or fall back to tier default
  const providerPricing = PROVIDER_PRICING[providerId];
  const pricing = providerPricing || DEFAULT_PRICING[costTier];

  const inputCost = (promptTokens / 1000) * pricing.inputCostPer1k;
  const outputCost = (completionTokens / 1000) * pricing.outputCostPer1k;
  const totalCost = inputCost + outputCost;

  return Math.round(totalCost * 100);
}

/**
 * Calculate cost with custom pricing per 1K tokens
 *
 * @param promptTokens - Number of input/prompt tokens
 * @param completionTokens - Number of output/completion tokens
 * @param inputCostPer1k - Cost per 1K input tokens (USD)
 * @param outputCostPer1k - Cost per 1K output tokens (USD)
 * @returns Cost in USD cents
 */
export function calculateCostWithCustomPricing(
  promptTokens: number,
  completionTokens: number,
  inputCostPer1k: number,
  outputCostPer1k: number,
): number {
  const inputCost = (promptTokens / 1000) * inputCostPer1k;
  const outputCost = (completionTokens / 1000) * outputCostPer1k;
  const totalCost = inputCost + outputCost;

  return Math.round(totalCost * 100);
}

/**
 * Apply cost tier multiplier to base cost
 *
 * @param baseCostCents - Base cost in cents
 * @param costTier - Cost tier to apply
 * @returns Adjusted cost in cents
 */
export function applyCostTierMultiplier(baseCostCents: number, costTier: CostTier): number {
  const multipliers = {
    [CostTier.PREMIUM]: 3.0,
    [CostTier.STANDARD]: 1.0,
    [CostTier.ECONOMY]: 0.3,
  };

  const multiplier = multipliers[costTier];
  return Math.round(baseCostCents * multiplier);
}

/**
 * Get pricing information for a cost tier
 *
 * @param costTier - Cost tier
 * @param providerId - Optional provider ID for provider-specific pricing
 * @returns Pricing object with input/output costs per 1K tokens
 */
export function getPricing(
  costTier: CostTier = CostTier.STANDARD,
  providerId?: string,
): {
  inputCostPer1k: number;
  outputCostPer1k: number;
  tier: CostTier;
} {
  if (providerId && PROVIDER_PRICING[providerId]) {
    return {
      ...PROVIDER_PRICING[providerId],
      tier: costTier,
    };
  }

  return {
    ...DEFAULT_PRICING[costTier],
    tier: costTier,
  };
}

/**
 * Estimate cost for a request
 *
 * @param estimatedPromptTokens - Estimated input tokens
 * @param estimatedCompletionTokens - Estimated output tokens
 * @param costTier - Cost tier
 * @returns Estimated cost in USD cents and formatted string
 */
export function estimateCost(
  estimatedPromptTokens: number,
  estimatedCompletionTokens: number,
  costTier: CostTier = CostTier.STANDARD,
): {
  estimatedCostCents: number;
  estimatedCostUSD: string;
  breakdown: {
    inputCostCents: number;
    outputCostCents: number;
  };
} {
  const pricing = DEFAULT_PRICING[costTier];

  const inputCostCents = Math.round((estimatedPromptTokens / 1000) * pricing.inputCostPer1k * 100);
  const outputCostCents = Math.round(
    (estimatedCompletionTokens / 1000) * pricing.outputCostPer1k * 100,
  );
  const totalCostCents = inputCostCents + outputCostCents;

  return {
    estimatedCostCents: totalCostCents,
    estimatedCostUSD: formatCostUSD(totalCostCents),
    breakdown: {
      inputCostCents,
      outputCostCents,
    },
  };
}

/**
 * Format cost in USD string
 *
 * @param costCents - Cost in cents
 * @returns Formatted USD string (e.g., "$1.23")
 */
export function formatCostUSD(costCents: number): string {
  const dollars = costCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}

/**
 * Calculate cost efficiency score
 *
 * @param totalTokens - Total tokens used
 * @param totalCostCents - Total cost in cents
 * @param costTier - Cost tier used
 * @returns Efficiency score (0-100, higher is better)
 */
export function calculateEfficiencyScore(
  totalTokens: number,
  totalCostCents: number,
  costTier: CostTier = CostTier.STANDARD,
): number {
  if (totalTokens === 0 || totalCostCents === 0) {
    return 0;
  }

  const actualCostPerToken = totalCostCents / totalTokens;
  const expectedCostPerToken =
    (DEFAULT_PRICING[costTier].inputCostPer1k + DEFAULT_PRICING[costTier].outputCostPer1k) / 2000; // Average of input/output, converted to per-token

  // Score based on how close actual is to expected (100 = exactly expected)
  const ratio = actualCostPerToken / expectedCostPerToken;
  const score = Math.max(0, Math.min(100, 100 * (1 - Math.abs(1 - ratio))));

  return Math.round(score);
}

/**
 * Compare costs between tiers
 *
 * @param promptTokens - Input tokens
 * @param completionTokens - Output tokens
 * @returns Cost comparison across all tiers
 */
export function compareTiers(
  promptTokens: number,
  completionTokens: number,
): Array<{
  tier: CostTier;
  costCents: number;
  costUSD: string;
  savings: number;
}> {
  const costs = Object.values(CostTier).map((tier) => ({
    tier,
    costCents: calculateCost(promptTokens, completionTokens, tier),
    costUSD: "",
    savings: 0,
  }));

  // Calculate savings compared to premium
  const premiumCost = costs.find((c) => c.tier === CostTier.PREMIUM)?.costCents || 0;

  return costs.map((cost) => ({
    ...cost,
    costUSD: formatCostUSD(cost.costCents),
    savings: premiumCost - cost.costCents,
  }));
}

/**
 * Project monthly cost from daily usage
 *
 * @param dailyCostCents - Average daily cost in cents
 * @param daysRemaining - Days remaining in period
 * @returns Projected cost with daily breakdown
 */
export function projectMonthlyCost(
  dailyCostCents: number,
  daysRemaining: number,
): {
  projectedMonthlyCostCents: number;
  projectedMonthlyCostUSD: string;
  remainingBudgetCents: number;
  dailyBudgetCents: number;
} {
  const daysInMonth = 30;
  const projectedMonthlyCostCents = dailyCostCents * daysInMonth;

  return {
    projectedMonthlyCostCents,
    projectedMonthlyCostUSD: formatCostUSD(projectedMonthlyCostCents),
    remainingBudgetCents: dailyCostCents * daysRemaining,
    dailyBudgetCents: dailyCostCents,
  };
}
