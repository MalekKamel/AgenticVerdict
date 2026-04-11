import type { ConnectorType } from "@agenticverdict/types";

export interface AdapterOperationEvent {
  readonly connector: ConnectorType;
  readonly operation: "fetchMetrics" | "authenticate";
  readonly outcome: "success" | "failure";
  readonly durationMs: number;
  readonly cacheHit?: boolean;
}

export interface ConnectorAdapterMetricSnapshot {
  readonly successCount: number;
  readonly failureCount: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly latencyMsP50: number | null;
  readonly latencyMsP95: number | null;
  readonly latencyMsP99: number | null;
}

function percentile(sorted: readonly number[], p: number): number | null {
  if (sorted.length === 0) {
    return null;
  }
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? null;
}

function computePercentiles(samples: readonly number[]): {
  p50: number | null;
  p95: number | null;
  p99: number | null;
} {
  if (samples.length === 0) {
    return { p50: null, p95: null, p99: null };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

/**
 * Process-local metrics for adapter calls (Task 1.1 / Task 1.6).
 */
export class AdapterMethodMetrics {
  private readonly maxSamples = 256;
  private readonly byConnector = new Map<
    ConnectorType,
    {
      successCount: number;
      failureCount: number;
      cacheHits: number;
      cacheMisses: number;
      latencySamples: number[];
    }
  >();

  private bucket(connector: ConnectorType) {
    let b = this.byConnector.get(connector);
    if (!b) {
      b = {
        successCount: 0,
        failureCount: 0,
        cacheHits: 0,
        cacheMisses: 0,
        latencySamples: [],
      };
      this.byConnector.set(connector, b);
    }
    return b;
  }

  record(event: AdapterOperationEvent): void {
    const b = this.bucket(event.connector);
    if (event.outcome === "success") {
      b.successCount += 1;
      b.latencySamples.push(event.durationMs);
      while (b.latencySamples.length > this.maxSamples) {
        b.latencySamples.shift();
      }
      if (event.operation === "fetchMetrics") {
        if (event.cacheHit) {
          b.cacheHits += 1;
        } else if (event.cacheHit === false) {
          b.cacheMisses += 1;
        }
      }
    } else {
      b.failureCount += 1;
    }
  }

  snapshotForConnector(connector: ConnectorType): ConnectorAdapterMetricSnapshot {
    const b = this.byConnector.get(connector);
    if (!b) {
      return {
        successCount: 0,
        failureCount: 0,
        cacheHits: 0,
        cacheMisses: 0,
        latencyMsP50: null,
        latencyMsP95: null,
        latencyMsP99: null,
      };
    }
    const { p50, p95, p99 } = computePercentiles(b.latencySamples);
    return {
      successCount: b.successCount,
      failureCount: b.failureCount,
      cacheHits: b.cacheHits,
      cacheMisses: b.cacheMisses,
      latencyMsP50: p50,
      latencyMsP95: p95,
      latencyMsP99: p99,
    };
  }

  snapshotAll(): Record<ConnectorType, ConnectorAdapterMetricSnapshot> {
    const platforms: ConnectorType[] = ["meta", "ga4", "gsc", "gbp", "tiktok"];
    return Object.fromEntries(platforms.map((p) => [p, this.snapshotForConnector(p)])) as Record<
      ConnectorType,
      ConnectorAdapterMetricSnapshot
    >;
  }
}

export function healthScoreFromMetrics(m: ConnectorAdapterMetricSnapshot): number {
  const total = m.successCount + m.failureCount;
  if (total === 0) {
    return 100;
  }
  const successRate = m.successCount / total;
  return Math.max(0, Math.min(100, Math.round(successRate * 100)));
}
