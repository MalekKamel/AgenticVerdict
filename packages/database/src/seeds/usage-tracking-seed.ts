import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { usageTracking } from "../schema/core/usage";

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

export interface SeedUsageTracking {
  metricType: string;
  quantity: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Seeds usage tracking records for development/testing.
 */
export async function seedUsageTrackingForTenant(
  db: Database,
  tenantId: string,
  records: SeedUsageTracking[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-usage-tracking-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const rec of records) {
        await tx
          .insert(usageTracking)
          .values({
            tenantId,
            metricType: rec.metricType,
            quantity: rec.quantity,
            periodStart: rec.periodStart,
            periodEnd: rec.periodEnd,
          })
          .onConflictDoNothing();
      }
    });
  });
}

/**
 * Creates sample usage tracking records for the current month.
 */
export function createDevUsageTracking(): SeedUsageTracking[] {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return [
    {
      metricType: "api_calls",
      quantity: 15420,
      periodStart: monthStart,
      periodEnd: monthEnd,
    },
    {
      metricType: "connector_syncs",
      quantity: 245,
      periodStart: monthStart,
      periodEnd: monthEnd,
    },
    {
      metricType: "ai_tokens",
      quantity: 2500000,
      periodStart: monthStart,
      periodEnd: monthEnd,
    },
    {
      metricType: "reports_generated",
      quantity: 38,
      periodStart: monthStart,
      periodEnd: monthEnd,
    },
    {
      metricType: "insights_runs",
      quantity: 156,
      periodStart: monthStart,
      periodEnd: monthEnd,
    },
  ];
}
