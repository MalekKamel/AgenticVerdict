import { index, jsonb, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 512 }).notNull(),
    status: varchar("status", { length: 64 }).notNull().default("draft"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reports_tenant_id_created_at_idx").on(t.tenantId, t.createdAt),
    unique("reports_tenant_title_unique").on(t.tenantId, t.title),
  ],
);
