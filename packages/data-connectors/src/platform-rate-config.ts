import type { ConnectorType } from "@agenticverdict/types";

import { TokenBucket } from "./token-bucket";

/** Approximate platform limits for in-process token buckets (requests per minute baseline). */
const DEFAULT_REQUESTS_PER_MINUTE: Record<ConnectorType, number> = {
  /** Marketing API ad-account cap is ~200 calls/hour; hourly bucket supersedes RPM for Meta. */
  meta: 4,
  ga4: 120,
  /** ~5 QPS steady-state cap (tasks.md 2.3 / AC-1.3.x). */
  gsc: 300,
  gbp: 120,
  /** Conservative steady-state cap; TikTok enforces per-app QPS limits on the Marketing API. */
  tiktok: 60,
};

/** Per-ad-account hourly caps (Task 2.1 / AC-1.1.5). */
const DEFAULT_REQUESTS_PER_HOUR: Partial<Record<ConnectorType, number>> = {
  meta: 200,
};

export interface PlatformRateLimitProfile {
  readonly requestsPerMinute: number;
  /** When set, {@link createConnectorTokenBucket} uses an hourly refill curve instead of RPM. */
  readonly requestsPerHour?: number;
}

export function defaultConnectorRateProfile(connector: ConnectorType): PlatformRateLimitProfile {
  const requestsPerHour = DEFAULT_REQUESTS_PER_HOUR[connector];
  return {
    requestsPerMinute: DEFAULT_REQUESTS_PER_MINUTE[connector],
    ...(requestsPerHour !== undefined ? { requestsPerHour } : {}),
  };
}

/**
 * Creates a token bucket capped for steady-state limits (burst = capacity).
 * Meta uses a 200 calls/hour-shaped bucket; other connectors use RPM.
 */
export function createConnectorTokenBucket(connector: ConnectorType): TokenBucket {
  const profile = defaultConnectorRateProfile(connector);
  if (profile.requestsPerHour !== undefined) {
    const rph = profile.requestsPerHour;
    return new TokenBucket(rph, rph / 3600, rph);
  }
  const rpm = profile.requestsPerMinute;
  const perSecond = rpm / 60;
  return new TokenBucket(rpm, perSecond, rpm);
}
