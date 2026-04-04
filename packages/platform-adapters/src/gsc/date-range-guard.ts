import type { DateRangeIso } from "../date-range";
import { PlatformError } from "../errors";
import { countInclusiveUtcDays } from "../ga4/date-range-split";

/** Search Console Search Analytics data is limited to ~16 months (execution plan / tasks.md 2.3). */
export const GSC_MAX_INCLUSIVE_HISTORY_DAYS = 486;

export function assertGscSearchAnalyticsDateRange(range: DateRangeIso): void {
  const days = countInclusiveUtcDays(range.startInclusive, range.endInclusive);
  if (days > GSC_MAX_INCLUSIVE_HISTORY_DAYS) {
    throw new PlatformError(
      "gsc",
      "invalid_request",
      `GSC search analytics date range spans ${days} days; maximum allowed is ${GSC_MAX_INCLUSIVE_HISTORY_DAYS} days (~16 months)`,
    );
  }
}
