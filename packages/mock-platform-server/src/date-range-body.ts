import type { DateRangeIso } from "@agenticverdict/data-connectors";

const DEFAULT_RANGE: DateRangeIso = {
  startInclusive: "2026-01-01",
  endInclusive: "2026-01-31",
};

/** Accepts inclusive ISO dates or datetime strings; mirrors vendor-style `start` / `end` fields. */
export function coerceDateRangeFromBody(body: unknown): DateRangeIso {
  if (body === null || typeof body !== "object") {
    return DEFAULT_RANGE;
  }
  const o = body as Record<string, unknown>;
  const startRaw =
    typeof o.startInclusive === "string"
      ? o.startInclusive
      : typeof o.start === "string"
        ? o.start
        : typeof o.dateRange === "object" && o.dateRange !== null
          ? typeof (o.dateRange as Record<string, unknown>).start === "string"
            ? ((o.dateRange as Record<string, unknown>).start as string)
            : undefined
          : undefined;
  const endRaw =
    typeof o.endInclusive === "string"
      ? o.endInclusive
      : typeof o.end === "string"
        ? o.end
        : typeof o.dateRange === "object" && o.dateRange !== null
          ? typeof (o.dateRange as Record<string, unknown>).end === "string"
            ? ((o.dateRange as Record<string, unknown>).end as string)
            : undefined
          : undefined;
  if (typeof startRaw === "string" && typeof endRaw === "string") {
    return {
      startInclusive: startRaw.slice(0, 10),
      endInclusive: endRaw.slice(0, 10),
    };
  }
  return DEFAULT_RANGE;
}
