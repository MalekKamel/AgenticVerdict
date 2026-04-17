import { boolean, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

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
    /** Scrypt-hashed password; null for legacy or externally provisioned accounts. */
    passwordHash: varchar("password_hash", { length: 512 }),
    /** New registrations set `false`; column defaults to `true` so legacy rows stay sign-in capable when the column is added. */
    emailVerified: boolean("email_verified").notNull().default(true),
    emailVerificationTokenHash: varchar("email_verification_token_hash", { length: 64 }),
    emailVerificationExpiresAt: timestamp("email_verification_expires_at", { withTimezone: true }),
    passwordResetTokenHash: varchar("password_reset_token_hash", { length: 64 }),
    passwordResetExpiresAt: timestamp("password_reset_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("users_company_id_email_unique").on(t.companyId, t.email)],
);
