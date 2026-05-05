import { z } from "zod";

export const basicInfoSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
  domain: z.string().min(1, "Domain is required"),
});

export const connectorSelectionSchema = z.object({
  connectorIds: z.array(z.string()).min(1, "Select at least one connector"),
});

export const metricConfigurationSchema = z.object({
  selectedMetrics: z.record(z.array(z.string())),
});

export const aiSettingsSchema = z.object({
  model: z.string().min(1, "Model is required"),
  quality: z.number().min(0).max(100),
  detailLevel: z.enum(["executive", "standard", "comprehensive"]),
  customPrompt: z.string().optional(),
});

export const scheduleDeliverySchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  time: z.string(),
  format: z.enum(["pdf", "excel", "both"]),
  emailRecipients: z.array(z.string().email("Invalid email address")),
  enableWebhook: z.boolean().optional(),
  webhookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const createInsightWizardSchema = z.object({
  ...basicInfoSchema.shape,
  ...connectorSelectionSchema.shape,
  ...metricConfigurationSchema.shape,
  ...aiSettingsSchema.shape,
  ...scheduleDeliverySchema.shape,
});

export type CreateInsightFormData = z.infer<typeof createInsightWizardSchema>;
