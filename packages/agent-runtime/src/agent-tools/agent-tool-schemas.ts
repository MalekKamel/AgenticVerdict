import type { PlatformType } from "@agenticverdict/types";
import { z } from "zod";

import { AgentToolError } from "./agent-tool-error";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected ISO calendar date YYYY-MM-DD");

export const dateRangeToolInputSchema = z.object({
  startInclusive: isoDateSchema,
  endInclusive: isoDateSchema,
});

export type DateRangeToolInput = z.infer<typeof dateRangeToolInputSchema>;

const platformTypeSchema = z.enum([
  "meta",
  "ga4",
  "gsc",
  "gbp",
  "tiktok",
]) as z.ZodType<PlatformType>;

export const queryHistoricalMetricsInputSchema = z.object({
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  platform: platformTypeSchema.optional(),
  limit: z.number().int().positive().max(5000).optional(),
});

export const analyzeTrendsInputSchema = z.object({
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  platform: platformTypeSchema.optional(),
  mode: z.enum(["row_volume", "payload_sum"]).default("row_volume"),
});

export const comparePeriodsInputSchema = z.object({
  platform: platformTypeSchema.optional(),
  periodA: z.object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  }),
  periodB: z.object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  }),
  mode: z.enum(["row_volume", "payload_sum"]).default("row_volume"),
});

export const generateSummaryInputSchema = z.object({
  title: z.string().min(1).max(200),
  bullets: z.array(z.string().min(1).max(2000)).min(1).max(40),
  tone: z.enum(["neutral", "executive", "technical"]).default("neutral"),
});

export const formatReportInputSchema = z.object({
  sections: z
    .array(
      z.object({
        heading: z.string().min(1).max(200),
        bodyMarkdown: z.string().min(1).max(20_000),
      }),
    )
    .min(1)
    .max(30),
  locale: z.string().min(2).max(16).default("en"),
});

export const prepareChartDataInputSchema = z.object({
  series: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        label: z.string().min(1).max(200),
        points: z
          .array(
            z.object({
              x: z.union([z.string(), z.number()]),
              y: z.number().finite(),
            }),
          )
          .min(1)
          .max(2000),
      }),
    )
    .min(1)
    .max(20),
  chartKind: z.enum(["line", "bar", "area"]).default("line"),
});

export const calculateMetricsInputSchema = z.object({
  values: z.array(z.number().finite()).min(1).max(10_000),
  operations: z
    .array(z.enum(["sum", "mean", "min", "max", "growth_rate"]))
    .min(1)
    .max(8),
});

export const statisticalAnalysisInputSchema = z.object({
  x: z.array(z.number().finite()).min(2).max(5000),
  y: z.array(z.number().finite()).min(2).max(5000),
  analyses: z
    .array(z.enum(["pearson_correlation", "outlier_zscore", "variance"]))
    .min(1)
    .max(6),
  zscoreThreshold: z.number().finite().positive().max(20).default(3),
});

export const normalizeMetricsInputSchema = z.object({
  values: z.array(z.number().finite()).min(1).max(10_000),
  method: z.enum(["min_max", "z_score"]).default("min_max"),
});

export const getConfigInputSchema = z.object({
  section: z.enum(["ai", "features", "localization", "marketing"]),
});

export function parseToolArgs<T>(
  schema: z.ZodSchema<T>,
  args: Readonly<Record<string, unknown>>,
): T {
  const r = schema.safeParse(args);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new AgentToolError("validation_failed", `Invalid tool arguments: ${msg}`, {
      cause: r.error,
    });
  }
  return r.data;
}
