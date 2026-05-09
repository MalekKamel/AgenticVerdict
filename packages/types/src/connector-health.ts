import type { ConnectorType } from "./connector-types";

export interface InfrastructureHealthOptions {
  readonly cache: object | null;
  readonly redis: object | null;
  readonly metrics: object;
  readonly deadLetterQueue?: object | null;
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

export interface AggregatedInfrastructureHealth {
  status: "ok" | "degraded";
  components: {
    cache: ComponentHealth & { metrics: object | null };
    redis: ComponentHealth;
    deadLetter: { status: "ok" | "degraded"; backlog: number };
    circuitBreaker: { status: "ok"; note: string };
    retryPolicy: { status: "ok"; note: string };
  };
  connectors: ConnectorHealthReport[];
}
