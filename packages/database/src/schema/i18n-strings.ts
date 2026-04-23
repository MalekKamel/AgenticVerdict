import { index, pgTable, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";

export const i18nStrings = pgTable(
  "i18n_strings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    locale: varchar("locale", { length: 16 }).notNull(),
    messageKey: varchar("message_key", { length: 512 }).notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("i18n_strings_tenant_locale_key_unique").on(t.tenantId, t.locale, t.messageKey),
    index("i18n_strings_tenant_id_locale_idx").on(t.tenantId, t.locale),
  ],
);
