import { createDatabaseClient, provenanceRecords } from "@agenticverdict/database";
import type { WorkflowTriggerJobResult } from "@agenticverdict/types";
import type { AnalysisResultResponse, ProvenanceInfo } from "@agenticverdict/types";
import { provenanceInfoSchema } from "@agenticverdict/types";
import { and, desc, eq } from "drizzle-orm";

import {
  getAnalysisBundleForTenant,
  listAllInsightsForTenant,
  listAllVerdictsForTenant,
  persistWorkflowResultForTenant,
} from "./analysis-store";

function looksLikeUuid(value: string | undefined): value is string {
  if (!value) {
    return false;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

let cachedDb: ReturnType<typeof createDatabaseClient> | undefined;

function getDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    return undefined;
  }
  cachedDb = createDatabaseClient(url, {
    debugSql: false,
    applicationName: "agenticverdict-api",
  });
  return cachedDb;
}

export function __setAnalysisRepositoryDbForTests(
  db: ReturnType<typeof createDatabaseClient> | undefined,
): void {
  cachedDb = db;
}

async function persistProvenanceRecord(bundle: AnalysisResultResponse): Promise<void> {
  if (!looksLikeUuid(bundle.analysisId) || !looksLikeUuid(bundle.tenantId)) {
    return;
  }
  const db = getDatabase();
  if (!db) {
    return;
  }
  try {
    const existing = await db
      .select({ id: provenanceRecords.id })
      .from(provenanceRecords)
      .where(
        and(
          eq(provenanceRecords.tenantId, bundle.tenantId),
          eq(provenanceRecords.analysisId, bundle.analysisId),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      return;
    }
    await db.insert(provenanceRecords).values({
      analysisId: bundle.analysisId,
      tenantId: bundle.tenantId,
      record: bundle.provenance as unknown as Record<string, unknown>,
    });
  } catch {
    // Provenance DB persistence is best-effort; in-memory bundle remains source of truth in tests/dev.
  }
}

export async function persistWorkflowResultAndProvenance(
  workflowResult: WorkflowTriggerJobResult,
): Promise<AnalysisResultResponse | null> {
  const bundle = persistWorkflowResultForTenant(workflowResult.tenantId, workflowResult);
  if (!bundle) {
    return null;
  }
  await persistProvenanceRecord(bundle);
  return bundle;
}

export function getTenantAnalysisBundle(
  tenantId: string,
  analysisId: string,
): AnalysisResultResponse | undefined {
  return getAnalysisBundleForTenant(tenantId, analysisId);
}

export function getTenantAnalysisProvenance(
  tenantId: string,
  analysisId: string,
): ProvenanceInfo | undefined {
  const bundle = getTenantAnalysisBundle(tenantId, analysisId);
  return bundle?.provenance;
}

export async function getTenantAnalysisProvenanceWithFallback(
  tenantId: string,
  analysisId: string,
): Promise<ProvenanceInfo | undefined> {
  const inMemory = getTenantAnalysisProvenance(tenantId, analysisId);
  if (inMemory) {
    return inMemory;
  }
  if (!looksLikeUuid(tenantId) || !looksLikeUuid(analysisId)) {
    return undefined;
  }
  const db = getDatabase();
  if (!db) {
    return undefined;
  }
  try {
    const rows = await db
      .select({ record: provenanceRecords.record })
      .from(provenanceRecords)
      .where(
        and(eq(provenanceRecords.tenantId, tenantId), eq(provenanceRecords.analysisId, analysisId)),
      )
      .orderBy(desc(provenanceRecords.capturedAt))
      .limit(1);
    const record = rows[0]?.record;
    const parsed = provenanceInfoSchema.safeParse(record);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function listTenantInsights(tenantId: string) {
  return listAllInsightsForTenant(tenantId);
}

export function listTenantVerdicts(tenantId: string) {
  return listAllVerdictsForTenant(tenantId);
}
