# `@agenticverdict/platform-adapters`

Plugin boundary for marketing platform integrations (Meta, GA4, GSC, GBP, TikTok).

## Phase 0 scope

- **`PlatformAdapter`** — authenticate, fetch raw metrics, normalize to `NormalizedPlatformSnapshot`, health signal.
- **`BasePlatformAdapter`** — wraps `fetchMetrics` with exponential backoff + `CircuitBreaker`.
- **`createAdapterRegistry`** — tenant-scoped factories `(context) => adapter` without importing `@agenticverdict/core`.
- **Errors** — `PlatformError` hierarchy for consistent handling upstream.
- **`MockPlatformAdapter`** + **`createSyntheticAdapter`** / **`useMockAdapter`** — tests without network.

## Deferred to Phase 1

- Real OAuth flows, vendor SDKs, credential decryption, and production rate-limit headers.
- Platform-specific normalizers implementing `PlatformDataNormalizer`.

## Integration steps

1. Implement a concrete adapter extending **`BasePlatformAdapter`** (or implement **`PlatformAdapter`** directly if you skip resilience defaults).
2. Register it with **`createAdapterRegistry<TenantContext>()`** inside application bootstrap.
3. Resolve with tenant context so credentials and `app.current_tenant_id` stay aligned with **`@agenticverdict/core`**.

## Normalized metrics

`NormalizedPlatformSnapshot` carries `platform`, `dateRange`, and `records[]` with `metricKey`, `value`, optional `dimensions`, and `capturedAt` (ISO datetime).
