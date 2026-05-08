import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { coreSchema } from "./schema";
import { tenants } from "../tenants";
import { businessDomains } from "../business-domains";

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

/** Tenant-scoped connector instance (a live connection to a platform). */
export const tenantConnectors = pgTable(
  "tenant_connectors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    platform: varchar("platform", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("inactive"),
    domainId: uuid("domain_id").references(() => businessDomains.id, { onDelete: "set null" }),
    config: jsonb("config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    metrics: jsonb("metrics")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    syncFrequency: varchar("sync_frequency", { length: 32 }).default("daily"),
    retentionDays: integer("retention_days").default(90),
    notifications: jsonb("notifications")
      .$type<Record<string, boolean>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    advancedOptions: jsonb("advanced_options")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    nextSyncAt: timestamp("next_sync_at", { withTimezone: true }),
    lastSyncStatus: varchar("last_sync_status", { length: 32 }),
    lastSyncRecords: integer("last_sync_records"),
    paused: boolean("paused").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tenant_connectors_tenant_idx").on(t.tenantId),
    index("tenant_connectors_platform_idx").on(t.platform),
    index("tenant_connectors_status_idx").on(t.status),
    index("tenant_connectors_domain_idx").on(t.domainId),
    unique("tenant_connectors_tenant_platform_name_unique").on(t.tenantId, t.platform, t.name),
  ],
);

/** Sync history for a tenant connector. */
export const connectorSyncHistory = pgTable(
  "connector_sync_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    connectorId: uuid("connector_id")
      .notNull()
      .references(() => tenantConnectors.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 32 }).notNull(),
    records: integer("records"),
    message: text("message"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("sync_history_connector_idx").on(t.connectorId),
    index("sync_history_tenant_idx").on(t.tenantId),
    index("sync_history_started_idx").on(t.startedAt),
  ],
);
