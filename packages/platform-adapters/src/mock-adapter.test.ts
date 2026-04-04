import { describe, expect, it } from "vitest";

import { PlatformAuthError, PlatformCircuitOpenError } from "./errors";
import { MockPlatformAdapter } from "./mock-adapter";

describe("MockPlatformAdapter", () => {
  const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-07" };

  it("round-trips metrics through normalizeData", async () => {
    const adapter = new MockPlatformAdapter("meta", {
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
    const adapter = new MockPlatformAdapter("ga4", { authFailureMessage: "bad" });
    await expect(adapter.authenticate({})).rejects.toBeInstanceOf(PlatformAuthError);
  });

  it("maps circuit breaker open state to PlatformCircuitOpenError", async () => {
    class Flaky extends MockPlatformAdapter {
      protected override async fetchRawMetrics() {
        throw new Error("rate limited 429");
      }
    }

    const flaky = new Flaky("gsc", {
      circuitBreakerOptions: { failureThreshold: 1, resetTimeoutMs: 60_000 },
      backoff: { maxAttempts: 1, retryOn: () => false },
    });
    await flaky.authenticate({ token: "x" });
    await expect(flaky.fetchMetrics(range)).rejects.toThrowError(/rate limited/);
    await expect(flaky.fetchMetrics(range)).rejects.toBeInstanceOf(PlatformCircuitOpenError);
  });
});
