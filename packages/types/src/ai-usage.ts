import { z } from "zod";
import { providerIdSchema } from "./tenant";
import { syncFrequencySchema } from "./connector-types";

// ============================================================================
// Usage Tracking Types
// ============================================================================

export interface AiUsageReport {
  id: string;
  tenantId: string;
  providerId: string;
  modelId: string;
  domainId?: string;
  connectorId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costCents: number;
  timestamp: Date;
  requestId: string;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  wasFailover: boolean;
  metadata?: Record<string, unknown>;
}

export interface AiUsageSummary {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCostCents: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  byProvider: ProviderUsageBreakdown[];
  byDomain: DomainUsageBreakdown[];
  byModel: ModelUsageBreakdown[];
}

export interface ProviderUsageBreakdown {
  providerId: string;
  providerName: string;
  totalTokens: number;
  totalCostCents: number;
  requestCount: number;
}

export interface DomainUsageBreakdown {
  domainId: string;
  domainName: string;
  totalTokens: number;
  totalCostCents: number;
  requestCount: number;
}

export interface ModelUsageBreakdown {
  modelId: string;
  modelName: string;
  totalTokens: number;
  totalCostCents: number;
  requestCount: number;
}

// ============================================================================
// Usage Tracking Zod Schemas
// ============================================================================

export const modelIdSchema = z
  .string()
  .min(1, "Model ID is required")
  .max(128, "Model ID must be less than 128 characters");

export const domainIdSchema = z
  .string()
  .min(1, "Domain ID is required")
  .uuid("Invalid UUID format");

/**
 * Usage report input
 */
export const usageReportSchema = z.object({
  providerId: providerIdSchema,
  modelId: modelIdSchema,
  domainId: domainIdSchema.optional(),
  connectorId: z.string().uuid().optional(),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  costCents: z.number().int().nonnegative(),
  requestId: z.string().uuid(),
  latencyMs: z.number().int().nonnegative(),
  success: z.boolean(),
  errorCode: z.string().max(64).optional(),
  errorMessage: z.string().max(512).optional(),
  wasFailover: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Usage query filters
 */
export const usageQueryFiltersSchema = z.object({
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  providerId: providerIdSchema.optional(),
  domainId: domainIdSchema.optional(),
  modelId: modelIdSchema.optional(),
  timeGranularity: syncFrequencySchema.default("daily"),
});

/**
 * Usage summary response
 */
export const usageSummarySchema = z.object({
  tenantId: z.string().uuid(),
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime(),
  totalPromptTokens: z.number().int().nonnegative(),
  totalCompletionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  totalCostCents: z.number().int().nonnegative(),
  totalRequests: z.number().int().nonnegative(),
  successfulRequests: z.number().int().nonnegative(),
  failedRequests: z.number().int().nonnegative(),
  avgLatencyMs: z.number().nonnegative(),
  byProvider: z.array(
    z.object({
      providerId: providerIdSchema,
      providerName: z.string(),
      totalTokens: z.number().int().nonnegative(),
      totalCostCents: z.number().int().nonnegative(),
      requestCount: z.number().int().nonnegative(),
    }),
  ),
  byDomain: z.array(
    z.object({
      domainId: domainIdSchema,
      domainName: z.string(),
      totalTokens: z.number().int().nonnegative(),
      totalCostCents: z.number().int().nonnegative(),
      requestCount: z.number().int().nonnegative(),
    }),
  ),
  byModel: z.array(
    z.object({
      modelId: modelIdSchema,
      modelName: z.string(),
      totalTokens: z.number().int().nonnegative(),
      totalCostCents: z.number().int().nonnegative(),
      requestCount: z.number().int().nonnegative(),
    }),
  ),
});

// Type exports
export type UsageReport = z.infer<typeof usageReportSchema>;
export type UsageQueryFilters = z.infer<typeof usageQueryFiltersSchema>;
export type UsageSummary = z.infer<typeof usageSummarySchema>;

// ============================================================================
// AI Usage Router Schemas (moved from apps/api/src/trpc/routers/ai-usage.ts)
// ============================================================================

export const usageQueryInputSchema = z.object({
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  providerId: z.string().optional(),
  domainId: z.string().uuid().optional(),
  modelId: z.string().optional(),
});
export type UsageQueryInput = z.infer<typeof usageQueryInputSchema>;

export const recordUsageInputSchema = z.object({
  providerId: z.string(),
  modelId: z.string(),
  domainId: z.string().uuid().optional(),
  connectorId: z.string().uuid().optional(),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  costCents: z.number().int().nonnegative(),
  requestId: z.string().uuid(),
  latencyMs: z.number().int().nonnegative(),
  success: z.boolean(),
  errorCode: z.string().max(64).optional(),
  errorMessage: z.string().max(512).optional(),
  wasFailover: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type RecordUsageInput = z.infer<typeof recordUsageInputSchema>;

export const usageSummaryOutputSchema = z.object({
  tenantId: z.string().uuid(),
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime(),
  totalPromptTokens: z.number().int(),
  totalCompletionTokens: z.number().int(),
  totalTokens: z.number().int(),
  totalCostCents: z.number().int(),
  totalRequests: z.number().int(),
  successfulRequests: z.number().int(),
  failedRequests: z.number().int(),
  avgLatencyMs: z.number(),
  byProvider: z.array(
    z.object({
      providerId: z.string(),
      totalTokens: z.number().int(),
      totalCostCents: z.number().int(),
      requestCount: z.number().int(),
    }),
  ),
  byDomain: z.array(
    z.object({
      domainId: z.string().uuid().nullable(),
      totalTokens: z.number().int(),
      totalCostCents: z.number().int(),
      requestCount: z.number().int(),
    }),
  ),
});
export type UsageSummaryOutput = z.infer<typeof usageSummaryOutputSchema>;

export interface UsageTrackOptions {
  tenantId: string;
  providerId: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens?: number;
  latencyMs?: number;
  success?: boolean;
  errorMessage?: string;
  domainId?: string;
  connectorId?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageMetrics {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  successRate: number;
  periodStart: Date;
  periodEnd: Date;
}
