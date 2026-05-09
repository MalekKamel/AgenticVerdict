import { z } from "zod";
import { connectorTypeSchema } from "@agenticverdict/types";

import type { NormalizedConnectorSnapshot } from "./types";

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

export const normalizedConnectorSnapshotSchema = z.object({
  connector: connectorTypeSchema,
  dateRange: dateRangeIsoSchema,
  records: z.array(normalizedMetricRecordSchema),
  metadata: snapshotPipelineMetadataSchema.optional(),
});

export type NormalizedConnectorSnapshotParsed = z.infer<typeof normalizedConnectorSnapshotSchema>;

export function parseNormalizedConnectorSnapshot(
  input: unknown,
): { success: true; data: NormalizedConnectorSnapshot } | { success: false; error: z.ZodError } {
  const r = normalizedConnectorSnapshotSchema.safeParse(input);
  if (!r.success) {
    return { success: false, error: r.error };
  }
  return { success: true, data: r.data as NormalizedConnectorSnapshot };
}
