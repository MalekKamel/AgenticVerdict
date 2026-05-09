import { index, jsonb, numeric, pgEnum, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { reports } from "./reports";
import { coreSchema } from "./core/schema";

export const insightTypeEnum = pgEnum("insight_type", [
  "opportunity",
  "risk",
  "observation",
  "recommendation",
]);

export const generatedInsights = coreSchema.table(
  "generated_insights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    analysisId: uuid("analysis_id"),
    insightType: insightTypeEnum("insight_type").notNull(),
    title: varchar("title", { length: 512 }).notNull(),
    description: text("description").notNull(),
    confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull().default("0"),
    relevanceScore: numeric("relevance_score", { precision: 3, scale: 2 }).notNull().default("0"),
    platforms: jsonb("platforms").$type<string[]>().notNull().default([]),
    relatedMetricKeys: jsonb("related_metric_keys").$type<string[]>().notNull().default([]),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("generated_insights_tenant_id_created_at_idx").on(t.tenantId, t.createdAt),
    index("generated_insights_report_id_idx").on(t.reportId),
    index("generated_insights_analysis_id_idx").on(t.analysisId),
  ],
);

export type GeneratedInsightDb = typeof generatedInsights.$inferSelect;
export type NewGeneratedInsight = typeof generatedInsights.$inferInsert;
