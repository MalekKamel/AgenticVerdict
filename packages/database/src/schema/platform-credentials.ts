import { pgTable, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { companies } from "./companies";

export const platformCredentials = pgTable(
  "platform_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    platform: varchar("platform", { length: 64 }).notNull(),
    encryptedPayload: text("encrypted_payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("platform_credentials_company_platform_unique").on(t.companyId, t.platform)],
);
