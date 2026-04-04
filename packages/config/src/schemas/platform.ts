import { z } from "zod";

import type { PlatformType } from "@agenticverdict/types";

const platformTypeSchema = z.enum([
  "meta",
  "ga4",
  "gsc",
  "gbp",
  "tiktok",
]) as z.ZodType<PlatformType>;

/** Single KPI definition used in marketing configuration. */
export const kpiConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
});

export const platformConfigSchema = z.object({
  platform: platformTypeSchema,
  enabled: z.boolean(),
  label: z.string().min(1).optional(),
  /** Non-secret integration hints (credentials stay in env / secure store). */
  credentialsRef: z.string().min(1).optional(),
  settings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type KpiConfig = z.infer<typeof kpiConfigSchema>;
export type PlatformConfig = z.infer<typeof platformConfigSchema>;
