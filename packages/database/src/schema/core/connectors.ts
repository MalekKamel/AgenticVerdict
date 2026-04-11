import { sql } from "drizzle-orm";
import { index, jsonb, primaryKey, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { coreSchema } from "./schema";

/** Canonical registry row for a data connector (GA4, Meta, …). IDs are stable string slugs (e.g. `ga4`). */
export const dataConnectors = coreSchema.table("data_connectors", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  version: varchar("version", { length: 32 }).notNull().default("1.0.0"),
  description: text("description"),
  credentialSchema: jsonb("credential_schema")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const connectorTags = coreSchema.table("connector_tags", {
  id: varchar("id", { length: 64 }).primaryKey(),
  label: varchar("label", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
});

export const connectorTagMappings = coreSchema.table(
  "connector_tag_mappings",
  {
    connectorId: varchar("connector_id", { length: 100 })
      .notNull()
      .references(() => dataConnectors.id, { onDelete: "cascade" }),
    connectorTagId: varchar("connector_tag_id", { length: 64 })
      .notNull()
      .references(() => connectorTags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.connectorId, t.connectorTagId] }),
    index("connector_tag_mappings_tag_idx").on(t.connectorTagId),
  ],
);
