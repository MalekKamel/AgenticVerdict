import type { Database } from "./client";
import { auditLogs } from "./schema/audit-logs";

export interface AuditConfigChangeParams {
  companyId: string;
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
    companyId: change.companyId,
    actorUserId: change.actorUserId ?? null,
    action: "config_change",
    resourceType: change.layer,
    resourceId: change.key,
    metadata: { oldValue: change.oldValue, newValue: change.newValue },
  });
}
