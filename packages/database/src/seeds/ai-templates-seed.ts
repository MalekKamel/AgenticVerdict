import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { aiTemplates, templateDeployments, templateUsageAnalytics } from "../schema/ai-templates";
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

export interface SeedAiTemplate {
  name: string;
  description?: string;
  type: "prompt" | "configuration" | "workflow";
  content: string;
  version?: string;
  status?: "draft" | "published" | "archived";
  variables?: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: unknown;
    description?: string;
  }>;
}

export interface SeedTemplateDeployment {
  templateName: string;
  scope: string;
  targetId?: string;
}

export async function seedAiTemplatesForTenant(
  db: Database,
  tenantId: string,
  templateConfigs: SeedAiTemplate[],
): Promise<Map<string, string>> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-ai-templates-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  const nameToId = new Map<string, string>();

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const cfg of templateConfigs) {
        const [template] = await tx
          .insert(aiTemplates)
          .values({
            tenantId,
            name: cfg.name,
            description: cfg.description,
            type: cfg.type,
            content: cfg.content,
            version: cfg.version ?? "1.0.0",
            status: cfg.status ?? "published",
            isLatestVersion: true,
            versionNumber: 1,
            variables: cfg.variables ?? [],
          })
          .onConflictDoNothing()
          .returning();

        const existing = template
          ? template
          : (
              await tx
                .select()
                .from(aiTemplates)
                .where(eq(aiTemplates.tenantId, tenantId) && eq(aiTemplates.name, cfg.name))
                .limit(1)
            )[0];

        if (existing) {
          nameToId.set(existing.name, existing.id);
        }
      }
    });
  });

  return nameToId;
}

export async function seedTemplateDeploymentsForTenant(
  db: Database,
  tenantId: string,
  templateNameToId: Map<string, string>,
  deployments: SeedTemplateDeployment[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-template-deployments-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const dep of deployments) {
        const templateId = templateNameToId.get(dep.templateName);
        if (!templateId) continue;

        await tx
          .insert(templateDeployments)
          .values({
            templateId,
            tenantId,
            scope: dep.scope,
            targetId: dep.targetId,
            deploymentStatus: "active",
            deployedVariables: {},
          })
          .onConflictDoNothing();
      }
    });
  });
}

export async function seedTemplateUsageAnalyticsForTenant(
  db: Database,
  tenantId: string,
  templateNameToId: Map<string, string>,
  analytics: Array<{
    templateName: string;
    executionCount: number;
    successCount: number;
    failureCount: number;
    avgExecutionTimeMs?: number;
    totalTokens?: number;
    totalCostCents?: number;
  }>,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-template-analytics-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const a of analytics) {
        const templateId = templateNameToId.get(a.templateName);
        if (!templateId) continue;

        await tx
          .insert(templateUsageAnalytics)
          .values({
            templateId,
            tenantId,
            usageDate: today,
            executionCount: a.executionCount,
            successCount: a.successCount,
            failureCount: a.failureCount,
            avgExecutionTimeMs: a.avgExecutionTimeMs ?? 2500,
            totalTokens: a.totalTokens ?? 50000,
            totalCostCents: a.totalCostCents ?? 150,
          })
          .onConflictDoNothing();
      }
    });
  });
}
