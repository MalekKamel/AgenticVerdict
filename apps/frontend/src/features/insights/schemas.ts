/**
 * Insight type schemas
 *
 * Zod schemas for runtime validation of JSONB fields
 */

import { z } from "zod";

export const InsightAIConfigSchema = z.object({
  model: z.string(),
  provider: z.enum(["anthropic", "openai"]).optional(),
  qualityLevel: z.enum(["standard", "premium"]).optional(),
  quality: z.number().optional(),
  detailLevel: z.enum(["executive", "standard", "comprehensive"]),
  customPrompt: z.string().optional(),
});

export type InsightAIConfig = z.infer<typeof InsightAIConfigSchema>;

export const InsightScheduleSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  time: z.number().int().min(0).max(23),
});

export type InsightSchedule = z.infer<typeof InsightScheduleSchema>;

export const InsightDeliverySchema = z.object({
  format: z.enum(["pdf", "excel", "both"]),
  emailRecipients: z.array(z.string().email()).optional(),
  enableWebhook: z.boolean().optional(),
  webhookUrl: z.string().url().optional().or(z.literal("")),
});

export type InsightDelivery = z.infer<typeof InsightDeliverySchema>;

export const InsightConnectorSchema = z.object({
  id: z.string(),
  connectorId: z.string(),
  enabled: z.boolean(),
  selectedMetrics: z.array(z.unknown()),
  filters: z.record(z.unknown()),
});

export type InsightConnector = z.infer<typeof InsightConnectorSchema>;

export const InsightListItemSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  templateId: z.string().nullable(),
  enabled: z.boolean(),
  schedule: InsightScheduleSchema,
  delivery: InsightDeliverySchema,
  aiConfig: InsightAIConfigSchema,
  createdAt: z.date(),
  status: z.enum(["idle", "running", "completed", "failed"]).optional(),
  lastRunAt: z.date().nullable().optional(),
  lastRunStatus: z
    .enum(["idle", "running", "completed", "failed", "success"])
    .nullable()
    .optional(),
  connectors: z.array(InsightConnectorSchema),
});

export type InsightListItem = z.infer<typeof InsightListItemSchema>;

/**
 * Runtime type guards
 */
export function isInsightAIConfig(value: unknown): value is InsightAIConfig {
  return InsightAIConfigSchema.safeParse(value).success;
}

export function isInsightSchedule(value: unknown): value is InsightSchedule {
  return InsightScheduleSchema.safeParse(value).success;
}

export function isInsightDelivery(value: unknown): value is InsightDelivery {
  return InsightDeliverySchema.safeParse(value).success;
}

export function isInsightConnector(value: unknown): value is InsightConnector {
  return InsightConnectorSchema.safeParse(value).success;
}

export function isInsightListItem(value: unknown): value is InsightListItem {
  return InsightListItemSchema.safeParse(value).success;
}
