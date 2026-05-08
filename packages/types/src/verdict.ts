import { z } from "zod";

import { dateRangeSchema, metricReferenceSchema } from "./common";

/** Platforms for evidence attribution (unified schema). */
export const verdictEvidenceSourceSchema = z.enum([
  "meta",
  "ga4",
  "gsc",
  "gbp",
  "tiktok",
  "internal",
  "composite",
]);

export type VerdictEvidenceSource = z.infer<typeof verdictEvidenceSourceSchema>;

export const verdictTypeSchema = z.enum([
  "budget_allocation",
  "platform_performance",
  "creative_effectiveness",
  "overall_health",
]);

export type VerdictType = z.infer<typeof verdictTypeSchema>;

export const verdictInsightSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  detail: z.string().min(1),
  impact: z.enum(["high", "medium", "low"]),
  confidence: z.number().min(0).max(1),
  category: z.string().optional(),
  sourcePlatform: z.string().optional(),
  relatedMetrics: z.array(metricReferenceSchema).optional(),
});

export type VerdictInsight = z.infer<typeof verdictInsightSchema>;

export const verdictRecommendationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  rationale: z.string().min(1),
  priority: z.number().int().min(1).max(5),
  estimatedImpact: z
    .object({
      roas: z.number().optional(),
      cost: z.number().optional(),
      revenue: z.number().optional(),
    })
    .optional(),
  effort: z.enum(["low", "medium", "high"]),
  timeline: z.string().optional(),
  ownerRole: z.string().optional(),
});

export type VerdictRecommendation = z.infer<typeof verdictRecommendationSchema>;

export const verdictActionItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1),
  ownerRole: z.string().min(1),
  priority: z.number().int().min(1).max(10),
  dueDateHint: z.string().optional(),
  estimatedHours: z.number().nonnegative().optional(),
  dependencies: z.array(z.string().uuid()).optional(),
});

export type VerdictActionItem = z.infer<typeof verdictActionItemSchema>;

export const verdictEvidenceSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  value: z.union([z.string(), z.number()]).optional(),
  metric: z.string().optional(),
  valueFormatted: z.string().optional(),
  change: z.number().optional(),
  changePercent: z.number().optional(),
  source: verdictEvidenceSourceSchema,
  capturedAt: z.coerce.date(),
});

export type VerdictEvidence = z.infer<typeof verdictEvidenceSchema>;

export const historicalTrendSchema = z.object({
  period: z.string().min(1),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  summary: z.string().optional(),
});

export type HistoricalTrend = z.infer<typeof historicalTrendSchema>;

export const dataSourcePlatformSchema = z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]);

export const dataSourceInfoSchema = z.object({
  platform: dataSourcePlatformSchema,
  metrics: z.array(z.string().min(1)).min(1),
  dateRange: dateRangeSchema,
  freshness: z.number().nonnegative(),
  qualityScore: z.number().min(0).max(100),
});

export type DataSourceInfo = z.infer<typeof dataSourceInfoSchema>;

export const methodologyInfoSchema = z.object({
  approach: z.string().min(1),
  dataPoints: z.number().int().nonnegative(),
  confidenceInterval: z
    .object({
      lower: z.number(),
      upper: z.number(),
      level: z.number().min(0).max(1),
    })
    .optional(),
  limitations: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional(),
});

export type MethodologyInfo = z.infer<typeof methodologyInfoSchema>;

export const verdictVisualizationSchema = z.object({
  type: z.enum(["gauge", "trend", "comparison", "distribution"]),
  title: z.string().min(1),
  data: z.unknown(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type VerdictVisualization = z.infer<typeof verdictVisualizationSchema>;

export const verdictReportMetadataSchema = z.object({
  includeInExecutiveSummary: z.boolean().default(false),
  displayPriority: z.number().int().min(1).max(10).default(5),
  visualizations: z.array(verdictVisualizationSchema).optional(),
  footnotes: z.array(z.string()).optional(),
});

export const verdictSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  analysisId: z.string().uuid(),
  verdictType: verdictTypeSchema,
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  summary: z.string().min(10).max(500),
  reasoning: z.array(z.string().min(10)).min(1),
  keyInsights: z.array(verdictInsightSchema).min(1),
  recommendations: z.array(verdictRecommendationSchema).min(1),
  actionItems: z.array(verdictActionItemSchema),
  evidence: z.array(verdictEvidenceSchema),
  historicalContext: z.array(historicalTrendSchema).optional(),
  dataSources: z.array(dataSourceInfoSchema).min(1),
  methodology: methodologyInfoSchema.optional(),
  platformsAnalyzed: z.array(z.string().min(1)).min(1),
  dateRange: dateRangeSchema,
  generatedAt: z.coerce.date(),
  generatedBy: z.string().min(1),
  modelUsed: z.string().min(1),
  parameters: z.record(z.string(), z.unknown()).optional(),
  reportMetadata: verdictReportMetadataSchema.optional(),
});

export type Verdict = z.infer<typeof verdictSchema>;
