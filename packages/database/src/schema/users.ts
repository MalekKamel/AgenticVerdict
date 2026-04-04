import { pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { companies } from "./companies";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    displayName: varchar("display_name", { length: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("users_company_id_email_unique").on(t.companyId, t.email)],
);
