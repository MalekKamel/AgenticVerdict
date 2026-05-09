import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { provenanceRecords } from "../schema/provenance";

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

export interface SeedProvenanceRecord {
  analysisId: string;
  record: Record<string, unknown>;
}

/**
 * Seeds provenance records for development/testing.
 */
export async function seedProvenanceRecordsForTenant(
  db: Database,
  tenantId: string,
  records: SeedProvenanceRecord[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-provenance-records-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const rec of records) {
        await tx
          .insert(provenanceRecords)
          .values({
            tenantId,
            analysisId: rec.analysisId,
            record: rec.record,
          })
          .onConflictDoNothing();
      }
    });
  });
}

/**
 * Creates sample provenance records for dev testing.
 */
export function createDevProvenanceRecords(analysisIds: string[]): SeedProvenanceRecord[] {
  return analysisIds.map((analysisId) => ({
    analysisId,
    record: {
      version: "1.0",
      dataSources: [
        { platform: "ga4", queryId: "dev_query_1", timestamp: new Date().toISOString() },
        { platform: "meta", queryId: "dev_query_2", timestamp: new Date().toISOString() },
      ],
      processingSteps: [
        { step: "data_collection", status: "completed", durationMs: 1200 },
        { step: "data_normalization", status: "completed", durationMs: 350 },
        { step: "analysis", status: "completed", durationMs: 4500 },
      ],
      modelInfo: {
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        tokensUsed: { input: 12500, output: 8200 },
      },
    },
  }));
}
