import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { insights } from "../schema/core/insights";
import type { SeedInsight } from "../factories/insight-factory";

function createMinimalTenantConfig(tenantId: string): TenantConfig {
  return {
    tenantId,
    tenantName: "Seed Tenant",
    localization: {
      language: "en",
      region: "US",
      timezone: "UTC",
      currency: "USD",
    },
    marketing: {
      channels: [],
      kpis: [],
    },
    ai: {
      primaryModel: "claude-3-5-sonnet-20241022",
      provider: "anthropic",
    },
    features: {
      enableInsights: true,
      enableVerdict: true,
    },
  };
}

export async function seedInsightsForTenant(
  db: Database,
  tenantId: string,
  insightConfigs: SeedInsight[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-insights-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      await tx
        .insert(insights)
        .values(
          insightConfigs.map((cfg) => ({
            tenantId,
            name: cfg.name,
            description: cfg.description,
            enabled: cfg.enabled,
            templateId: cfg.templateId,
          })),
        )
        .onConflictDoNothing();
    });
  });
}
