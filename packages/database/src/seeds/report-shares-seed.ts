import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { reportShares } from "../schema/report-shares";
import { reports } from "../schema/reports";
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

export interface SeedReportShare {
  reportTitle: string;
  token?: string;
  expiresAt?: Date;
  allowDownload?: boolean;
}

export async function seedReportSharesForTenant(
  db: Database,
  tenantId: string,
  shareConfigs: SeedReportShare[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-report-shares-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const cfg of shareConfigs) {
        const report = await tx
          .select()
          .from(reports)
          .where(eq(reports.tenantId, tenantId) && eq(reports.title, cfg.reportTitle))
          .limit(1);

        if (report.length === 0) continue;

        const defaultExpiresAt = new Date();
        defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 30);

        await tx
          .insert(reportShares)
          .values({
            reportId: report[0].id,
            tenantId,
            token: cfg.token ?? crypto.randomUUID(),
            expiresAt: cfg.expiresAt ?? defaultExpiresAt,
            createdBy: "seed-system",
          })
          .onConflictDoNothing();
      }
    });
  });
}
