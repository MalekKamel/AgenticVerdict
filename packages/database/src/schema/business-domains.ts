import type { DomainProviderConfig, DomainMetadata } from "@agenticverdict/types";
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  unique,
  index,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { aiProviders } from "./ai-providers";

/**
 * Business Domains Schema
 * Allows tenants to define custom business domains for organizing connectors
 */

// @ts-expect-error Drizzle ORM circular reference - type inferred via $inferSelect
export const businessDomains = pgTable(
  "business_domains",
  {
    /** Unique domain identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID - scoped for multi-tenancy */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Domain name */
    name: varchar("name", { length: 128 }).notNull(),

    /** Domain description */
    description: text("description"),

    /** Parent domain ID for hierarchy (self-referencing) */
    // @ts-expect-error Drizzle ORM circular reference
    parentId: uuid("parent_id").references(() => businessDomains.id, {
      onDelete: "cascade",
    }),

    /** Domain order/sort position within siblings */
    order: integer("order").notNull().default(0),

    /** Domain-specific provider configuration override */
    providerConfig: jsonb("provider_config").$type<DomainProviderConfig>(),

    /** Whether domain uses tenant default provider */
    usesTenantDefault: boolean("uses_tenant_default").notNull().default(true),

    /** Metadata for additional configuration */
    metadata: jsonb("metadata").$type<DomainMetadata>(),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint: domain name per tenant */
    unique("business_domains_tenant_name_unique").on(t.tenantId, t.name),

    /** Index for tenant lookup */
    index("business_domains_tenant_idx").on(t.tenantId),

    /** Index for parent lookup (hierarchy) */
    index("business_domains_parent_idx").on(t.parentId),

    /** Index for order sorting */
    index("business_domains_order_idx").on(t.order),

    /** Composite index for hierarchy queries */
    index("business_domains_tenant_parent_idx").on(t.tenantId, t.parentId),
  ],
);

/**
 * Domain-Connector Assignments
 * Links connectors to business domains
 */
export const domainConnectorAssignments = pgTable(
  "domain_connector_assignments",
  {
    /** Unique assignment identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Domain ID */
    domainId: uuid("domain_id")
      .notNull()
      .references(() => businessDomains.id, { onDelete: "cascade" }),

    /** Connector ID (from tenant_connectors) */
    connectorId: uuid("connector_id").notNull(),

    /** Tenant ID for validation */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Assignment order */
    order: integer("order").notNull().default(0),

    /** Assigned by user ID */
    assignedBy: uuid("assigned_by"),

    /** Assignment metadata */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint: one domain per connector */
    unique("domain_connector_assignments_connector_unique").on(t.connectorId),

    /** Index for domain lookup */
    index("domain_connector_assignments_domain_idx").on(t.domainId),

    /** Index for connector lookup */
    index("domain_connector_assignments_connector_idx").on(t.connectorId),

    /** Index for tenant lookup */
    index("domain_connector_assignments_tenant_idx").on(t.tenantId),

    /** Composite index for domain-connector queries */
    index("domain_connector_assignments_domain_connector_idx").on(t.domainId, t.connectorId),
  ],
);

/**
 * Domain Hierarchy Cache
 * Materialized path cache for efficient hierarchy queries
 */
export const domainHierarchyCache = pgTable(
  "domain_hierarchy_cache",
  {
    /** Domain ID */
    domainId: uuid("domain_id")
      .notNull()
      .references(() => businessDomains.id, { onDelete: "cascade" })
      .primaryKey(),

    /** Materialized path (e.g., "1/5/12/") */
    materializedPath: text("materialized_path").notNull(),

    /** Ancestor domain IDs (array) */
    ancestorIds: jsonb("ancestor_ids").$type<string[]>().notNull(),

    /** Descendant domain IDs (array) */
    descendantIds: jsonb("descendant_ids").$type<string[]>().notNull(),

    /** Depth level (0 = root) */
    depth: integer("depth").notNull().default(0),

    /** Last cache refresh timestamp */
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Index for ancestor queries */
    index("domain_hierarchy_cache_ancestors_idx").using("gin", t.ancestorIds),

    /** Index for descendant queries */
    index("domain_hierarchy_cache_descendants_idx").using("gin", t.descendantIds),

    /** Index for depth queries */
    index("domain_hierarchy_cache_depth_idx").on(t.depth),
  ],
);

// Relations
export const businessDomainsRelations = relations(businessDomains, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [businessDomains.tenantId],
    references: [tenants.id],
  }),
  parent: one(businessDomains, {
    fields: [businessDomains.parentId],
    references: [businessDomains.id],
    relationName: "domainHierarchy",
  }),
  children: many(businessDomains, {
    relationName: "domainHierarchy",
  }),
  providers: many(aiProviders, {
    relationName: "domainProviders",
  }),
  connectorAssignments: many(domainConnectorAssignments),
}));

export const domainConnectorAssignmentsRelations = relations(
  domainConnectorAssignments,
  ({ one }) => ({
    domain: one(businessDomains, {
      fields: [domainConnectorAssignments.domainId],
      references: [businessDomains.id],
    }),
    tenant: one(tenants, {
      fields: [domainConnectorAssignments.tenantId],
      references: [tenants.id],
    }),
  }),
);

export const domainHierarchyCacheRelations = relations(domainHierarchyCache, ({ one }) => ({
  domain: one(businessDomains, {
    fields: [domainHierarchyCache.domainId],
    references: [businessDomains.id],
  }),
}));

// Type exports
export type BusinessDomainDb = typeof businessDomains.$inferSelect;
export type NewBusinessDomain = typeof businessDomains.$inferInsert;
export type DomainConnectorAssignment = typeof domainConnectorAssignments.$inferSelect;
export type NewDomainConnectorAssignment = typeof domainConnectorAssignments.$inferInsert;
export type DomainHierarchyCache = typeof domainHierarchyCache.$inferSelect;
export type NewDomainHierarchyCache = typeof domainHierarchyCache.$inferInsert;
