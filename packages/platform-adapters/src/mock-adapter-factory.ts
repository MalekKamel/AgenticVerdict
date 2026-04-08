import type { PlatformType } from "@agenticverdict/types";

import type { BasePlatformAdapterOptions } from "./adapter";
import type { DateRangeIso } from "./date-range";

import { MockPlatformAdapter, type MockPlatformAdapterOptions } from "./mock-adapter";
import { type MockAdapterScenario, buildScenarioRecords } from "./mock-static-data";

export interface MockAdapterFactoryConfig extends BasePlatformAdapterOptions {
  readonly platform: PlatformType;
  readonly scenario?: MockAdapterScenario;
  /** Affects synthetic `capturedAt` days when {@link dateRange} is set. */
  readonly seed?: number;
  readonly dateRange?: DateRangeIso;
  /** Override normalized rows (skips built-in scenario generation). */
  readonly records?: MockPlatformAdapterOptions["records"];
  /** Override raw fetch payload. */
  readonly rawResponse?: unknown;
  readonly circuitBreakerOptions?: MockPlatformAdapterOptions["circuitBreakerOptions"];
  readonly backoff?: MockPlatformAdapterOptions["backoff"];
}

/**
 * Factory for {@link MockPlatformAdapter} instances backed by deterministic static metrics.
 *
 * Use {@link scenario} `"error"` to simulate post-auth fetch failures (see {@link MockPlatformAdapterOptions.fetchFailureMessage}).
 */
export class MockAdapterFactory {
  static create(config: MockAdapterFactoryConfig): MockPlatformAdapter {
    const scenario = config.scenario ?? "normal";
    const seed = config.seed ?? 42_001;

    if (scenario === "error") {
      return new MockPlatformAdapter(config.platform, {
        tenantId: config.tenantId,
        rawResponse: { scenario: "error", platform: config.platform },
        fetchFailureMessage: "mock_adapter_factory:error_scenario",
        /** Non-retryable so {@link fetchMetrics} fails fast under default backoff. */
        fetchFailureCode: "invalid_request",
        circuitBreaker: config.circuitBreaker,
        circuitBreakerOptions: config.circuitBreakerOptions,
        cache: config.cache,
        cacheTtlSeconds: config.cacheTtlSeconds,
        tokenBucket: config.tokenBucket,
        backoff: config.backoff,
        metrics: config.metrics,
        deadLetterQueue: config.deadLetterQueue,
      });
    }

    const records =
      config.records ??
      buildScenarioRecords({
        platform: config.platform,
        scenario,
        seed,
        dateRange: config.dateRange,
      });

    const rawResponse =
      config.rawResponse ??
      ({
        mock: true,
        platform: config.platform,
        scenario,
        seed,
        records,
      } as const);

    return new MockPlatformAdapter(config.platform, {
      tenantId: config.tenantId,
      rawResponse,
      records,
      circuitBreaker: config.circuitBreaker,
      circuitBreakerOptions: config.circuitBreakerOptions,
      cache: config.cache,
      cacheTtlSeconds: config.cacheTtlSeconds,
      tokenBucket: config.tokenBucket,
      backoff: config.backoff,
      metrics: config.metrics,
      deadLetterQueue: config.deadLetterQueue,
    });
  }
}
