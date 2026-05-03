import { z } from "zod";

export const insightTypeSchema = z.enum(["anomaly", "trend", "opportunity", "warning"]);

export type InsightType = z.infer<typeof insightTypeSchema>;

export const generatedInsightSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  analysisId: z.string().uuid(),
  type: insightTypeSchema,
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  confidence: z.number().min(0).max(1),
  relevanceScore: z.number().min(0).max(1),
  platforms: z.array(z.string().min(1)).min(1),
  relatedMetricKeys: z.array(z.string()).optional(),
  evidence: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.union([z.string(), z.number()]).optional(),
        source: z.string().optional(),
      }),
    )
    .optional(),
  createdAt: z.coerce.date(),
});

export type GeneratedInsight = z.infer<typeof generatedInsightSchema>;

export const insightAttributesSchema = z.object({
  period: z.string().optional(),
  metricClass: z.string().optional(),
  severity: z.string().optional(),
});

export type InsightAttributes = z.infer<typeof insightAttributesSchema>;

export const insightDtoSchema = z.object({
  id: z.string(),
  insightType: z.string(),
  attributes: insightAttributesSchema,
  domains: z.array(z.string()),
  rawName: z.string(),
  createdAt: z.string(),
  connectorIds: z.array(z.string()),
});

export type InsightDTO = z.infer<typeof insightDtoSchema>;

export const dashboardInsightSummarySchema = z.object({
  id: z.string(),
  insightType: z.string(),
  attributes: insightAttributesSchema,
  domains: z.array(z.string()),
  rawName: z.string(),
  createdAt: z.string(),
  connectorIds: z.array(z.string()),
});

export type DashboardInsightSummary = z.infer<typeof dashboardInsightSummarySchema>;
