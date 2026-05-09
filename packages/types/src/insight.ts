import { z } from "zod";
import { sortDirectionSchema } from "./common";

export const INSIGHT_TYPES = ["opportunity", "risk", "observation", "recommendation"] as const;
export type InsightType = (typeof INSIGHT_TYPES)[number];

export const insightTypeSchema = z.enum(INSIGHT_TYPES);

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

export const insightDeliverySchema = z.object({
  format: z.enum(["pdf", "excel", "both"]),
  emailRecipients: z.array(z.string().email("EMAIL_INVALID")).optional(),
  enableWebhook: z.boolean().optional(),
  webhookUrl: z.union([z.url("WEBHOOK_URL_INVALID"), z.literal("")]).optional(),
});
export type InsightDelivery = z.infer<typeof insightDeliverySchema>;

export const insightAiConfigSchema = z.object({
  model: z.string().min(1, "MODEL_REQUIRED"),
  provider: z.string().min(1).max(64).optional(),
  qualityLevel: z.enum(["standard", "premium"]).optional(),
  quality: z.number().min(0).max(100).optional(),
  detailLevel: z.enum(["executive", "standard", "comprehensive"]),
  customPrompt: z.string().optional(),
});
export type InsightAiConfig = z.infer<typeof insightAiConfigSchema>;

export const INSIGHT_STATUSES = ["idle", "running", "completed", "failed"] as const;
export type InsightStatus = (typeof INSIGHT_STATUSES)[number];

export const insightStatusSchema = z.enum(INSIGHT_STATUSES);

export const DB_RUN_STATUSES = ["success", "failed"] as const;
export type InsightDbRunStatus = (typeof DB_RUN_STATUSES)[number] | null;

export const insightDbRunStatusSchema = z.enum(DB_RUN_STATUSES).nullable();

export const DETAIL_LEVELS = ["executive", "standard", "comprehensive"] as const;
export type DetailLevel = (typeof DETAIL_LEVELS)[number];

export const detailLevelSchema = z.enum(DETAIL_LEVELS);

// ============================================================================
// Insight CRUD Schemas (moved from apps/api/src/trpc/routers/insights.ts)
// ============================================================================

export const insightConnectorSchema = z.object({
  connectorId: z.string(),
  enabled: z.boolean().default(true),
  selectedMetrics: z.array(z.string()).default([]),
  filters: z.record(z.string(), z.unknown()).default({}),
});
export type InsightConnector = z.infer<typeof insightConnectorSchema>;

export const insightCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  templateId: z.string().optional(),
  enabled: z.boolean().default(true),
  delivery: insightDeliverySchema,
  aiConfig: insightAiConfigSchema,
  connectors: z.array(insightConnectorSchema),
});
export type InsightCreateInput = z.infer<typeof insightCreateSchema>;

export const insightUpdateSchema = insightCreateSchema.partial();
export type InsightUpdateInput = z.infer<typeof insightUpdateSchema>;

export const insightListInputSchema = z.object({
  status: z.enum(["enabled", "disabled", "all"]).optional().default("all"),
  search: z.string().optional(),
  domain: z.string().optional(),
  sortField: z.enum(["name", "createdAt", "lastRunAt", "status"]).optional().default("createdAt"),
  sortDirection: sortDirectionSchema.optional().default("desc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type InsightListInput = z.infer<typeof insightListInputSchema>;

export const insightOutputSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  templateId: z.string().nullable(),
  enabled: z.boolean(),
  domain: z.string().nullable(),
  domains: z.array(z.string()).optional(),
  status: insightStatusSchema,
  lastRunAt: z.date().nullable(),
  lastRunStatus: insightDbRunStatusSchema,
  delivery: insightDeliverySchema,
  aiConfig: insightAiConfigSchema,
  createdAt: z.date(),
  connectors: z.array(
    z.object({
      id: z.string(),
      connectorId: z.string(),
      enabled: z.boolean(),
      selectedMetrics: z.array(z.string()),
      filters: z.record(z.string(), z.unknown()),
    }),
  ),
});
export type InsightOutput = z.infer<typeof insightOutputSchema>;

export const insightListOutputSchema = z.object({
  insights: z.array(insightOutputSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type InsightListOutput = z.infer<typeof insightListOutputSchema>;

// ============================================================================
// Runtime type guards
// ============================================================================

export function isInsightAiConfig(value: unknown): value is InsightAiConfig {
  return insightAiConfigSchema.safeParse(value).success;
}

export function isInsightDelivery(value: unknown): value is InsightDelivery {
  return insightDeliverySchema.safeParse(value).success;
}

export function isInsightConnector(value: unknown): value is InsightConnector {
  return insightConnectorSchema.safeParse(value).success;
}
