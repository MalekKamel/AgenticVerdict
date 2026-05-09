import { sql } from "drizzle-orm";
import { boolean, index, jsonb, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import type { InsightDelivery, InsightAiConfig } from "@agenticverdict/types";
import { tenants } from "../tenants";
import { dataConnectors } from "./connectors";
import { coreSchema } from "./schema";

/**
 * Business-facing insight configuration (successor to internal-only “pipeline” terminology).
 * Scoped to a tenant; links to connectors via {@link insightConnectors}.
 */
export const insights = coreSchema.table(
  "insights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    templateId: varchar("template_id", { length: 100 }),
    enabled: boolean("enabled").notNull().default(true),
    domain: varchar("domain", { length: 255 }),
    status: varchar("status", { length: 50 }).notNull().default("idle"),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    lastRunStatus: varchar("last_run_status", { length: 50 }),
    delivery: jsonb("delivery")
      .$type<InsightDelivery>()
      .notNull()
      .default(sql`'{"format":"pdf"}'::jsonb`),
    aiConfig: jsonb("ai_config")
      .$type<InsightAiConfig>()
      .notNull()
      .default(sql`'{"model":"claude-3.5-sonnet","detailLevel":"standard"}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("insights_tenant_id_idx").on(t.tenantId),
    unique("insights_tenant_name_unique").on(t.tenantId, t.name),
  ],
);

export const insightConnectors = coreSchema.table(
  "insight_connectors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    insightId: uuid("insight_id")
      .notNull()
      .references(() => insights.id, { onDelete: "cascade" }),
    connectorId: varchar("connector_id", { length: 100 })
      .notNull()
      .references(() => dataConnectors.id, { onDelete: "restrict" }),
    enabled: boolean("enabled").notNull().default(true),
    selectedMetrics: jsonb("selected_metrics")
      .$type<unknown[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    filters: jsonb("filters")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (t) => [
    unique("insight_connectors_insight_connector_unique").on(t.insightId, t.connectorId),
    index("insight_connectors_insight_id_idx").on(t.insightId),
  ],
);
