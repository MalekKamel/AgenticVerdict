import { boolean, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { tenants } from "../tenants";

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 128 }).notNull(),
    description: varchar("description", { length: 512 }),
    isSystemRole: boolean("is_system_role").notNull().default(false),
    isCustomRole: boolean("is_custom_role").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("roles_tenant_id_name_unique").on(t.tenantId, t.name)],
);
