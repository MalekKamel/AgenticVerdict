import { z } from "zod";

/**
 * Schedule frequency for insight generation (distinct from connector sync frequency).
 * Insights run at business hours: daily, weekly, monthly, or quarterly.
 */
export const SCHEDULE_FREQUENCIES = ["daily", "weekly", "monthly", "quarterly"] as const;
export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number];
export const scheduleFrequencySchema = z.enum(SCHEDULE_FREQUENCIES);

/**
 * Insight Template DTO (returned by API)
 */
export const insightTemplateSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().nullable(),
  nameTranslations: z.record(z.string(), z.string()),
  name: z.string(),
  descriptionTranslations: z.record(z.string(), z.string()),
  description: z.string(),
  domains: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
  connectors: z.array(
    z.object({
      connectorId: z.string(),
      connectorName: z.string(),
      metrics: z.array(z.string()),
    }),
  ),
  aiTemplateId: z.string().uuid().nullable(),
  schedule: z.object({
    frequency: scheduleFrequencySchema,
    time: z.number().min(0).max(23),
  }),
  delivery: z.object({
    format: z.enum(["pdf", "excel", "both"]),
    emailRecipients: z.array(z.string().email()),
    enableWebhook: z.boolean(),
    webhookUrl: z.string().url().nullable(),
  }),
  icon: z.string(),
  isActive: z.boolean(),
  version: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Insight template summary (for list view)
 */
export const insightTemplateSummarySchema = z.object({
  id: z.string().uuid(),
  nameTranslations: z.record(z.string(), z.string()),
  name: z.string(),
  descriptionTranslations: z.record(z.string(), z.string()),
  description: z.string(),
  icon: z.string(),
  domains: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
  connectorCount: z.number(),
  isActive: z.boolean(),
});

/**
 * Applied template configuration (returned when applying a template)
 */
export const appliedTemplateConfigSchema = z.object({
  templateId: z.string().uuid(),
  templateName: z.string(),
  name: z.string(),
  description: z.string(),
  domain: z.string(),
  connectorIds: z.array(z.string()),
  aiTemplateId: z.string().uuid().nullable(),
  schedule: z.object({
    frequency: scheduleFrequencySchema,
    time: z.number().min(0).max(23),
  }),
  delivery: z.object({
    format: z.enum(["pdf", "excel", "both"]),
    emailRecipients: z.array(z.string().email()),
    enableWebhook: z.boolean(),
    webhookUrl: z.string().url().nullable(),
  }),
});

/**
 * Validation result for template connector/metric mappings
 */
export const templateValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(
    z.object({
      connectorId: z.string(),
      metric: z.string(),
      message: z.string(),
    }),
  ),
});

// Input schemas for tRPC procedures
export const listInsightTemplatesInput = z.object({
  domain: z.string().optional(),
});

export const getInsightTemplateInput = z.object({
  id: z.string().uuid(),
});

export const applyInsightTemplateInput = z.object({
  id: z.string().uuid(),
});

export const validateInsightTemplateInput = z.object({
  id: z.string().uuid(),
});

// Type exports
export type InsightTemplate = z.infer<typeof insightTemplateSchema>;
export type InsightTemplateSummary = z.infer<typeof insightTemplateSummarySchema>;
export type AppliedTemplateConfig = z.infer<typeof appliedTemplateConfigSchema>;
export type TemplateValidationResult = z.infer<typeof templateValidationResultSchema>;
export type ListInsightTemplatesInput = z.infer<typeof listInsightTemplatesInput>;
export type GetInsightTemplateInput = z.infer<typeof getInsightTemplateInput>;
export type ApplyInsightTemplateInput = z.infer<typeof applyInsightTemplateInput>;
export type ValidateInsightTemplateInput = z.infer<typeof validateInsightTemplateInput>;
