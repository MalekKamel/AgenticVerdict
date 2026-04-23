import type { Database } from "./client";
import { auditLogs } from "./schema/audit-logs";

export interface AuditConfigChangeParams {
  tenantId: string;
  actorUserId?: string;
  layer: "build" | "runtime" | "tenant";
  key: string;
  oldValue: unknown;
  newValue: unknown;
}

export async function auditConfigChange(
  db: Database,
  change: AuditConfigChangeParams,
): Promise<void> {
  await db.insert(auditLogs).values({
    tenantId: change.tenantId,
    actorUserId: change.actorUserId ?? null,
    action: "config_change",
    resourceType: change.layer,
    resourceId: change.key,
    metadata: { oldValue: change.oldValue, newValue: change.newValue },
  });
}
