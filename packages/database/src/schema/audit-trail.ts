import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { insights } from "./core/insights";
import { reports } from "./reports";

export const auditTrail = pgTable(
  "audit_trail",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    insightId: uuid("insight_id").references(() => insights.id, { onDelete: "cascade" }),
    reportId: uuid("report_id").references(() => reports.id, { onDelete: "cascade" }),
    actorSub: text("actor_sub").notNull(),
    action: varchar("action", { length: 128 }).notNull(),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    durationMs: integer("duration_ms"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    requestId: text("request_id"),
  },
  (t) => [
    index("audit_trail_tenant_id_idx").on(t.tenantId),
    index("audit_trail_insight_id_idx").on(t.insightId),
    index("audit_trail_timestamp_idx").on(t.timestamp.desc()),
  ],
);
