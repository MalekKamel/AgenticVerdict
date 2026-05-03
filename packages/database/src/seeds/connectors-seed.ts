import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { tenantConnectors } from "../schema/core/connectors";
import type { SeedTenantConnector } from "../factories/connector-factory";

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

export async function seedTenantConnectors(
  db: Database,
  tenantId: string,
  connectorConfigs: SeedTenantConnector[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-connectors-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      await tx
        .insert(tenantConnectors)
        .values(
          connectorConfigs.map((cfg) => ({
            tenantId,
            platform: cfg.platform,
            name: cfg.name,
            domain: cfg.domain,
            status: cfg.status ?? "inactive",
            syncFrequency: cfg.syncFrequency ?? "daily",
            metrics: cfg.metrics ?? [],
          })),
        )
        .onConflictDoNothing();
    });
  });
}
