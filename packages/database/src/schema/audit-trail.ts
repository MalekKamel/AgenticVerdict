import { index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { insights } from "./core/insights";

export const auditTrail = pgTable(
  "audit_trail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    insightId: uuid("insight_id").references(() => insights.id, { onDelete: "set null" }),
    eventType: varchar("event_type", { length: 128 }).notNull(),
    eventData: jsonb("event_data").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_trail_tenant_id_idx").on(t.tenantId),
    index("audit_trail_insight_id_idx").on(t.insightId),
    index("audit_trail_created_at_idx").on(t.createdAt),
  ],
);
