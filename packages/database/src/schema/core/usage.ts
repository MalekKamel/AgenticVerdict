import { date, index, integer, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { companies } from "../companies";
import { coreSchema } from "./schema";

/** Aggregated usage quantities for billing / metering (tenant-scoped). */
export const usageTracking = coreSchema.table(
  "usage_tracking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    metricType: varchar("metric_type", { length: 50 }).notNull(),
    quantity: integer("quantity").notNull(),
    periodStart: date("period_start", { mode: "date" }).notNull(),
    periodEnd: date("period_end", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("usage_tracking_company_id_period_idx").on(t.companyId, t.periodStart, t.periodEnd),
  ],
);
