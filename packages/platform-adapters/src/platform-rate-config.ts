import type { PlatformType } from "@agenticverdict/types";

import { TokenBucket } from "./token-bucket";

/** Approximate platform limits for in-process token buckets (requests per minute baseline). */
const DEFAULT_REQUESTS_PER_MINUTE: Record<PlatformType, number> = {
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
const DEFAULT_REQUESTS_PER_HOUR: Partial<Record<PlatformType, number>> = {
  meta: 200,
};

export interface PlatformRateLimitProfile {
  readonly requestsPerMinute: number;
  /** When set, {@link createPlatformTokenBucket} uses an hourly refill curve instead of RPM. */
  readonly requestsPerHour?: number;
}

export function defaultPlatformRateProfile(platform: PlatformType): PlatformRateLimitProfile {
  const requestsPerHour = DEFAULT_REQUESTS_PER_HOUR[platform];
  return {
    requestsPerMinute: DEFAULT_REQUESTS_PER_MINUTE[platform],
    ...(requestsPerHour !== undefined ? { requestsPerHour } : {}),
  };
}

/**
 * Creates a token bucket capped for steady-state limits (burst = capacity).
 * Meta uses a 200 calls/hour-shaped bucket; other platforms use RPM.
 */
export function createPlatformTokenBucket(platform: PlatformType): TokenBucket {
  const profile = defaultPlatformRateProfile(platform);
  if (profile.requestsPerHour !== undefined) {
    const rph = profile.requestsPerHour;
    return new TokenBucket(rph, rph / 3600, rph);
  }
  const rpm = profile.requestsPerMinute;
  const perSecond = rpm / 60;
  return new TokenBucket(rpm, perSecond, rpm);
}
