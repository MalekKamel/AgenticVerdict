import { describe, expect, it } from "vitest";

import { PlatformAuthError, PlatformCircuitOpenError } from "./errors";
import { MockPlatformAdapter } from "./mock-adapter";
import { testAdapterTenantId } from "./test-utils";

describe("MockPlatformAdapter", () => {
  const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-07" };

  it("round-trips metrics through normalizeData", async () => {
    const adapter = new MockPlatformAdapter("meta", {
      tenantId: testAdapterTenantId,
      rawResponse: {
        records: [{ metricKey: "clicks", value: 3, capturedAt: "2026-01-02T00:00:00.000Z" }],
      },
    });
    await adapter.authenticate({ token: "x" });
    const raw = await adapter.fetchMetrics(range);
    const norm = adapter.normalizeData(raw, range);
    expect(norm.records).toHaveLength(1);
    expect(norm.records[0]?.metricKey).toBe("clicks");
  });

  it("honors auth failure option", async () => {
    const adapter = new MockPlatformAdapter("ga4", {
      tenantId: testAdapterTenantId,
      authFailureMessage: "bad",
    });
    await expect(adapter.authenticate({})).rejects.toBeInstanceOf(PlatformAuthError);
  });

  it("rejects fetchMetrics before authenticate", async () => {
    const adapter = new MockPlatformAdapter("tiktok", { tenantId: testAdapterTenantId });
    await expect(adapter.fetchMetrics(range)).rejects.toThrow(PlatformAuthError);
  });

  it("uses records override when provided", async () => {
    const adapter = new MockPlatformAdapter("gbp", {
      tenantId: testAdapterTenantId,
      records: [{ metricKey: "x", value: 1, capturedAt: "2026-01-01T00:00:00.000Z" }],
    });
    await adapter.authenticate({});
    const raw = await adapter.fetchMetrics(range);
    const norm = adapter.normalizeData(raw, range);
    expect(norm.records).toHaveLength(1);
    expect(norm.records[0]?.metricKey).toBe("x");
  });

  it("normalizeData defaults to empty records when raw omits records", async () => {
    const adapter = new MockPlatformAdapter("ga4", {
      tenantId: testAdapterTenantId,
      rawResponse: { other: true },
    });
    await adapter.authenticate({});
    const raw = await adapter.fetchMetrics(range);
    expect(adapter.normalizeData(raw, range).records).toEqual([]);
  });

  it("maps circuit breaker open state to PlatformCircuitOpenError", async () => {
    class Flaky extends MockPlatformAdapter {
      protected override async fetchRawMetrics(_dateRange: typeof range) {
        void _dateRange;
        throw new Error("rate limited 429");
      }
    }

    const flaky = new Flaky("gsc", {
      tenantId: testAdapterTenantId,
      circuitBreakerOptions: { failureThreshold: 1, resetTimeoutMs: 60_000 },
      backoff: { maxAttempts: 1, retryOn: () => false },
    });
    await flaky.authenticate({ token: "x" });
    await expect(flaky.fetchMetrics(range)).rejects.toThrowError(/rate limited/);
    await expect(flaky.fetchMetrics(range)).rejects.toBeInstanceOf(PlatformCircuitOpenError);
  });
});
