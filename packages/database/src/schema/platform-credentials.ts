import { pgTable, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";

export const platformCredentials = pgTable(
  "platform_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    platform: varchar("platform", { length: 64 }).notNull(),
    encryptedPayload: text("encrypted_payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("platform_credentials_tenant_platform_unique").on(t.tenantId, t.platform)],
);
