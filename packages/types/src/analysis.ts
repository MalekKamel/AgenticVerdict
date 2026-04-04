import { z } from "zod";

import { dateRangeSchema } from "./common";
import { generatedInsightSchema } from "./insight";
import { marketingVerdictSchema } from "./verdict";

export const transformationSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  timestamp: z.coerce.date(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export type Transformation = z.infer<typeof transformationSchema>;

export const dataSourceProvenanceSchema = z.object({
  platform: z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]),
  metrics: z.array(z.string()).min(1),
  dateRange: dateRangeSchema,
  freshnessHours: z.number().nonnegative(),
  qualityScore: z.number().min(0).max(100),
});

export type DataSourceProvenance = z.infer<typeof dataSourceProvenanceSchema>;

export const provenanceInfoSchema = z.object({
  analysisId: z.string().uuid(),
  generatedAt: z.coerce.date(),
  agentVersion: z.string().min(1),
  modelUsed: z.string().min(1),
  dataSources: z.array(dataSourceProvenanceSchema).min(1),
  transformations: z.array(transformationSchema),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export type ProvenanceInfo = z.infer<typeof provenanceInfoSchema>;

export const analysisResultResponseSchema = z.object({
  analysisId: z.string().uuid(),
  tenantId: z.string().uuid(),
  period: dateRangeSchema,
  platformsAnalyzed: z.array(z.string().min(1)).min(1),
  dataQualityScore: z.number().min(0).max(100),
  generatedAt: z.coerce.date(),
  provenance: provenanceInfoSchema,
  insights: z.array(generatedInsightSchema),
  verdicts: z.array(marketingVerdictSchema),
});

export type AnalysisResultResponse = z.infer<typeof analysisResultResponseSchema>;
