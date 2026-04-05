import { and, eq } from "drizzle-orm";

import type { Database } from "@agenticverdict/database";
import { reports } from "@agenticverdict/database";

export interface NewReportRow {
  companyId: string;
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
      companyId: row.companyId,
      title: row.title,
      status: row.status ?? "draft",
      metadata: row.metadata ?? {},
    })
    .returning();
  return created;
}

export async function selectReportForCompany(db: Database, reportId: string, companyId: string) {
  const [found] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.companyId, companyId)))
    .limit(1);
  return found ?? null;
}

export async function updateReportRowMetadata(
  db: Database,
  reportId: string,
  companyId: string,
  metadataPatch: Record<string, unknown>,
) {
  const current = await selectReportForCompany(db, reportId, companyId);
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
    .where(and(eq(reports.id, reportId), eq(reports.companyId, companyId)))
    .returning();
  return updated ?? null;
}

export async function updateReportRowStatus(
  db: Database,
  reportId: string,
  companyId: string,
  status: string,
) {
  const [updated] = await db
    .update(reports)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(reports.id, reportId), eq(reports.companyId, companyId)))
    .returning();
  return updated ?? null;
}
