import type { PlatformType } from "@agenticverdict/types";

import { CircuitBreaker, type CircuitBreakerOptions } from "./circuit-breaker";
import type { PlatformCredentials } from "./credentials";
import type { DateRangeIso } from "./date-range";
import { PlatformCircuitOpenError } from "./errors";
import type { NormalizedPlatformSnapshot } from "./normalization";
import {
  defaultBackoffOptions,
  type ExponentialBackoffOptions,
  withExponentialBackoff,
} from "./rate-limit";

export interface PlatformAdapter {
  readonly platform: PlatformType;
  authenticate(credentials: PlatformCredentials): Promise<void>;
  /** Vendor-specific payload; normalize via {@link normalizeData}. */
  fetchMetrics(dateRange: DateRangeIso): Promise<unknown>;
  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedPlatformSnapshot;
  isHealthy(): Promise<boolean>;
}

export interface BasePlatformAdapterOptions {
  circuitBreaker?: CircuitBreaker;
  circuitBreakerOptions?: Partial<CircuitBreakerOptions>;
  backoff?: Partial<ExponentialBackoffOptions>;
}

/**
 * Template adapter: wraps raw fetch with exponential backoff + circuit breaker.
 */
export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract readonly platform: PlatformType;

  private readonly breaker: CircuitBreaker;
  private readonly backoff: ExponentialBackoffOptions;

  protected constructor(options: BasePlatformAdapterOptions = {}) {
    this.breaker =
      options.circuitBreaker ?? new CircuitBreaker(options.circuitBreakerOptions ?? undefined);
    this.backoff = { ...defaultBackoffOptions, ...options.backoff };
  }

  abstract authenticate(credentials: PlatformCredentials): Promise<void>;

  protected abstract fetchRawMetrics(dateRange: DateRangeIso): Promise<unknown>;

  abstract normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedPlatformSnapshot;

  async fetchMetrics(dateRange: DateRangeIso): Promise<unknown> {
    try {
      return await this.breaker.execute(() =>
        withExponentialBackoff(this.backoff, () => this.fetchRawMetrics(dateRange)),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "Circuit breaker is open") {
        throw new PlatformCircuitOpenError(this.platform);
      }
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    const state = this.breaker.getState();
    return state !== "open";
  }
}
