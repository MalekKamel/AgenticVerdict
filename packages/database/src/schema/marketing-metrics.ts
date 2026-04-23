import { date, index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";

export const marketingMetrics = pgTable(
  "marketing_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    platform: varchar("platform", { length: 64 }).notNull(),
    metricDate: date("metric_date", { mode: "string" }).notNull(),
    payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("marketing_metrics_tenant_id_metric_date_idx").on(t.tenantId, t.metricDate)],
);
