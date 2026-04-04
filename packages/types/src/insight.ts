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
