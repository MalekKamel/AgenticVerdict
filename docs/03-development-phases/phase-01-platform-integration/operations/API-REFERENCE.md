# Platform adapters — API reference

This reference describes the **public TypeScript API** of `@agenticverdict/platform-adapters`. Adapters are consumed from application services (for example the future Fastify API or workers), not directly from browser code.

## Core contract: `PlatformAdapter`

Defined in `packages/platform-adapters/src/adapter.ts`.

| Member          | Signature                                                                   | Description                                                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `platform`      | `readonly PlatformType`                                                     | One of `meta`, `ga4`, `gsc`, `gbp`, `tiktok`.                                                                                                                                              |
| `authenticate`  | `(credentials: PlatformCredentials) => Promise<void>`                       | Validates or exchanges tokens and stores internal state required for fetch. Must be called before `fetchMetrics` / `normalizeData` on raw payloads that depend on that session.            |
| `fetchMetrics`  | `(dateRange: DateRangeIso) => Promise<unknown>`                             | Returns a **vendor-specific** JSON-serializable payload (campaigns, reports, etc.). Subject to cache, token bucket, circuit breaker, and exponential backoff inside `BasePlatformAdapter`. |
| `normalizeData` | `(rawData: unknown, dateRange: DateRangeIso) => NormalizedPlatformSnapshot` | Pure transform from raw vendor payload to the unified normalized snapshot schema.                                                                                                          |
| `isHealthy`     | `() => Promise<boolean>`                                                    | Lightweight probe; implementation is per adapter (typically reflects whether authenticate succeeded and core config is present).                                                           |

### `PlatformCredentials`

Opaque string map: `Readonly<Record<string, string>>`. Each adapter documents required keys via `*CredentialKeys` constants (see [AUTHENTICATION-GUIDES.md](./AUTHENTICATION-GUIDES.md)).

### `DateRangeIso`

Inclusive calendar range with `start` / `end` as ISO date strings (`YYYY-MM-DD`), UTC semantics as implemented per adapter.

## `BasePlatformAdapter`

Abstract base implementing the cross-cutting pipeline:

1. Optional **token bucket** (constructor option; several adapters pass `null` and use an internal per-request bucket).
2. **Cache lookup** (`PlatformCache`) when configured.
3. **Circuit breaker** around the guarded operation.
4. **Exponential backoff with jitter** on retryable failures.

### `BasePlatformAdapterOptions`

| Option                                     | Type                                | Description                                                                                                                                |
| ------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `circuitBreaker` / `circuitBreakerOptions` | `CircuitBreaker` / partial options  | Override breaker instance or thresholds.                                                                                                   |
| `backoff`                                  | partial `ExponentialBackoffOptions` | Backoff schedule (defaults include 1s–16s with jitter).                                                                                    |
| `tenantId`                                 | `string`                            | **Required.** Non-empty after trim; used for cache keys and tenant-scoped operations. Missing/blank → `PlatformError` `missing_tenant_id`. |
| `cache`                                    | `PlatformCache \| null`             | Distributed or in-memory cache; `null` disables.                                                                                           |
| `cacheTtlSeconds`                          | `number`                            | TTL for adapter fetch cache entries.                                                                                                       |
| `tokenBucket`                              | `TokenBucket \| null`               | Request throttle at adapter entry (often `null` when adapter uses internal bucket).                                                        |
| `metrics`                                  | `AdapterMethodMetrics \| null`      | Records success/failure, latency percentiles, cache hits/misses.                                                                           |
| `deadLetterQueue`                          | `DeadLetterQueue \| null`           | Failed operations enqueue a record for inspection.                                                                                         |

### Extension points (subclasses)

| Method            | Responsibility                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `doAuthenticate`  | Perform OAuth exchange / token validation and persist tokens or resource IDs on the instance. |
| `fetchRawMetrics` | Perform vendor HTTP calls and return the raw payload for `fetchMetrics` (after cache miss).   |
| `normalizeData`   | Map raw payload to `NormalizedPlatformSnapshot`.                                              |

## Registry

`createAdapterRegistry<TContext>()` returns `PlatformAdapterRegistry<TContext>`:

- `register(platform, factory)` — register a factory that receives `TContext` (tenant config, secrets handle, etc.).
- `resolve(platform, context)` — returns a `PlatformAdapter`; throws `PlatformError` with code `not_registered` if missing.
- `has(platform)`, `platforms()` — introspection.

## Infrastructure bundle

`createDefaultAdapterInfrastructure()` (`adapter-infrastructure.ts`) returns `AdapterInfrastructureBundle`:

| Field             | Description                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `cache`           | `MemoryPlatformCache` or `UpstashPlatformCache` depending on `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. |
| `redis`           | Upstash client or `null`.                                                                                           |
| `metrics`         | Shared `AdapterMethodMetrics` instance.                                                                             |
| `deadLetterQueue` | In-process `InMemoryDeadLetterQueue`.                                                                               |
| `getHealth`       | Async aggregator used by HTTP routes (see [MONITORING-GUIDE.md](./MONITORING-GUIDE.md)).                            |

## Per-platform adapter classes (exported)

| Class                   | Module                  | Notes                                                                   |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------- |
| `MetaPlatformAdapter`   | `meta/meta-adapter`     | Graph API pagination; optional long-lived token exchange.               |
| `Ga4PlatformAdapter`    | `ga4/ga4-adapter`       | Data API, date split (365-day), sampling metadata, daily quota tracker. |
| `GscPlatformAdapter`    | `gsc/gsc-adapter`       | Search Analytics, sitemaps, URL inspection; 16-month guard.             |
| `GbpPlatformAdapter`    | `gbp/gbp-adapter`       | Accounts, locations, reviews, performance metrics.                      |
| `TikTokPlatformAdapter` | `tiktok/tiktok-adapter` | Marketing API; sandbox flag; report window split.                       |
| `MockPlatformAdapter`   | `mock-adapter`          | Test double implementing `PlatformAdapter`.                             |

Constructor options for each extend `BasePlatformAdapterOptions` plus adapter-specific fields (for example `fetchImpl`, `requestTokenBucket`, `dailyQuota` on GA4). See JSDoc on each class in source.

## Normalization and validation (downstream of adapters)

- `runNormalizationPipeline`, `NormalizedPlatformSnapshot`, Zod schemas — `normalization/`
- `validateNormalizedSnapshot`, `computeDataQualityScore`, outlier helpers — `validation/`

## HTTP API (web app)

Operational health is exposed from the Next.js app under `/api/health*`. See [openapi/platform-adapters-health.yaml](./openapi/platform-adapters-health.yaml) and [USAGE-EXAMPLES.md](./USAGE-EXAMPLES.md).
