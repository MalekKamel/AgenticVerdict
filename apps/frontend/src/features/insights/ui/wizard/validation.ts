import { z } from "zod";
import { insightDeliverySchema, insightAiConfigSchema } from "@agenticverdict/types";

export const basicInfoSchema = z.object({
  name: z.string().min(3, "NAME_TOO_SHORT").max(100, "NAME_TOO_LONG"),
  description: z.string().optional(),
  domain: z.string().min(1, "DOMAIN_REQUIRED"),
});

export const connectorSelectionSchema = z.object({
  connectorIds: z.array(z.string()).min(1, "CONNECTOR_REQUIRED"),
});

export const metricConfigurationSchema = z.object({
  selectedMetrics: z.record(z.string(), z.array(z.string())),
});

export { insightAiConfigSchema as aiSettingsSchema };
export { insightDeliverySchema as scheduleDeliverySchema };

export const createInsightWizardSchema = z.object({
  ...basicInfoSchema.shape,
  ...connectorSelectionSchema.shape,
  ...metricConfigurationSchema.shape,
  ...insightAiConfigSchema.shape,
  ...insightDeliverySchema.shape,
});

export type CreateInsightFormData = z.infer<typeof createInsightWizardSchema>;
