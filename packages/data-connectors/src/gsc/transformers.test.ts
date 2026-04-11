import { describe, expect, it } from "vitest";

import type { GscRawMetricsPayload } from "./models";
import { normalizeGscRawMetrics } from "./transformers";

describe("normalizeGscRawMetrics", () => {
  it("returns empty snapshot for invalid raw", () => {
    const r = normalizeGscRawMetrics(null, {
      startInclusive: "2025-01-01",
      endInclusive: "2025-01-02",
    });
    expect(r.records).toHaveLength(0);
    expect(r.connector).toBe("gsc");
  });

  it("normalizes analytics, sitemaps, and inspection payloads", () => {
    const raw: GscRawMetricsPayload = {
      siteUrl: "https://example.com/",
      fetchedAt: "2025-01-01T00:00:00.000Z",
      requestedRange: { startInclusive: "2025-01-01", endInclusive: "2025-01-07" },
      searchAnalytics: [
        {
          rows: [
            {
              keys: ["q", "/x", "DESKTOP", "fr"],
              clicks: 0,
              impressions: 0,
              ctr: 0,
              position: 0,
            },
          ],
        },
      ],
      sitemaps: { sitemap: [{ path: "https://example.com/a.xml", isPending: false }] },
      urlInspection: {
        inspectionResult: {
          indexStatusResult: { verdict: "NEUTRAL", coverageState: "Excluded" },
          mobileUsabilityResult: {
            verdict: "FAILED",
            issues: [{ issueType: "TAP_TARGET", severity: "ERROR" }],
          },
          richResultsResult: { verdict: "PASS" },
        },
      },
    };
    const range = raw.requestedRange;
    const r = normalizeGscRawMetrics(raw, range);
    expect(r.records.some((x) => x.metricKey === "gsc.mobile_usability.issue_count")).toBe(true);
    expect(r.records.some((x) => x.metricKey === "gsc.rich_results.verdict")).toBe(true);
  });
});
