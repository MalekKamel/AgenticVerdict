import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";

/**
 * Stored provenance bundle for an analysis (remediation R-11).
 * `record` holds the JSON shape produced by {@link ProvenanceRecordPayload} in agent-runtime.
 */
export const provenanceRecords = pgTable(
  "provenance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    analysisId: uuid("analysis_id").notNull(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    record: jsonb("record").$type<Record<string, unknown>>().notNull(),
  },
  (t) => [
    index("provenance_records_tenant_analysis_idx").on(t.tenantId, t.analysisId),
    index("provenance_records_captured_at_idx").on(t.capturedAt),
  ],
);
