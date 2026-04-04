import { z } from "zod";

import type { NormalizedPlatformSnapshot } from "./types";

const platformTypeSchema = z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]);

const dateRangeIsoSchema = z.object({
  startInclusive: z.string().min(1),
  endInclusive: z.string().min(1),
});

const snapshotPipelineMetadataSchema = z.object({
  normalizedAt: z.string().min(1),
  pipelineVersion: z.string().min(1),
  fxTableVersion: z.string().min(1).optional(),
});

export const normalizedMetricRecordSchema = z.object({
  metricKey: z.string().min(1),
  value: z.number().finite(),
  dimensions: z.record(z.string(), z.string()).optional(),
  capturedAt: z.string().min(1),
});

export const normalizedPlatformSnapshotSchema = z.object({
  platform: platformTypeSchema,
  dateRange: dateRangeIsoSchema,
  records: z.array(normalizedMetricRecordSchema),
  metadata: snapshotPipelineMetadataSchema.optional(),
});

export type NormalizedPlatformSnapshotParsed = z.infer<typeof normalizedPlatformSnapshotSchema>;

export function parseNormalizedPlatformSnapshot(
  input: unknown,
): { success: true; data: NormalizedPlatformSnapshot } | { success: false; error: z.ZodError } {
  const r = normalizedPlatformSnapshotSchema.safeParse(input);
  if (!r.success) {
    return { success: false, error: r.error };
  }
  return { success: true, data: r.data as NormalizedPlatformSnapshot };
}
