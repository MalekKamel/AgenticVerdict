import { sql } from "drizzle-orm";
import { jsonb, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { coreSchema } from "./schema";

/** Agency partner accounts (multi-tenant SaaS resale / managed-service model). */
export const agencyPartners = coreSchema.table("agency_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  settings: jsonb("settings")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
