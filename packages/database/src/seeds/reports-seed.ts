import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { reports } from "../schema/reports";
import { reportTemplates } from "../schema/report-templates";

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

export interface SeedReportTemplate {
  name: string;
  definition: Record<string, unknown>;
}

export interface SeedReport {
  title: string;
  status?: "draft" | "published" | "archived";
  metadata?: Record<string, unknown>;
}

export async function seedReportTemplatesForTenant(
  db: Database,
  tenantId: string,
  templateConfigs: SeedReportTemplate[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-report-templates-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      await tx
        .insert(reportTemplates)
        .values(
          templateConfigs.map((cfg) => ({
            tenantId,
            name: cfg.name,
            definition: cfg.definition,
          })),
        )
        .onConflictDoNothing();
    });
  });
}

export async function seedReportsForTenant(
  db: Database,
  tenantId: string,
  reportConfigs: SeedReport[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-reports-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      await tx
        .insert(reports)
        .values(
          reportConfigs.map((cfg) => ({
            tenantId,
            title: cfg.title,
            status: cfg.status ?? "draft",
            metadata: cfg.metadata,
          })),
        )
        .onConflictDoNothing();
    });
  });
}
