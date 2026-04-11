import type { DateRangeIso } from "../date-range";

function parseUtcDayStartMs(isoDate: string): number {
  const t = Date.parse(`${isoDate}T00:00:00.000Z`);
  if (!Number.isFinite(t)) {
    throw new Error(`Invalid date (expected YYYY-MM-DD): ${isoDate}`);
  }
  return t;
}

function formatUtcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Inclusive calendar-day span between two `YYYY-MM-DD` bounds (UTC). */
export function countInclusiveUtcDays(startInclusive: string, endInclusive: string): number {
  const s = parseUtcDayStartMs(startInclusive);
  const e = parseUtcDayStartMs(endInclusive);
  if (e < s) {
    return 0;
  }
  return Math.floor((e - s) / 86_400_000) + 1;
}

/**
 * Splits an inclusive range into chunks of at most `maxInclusiveDays` days (GA4 Data API limit).
 * AC-1.2.5: ranges longer than 365 days are split and reassembled by the caller.
 */
export function splitInclusiveDateRange(
  range: DateRangeIso,
  maxInclusiveDays: number,
): DateRangeIso[] {
  if (maxInclusiveDays < 1) {
    throw new Error("maxInclusiveDays must be at least 1");
  }
  const total = countInclusiveUtcDays(range.startInclusive, range.endInclusive);
  if (total === 0) {
    return [{ startInclusive: range.startInclusive, endInclusive: range.endInclusive }];
  }
  if (total <= maxInclusiveDays) {
    return [range];
  }

  const endMs = parseUtcDayStartMs(range.endInclusive);
  const chunks: DateRangeIso[] = [];
  let cursorStart = range.startInclusive;

  while (true) {
    const startMs = parseUtcDayStartMs(cursorStart);
    const chunkEndMs = Math.min(startMs + (maxInclusiveDays - 1) * 86_400_000, endMs);
    const endStr = formatUtcDay(chunkEndMs);
    chunks.push({ startInclusive: cursorStart, endInclusive: endStr });
    if (chunkEndMs >= endMs) {
      break;
    }
    cursorStart = formatUtcDay(chunkEndMs + 86_400_000);
  }

  return chunks;
}

/**
 * When the requested range exceeds `maxInclusiveDays`, GA4 funnel/realtime-style calls
 * use the trailing window so a single request stays within platform limits.
 */
export function trailingInclusiveWindow(
  range: DateRangeIso,
  maxInclusiveDays: number,
): DateRangeIso {
  const total = countInclusiveUtcDays(range.startInclusive, range.endInclusive);
  if (total <= maxInclusiveDays) {
    return range;
  }
  const endMs = parseUtcDayStartMs(range.endInclusive);
  const startMs = endMs - (maxInclusiveDays - 1) * 86_400_000;
  return { startInclusive: formatUtcDay(startMs), endInclusive: range.endInclusive };
}
