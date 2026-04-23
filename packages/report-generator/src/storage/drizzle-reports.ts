import { and, eq } from "drizzle-orm";

import type { Database } from "@agenticverdict/database";
import { reports } from "@agenticverdict/database";

export interface NewReportRow {
  tenantId: string;
  title: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

function mergeMetadata(
  existing: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return { ...(existing ?? {}), ...patch };
}

export async function insertReportRow(db: Database, row: NewReportRow) {
  const [created] = await db
    .insert(reports)
    .values({
      tenantId: row.tenantId,
      title: row.title,
      status: row.status ?? "draft",
      metadata: row.metadata ?? {},
    })
    .returning();
  return created;
}

export async function selectReportForTenant(db: Database, reportId: string, tenantId: string) {
  const [found] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.tenantId, tenantId)))
    .limit(1);
  return found ?? null;
}

export async function updateReportRowMetadata(
  db: Database,
  reportId: string,
  tenantId: string,
  metadataPatch: Record<string, unknown>,
) {
  const current = await selectReportForTenant(db, reportId, tenantId);
  if (!current) {
    return null;
  }
  const nextMeta = mergeMetadata(
    current.metadata as Record<string, unknown> | undefined,
    metadataPatch,
  );
  const [updated] = await db
    .update(reports)
    .set({ metadata: nextMeta, updatedAt: new Date() })
    .where(and(eq(reports.id, reportId), eq(reports.tenantId, tenantId)))
    .returning();
  return updated ?? null;
}

export async function updateReportRowStatus(
  db: Database,
  reportId: string,
  tenantId: string,
  status: string,
) {
  const [updated] = await db
    .update(reports)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(reports.id, reportId), eq(reports.tenantId, tenantId)))
    .returning();
  return updated ?? null;
}
