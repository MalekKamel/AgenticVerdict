import { describe, expect, it } from "vitest";

import type { Ga4RawMetricsPayload } from "./models";
import { normalizeGa4RawMetrics } from "./transformers";

const dateRange = { startInclusive: "2024-01-01", endInclusive: "2024-01-07" };

describe("normalizeGa4RawMetrics", () => {
  it("returns empty records for invalid raw", () => {
    const snap = normalizeGa4RawMetrics({}, dateRange);
    expect(snap.platform).toBe("ga4");
    expect(snap.records).toHaveLength(0);
  });

  it("emits event and traffic metrics", () => {
    const raw: Ga4RawMetricsPayload = {
      propertyId: "123",
      fetchedAt: "2026-04-04T00:00:00.000Z",
      requestedRange: dateRange,
      eventReport: {
        dimensionHeaders: [{ name: "date" }, { name: "eventName" }],
        metricHeaders: [{ name: "eventCount" }],
        rows: [
          {
            dimensionValues: [{ value: "20240101" }, { value: "page_view" }],
            metricValues: [{ value: "10" }],
          },
        ],
      },
      trafficReport: {
        dimensionHeaders: [{ name: "date" }],
        metricHeaders: [{ name: "sessions" }, { name: "totalUsers" }],
        rows: [
          {
            dimensionValues: [{ value: "20240101" }],
            metricValues: [{ value: "5" }, { value: "3" }],
          },
        ],
      },
      realtimeReport: null,
      funnelReport: null,
      sampling: { sampled: false, sources: [] },
      dataApiCalls: 4,
    };
    const snap = normalizeGa4RawMetrics(raw, dateRange);
    const keys = snap.records.map((r) => r.metricKey);
    expect(keys).toContain("ga4.event.eventCount");
    expect(keys).toContain("ga4.traffic.sessions");
    expect(keys).toContain("ga4.meta.sampled");
    expect(keys).toContain("ga4.meta.dataApiCalls");
  });

  it("records funnel error and realtime rows when present", () => {
    const raw: Ga4RawMetricsPayload = {
      propertyId: "123",
      fetchedAt: "2026-04-04T00:00:00.000Z",
      requestedRange: dateRange,
      eventReport: { rows: [] },
      trafficReport: { rows: [] },
      realtimeReport: {
        dimensionHeaders: [{ name: "unifiedScreenName" }],
        metricHeaders: [{ name: "activeUsers" }],
        rows: [
          {
            dimensionValues: [{ value: "/home" }],
            metricValues: [{ value: "7" }],
          },
        ],
      },
      funnelReport: null,
      funnelError: "funnel API unavailable",
      sampling: { sampled: true, sources: ["eventReport"] },
      dataApiCalls: 5,
    };
    const snap = normalizeGa4RawMetrics(raw, dateRange);
    expect(snap.records.some((r) => r.metricKey === "ga4.funnel.error")).toBe(true);
    expect(snap.records.some((r) => r.metricKey === "ga4.realtime.activeUsers")).toBe(true);
  });

  it("records funnel.present when a funnel payload exists", () => {
    const raw: Ga4RawMetricsPayload = {
      propertyId: "123",
      fetchedAt: "2026-04-04T00:00:00.000Z",
      requestedRange: dateRange,
      eventReport: { rows: [] },
      trafficReport: { rows: [] },
      realtimeReport: null,
      funnelReport: { steps: [] },
      sampling: { sampled: false, sources: [] },
      dataApiCalls: 3,
    };
    const snap = normalizeGa4RawMetrics(raw, dateRange);
    expect(snap.records.some((r) => r.metricKey === "ga4.funnel.present")).toBe(true);
  });
});
