import type { ConnectorType } from "@agenticverdict/types";

import type { BaseConnectorAdapterOptions } from "./adapter";
import type { DateRangeIso } from "./date-range";

import { MockConnectorAdapter, type MockConnectorAdapterOptions } from "./mock-adapter";
import { type MockAdapterScenario, buildScenarioRecords } from "./mock-static-data";

export interface MockAdapterFactoryConfig extends BaseConnectorAdapterOptions {
  readonly connector: ConnectorType;
  readonly scenario?: MockAdapterScenario;
  /** Affects synthetic `capturedAt` days when {@link dateRange} is set. */
  readonly seed?: number;
  readonly dateRange?: DateRangeIso;
  /** Override normalized rows (skips built-in scenario generation). */
  readonly records?: MockConnectorAdapterOptions["records"];
  /** Override raw fetch payload. */
  readonly rawResponse?: unknown;
  readonly circuitBreakerOptions?: MockConnectorAdapterOptions["circuitBreakerOptions"];
  readonly backoff?: MockConnectorAdapterOptions["backoff"];
}

/**
 * Factory for {@link MockConnectorAdapter} instances backed by deterministic static metrics.
 *
 * Use {@link scenario} `"error"` to simulate post-auth fetch failures (see {@link MockConnectorAdapterOptions.fetchFailureMessage}).
 */
export class MockAdapterFactory {
  static create(config: MockAdapterFactoryConfig): MockConnectorAdapter {
    const scenario = config.scenario ?? "normal";
    const seed = config.seed ?? 42_001;

    if (scenario === "error") {
      return new MockConnectorAdapter(config.connector, {
        tenantId: config.tenantId,
        rawResponse: { scenario: "error", connector: config.connector },
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
        connector: config.connector,
        scenario,
        seed,
        dateRange: config.dateRange,
      });

    const rawResponse =
      config.rawResponse ??
      ({
        mock: true,
        connector: config.connector,
        scenario,
        seed,
        records,
      } as const);

    return new MockConnectorAdapter(config.connector, {
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
