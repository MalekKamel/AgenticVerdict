# Changelog entry: Phase 01 — Mock adapter integration and environment-driven selection

**Date:** 2026-04-07  
**Scope:** Phase 1 (Platform Integration) — execution of `docs/06-reference/mock-adapter-integration.md` with production-safe mock selection, config schema support, web health exposure, and test coverage.

This entry documents the implementation that makes platform adapter resolution environment-aware (`mock` vs `production`) while preserving tenant-scoped infrastructure wiring and enforcing strict security controls in production/staging environments.

---

## Summary

- Added a new **platform adapter factory** (`createPlatformAdapter`) that selects mock or production adapters per platform using env flags with clear precedence: **platform override > master flag > default false**.
- Added a **hard security guard** preventing mock adapter enablement in `production` and `staging`.
- Extended `MockAdapterFactory` to accept and forward full `BasePlatformAdapterOptions` so mocks and production adapters share cache, metrics, DLQ, and resilience plumbing.
- Added a typed **mock-adapter environment schema** and parser in `@agenticverdict/config`.
- Enriched the web adapter health endpoint with **`mockMode`**, **`mockPlatforms`**, and per-platform **`adapterType`** metadata.
- Added unit and integration tests covering factory behavior, precedence, security guardrails, and env parsing.
- Updated `.env.example` and `README.md` with runnable mock mode setup.

---

## Added

### `packages/platform-adapters`

- **`src/adapter-factory.ts`**
  - `createPlatformAdapter(config)`
  - `isMockEnabledForPlatform(platform, env?)`
  - `platformAdapterTypes` constant for all supported platforms
  - strict `"0" | "1"` parsing with descriptive config errors
  - production/staging guard (`[SECURITY]` error when mock is enabled)

- **`src/adapter-factory.test.ts`**
  - master-flag mock selection
  - platform override precedence
  - explicit `useMock` override
  - invalid flag format handling
  - production guard behavior

- **`src/security.test.ts`**
  - staging behavior checks for disabled and enabled mock flags

### `packages/config`

- **`src/schemas/mock-adapters.ts`**
  - `mockAdapterEnvSchema`
  - `parseMockAdapterEnv(env?)`
  - `MockAdapterEnv` and `MockAdapterScenarioEnv` types

- **`src/schemas/mock-adapters.test.ts`**
  - binary flag transform assertions
  - scenario parsing assertions
  - omitted optional fields behavior

### `tests/phase01-platform-integration`

- **`src/integration/mock-mode.integration.test.ts`**
  - validates end-to-end mock adapter usage when env mock mode is enabled
  - asserts successful authenticate/fetch/normalize flow

---

## Changed

### `packages/platform-adapters`

- **`src/mock-adapter-factory.ts`**
  - `MockAdapterFactoryConfig` now extends `BasePlatformAdapterOptions`.
  - forwards shared infra options into `MockPlatformAdapter` construction:
    - `cache`, `cacheTtlSeconds`
    - `metrics`
    - `deadLetterQueue`
    - `tokenBucket`
    - `circuitBreaker`, `circuitBreakerOptions`
    - `backoff`

- **`src/index.ts`**
  - exports `createPlatformAdapter`, `isMockEnabledForPlatform`, `platformAdapterTypes`, and `AdapterFactoryConfig`.

### `packages/config`

- **`src/index.ts`**
  - exports `mockAdapterEnvSchema`, `parseMockAdapterEnv`, and associated types.

### `apps/frontend`

- **`src/app/api/health/adapters/route.ts`**
  - augments health payload with:
    - `mockMode: boolean`
    - `mockPlatforms: PlatformType[]`
    - per-platform `adapterType: "mock" | "production"`

### Developer docs/env

- **`.env.example`**
  - added complete mock adapter variable set:
    - `AGENTICVERDICT_USE_MOCK_ADAPTERS`
    - `AGENTICVERDICT_MOCK_META|GA4|GSC|GBP|TIKTOK`
    - `AGENTICVERDICT_MOCK_SEED`
    - `AGENTICVERDICT_MOCK_SCENARIO`

- **`README.md`**
  - added a dedicated local setup section for mock adapter mode with verification steps.

---

## Verification (local)

The following commands were executed successfully after implementation:

- `pnpm --filter @agenticverdict/platform-adapters test`
- `pnpm --filter @agenticverdict/config test`
- `pnpm --filter @agenticverdict/phase01-platform-integration test`
- `pnpm --filter @agenticverdict/platform-adapters typecheck`
- `pnpm --filter @agenticverdict/config typecheck`
- `pnpm --filter @agenticverdict/frontend typecheck`

---

## Scope notes

- `apps/api` and `apps/worker` were not updated for runtime adapter registration in this slice because current `index.ts` files are barrel exports and do not instantiate platform adapters. Integration should be applied at actual adapter construction points when those runtime flows are introduced.
- Mock scenario support aligns with existing code (`normal`, `high-volume`, `zero-conversions`, `error`) rather than introducing an unimplemented `empty` scenario.

---

## Related documentation

- [`docs/06-reference/mock-adapter-integration.md`](docs/06-reference/mock-adapter-integration.md)
- [`specs/00-core/01-connectors/EXECUTION-PLAN.md`](specs/00-core/01-connectors/EXECUTION-PLAN.md)
