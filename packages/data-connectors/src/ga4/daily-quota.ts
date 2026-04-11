import { PlatformError } from "../errors";

export interface Ga4DailyQuotaTrackerOptions {
  readonly maxRequestsPerUtcDay?: number;
  /** Override for tests (defaults to system UTC calendar day). */
  readonly currentUtcDay?: () => string;
}

/**
 * Hard cap on GA4 Data API calls per UTC calendar day (Task 2.2: ~50k requests/day per project).
 * In-process only; multi-instance deployments should back this with shared storage.
 */
export class Ga4DailyQuotaTracker {
  private readonly max: number;
  private readonly currentUtcDay: () => string;
  private utcDay = "";
  private count = 0;

  constructor(options: Ga4DailyQuotaTrackerOptions = {}) {
    this.max = options.maxRequestsPerUtcDay ?? 50_000;
    this.currentUtcDay = options.currentUtcDay ?? (() => new Date().toISOString().slice(0, 10));
  }

  consumeOrThrow(platform: "ga4" = "ga4"): void {
    const day = this.currentUtcDay();
    if (day !== this.utcDay) {
      this.utcDay = day;
      this.count = 0;
    }
    if (this.count >= this.max) {
      throw new PlatformError(
        platform,
        "invalid_request",
        `GA4 Data API daily request budget (${this.max}) exhausted for UTC date ${day}`,
      );
    }
    this.count += 1;
  }
}
