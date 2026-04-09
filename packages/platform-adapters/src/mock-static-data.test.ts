import { describe, expect, it } from "vitest";

import { buildScenarioRecords, mulberry32, type MockAdapterScenario } from "./mock-static-data";

describe("mulberry32", () => {
  it("is deterministic for the same seed", () => {
    const a = mulberry32(99);
    const b = mulberry32(99);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("buildScenarioRecords", () => {
  const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-07" };

  it.each<[MockAdapterScenario, number]>([
    ["normal", 8 * 9],
    ["realistic", 14 * 7],
    ["high-volume", 36 * 9],
  ])("produces scaled row counts for %s", (scenario, expectedLen) => {
    const records = buildScenarioRecords({
      platform: "meta",
      scenario,
      seed: 1,
      dateRange: range,
    });
    expect(records).toHaveLength(expectedLen);
  });

  it("realistic scenario emits platform-native metric keys", () => {
    const records = buildScenarioRecords({
      platform: "meta",
      scenario: "realistic",
      seed: 9,
      dateRange: range,
    });
    expect(records.some((r) => r.metricKey === "meta.impressions")).toBe(true);
    expect(records.some((r) => r.metricKey === "meta.spend")).toBe(true);
    expect(records.every((r) => !r.metricKey.includes(".mock."))).toBe(true);
  });

  it("zero-conversions forces conversion metrics to 0", () => {
    const records = buildScenarioRecords({
      platform: "ga4",
      scenario: "zero-conversions",
      seed: 2,
      dateRange: range,
    });
    const conversions = records.filter((r) => r.metricKey.endsWith(".conversions"));
    expect(conversions.length).toBeGreaterThan(0);
    expect(conversions.every((r) => r.value === 0)).toBe(true);
  });

  it("returns no rows for error scenario", () => {
    expect(
      buildScenarioRecords({
        platform: "gsc",
        scenario: "error",
        seed: 3,
      }),
    ).toEqual([]);
  });
});
