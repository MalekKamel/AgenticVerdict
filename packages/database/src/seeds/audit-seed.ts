import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { auditLogs } from "../schema/audit-logs";
import { auditTrail } from "../schema/audit-trail";

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

export interface SeedAuditLog {
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

export async function seedAuditLogsForTenant(
  db: Database,
  tenantId: string,
  logConfigs: SeedAuditLog[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-audit-logs-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const cfg of logConfigs) {
        await tx.insert(auditLogs).values({
          tenantId,
          action: cfg.action,
          resourceType: cfg.resourceType,
          resourceId: cfg.resourceId,
          metadata: cfg.metadata,
        });
      }
    });
  });
}

export interface SeedAuditTrailEvent {
  eventType: string;
  entityType: "insight" | "report" | "connector" | "user";
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function seedAuditTrailForTenant(
  db: Database,
  tenantId: string,
  eventConfigs: SeedAuditTrailEvent[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-audit-trail-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const cfg of eventConfigs) {
        await tx.insert(auditTrail).values({
          tenantId,
          eventType: cfg.eventType,
          entityType: cfg.entityType,
          entityId: cfg.entityId,
          description: cfg.description,
          metadata: cfg.metadata,
          occurredAt: new Date(),
        });
      }
    });
  });
}
