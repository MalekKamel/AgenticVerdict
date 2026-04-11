import type { Redis } from "@upstash/redis";
import type { ConnectorType } from "@agenticverdict/types";

import { AdapterMethodMetrics, healthScoreFromMetrics } from "./adapter-metrics";
import type { DeadLetterQueue } from "./dead-letter-queue";
import type { PlatformCache } from "./cache/types";

export interface InfrastructureHealthOptions {
  readonly cache: PlatformCache | null;
  readonly redis: Redis | null;
  readonly metrics: AdapterMethodMetrics;
  readonly deadLetterQueue?: DeadLetterQueue | null;
}

export interface ComponentHealth {
  readonly status: "ok" | "degraded" | "down";
  readonly detail?: string;
}

export interface ConnectorHealthReport {
  readonly connector: ConnectorType;
  readonly healthScore: number;
  readonly adapter: ConnectorAdapterMetricSnapshotJson;
  readonly status: "ok" | "degraded" | "unknown";
}

interface ConnectorAdapterMetricSnapshotJson {
  successCount: number;
  failureCount: number;
  cacheHits: number;
  cacheMisses: number;
  latencyMsP50: number | null;
  latencyMsP95: number | null;
  latencyMsP99: number | null;
}

async function probeRedis(redis: Redis | null): Promise<ComponentHealth> {
  if (!redis) {
    return { status: "ok", detail: "Redis not configured (L1 memory cache only)" };
  }
  try {
    const t0 = performance.now();
    await redis.ping();
    const ms = performance.now() - t0;
    if (ms > 50) {
      return { status: "degraded", detail: `Ping slow (${Math.round(ms)}ms)` };
    }
    return { status: "ok", detail: `Ping ${Math.round(ms)}ms` };
  } catch {
    return { status: "down", detail: "Redis ping failed" };
  }
}

function cacheComponentHealth(cache: PlatformCache | null): ComponentHealth {
  if (!cache) {
    return { status: "degraded", detail: "No cache instance wired" };
  }
  const m = cache.getMetrics();
  if (m.errors > 0 && cache.isDistributed()) {
    return { status: "degraded", detail: `${m.errors} cache errors` };
  }
  if (!cache.isDistributed()) {
    return { status: "ok", detail: "In-memory L1 cache operational" };
  }
  return { status: "ok", detail: "Distributed cache operational" };
}

/**
 * Aggregated health for monitoring endpoints (Task 1.6 / AC-1.7.1, AC-1.7.8).
 */
export async function collectInfrastructureHealth(options: InfrastructureHealthOptions): Promise<{
  status: "ok" | "degraded";
  components: {
    cache: ComponentHealth & { metrics: ReturnType<PlatformCache["getMetrics"]> | null };
    redis: ComponentHealth;
    deadLetter: { status: "ok" | "degraded"; backlog: number };
    circuitBreaker: { status: "ok"; note: string };
    retryPolicy: { status: "ok"; note: string };
  };
  connectors: ConnectorHealthReport[];
}> {
  const redisHealth = await probeRedis(options.redis);
  const cache = options.cache;
  const cacheHealth = cacheComponentHealth(cache);
  const cacheMetrics = cache?.getMetrics() ?? null;

  const dlq = options.deadLetterQueue;
  const backlog = dlq?.size() ?? 0;
  const deadLetterHealth =
    backlog > 100 ? { status: "degraded" as const, backlog } : { status: "ok" as const, backlog };

  const connectorIds: ConnectorType[] = ["meta", "ga4", "gsc", "gbp", "tiktok"];
  const connectorReports: ConnectorHealthReport[] = connectorIds.map((connector) => {
    const snap = options.metrics.snapshotForConnector(connector);
    const score = healthScoreFromMetrics(snap);
    const adapterJson: ConnectorAdapterMetricSnapshotJson = {
      successCount: snap.successCount,
      failureCount: snap.failureCount,
      cacheHits: snap.cacheHits,
      cacheMisses: snap.cacheMisses,
      latencyMsP50: snap.latencyMsP50,
      latencyMsP95: snap.latencyMsP95,
      latencyMsP99: snap.latencyMsP99,
    };
    const status =
      snap.successCount + snap.failureCount === 0
        ? ("unknown" as const)
        : score >= 80
          ? ("ok" as const)
          : ("degraded" as const);
    return { connector, healthScore: score, adapter: adapterJson, status };
  });

  const overallDegraded =
    cacheHealth.status !== "ok" ||
    redisHealth.status === "down" ||
    deadLetterHealth.status !== "ok" ||
    connectorReports.some((p) => p.status === "degraded");

  return {
    status: overallDegraded ? "degraded" : "ok",
    components: {
      cache: { ...cacheHealth, metrics: cacheMetrics },
      redis: redisHealth,
      deadLetter: deadLetterHealth,
      circuitBreaker: {
        status: "ok",
        note: "Per-adapter CircuitBreaker instances (see connector adapter options)",
      },
      retryPolicy: {
        status: "ok",
        note: "Exponential backoff with jitter (1s–16s), up to 6 attempts",
      },
    },
    connectors: connectorReports,
  };
}
