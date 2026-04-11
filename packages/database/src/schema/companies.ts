import { boolean, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { agencyPartners } from "./core/tenants";

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  active: boolean("active").notNull().default(true),
  agencyPartnerId: uuid("agency_partner_id").references(() => agencyPartners.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
