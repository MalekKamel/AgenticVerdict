import type { ConnectorType, ExponentialBackoffOptions } from "@agenticverdict/types";

import type { AdapterMethodMetrics } from "./adapter-metrics";
import { buildAdapterCacheKey } from "./cache/cache-keys";
import { defaultAdapterCacheTtlSeconds } from "./cache/ttl";
import type { PlatformCache } from "./cache/types";
import { CircuitBreaker, type CircuitBreakerOptions } from "./circuit-breaker";
import type { ConnectorCredentials } from "./credentials";
import type { DateRangeIso } from "./date-range";
import type { DeadLetterQueue } from "./dead-letter-queue";
import { PlatformCircuitOpenError, PlatformError } from "./errors";
import type { NormalizedConnectorSnapshot } from "./normalization";
import { defaultBackoffOptions, withExponentialBackoff } from "./rate-limit";
import type { TokenBucket } from "./token-bucket";

/**
 * Integration boundary for a single marketing or analytics data source (GA4, Meta, …).
 * Implementations fetch vendor-specific payloads and normalize them into
 * {@link NormalizedConnectorSnapshot} for downstream pipelines.
 */
export interface ConnectorAdapter {
  readonly connector: ConnectorType;
  authenticate(credentials: ConnectorCredentials): Promise<void>;
  /** Vendor-specific payload; normalize via {@link normalizeData}. */
  fetchMetrics(dateRange: DateRangeIso): Promise<unknown>;
  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedConnectorSnapshot;
  isHealthy(): Promise<boolean>;
}

export interface BaseConnectorAdapterOptions {
  circuitBreaker?: CircuitBreaker;
  circuitBreakerOptions?: Partial<CircuitBreakerOptions>;
  backoff?: Partial<ExponentialBackoffOptions>;
  /** Tenant segment for cache keys and operational isolation (required). */
  tenantId: string;
  cache?: PlatformCache | null;
  cacheTtlSeconds?: number;
  tokenBucket?: TokenBucket | null;
  metrics?: AdapterMethodMetrics | null;
  deadLetterQueue?: DeadLetterQueue | null;
}

/**
 * Template adapter: token bucket → cache → circuit breaker → exponential backoff → raw fetch.
 */
export abstract class BaseConnectorAdapter implements ConnectorAdapter {
  abstract readonly connector: ConnectorType;

  private readonly breaker: CircuitBreaker;
  private readonly backoff: ExponentialBackoffOptions;
  private readonly tenantId: string;
  private readonly cache: PlatformCache | null;
  private readonly cacheTtlSeconds?: number;
  private readonly tokenBucket: TokenBucket | null;
  private readonly metrics: AdapterMethodMetrics | null;
  private readonly deadLetterQueue: DeadLetterQueue | null;

  protected constructor(connector: ConnectorType, options: BaseConnectorAdapterOptions) {
    const tenantId = options.tenantId.trim();
    if (!tenantId) {
      throw new PlatformError(
        connector,
        "missing_tenant_id",
        "tenantId is required for all adapter operations",
      );
    }
    this.breaker =
      options.circuitBreaker ??
      new CircuitBreaker(options.circuitBreakerOptions ?? undefined, {
        platform: connector,
        adapter: this.constructor.name,
      });
    this.backoff = { ...defaultBackoffOptions, ...options.backoff };
    this.tenantId = tenantId;
    this.cache = options.cache ?? null;
    this.cacheTtlSeconds = options.cacheTtlSeconds;
    this.tokenBucket = options.tokenBucket ?? null;
    this.metrics = options.metrics ?? null;
    this.deadLetterQueue = options.deadLetterQueue ?? null;
  }

  protected abstract doAuthenticate(credentials: ConnectorCredentials): Promise<void>;

  async authenticate(credentials: ConnectorCredentials): Promise<void> {
    const started = Date.now();
    try {
      await this.doAuthenticate(credentials);
      this.metrics?.record({
        connector: this.connector,
        operation: "authenticate",
        outcome: "success",
        durationMs: Date.now() - started,
      });
    } catch (error) {
      this.metrics?.record({
        connector: this.connector,
        operation: "authenticate",
        outcome: "failure",
        durationMs: Date.now() - started,
      });
      this.enqueueDeadLetter("authenticate", error, "");
      throw error;
    }
  }

  protected abstract fetchRawMetrics(dateRange: DateRangeIso): Promise<unknown>;

  abstract normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedConnectorSnapshot;

  async fetchMetrics(dateRange: DateRangeIso): Promise<unknown> {
    const started = Date.now();
    const cacheKey =
      this.cache !== null
        ? buildAdapterCacheKey({ tenantId: this.tenantId, connector: this.connector, dateRange })
        : null;

    try {
      if (this.tokenBucket) {
        await this.tokenBucket.consume();
      }

      if (this.cache !== null && cacheKey !== null) {
        const cached = await this.cache.get(cacheKey);
        if (cached !== null) {
          try {
            const parsed: unknown = JSON.parse(cached) as unknown;
            this.metrics?.record({
              connector: this.connector,
              operation: "fetchMetrics",
              outcome: "success",
              durationMs: Date.now() - started,
              cacheHit: true,
            });
            return parsed;
          } catch {
            await this.cache.delete(cacheKey);
          }
        }
      }

      const raw = await this.breaker.execute(() =>
        withExponentialBackoff(this.backoff, () => this.fetchRawMetrics(dateRange), {
          platform: this.connector,
          operation: "fetchMetrics",
        }),
      );

      if (this.cache !== null && cacheKey !== null) {
        try {
          const ttl = this.cacheTtlSeconds ?? defaultAdapterCacheTtlSeconds(this.connector);
          await this.cache.set(cacheKey, JSON.stringify(raw), ttl);
        } catch {
          // Cache failures must not fail the adapter call.
        }
      }

      this.metrics?.record({
        connector: this.connector,
        operation: "fetchMetrics",
        outcome: "success",
        durationMs: Date.now() - started,
        cacheHit: this.cache !== null ? false : undefined,
      });
      return raw;
    } catch (error) {
      this.metrics?.record({
        connector: this.connector,
        operation: "fetchMetrics",
        outcome: "failure",
        durationMs: Date.now() - started,
      });
      this.enqueueDeadLetter("fetchMetrics", error, JSON.stringify(dateRange).slice(0, 500));
      if (error instanceof Error && error.message === "Circuit breaker is open") {
        throw new PlatformCircuitOpenError(this.connector);
      }
      throw error;
    }
  }

  private enqueueDeadLetter(operation: string, error: unknown, payloadSummary: string): void {
    if (!this.deadLetterQueue) {
      return;
    }
    const isCircuitOpen =
      (error instanceof Error && error.message === "Circuit breaker is open") ||
      error instanceof PlatformCircuitOpenError;
    if (isCircuitOpen) {
      return;
    }
    this.deadLetterQueue.enqueue({
      connector: this.connector,
      operation,
      errorMessage: error instanceof Error ? error.message : String(error),
      payloadSummary: payloadSummary.length > 0 ? payloadSummary : undefined,
    });
  }

  async isHealthy(): Promise<boolean> {
    const state = this.breaker.getState();
    return state !== "open";
  }
}
