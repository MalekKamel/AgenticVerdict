import type { ConnectorType } from "@agenticverdict/types";

/** Default TTLs (seconds) by platform for raw fetch payloads (Task 1.2). */
const DEFAULT_TTL_SECONDS: Record<ConnectorType, number> = {
  meta: 120,
  ga4: 300,
  gsc: 600,
  gbp: 600,
  tiktok: 120,
};

export function defaultAdapterCacheTtlSeconds(connector: ConnectorType): number {
  return DEFAULT_TTL_SECONDS[connector];
}
