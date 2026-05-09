import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { insights } from "./core/insights";
import { reports } from "./reports";

export const webhookDeliveryStatusEnum = pgEnum("webhook_delivery_status", [
  "pending",
  "success",
  "failed",
  "dead-letter",
]);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    insightId: uuid("insight_id").references(() => insights.id, { onDelete: "set null" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    reportId: uuid("report_id").references(() => reports.id, { onDelete: "set null" }),
    url: text("url").notNull(),
    status: webhookDeliveryStatusEnum("status").notNull().default("pending"),
    responseCode: integer("response_code"),
    responseBody: text("response_body"),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("webhook_deliveries_tenant_id_idx").on(t.tenantId),
    index("webhook_deliveries_insight_id_idx").on(t.insightId),
    index("webhook_deliveries_report_id_idx").on(t.reportId),
  ],
);

export type WebhookDeliveryDb = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDeliveryDb = typeof webhookDeliveries.$inferInsert;
