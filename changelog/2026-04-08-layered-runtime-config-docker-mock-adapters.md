# Changelog entry: Layered runtime configuration, Docker mock-adapter stages, and Postgres feature flags

**Date:** 2026-04-08  
**Scope:** Execution of the greenfield plan in `docs/04-technology-research/docker-mock-adapter-solution-summary.md` (and supporting research: container-agnostic config, Docker root-cause analysis, greenfield quick reference, feature-flag runtime config). Implements **Layer 1 + Layer 2** configuration separation for mock adapters, **multi-stage API/worker images** selectable by `TARGET_STAGE`, **compose overlays** for dev/test, **Postgres-backed feature flags** with a database-layer service, **Prometheus metrics** for config/flag evaluation, and an **audit helper** for config changes.

This work **complements** compiler-driven `build-constants` (see `changelog/2026-04-08-compiler-driven-adapter-config.md`): production bundles and `IS_PRODUCTION` semantics remain; adapter selection no longer relies on a single `if (!IS_PRODUCTION)` wrapper around the entire mock branch. **Next.js web** Docker images are unchanged (standalone build still eliminates mock code at build time).

---

## Summary

- Added **`@agenticverdict/config/configuration`** with validated **`RuntimeConfig`** (Zod), **`ConfigurationService`**, **`config`**, and a single implementation of **`isMockEnabledForPlatform`** (same env precedence and production/staging security throws as before).
- **`canEnableMocksViaEnv`** inspects the **passed `process.env` snapshot** for `NODE_ENV` first, then **`IS_PRODUCTION`** from `build-constants`, so container overrides and Vitest behave predictably.
- Refactored **`createPlatformAdapter`**: production processes **never** take the mock path from env; non-production uses **`isMockEnabledForPlatform`** from config. **`useMock: true`** in production still yields **production** adapters (prior behavior). **`useMock: true`** in dev/test forces mocks.
- **API and worker Dockerfiles**: stages **`development`**, **`test`**, **`production`**; runner **`COPY --from=${TARGET_STAGE}`** with **`ARG TARGET_STAGE`** / **`ARG NODE_ENV`**.
- **Root compose**: **`docker-compose.dev.yml`** and **`docker-compose.test.yml`** for API/worker mock-friendly builds; **`deploy/docker-compose.dev.override.yml`** passes **`TARGET_STAGE`** alongside **`NODE_ENV`**.
- **Database**: tables **`feature_flags`** and **`tenant_feature_flags`**, migration **`0003_feature_flags.sql`**, **`FeatureFlagService`** + **`createFeatureFlagService(db)`** (lives in **`@agenticverdict/database`** to avoid **`config` ↔ `database` circular dependencies**).
- **Observability**: **`agenticverdict_*`** config / feature-flag metrics on **`productionFlowTestRegistry`** with **get-or-create** registration for Vitest `resetModules` safety.
- **Audit**: **`auditConfigChange`** writes **`audit_logs`** rows for config-change events.
- **Fixtures path**: **`tests/fixtures/.gitkeep`** (optional volume hook documented in test compose comments).

---

## Added

### `packages/config`

- **`src/schemas/runtime-config.ts`**
  - `mockAdapterPlatformSchema`, `runtimeConfigSchema`, `RuntimeConfig` type

- **`src/configuration.ts`**
  - `canEnableMocksViaEnv`, `isMockEnabledForPlatform`, `buildRuntimeConfig` (internal), `ConfigurationService`, `config`

- **`src/configuration.test.ts`**
  - feature toggle parsing, mock master flag, `canEnableMocksViaEnv`, platform override semantics

- **`package.json` `exports`**
  - `"./configuration": "./src/configuration.ts"`

### `packages/platform-adapters`

- **`src/adapter-factory.ts`**
  - `shouldUseMockAdapter`, `createProductionAdapter` (exhaustive `switch`)
  - Re-exports: `isMockEnabledForPlatform`, **`config`** (same object as `@agenticverdict/config/configuration`)

- **`src/index.ts`**
  - export **`config`**

### `packages/database`

- **`src/schema/feature-flags.ts`**
  - `featureFlags`, `tenantFeatureFlags` (Drizzle)

- **`migrations/0003_feature_flags.sql`**
  - `feature_flags`, `tenant_feature_flags`, indexes, FKs to `tenants` / `feature_flags`

- **`migrations/meta/_journal.json`** (+ **`0003_snapshot.json`**)
  - Drizzle journal entry for the new migration

- **`src/feature-flag-service.ts`**
  - `FeatureFlagContext`, `FeatureFlagService`, `getFlag`, `getFlags`, `createFeatureFlagService`

- **`src/audit-config-change.ts`**
  - `AuditConfigChangeParams`, `auditConfigChange` → `audit_logs`

- **`src/index.ts`**
  - exports for feature-flag service and audit helper

### `packages/observability`

- **`src/config-access-metrics.ts`**
  - `configAccessTotal`, `configLoadDurationSeconds`, `featureFlagEvaluationTotal` (prefixed metric names, shared registry, idempotent registration)

- **`src/index.ts`**
  - re-exports config-access metrics

### Docker and Compose

- **`apps/api/Dockerfile`**
  - stages: `development`, `test`, `production`; runner `COPY --from=${TARGET_STAGE}`

- **`apps/worker/Dockerfile`**
  - same multi-stage pattern as API

- **`docker-compose.dev.yml`**
  - API/worker: `TARGET_STAGE: development`, `NODE_ENV: development`, `AGENTICVERDICT_USE_MOCK_ADAPTERS: "1"`

- **`docker-compose.test.yml`**
  - API/worker: `TARGET_STAGE: test`, `NODE_ENV: test`, mock flags + `AGENTICVERDICT_MOCK_SCENARIO: normal`

- **`deploy/docker-compose.dev.override.yml`**
  - `TARGET_STAGE: development` in build args for api/worker

### Repository hygiene

- **`tests/fixtures/.gitkeep`**
  - placeholder for deterministic fixture mounts (commented optional volume in test compose)

---

## Changed

### `packages/config`

- **`src/index.ts`**
  - exports `ConfigurationService`, `canEnableMocksViaEnv`, `config`, `isMockEnabledForPlatform`, `runtimeConfigSchema`, `RuntimeConfig`

### `packages/platform-adapters`

- **`src/adapter-factory.ts`**
  - mock selection driven by **`shouldUseMockAdapter`** + config-layer **`isMockEnabledForPlatform`**; removed monolithic **`if (!IS_PRODUCTION)`** around mock instantiation
  - **`parseBinaryFlag`** / previous inline **`isMockEnabledForPlatform`** body **moved** to `packages/config` (behavior preserved)

### `packages/database`

- **`src/schema/index.ts`**
  - exports `featureFlags`, `tenantFeatureFlags`

- **`test/schema.unit.test.ts`**
  - expected export list includes new tables

---

## Design notes

### Why `FeatureFlagService` is not under `packages/config`

`@agenticverdict/database` already depends on `@agenticverdict/config`. Importing the database client from `packages/config` would create a **circular dependency**. The research doc’s sample location was adjusted: **DB-bound flag evaluation** lives next to the schema in **`@agenticverdict/database`**.

### Web / Next.js

Mock adapters in **Dockerized web** remain unsupported for the same reasons as in `docs/04-technology-research/docker-incompatibility-root-cause-analysis.md` (standalone + DCE). API and worker paths are the focus of **`TARGET_STAGE`** and compose overlays.

### Migrations

Apply **`0003_feature_flags`** in each environment using the project’s standard migration command, for example:

`pnpm --filter @agenticverdict/database db:migrate`

---

## Verification

- **`pnpm check:cycles`** — no new circular imports
- **`pnpm typecheck`**
- **`pnpm verify:production-bundle`** — production Vite outputs and adapter-factory smoke bundle still show **no mock adapter symbols**
- Vitest: **`packages/config`**, **`packages/platform-adapters`** (adapter-factory + integration + node-env + security), **`packages/database`** schema test, **`packages/observability`** (metrics modules)

---

## Follow-up (greenfield cleanup)

Detailed breakdown, breaking changes, and migration notes: **`changelog/2026-04-09-runtime-config-greenfield-cleanup.md`**.

---

## Related documentation

- `docs/04-technology-research/docker-mock-adapter-solution-summary.md`
- `docs/04-technology-research/docker-incompatibility-root-cause-analysis.md`
- `docs/04-technology-research/container-agnostic-config-management-research.md`
- `docs/04-technology-research/docker-mock-adapter-greenfield-quick-reference.md`
- `docs/04-technology-research/feature-flag-runtime-config-research.md`
- `changelog/2026-04-08-compiler-driven-adapter-config.md` (build constants + prior adapter-factory guard)
- `changelog/2026-04-09-runtime-config-greenfield-cleanup.md` (deduplication, **`RuntimeConfig`** accuracy, public API cleanup)
