import { describe, expect, it } from "vitest";

import { PlatformError } from "./errors";
import { MockAdapterFactory } from "./mock-adapter-factory";
import { testAdapterTenantId } from "./test-utils";

describe("MockAdapterFactory", () => {
  const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-07" };

  it("creates deterministic adapters for the same seed", async () => {
    const a = MockAdapterFactory.create({
      connector: "meta",
      tenantId: testAdapterTenantId,
      seed: 77,
      scenario: "normal",
      dateRange: range,
    });
    const b = MockAdapterFactory.create({
      connector: "meta",
      tenantId: testAdapterTenantId,
      seed: 77,
      scenario: "normal",
      dateRange: range,
    });
    await a.authenticate({ token: "t" });
    await b.authenticate({ token: "t" });
    const na = a.normalizeData(await a.fetchMetrics(range), range);
    const nb = b.normalizeData(await b.fetchMetrics(range), range);
    expect(na.records.map((r) => r.value)).toEqual(nb.records.map((r) => r.value));
  });

  it("error scenario fails fetchMetrics with PlatformError", async () => {
    const adapter = MockAdapterFactory.create({
      connector: "ga4",
      tenantId: testAdapterTenantId,
      scenario: "error",
    });
    await adapter.authenticate({ token: "t" });
    await expect(adapter.fetchMetrics(range)).rejects.toBeInstanceOf(PlatformError);
  });

  it("realistic scenario provides platform-native records", async () => {
    const adapter = MockAdapterFactory.create({
      connector: "ga4",
      tenantId: testAdapterTenantId,
      scenario: "realistic",
      seed: 11,
      dateRange: range,
    });
    await adapter.authenticate({ token: "t" });
    const normalized = adapter.normalizeData(await adapter.fetchMetrics(range), range);
    expect(normalized.records.some((r) => r.metricKey === "ga4.event.sessions")).toBe(true);
    expect(normalized.records.some((r) => r.metricKey.includes(".mock."))).toBe(false);
  });
});
