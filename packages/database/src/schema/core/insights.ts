import { sql } from "drizzle-orm";
import { boolean, index, jsonb, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

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
    schedule: jsonb("schedule")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    delivery: jsonb("delivery")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    aiConfig: jsonb("ai_config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  (t) => [unique("insight_connectors_insight_connector_unique").on(t.insightId, t.connectorId)],
);
