import type { ConnectorType } from "@agenticverdict/types";

import type { DateRangeIso } from "../date-range";

export interface AdapterCacheKeyInput {
  readonly tenantId: string;
  readonly connector: ConnectorType;
  readonly dateRange: DateRangeIso;
  readonly segment?: string;
}

export function buildAdapterCacheKey(input: AdapterCacheKeyInput): string {
  const segment = input.segment ?? "metrics";
  const range = `${input.dateRange.startInclusive}:${input.dateRange.endInclusive}`;
  return `av:adapter:${input.tenantId}:${input.connector}:${segment}:${range}`;
}
