import { Counter, Histogram, Gauge } from "prom-client";
import { productionFlowTestRegistry } from "@agenticverdict/observability";

export type ProviderMetricLabels = {
  providerId: string;
  tenantId: string;
  model?: string;
  operation?: "chat" | "embeddings" | "image" | "tts";
};

export type ErrorMetricLabels = {
  providerId: string;
  tenantId: string;
  errorCode: string;
  operation?: string;
};

const requestCount = new Counter({
  name: "agenticverdict_provider_requests_total",
  help: "Total number of provider requests",
  labelNames: ["providerId", "tenantId", "model", "operation"],
  registers: [productionFlowTestRegistry],
});

const requestLatency = new Histogram({
  name: "agenticverdict_provider_request_latency_seconds",
  help: "Provider request latency in seconds",
  labelNames: ["providerId", "tenantId", "model", "operation"],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
  registers: [productionFlowTestRegistry],
});

const errorCount = new Counter({
  name: "agenticverdict_provider_errors_total",
  help: "Total number of provider errors",
  labelNames: ["providerId", "tenantId", "errorCode", "operation"],
  registers: [productionFlowTestRegistry],
});

const tokenUsage = new Counter({
  name: "agenticverdict_provider_tokens_total",
  help: "Total token usage by provider",
  labelNames: ["providerId", "tenantId", "model", "type"],
  registers: [productionFlowTestRegistry],
});

const costUsd = new Counter({
  name: "agenticverdict_provider_cost_usd_total",
  help: "Total cost in USD by provider",
  labelNames: ["providerId", "tenantId", "model"],
  registers: [productionFlowTestRegistry],
});

const streamingDuration = new Histogram({
  name: "agenticverdict_provider_streaming_duration_seconds",
  help: "Duration of streaming requests in seconds",
  labelNames: ["providerId", "tenantId", "model"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
  registers: [productionFlowTestRegistry],
});

const activeStreams = new Gauge({
  name: "agenticverdict_provider_active_streams",
  help: "Number of active streaming connections",
  labelNames: ["providerId", "tenantId"],
  registers: [productionFlowTestRegistry],
});

const modelAvailability = new Gauge({
  name: "agenticverdict_provider_model_availability",
  help: "Model availability status (1=available, 0=unavailable)",
  labelNames: ["providerId", "model"],
  registers: [productionFlowTestRegistry],
});

const credentialRefreshCount = new Counter({
  name: "agenticverdict_provider_credential_refreshes_total",
  help: "Total number of credential refresh operations",
  labelNames: ["providerId", "tenantId"],
  registers: [productionFlowTestRegistry],
});

const cacheHitCount = new Counter({
  name: "agenticverdict_provider_cache_hits_total",
  help: "Total number of cache hits",
  labelNames: ["providerId", "tenantId", "cacheType"],
  registers: [productionFlowTestRegistry],
});

const failoverCount = new Counter({
  name: "agenticverdict_provider_failovers_total",
  help: "Total number of provider failover events",
  labelNames: ["providerId", "tenantId", "fromProvider", "toProvider"],
  registers: [productionFlowTestRegistry],
});

const rateLimitCount = new Counter({
  name: "agenticverdict_provider_rate_limits_total",
  help: "Total number of rate limit events",
  labelNames: ["providerId", "tenantId"],
  registers: [productionFlowTestRegistry],
});

export function recordRequest(
  labels: Omit<ProviderMetricLabels, "operation"> & { operation?: string },
): void {
  requestCount.inc({
    providerId: labels.providerId,
    tenantId: labels.tenantId,
    model: labels.model || "",
    operation: labels.operation || "",
  });
}

export function recordLatency(
  labels: Omit<ProviderMetricLabels, "operation"> & { operation?: string },
  durationSeconds: number,
): void {
  if (durationSeconds < 0 || !Number.isFinite(durationSeconds)) {
    return;
  }
  requestLatency.observe(
    {
      providerId: labels.providerId,
      tenantId: labels.tenantId,
      model: labels.model || "",
      operation: labels.operation || "",
    },
    durationSeconds,
  );
}

export function recordError(labels: ErrorMetricLabels): void {
  errorCount.inc({
    providerId: labels.providerId,
    tenantId: labels.tenantId,
    errorCode: labels.errorCode,
    operation: labels.operation || "",
  });
}

export function recordTokenUsage(
  labels: Omit<ProviderMetricLabels, "operation">,
  tokenType: "prompt" | "completion" | "total",
  count: number,
): void {
  if (count < 0 || !Number.isFinite(count)) {
    return;
  }
  tokenUsage.inc(
    {
      providerId: labels.providerId,
      tenantId: labels.tenantId,
      model: labels.model || "",
      type: tokenType,
    },
    count,
  );
}

export function recordCost(
  labels: Omit<ProviderMetricLabels, "operation">,
  costUsdAmount: number,
): void {
  if (costUsdAmount < 0 || !Number.isFinite(costUsdAmount)) {
    return;
  }
  costUsd.inc(
    {
      providerId: labels.providerId,
      tenantId: labels.tenantId,
      model: labels.model || "",
    },
    costUsdAmount,
  );
}

export function recordStreamingDuration(
  labels: Omit<ProviderMetricLabels, "operation">,
  durationSeconds: number,
): void {
  if (durationSeconds < 0 || !Number.isFinite(durationSeconds)) {
    return;
  }
  streamingDuration.observe(
    {
      providerId: labels.providerId,
      tenantId: labels.tenantId,
      model: labels.model || "",
    },
    durationSeconds,
  );
}

export function incrementActiveStreams(providerId: string, tenantId: string): void {
  activeStreams.inc({ providerId, tenantId });
}

export function decrementActiveStreams(providerId: string, tenantId: string): void {
  activeStreams.dec({ providerId, tenantId });
}

export function setModelAvailability(providerId: string, model: string, available: boolean): void {
  modelAvailability.set({ providerId, model }, available ? 1 : 0);
}

export function recordCredentialRefresh(providerId: string, tenantId: string): void {
  credentialRefreshCount.inc({ providerId, tenantId });
}

export function recordCacheHit(
  providerId: string,
  tenantId: string,
  cacheType: "model" | "credential" | "config",
): void {
  cacheHitCount.inc({ providerId, tenantId, cacheType });
}

export function recordFailover(
  providerId: string,
  tenantId: string,
  fromProvider: string,
  toProvider: string,
): void {
  failoverCount.inc({
    providerId,
    tenantId,
    fromProvider,
    toProvider,
  });
}

export function recordRateLimit(providerId: string, tenantId: string): void {
  rateLimitCount.inc({ providerId, tenantId });
}

export interface LatencyTimer {
  end: (labels: Omit<ProviderMetricLabels, "operation"> & { operation?: string }) => void;
}

export function startLatencyTimer(): LatencyTimer {
  const start = performance.now();
  return {
    end: (labels: Omit<ProviderMetricLabels, "operation"> & { operation?: string }) => {
      const durationSeconds = (performance.now() - start) / 1000;
      recordLatency(labels, durationSeconds);
    },
  };
}
