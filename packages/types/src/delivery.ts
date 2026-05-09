import { z } from "zod";

export type DeliveryEventType =
  | "email_queued"
  | "email_sent"
  | "email_failed"
  | "email_bounced"
  | "email_complaint"
  | "share_issued"
  | "schedule_registered"
  | "schedule_removed";

export const deliveryEventTypeSchema = z.enum([
  "email_queued",
  "email_sent",
  "email_failed",
  "email_bounced",
  "email_complaint",
  "share_issued",
  "schedule_registered",
  "schedule_removed",
]);

export interface DeliveryEvent {
  id: string;
  tenantId: string;
  type: DeliveryEventType;
  reportId?: string | undefined;
  scheduleId?: string | undefined;
  at: string;
  meta?: Record<string, string | number | boolean> | undefined;
}

export const deliveryEventSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  type: deliveryEventTypeSchema,
  reportId: z.string().uuid().optional(),
  scheduleId: z.string().uuid().optional(),
  at: z.iso.datetime(),
  meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type DeliveryEventInput = z.input<typeof deliveryEventSchema>;
export type DeliveryEventOutput = z.output<typeof deliveryEventSchema>;

export interface DeliveryMetricsSummary {
  emailQueued: number;
  emailSent: number;
  emailFailed: number;
  emailBounced: number;
  emailComplaints: number;
  shareIssued: number;
  scheduleRegistered: number;
  scheduleRemoved: number;
}

export const deliveryMetricsSummarySchema = z.object({
  emailQueued: z.number().int().nonnegative(),
  emailSent: z.number().int().nonnegative(),
  emailFailed: z.number().int().nonnegative(),
  emailBounced: z.number().int().nonnegative(),
  emailComplaints: z.number().int().nonnegative(),
  shareIssued: z.number().int().nonnegative(),
  scheduleRegistered: z.number().int().nonnegative(),
  scheduleRemoved: z.number().int().nonnegative(),
});
