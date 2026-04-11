import type { ConnectorType } from "@agenticverdict/types";

import type { DateRangeIso } from "../date-range";

export interface NormalizedMetricRecord {
  metricKey: string;
  value: number;
  dimensions?: Readonly<Record<string, string>>;
  capturedAt: string;
}

export interface SnapshotPipelineMetadata {
  readonly normalizedAt: string;
  readonly pipelineVersion: string;
  readonly fxTableVersion?: string;
}

export interface NormalizedConnectorSnapshot {
  connector: ConnectorType;
  dateRange: DateRangeIso;
  records: NormalizedMetricRecord[];
  /** Present when the snapshot passed through {@link runNormalizationPipeline}. */
  metadata?: SnapshotPipelineMetadata;
}

/**
 * Maps vendor payloads into {@link NormalizedConnectorSnapshot}. Implemented per platform adapter.
 */
export interface ConnectorDataNormalizer {
  readonly connector: ConnectorType;
  normalize(raw: unknown, dateRange: DateRangeIso): NormalizedConnectorSnapshot;
}
