import type { PlatformType } from "@agenticverdict/types";

import type { DateRangeIso } from "./date-range";

export interface NormalizedMetricRecord {
  metricKey: string;
  value: number;
  dimensions?: Readonly<Record<string, string>>;
  capturedAt: string;
}

export interface NormalizedPlatformSnapshot {
  platform: PlatformType;
  dateRange: DateRangeIso;
  records: NormalizedMetricRecord[];
}

/**
 * Maps vendor payloads into {@link NormalizedPlatformSnapshot}. Implemented per platform in Phase 1.
 */
export interface PlatformDataNormalizer {
  readonly platform: PlatformType;
  normalize(raw: unknown, dateRange: DateRangeIso): NormalizedPlatformSnapshot;
}
