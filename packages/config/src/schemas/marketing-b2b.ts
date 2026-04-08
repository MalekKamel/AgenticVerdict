import { z } from "zod";

/**
 * Optional B2B funnel KPI profile (fleet / lead-quality style businesses).
 * Thresholds and weights are configuration-driven — no tenant-specific code paths.
 */
export const b2bKpiWeightsSchema = z.object({
  /** Weight for decision-maker signal (0–1). */
  decisionMakerSignal: z.number().min(0).max(1).optional(),
  /** Weight for minimum fleet size signal (0–1). */
  fleetSizeSignal: z.number().min(0).max(1).optional(),
  /** Weight for regional fit (e.g. share of in-region qualified leads) (0–1). */
  regionalFitSignal: z.number().min(0).max(1).optional(),
});

export const b2bKpiTargetCpqlSchema = z.object({
  maxAmount: z.number().positive(),
  currencyCode: z.string().min(1),
});

/**
 * Maps normalized platform snapshot metric keys (suffix match) into funnel counters.
 * Suffixes are matched case-insensitively (e.g. `mock.conversions` matches `meta.mock.conversions`).
 */
export const b2bFunnelMetricMappingSchema = z.object({
  totalLeadMetricSuffixes: z.array(z.string().min(1)).optional(),
  qualifiedLeadMetricSuffixes: z.array(z.string().min(1)).optional(),
  spendMetricSuffixes: z.array(z.string().min(1)).optional(),
  decisionMakerLeadMetricSuffixes: z.array(z.string().min(1)).optional(),
  fleetQualifiedLeadMetricSuffixes: z.array(z.string().min(1)).optional(),
  regionalQualifiedLeadMetricSuffixes: z.array(z.string().min(1)).optional(),
  /** When set, regional sums only include records whose dimensions contain this key/value. */
  regionalDimension: z.object({ key: z.string().min(1), value: z.string().min(1) }).optional(),
  sessionsMetricSuffixes: z.array(z.string().min(1)).optional(),
  sessionLanguageDimensionKey: z.string().min(1).optional(),
});

export const b2bKpiProfileSchema = z.object({
  /** When false or omitted, raw rates and CPQL are still computed but composite score/targets are omitted. */
  enabled: z.boolean().optional(),
  /** Minimum fleet size (vehicles) for a lead to count as “fleet-qualified”. */
  minFleetVehiclesQualified: z.number().int().positive().optional(),
  weights: b2bKpiWeightsSchema.optional(),
  targetCpql: b2bKpiTargetCpqlSchema.optional(),
  funnelMetricMapping: b2bFunnelMetricMappingSchema.optional(),
});

export type B2bKpiProfile = z.infer<typeof b2bKpiProfileSchema>;
export type B2bKpiWeights = z.infer<typeof b2bKpiWeightsSchema>;
export type B2bFunnelMetricMapping = z.infer<typeof b2bFunnelMetricMappingSchema>;
