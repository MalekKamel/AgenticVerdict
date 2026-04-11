import { describe, expect, it, vi } from "vitest";

import { AdapterMethodMetrics } from "./adapter-metrics";
import type { PlatformCache } from "./cache/types";
import { MemoryPlatformCache } from "./cache/memory-cache";
import { InMemoryDeadLetterQueue } from "./dead-letter-queue";
import { collectInfrastructureHealth } from "./infrastructure-health";

describe("collectInfrastructureHealth", () => {
  it("returns 200-shaped payload with platform rows (AC-1.7.8)", async () => {
    const metrics = new AdapterMethodMetrics();
    metrics.record({
      connector: "meta",
      operation: "fetchMetrics",
      outcome: "success",
      durationMs: 12,
    });

    const report = await collectInfrastructureHealth({
      cache: new MemoryPlatformCache(),
      redis: null,
      metrics,
      deadLetterQueue: new InMemoryDeadLetterQueue(),
    });

    expect(report.status).toBe("ok");
    expect(report.components.retryPolicy.status).toBe("ok");
    expect(report.connectors).toHaveLength(5);
    const meta = report.connectors.find((p) => p.connector === "meta");
    expect(meta?.healthScore).toBe(100);
  });

  it("marks degraded when Redis ping fails", async () => {
    const redis = {
      ping: vi.fn().mockRejectedValue(new Error("network")),
    };

    const report = await collectInfrastructureHealth({
      cache: new MemoryPlatformCache(),
      redis: redis as unknown as import("@upstash/redis").Redis,
      metrics: new AdapterMethodMetrics(),
    });

    expect(report.components.redis.status).toBe("down");
    expect(report.status).toBe("degraded");
  });

  it("marks Redis degraded when ping latency is high", async () => {
    let tick = 0;
    const perfSpy = vi.spyOn(performance, "now").mockImplementation(() => {
      tick += 1;
      return tick === 1 ? 0 : 60;
    });
    const redis = { ping: vi.fn().mockResolvedValue("PONG") };

    const report = await collectInfrastructureHealth({
      cache: new MemoryPlatformCache(),
      redis: redis as unknown as import("@upstash/redis").Redis,
      metrics: new AdapterMethodMetrics(),
    });

    expect(report.components.redis.status).toBe("degraded");
    perfSpy.mockRestore();
  });

  it("marks degraded when dead-letter backlog exceeds the warning threshold", async () => {
    const dlq = new InMemoryDeadLetterQueue();
    for (let i = 0; i < 101; i += 1) {
      dlq.enqueue({ connector: "gsc", operation: "fetchMetrics", errorMessage: "fail" });
    }
    const report = await collectInfrastructureHealth({
      cache: new MemoryPlatformCache(),
      redis: null,
      metrics: new AdapterMethodMetrics(),
      deadLetterQueue: dlq,
    });
    expect(report.components.deadLetter.status).toBe("degraded");
    expect(report.status).toBe("degraded");
  });

  it("marks degraded when cache is not wired", async () => {
    const report = await collectInfrastructureHealth({
      cache: null,
      redis: null,
      metrics: new AdapterMethodMetrics(),
    });
    expect(report.components.cache.status).toBe("degraded");
    expect(report.status).toBe("degraded");
  });

  it("marks distributed cache degraded when errors are reported", async () => {
    const cache: PlatformCache = {
      async get() {
        return null;
      },
      async set() {},
      async delete() {},
      getMetrics() {
        return { hits: 0, misses: 0, sets: 0, errors: 2, totalLatencyMs: 0, operations: 0 };
      },
      isDistributed() {
        return true;
      },
    };

    const report = await collectInfrastructureHealth({
      cache,
      redis: null,
      metrics: new AdapterMethodMetrics(),
    });

    expect(report.components.cache.status).toBe("degraded");
    expect(report.status).toBe("degraded");
  });

  it("reports ok when distributed cache has no errors", async () => {
    const cache: PlatformCache = {
      async get() {
        return null;
      },
      async set() {},
      async delete() {},
      getMetrics() {
        return { hits: 1, misses: 0, sets: 0, errors: 0, totalLatencyMs: 1, operations: 1 };
      },
      isDistributed() {
        return true;
      },
    };

    const report = await collectInfrastructureHealth({
      cache,
      redis: null,
      metrics: new AdapterMethodMetrics(),
    });

    expect(report.components.cache.status).toBe("ok");
    expect(report.components.cache.detail).toContain("Distributed");
  });

  it("marks overall degraded when a platform adapter health score is low", async () => {
    const metrics = new AdapterMethodMetrics();
    for (let i = 0; i < 20; i += 1) {
      metrics.record({
        connector: "tiktok",
        operation: "fetchMetrics",
        outcome: "failure",
        durationMs: 100,
      });
    }
    metrics.record({
      connector: "tiktok",
      operation: "fetchMetrics",
      outcome: "success",
      durationMs: 10,
    });

    const report = await collectInfrastructureHealth({
      cache: new MemoryPlatformCache(),
      redis: null,
      metrics,
    });

    const tiktokRow = report.connectors.find((p) => p.connector === "tiktok");
    expect(tiktokRow?.status).toBe("degraded");
    expect(report.status).toBe("degraded");
  });
});
