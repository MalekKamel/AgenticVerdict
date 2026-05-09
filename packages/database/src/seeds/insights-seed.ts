import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped, type TransactionClient } from "../db-scoped";
import { insights, insightConnectors } from "../schema/core/insights";
import type { SeedInsight } from "../factories/insight-factory";
import { and, eq } from "drizzle-orm";

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
      for (const cfg of insightConfigs) {
        const inserted = await tx
          .insert(insights)
          .values({
            tenantId,
            name: cfg.name,
            description: cfg.description,
            enabled: cfg.enabled,
            templateId: cfg.templateId,
            domain: cfg.domain,
            status: cfg.status ?? "idle",
            lastRunAt: cfg.lastRunAt,
            lastRunStatus: cfg.lastRunStatus,
            delivery: cfg.delivery ? (cfg.delivery as Record<string, unknown>) : {},
            aiConfig: cfg.aiConfig ? (cfg.aiConfig as Record<string, unknown>) : {},
          })
          .onConflictDoNothing()
          .returning();

        if (inserted.length === 0) {
          const existing = await tx
            .select({ id: insights.id })
            .from(insights)
            .where(and(eq(insights.tenantId, tenantId), eq(insights.name, cfg.name)))
            .limit(1);

          if (existing.length > 0 && cfg.connectorIds && cfg.connectorIds.length > 0) {
            await seedInsightConnectorAssociations(tx, tenantId, existing[0].id, cfg.connectorIds);
          }
          continue;
        }

        const insightId = inserted[0].id;

        if (cfg.connectorIds && cfg.connectorIds.length > 0) {
          await seedInsightConnectorAssociations(tx, tenantId, insightId, cfg.connectorIds);
        }
      }
    });
  });
}

async function seedInsightConnectorAssociations(
  tx: TransactionClient,
  tenantId: string,
  insightId: string,
  connectorIds: string[],
): Promise<void> {
  const platformMetricsMap: Record<string, string[]> = {
    ga4: ["ga4.sessions", "ga4.conversions", "ga4.spend", "ga4.ctr", "ga4.cpc", "ga4.cpa"],
    gsc: ["gsc.impressions", "gsc.clicks", "gsc.ctr", "gsc.position"],
    meta: [
      "meta.impressions",
      "meta.clicks",
      "meta.spend",
      "meta.conversions",
      "meta.ctr",
      "meta.cpc",
      "meta.cpa",
    ],
    tiktok: [
      "tiktok.impressions",
      "tiktok.clicks",
      "tiktok.spend",
      "tiktok.conversions",
      "tiktok.ctr",
      "tiktok.cpc",
      "tiktok.cpa",
    ],
    gbp: [
      "gbp.views",
      "gbp.searches",
      "gbp.phone_calls",
      "gbp.website_clicks",
      "gbp.direction_requests",
    ],
  };

  for (const connectorId of connectorIds) {
    await tx
      .insert(insightConnectors)
      .values({
        insightId,
        connectorId,
        enabled: true,
        selectedMetrics: (platformMetricsMap[connectorId] ?? []) as unknown[],
        filters: {},
      })
      .onConflictDoNothing();
  }
}
