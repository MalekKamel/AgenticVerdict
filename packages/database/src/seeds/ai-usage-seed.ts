import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import {
  aiUsageReports,
  aiUsageAggregationDaily,
  aiUsageAggregationMonthly,
} from "../schema/ai-usage_reports";

function createMinimalTenantConfig(tenantId: string): TenantConfig {
  return {
    tenantId,
    tenantName: "Seed Tenant",
    localization: { language: "en", region: "US", timezone: "UTC", currency: "USD" },
    marketing: { channels: [], kpis: [] },
    ai: { primaryModel: "claude-3-5-sonnet-20241022", provider: "anthropic" },
    features: { enableInsights: true, enableVerdict: true },
  };
}

export async function seedAiUsageReportsForTenant(
  db: Database,
  tenantId: string,
  reports: Array<{
    providerId: string;
    modelId: string;
    requestId: string;
    promptTokens: number;
    completionTokens: number;
    costCents: number;
    latencyMs?: number;
    success?: boolean;
  }>,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-usage-reports-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const report of reports) {
        await tx
          .insert(aiUsageReports)
          .values({
            tenantId,
            providerId: report.providerId,
            modelId: report.modelId,
            requestId: report.requestId,
            promptTokens: report.promptTokens,
            completionTokens: report.completionTokens,
            totalTokens: report.promptTokens + report.completionTokens,
            costCents: report.costCents,
            timestamp: new Date(),
            latencyMs: report.latencyMs ?? 1500,
            success: report.success ?? true,
            wasFailover: false,
            failoverAttempt: 0,
          })
          .onConflictDoNothing();
      }
    });
  });
}

export async function seedAiUsageAggregationDailyForTenant(
  db: Database,
  tenantId: string,
  aggregations: Array<{
    providerId: string;
    modelId: string;
    usageDate: Date;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalRequests: number;
    totalCostCents: number;
  }>,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-usage-daily-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const agg of aggregations) {
        await tx
          .insert(aiUsageAggregationDaily)
          .values({
            tenantId,
            usageDate: agg.usageDate,
            providerId: agg.providerId,
            modelId: agg.modelId,
            totalPromptTokens: agg.totalPromptTokens,
            totalCompletionTokens: agg.totalCompletionTokens,
            totalTokens: agg.totalPromptTokens + agg.totalCompletionTokens,
            totalCostCents: agg.totalCostCents,
            totalRequests: agg.totalRequests,
            successfulRequests: Math.floor(agg.totalRequests * 0.98),
            failedRequests: Math.floor(agg.totalRequests * 0.02),
            avgLatencyMs: 1500,
            failoverRequests: 0,
            lastAggregatedAt: new Date(),
          })
          .onConflictDoNothing();
      }
    });
  });
}

export async function seedAiUsageAggregationMonthlyForTenant(
  db: Database,
  tenantId: string,
  aggregations: Array<{
    providerId: string;
    modelId: string;
    year: number;
    month: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalRequests: number;
    totalCostCents: number;
  }>,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-usage-monthly-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const agg of aggregations) {
        await tx
          .insert(aiUsageAggregationMonthly)
          .values({
            tenantId,
            year: agg.year,
            month: agg.month,
            providerId: agg.providerId,
            modelId: agg.modelId,
            totalPromptTokens: agg.totalPromptTokens,
            totalCompletionTokens: agg.totalCompletionTokens,
            totalTokens: agg.totalPromptTokens + agg.totalCompletionTokens,
            totalCostCents: agg.totalCostCents,
            totalRequests: agg.totalRequests,
            successfulRequests: Math.floor(agg.totalRequests * 0.98),
            failedRequests: Math.floor(agg.totalRequests * 0.02),
            avgLatencyMs: 1500,
            peakDailyCostCents: Math.floor(agg.totalCostCents / 20),
            lastAggregatedAt: new Date(),
          })
          .onConflictDoNothing();
      }
    });
  });
}
