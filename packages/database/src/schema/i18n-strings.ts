import { index, pgTable, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { companies } from "./companies";

export const i18nStrings = pgTable(
  "i18n_strings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    locale: varchar("locale", { length: 16 }).notNull(),
    messageKey: varchar("message_key", { length: 512 }).notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("i18n_strings_company_locale_key_unique").on(t.companyId, t.locale, t.messageKey),
    index("i18n_strings_company_id_locale_idx").on(t.companyId, t.locale),
  ],
);
