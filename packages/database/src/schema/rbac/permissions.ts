import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 256 }).notNull().unique(),
    resource: varchar("resource", { length: 128 }).notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    description: varchar("description", { length: 512 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("permissions_resource_action_unique").on(t.resource, t.action)],
);
