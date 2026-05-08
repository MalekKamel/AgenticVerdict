import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { budgetAlerts, alertTriggerHistory, budgetPeriodSummaries } from "../schema/budget-alerts";
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

export interface SeedBudgetAlert {
  name: string;
  description?: string;
  type: "threshold" | "percentage" | "rate";
  threshold: number;
  thresholdType: "cost" | "tokens" | "requests";
  timeWindow: "hourly" | "daily" | "weekly" | "monthly";
  notifications: Array<{
    type: string;
    target: string;
    isEnabled: boolean;
  }>;
}

export async function seedBudgetAlertsForTenant(
  db: Database,
  tenantId: string,
  alertConfigs: SeedBudgetAlert[],
): Promise<Map<string, string>> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-budget-alerts-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  const nameToId = new Map<string, string>();

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const cfg of alertConfigs) {
        const [alert] = await tx
          .insert(budgetAlerts)
          .values({
            tenantId,
            name: cfg.name,
            description: cfg.description,
            type: cfg.type,
            threshold: cfg.threshold,
            thresholdType: cfg.thresholdType,
            timeWindow: cfg.timeWindow,
            status: "active",
            notifications: cfg.notifications,
          })
          .onConflictDoNothing()
          .returning();

        const existing = alert
          ? alert
          : (
              await tx
                .select()
                .from(budgetAlerts)
                .where(eq(budgetAlerts.tenantId, tenantId) && eq(budgetAlerts.name, cfg.name))
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

export async function seedAlertTriggerHistoryForTenant(
  db: Database,
  tenantId: string,
  alertNameToId: Map<string, string>,
  triggers: Array<{
    alertName: string;
    triggeredValue: number;
    thresholdValue: number;
    triggeredAt: Date;
  }>,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-alert-triggers-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const trigger of triggers) {
        const alertId = alertNameToId.get(trigger.alertName);
        if (!alertId) continue;

        await tx.insert(alertTriggerHistory).values({
          alertId,
          tenantId,
          triggeredValue: trigger.triggeredValue,
          thresholdValue: trigger.thresholdValue,
          exceededBy: trigger.triggeredValue - trigger.thresholdValue,
          triggeredAt: trigger.triggeredAt,
          notificationsSent: [],
        });
      }
    });
  });
}

export async function seedBudgetPeriodSummariesForTenant(
  db: Database,
  tenantId: string,
  summaries: Array<{
    periodType: "hourly" | "daily" | "weekly" | "monthly";
    periodStart: Date;
    periodEnd: Date;
    totalCostCents: number;
    totalTokens: number;
    totalRequests: number;
    budgetLimitCents?: number;
  }>,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-budget-summaries-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const summary of summaries) {
        const budgetUsedPercent = summary.budgetLimitCents
          ? Math.floor((summary.totalCostCents / summary.budgetLimitCents) * 10000)
          : 0;

        const daysRemaining = Math.max(
          0,
          Math.floor((summary.periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        );

        const totalDays = Math.floor(
          (summary.periodEnd.getTime() - summary.periodStart.getTime()) / (1000 * 60 * 60 * 24),
        );
        const dailyAverageCostCents =
          totalDays > 0 ? Math.floor(summary.totalCostCents / totalDays) : summary.totalCostCents;

        await tx
          .insert(budgetPeriodSummaries)
          .values({
            tenantId,
            periodType: summary.periodType,
            periodStart: summary.periodStart,
            periodEnd: summary.periodEnd,
            totalCostCents: summary.totalCostCents,
            totalTokens: summary.totalTokens,
            totalRequests: summary.totalRequests,
            budgetLimitCents: summary.budgetLimitCents,
            budgetUsedPercent,
            projectedCostCents: dailyAverageCostCents * daysRemaining + summary.totalCostCents,
            daysRemaining,
            dailyAverageCostCents,
          })
          .onConflictDoNothing();
      }
    });
  });
}
