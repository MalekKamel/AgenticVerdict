import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { connectorSyncHistory, tenantConnectors } from "../schema/core/connectors";
import { eq } from "drizzle-orm";

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

export interface SeedConnectorSyncHistory {
  connectorPlatform: string;
  status: "success" | "failed" | "partial";
  recordsSynced?: number;
  errorMessage?: string;
}

export async function seedConnectorSyncHistoryForTenant(
  db: Database,
  tenantId: string,
  syncConfigs: SeedConnectorSyncHistory[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-sync-history-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const cfg of syncConfigs) {
        const connector = await tx
          .select()
          .from(tenantConnectors)
          .where(
            eq(tenantConnectors.tenantId, tenantId) &&
              eq(tenantConnectors.platform, cfg.connectorPlatform),
          )
          .limit(1);

        if (connector.length === 0) continue;

        const startedAt = new Date();
        startedAt.setHours(startedAt.getHours() - 1);
        const completedAt = new Date();

        await tx.insert(connectorSyncHistory).values({
          connectorId: connector[0].id,
          tenantId,
          status: cfg.status,
          recordsSynced: cfg.recordsSynced ?? 0,
          errorMessage: cfg.errorMessage,
          startedAt,
          completedAt,
        });
      }
    });
  });
}
