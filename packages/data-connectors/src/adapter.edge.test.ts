import { describe, expect, it } from "vitest";

import { BaseConnectorAdapter, type BaseConnectorAdapterOptions } from "./adapter";
import { buildAdapterCacheKey } from "./cache/cache-keys";
import { MemoryPlatformCache } from "./cache/memory-cache";
import { InMemoryDeadLetterQueue } from "./dead-letter-queue";
import type { ConnectorCredentials } from "./credentials";
import type { DateRangeIso } from "./date-range";
import { PlatformCircuitOpenError, PlatformError } from "./errors";
import type { NormalizedConnectorSnapshot } from "./normalization";

describe("BaseConnectorAdapter edge cases", () => {
  const range: DateRangeIso = { startInclusive: "2026-01-01", endInclusive: "2026-01-07" };

  it("rejects empty tenantId", () => {
    class A extends BaseConnectorAdapter {
      readonly connector = "meta" as const;
      constructor(options: BaseConnectorAdapterOptions) {
        super("meta", options);
      }
      protected async doAuthenticate(_c: ConnectorCredentials) {
        void _c;
      }
      protected async fetchRawMetrics() {
        return {};
      }
      normalizeData(): NormalizedConnectorSnapshot {
        return { connector: "meta", dateRange: range, records: [] };
      }
    }
    expect(() => new A({ tenantId: "   " })).toThrow(PlatformError);
    try {
      new A({ tenantId: "   " });
    } catch (e) {
      expect(e).toBeInstanceOf(PlatformError);
      expect((e as PlatformError).code).toBe("missing_tenant_id");
    }
  });

  it("drops corrupt cache entries and refetches", async () => {
    const cache = new MemoryPlatformCache();
    const key = buildAdapterCacheKey({
      tenantId: "t1",
      connector: "meta",
      dateRange: range,
    });
    await cache.set(key, "not-json", 120);

    class A extends BaseConnectorAdapter {
      readonly connector = "meta" as const;
      constructor(options: BaseConnectorAdapterOptions) {
        super("meta", options);
      }
      protected async doAuthenticate(_c: ConnectorCredentials) {
        void _c;
      }
      protected async fetchRawMetrics() {
        return { ok: true };
      }
      normalizeData(): NormalizedConnectorSnapshot {
        return { connector: "meta", dateRange: range, records: [] };
      }
    }

    const adapter = new A({
      tenantId: "t1",
      cache,
      backoff: { maxAttempts: 1, retryOn: () => false },
    });
    await adapter.authenticate({});
    const raw = await adapter.fetchMetrics(range);
    expect(raw).toEqual({ ok: true });
  });

  it("enqueues dead letter on fetch failure but not on circuit open", async () => {
    const dlq = new InMemoryDeadLetterQueue();
    class Fails extends BaseConnectorAdapter {
      readonly connector = "ga4" as const;
      constructor(options: BaseConnectorAdapterOptions) {
        super("ga4", options);
      }
      protected async doAuthenticate(_c: ConnectorCredentials) {
        void _c;
      }
      protected async fetchRawMetrics() {
        throw new Error("400 bad request");
      }
      normalizeData(): NormalizedConnectorSnapshot {
        return { connector: "ga4", dateRange: range, records: [] };
      }
    }

    const adapter = new Fails({
      tenantId: "t-dlq",
      deadLetterQueue: dlq,
      backoff: { maxAttempts: 1, retryOn: () => false },
    });
    await adapter.authenticate({});
    await expect(adapter.fetchMetrics(range)).rejects.toThrow("400 bad request");
    expect(dlq.size()).toBe(1);

    class Opens extends BaseConnectorAdapter {
      readonly connector = "ga4" as const;
      constructor(options: BaseConnectorAdapterOptions) {
        super("ga4", options);
      }
      protected async doAuthenticate(_c: ConnectorCredentials) {
        void _c;
      }
      protected async fetchRawMetrics() {
        throw new Error("503");
      }
      normalizeData(): NormalizedConnectorSnapshot {
        return { connector: "ga4", dateRange: range, records: [] };
      }
    }

    const dlq2 = new InMemoryDeadLetterQueue();
    const flaky = new Opens({
      tenantId: "t-circuit",
      deadLetterQueue: dlq2,
      circuitBreakerOptions: { failureThreshold: 1, resetTimeoutMs: 60_000 },
      backoff: { maxAttempts: 1, retryOn: () => false },
    });
    await flaky.authenticate({});
    await expect(flaky.fetchMetrics(range)).rejects.toThrow("503");
    await expect(flaky.fetchMetrics(range)).rejects.toBeInstanceOf(PlatformCircuitOpenError);
    expect(dlq2.size()).toBe(1);
  });
});
