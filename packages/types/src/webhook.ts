import { z } from "zod";
import { REPORT_FORMATS } from "./reports";

// ============================================================================
// Webhook Payload Schemas
// ============================================================================

export const webhookPayloadDepthSchema = z.enum(["summary", "full"]);
export type WebhookPayloadDepth = z.infer<typeof webhookPayloadDepthSchema>;

export const webhookMetricSummarySchema = z.object({
  key: z.string(),
  value: z.number(),
  trend: z.enum(["up", "down", "stable"]).optional(),
  changePercent: z.number().optional(),
});
export type WebhookMetricSummary = z.infer<typeof webhookMetricSummarySchema>;

export const webhookReportUrlsSchema = z.object({
  pdf: z.string().url().optional(),
  xlsx: z.string().url().optional(),
});
export type WebhookReportUrls = z.infer<typeof webhookReportUrlsSchema>;

export const webhookPayloadSchema = z.object({
  event: z.literal("report.delivery.completed"),
  insightId: z.string().uuid(),
  tenantId: z.string().uuid(),
  reportId: z.string().uuid(),
  insightName: z.string().optional(),
  templateId: z.string().uuid().optional(),
  timestamp: z.string().datetime(),
  metrics: z.array(webhookMetricSummarySchema).optional(),
  aiInsights: z.array(z.string()).optional(),
  reportUrls: webhookReportUrlsSchema.optional(),
  payloadDepth: webhookPayloadDepthSchema,
  deliveryStatus: z.enum(["sent", "failed"]),
  format: z.enum(REPORT_FORMATS),
  attachmentsCount: z.number().int().min(0).optional(),
  emailSuccess: z.boolean().optional(),
  messageId: z.string().optional(),
  error: z.string().optional(),
});
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

// ============================================================================
// Delivery Event Schema
// ============================================================================

export const webhookDeliveryEventSchema = z.object({
  tenantId: z.string().uuid(),
  reportId: z.string().uuid(),
  provider: z.enum(["resend", "sendgrid", "unknown"]),
  event: z.enum(["delivered", "failed"]),
  recipientEmail: z.string().email(),
  messageId: z.string().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export type WebhookDeliveryEvent = z.infer<typeof webhookDeliveryEventSchema>;

// ============================================================================
// Webhook Delivery Status Enums
// ============================================================================

export const WEBHOOK_DELIVERY_STATUSES = ["pending", "success", "failed", "dead-letter"] as const;

export const webhookDeliveryStatusSchema = z.enum(WEBHOOK_DELIVERY_STATUSES);
export type WebhookDeliveryStatus = z.infer<typeof webhookDeliveryStatusSchema>;
