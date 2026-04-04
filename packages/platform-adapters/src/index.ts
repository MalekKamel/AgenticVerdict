/**
 * Platform adapter contracts, resilience helpers, registry, and mocks.
 * Vendor SDK integrations ship in Phase 1; this package is the plugin boundary.
 */
export {
  BasePlatformAdapter,
  type BasePlatformAdapterOptions,
  type PlatformAdapter,
} from "./adapter";
export { CircuitBreaker, type CircuitBreakerOptions, type CircuitState } from "./circuit-breaker";
export type { PlatformCredentials } from "./credentials";
export type { DateRangeIso } from "./date-range";
export {
  PlatformAuthError,
  PlatformCircuitOpenError,
  PlatformError,
  type PlatformErrorCode,
  PlatformRateLimitError,
} from "./errors";
export { MockPlatformAdapter, type MockPlatformAdapterOptions } from "./mock-adapter";
export type {
  NormalizedMetricRecord,
  NormalizedPlatformSnapshot,
  PlatformDataNormalizer,
} from "./normalization";
export {
  createAdapterRegistry,
  type AdapterFactory,
  type PlatformAdapterRegistry,
} from "./registry";
export {
  defaultBackoffOptions,
  type ExponentialBackoffOptions,
  withExponentialBackoff,
} from "./rate-limit";
export { createSyntheticAdapter, useMockAdapter, type SyntheticAdapterOptions } from "./test-utils";

export const PLATFORM_ADAPTERS_PACKAGE_VERSION = "0.1.0";
