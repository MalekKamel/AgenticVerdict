import { z } from "zod";
import { insightAttributesSchema } from "./insight";

export const dashboardDomainSlugSchema = z.enum([
  "marketing",
  "finance",
  "operations",
  "seo",
  "social",
  "local",
]);

export type DashboardDomainSlug = z.infer<typeof dashboardDomainSlugSchema>;

export const dashboardDatePresetSchema = z.enum([
  "last_7_days",
  "last_30_days",
  "this_month",
  "last_month",
  "custom",
]);

export type DashboardDatePreset = z.infer<typeof dashboardDatePresetSchema>;

export const dashboardViewModeSchema = z.enum(["standard", "compact"]);

export type DashboardViewMode = z.infer<typeof dashboardViewModeSchema>;

export const dashboardKpiMetricSchema = z.object({
  id: z.string(),
  labelKey: z.string(),
  value: z.number(),
  deltaLabelKey: z.string().optional(),
  href: z.string().optional(),
});

export type DashboardKpiMetric = z.infer<typeof dashboardKpiMetricSchema>;

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

export const dashboardConnectorHealthSchema = z.object({
  id: z.string(),
  nameKey: z.string(),
  status: z.enum(["healthy", "degraded", "disconnected"]),
});

export type DashboardConnectorHealth = z.infer<typeof dashboardConnectorHealthSchema>;

export const dashboardHomeSummarySchema = z.object({
  kpis: z.array(dashboardKpiMetricSchema),
  insights: z.array(dashboardInsightSummarySchema),
  connectors: z.array(dashboardConnectorHealthSchema),
  generatedAt: z.string(),
});

export type DashboardHomeSummary = z.infer<typeof dashboardHomeSummarySchema>;

export const dashboardDomainSummarySchema = z.object({
  domain: dashboardDomainSlugSchema,
  kpis: z.array(dashboardKpiMetricSchema),
  generatedAt: z.string(),
});

export type DashboardDomainSummary = z.infer<typeof dashboardDomainSummarySchema>;

export const dashboardAgencyClientRowSchema = z.object({
  clientId: z.string(),
  name: z.string(),
  permitted: z.boolean(),
  insightCount: z.number(),
  connectorStatusKey: z.enum(["healthy", "degraded", "disconnected"]),
});

export type DashboardAgencyClientRow = z.infer<typeof dashboardAgencyClientRowSchema>;

export const dashboardAgencyOverviewSchema = z.object({
  clients: z.array(dashboardAgencyClientRowSchema),
  aggregateKpis: z.array(dashboardKpiMetricSchema),
  generatedAt: z.string(),
});

export type DashboardAgencyOverview = z.infer<typeof dashboardAgencyOverviewSchema>;

export const dashboardWidgetIdSchema = z.enum([
  "kpi_grid",
  "insights",
  "connectors",
  "quick_actions",
]);

export type DashboardWidgetId = z.infer<typeof dashboardWidgetIdSchema>;

export const dashboardLayoutStateSchema = z.object({
  order: z.array(dashboardWidgetIdSchema),
});

export type DashboardLayoutState = z.infer<typeof dashboardLayoutStateSchema>;
