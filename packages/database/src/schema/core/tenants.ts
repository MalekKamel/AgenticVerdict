import {
  pgEnum,
  varchar,
  integer,
  decimal,
  timestamp,
  uuid,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { coreSchema } from "./schema";

export const agencyPartnerTierEnum = pgEnum("agency_partner_tier", [
  "registered",
  "certified",
  "elite",
]);

export const agencyPartners = coreSchema.table("agency_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),

  tier: agencyPartnerTierEnum("tier").notNull().default("registered"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10.00"),
  maxClients: integer("max_clients").default(10),
  whiteLabelEnabled: boolean("white_label_enabled").default(false),
  partnerSince: timestamp("partner_since", { withTimezone: true }),
  certifiedAt: timestamp("certified_at", { withTimezone: true }),

  settings: jsonb("settings")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
