# Changelog entry: Compiler-driven adapter configuration and production bundle verification

**Date:** 2026-04-08  
**Scope:** Execution of `docs/04-technology-research/compiler-driven-adapter-config-implementation-plan.md` — build-time constants for adapter selection, API/worker esbuild outputs, CI verification, tests, and documentation. Does **not** change the on-disk `CompanyConfig` JSON schema (no discriminated union on `environment`).

This entry documents the shift toward **shared build constants** (`NODE_ENV`-derived) for mock vs production adapter paths, **production-only guards** for workflow test triggers and worker startup, and **automated checks** that production-oriented bundles do not retain mock adapter symbols where tree-shaking applies.

---

## Summary

- Introduced **`@agenticverdict/config/build-constants`** (and barrel exports) with frozen **`BUILD_CONFIG`**, **`IS_PRODUCTION`**, **`MOCK_ADAPTERS_ENABLED`**, and type guards used across packages.
- Updated **`createPlatformAdapter`** so the **mock adapter path is unreachable when `NODE_ENV === "production"`** at module evaluation time, while preserving **`useMock: true | false`** semantics and existing **`isMockEnabledForPlatform`** env precedence for non-production processes (including the web adapter health route).
- Added **esbuild** packaging for **API** and **worker** CLI entrypoints (`dist/cli.mjs`) with **`process.env.NODE_ENV` define**; all **declared npm dependencies stay external** so heavy graphs (for example Playwright) are not pulled into the shell bundle.
- Added a **focused smoke bundle** of `adapter-factory.ts` with **`@agenticverdict/config` inlined**, production define, and **`minify: true`** to assert **dead-code elimination** removes **`MockPlatformAdapter` / `MockAdapterFactory`** symbols from the minified artifact.
- Wired **CI** to run **`verify:build-config`** and **`verify:production-bundle`** after unit tests with coverage.
- Documented migration and manual testing expectations; linked research and implementation plan from the technology research index.

---

## Added

### `packages/config`

- **`src/build-constants.ts`**
  - `NODE_ENV`, `IS_PRODUCTION`, `MOCK_ADAPTERS_ENABLED`, `BUILD_TIMESTAMP`, `API_VERSION`
  - `BUILD_CONFIG` (`Object.freeze`)
  - `BuildConfig` type, `isProductionBuild`, `isDevelopmentBuild`, `isTestBuild`

- **`src/build-constants.test.ts`**
  - dynamic `import()` with `vi.stubEnv` for `NODE_ENV` variants
  - frozen-config mutation throws in strict mode
  - type guard return types

- **`package.json` `exports`**
  - `"./build-constants": "./src/build-constants.ts"`

### `packages/platform-adapters`

- **`src/adapter-factory.node-env.test.ts`**
  - fresh module graph under `NODE_ENV=production` with mock master flag set; expects **Meta** (production) adapter

- **`src/adapter-factory.integration.test.ts`**
  - development + mock flag → mock adapter
  - development + `useMock: false` → production adapter (dynamic imports aligned with `instanceof`)

### `apps/api`

- **`src/routes/v1/workflow-trigger-gate.ts`**
  - `isWorkflowTestTriggerAllowed()` — `false` when `BUILD_CONFIG.isProduction`

- **`src/routes/v1/workflow-trigger-gate.test.ts`**
  - dynamic import gate under `production` vs `test` `NODE_ENV`

- **`esbuild.config.mjs`**
  - bundles `src/cli.ts` → `dist/cli.mjs` + sourcemap; externalizes all **`dependencies`**

- **`package.json`**
  - script **`build:esbuild`**
  - devDependency **`esbuild`**

### `apps/worker`

- **`esbuild.config.mjs`**
  - same pattern as API

- **`package.json`**
  - script **`build:esbuild`**
  - dependency **`@agenticverdict/config`**
  - devDependency **`esbuild`**

### Root and tooling

- **`package.json` scripts**
  - **`verify:build-config`** — Vitest on `packages/config/src/build-constants.test.ts`
  - **`verify:production-bundle`** — production esbuild for api + worker, adapter-factory smoke bundle, bundle analyzer
  - **`benchmark:esbuild`** — `tools/build/benchmark-builds.mjs`

- **`package.json` devDependencies**
  - **`esbuild`** (for repo-level smoke script resolution)

- **`tools/build/analyze-bundles.mjs`**
  - recursive scan of `.mjs` outputs; fails if `MockPlatformAdapter` or `MockAdapterFactory` substrings appear

- **`tools/build/bundle-adapter-factory-smoke.mjs`**
  - bundles `packages/platform-adapters/src/adapter-factory.ts` with config inlined, production define, **minify**, symbol check

- **`tools/build/benchmark-builds.mjs`**
  - times api/worker `build:esbuild` and reports approximate `dist` byte totals

- **`turbo.json`**
  - task **`build:esbuild`** with `dist/**` outputs

### Continuous integration

- **`.github/workflows/ci.yml`**
  - step **Verify build constants** → `pnpm run verify:build-config`
  - step **Production esbuild bundles (mock-code scan)** → `pnpm run verify:production-bundle` with `NODE_ENV: production`

### Documentation

- **`docs/06-reference/migration-guide-compiler-driven-config.md`**
  - migration patterns, explicit note that **company JSON / `CompanyConfig` are unchanged**

- **`tests/docs/manual-testing-guide.md`**
  - **§2.7 Compiler-driven adapter configuration** — build constants, blocked workflow test trigger in production, worker startup check

- **`docs/04-technology-research/README.md`**
  - **Compiler-driven configuration** links to research and implementation plan

---

## Changed

### `packages/config`

- **`src/index.ts`**
  - re-exports build constants and guards from `./build-constants`

### `packages/platform-adapters`

- **`package.json`**
  - dependency **`@agenticverdict/config`**

- **`src/adapter-factory.ts`**
  - imports **`IS_PRODUCTION`** from `@agenticverdict/config/build-constants`
  - **`createPlatformAdapter`**: mock branch only when **`!IS_PRODUCTION`**; **`useMock === true`** still forces mock in dev/test; **`useMock === false`** forces production adapters regardless of mock env flags
  - **`isMockEnabledForPlatform`** unchanged (production/staging security strings, web health compatibility)

### `apps/api`

- **`src/routes/v1/workflows.ts`**
  - after successful body parse, returns **400** when **`!isWorkflowTestTriggerAllowed()`** with a clear validation error payload

### `apps/worker`

- **`src/cli.ts`**
  - logs **`worker_startup`** with `BUILD_CONFIG` fields
  - **`process.exit(1)`** when **`BUILD_CONFIG.isProduction`** and **`AGENTICVERDICT_USE_MOCK_ADAPTERS === "1"`**

---

## Intentionally not in this slice

- **`CompanyConfig` discriminated union** (`environment` / `mockAdapters` / `debugMode`) from the plan — would invalidate existing tenant JSON; deferred with migration guide clarification.
- **`@esbuild/typescript-plugin`** — esbuild compiles TypeScript without it.
- **TypeScript solution `references` overhaul** at repo root — avoided broad monorepo churn; Turbo and package `typecheck` remain the source of truth.
- **`isMockEnabledForPlatform` throwing** when `BUILD_CONFIG.isProduction` — would break **`apps/web`** aggregated adapter health, which calls the helper per platform in production.
- **Separate `examples/compiler-driven-config` repository** (plan appendix) — out of repo scope.
- **`docs/02-planning-and-methodology/architecture.md`** — file not present in the tree at time of implementation.

---

## Verification (local)

Representative commands used after implementation:

- `pnpm run verify:build-config`
- `pnpm run verify:production-bundle`
- `pnpm --filter @agenticverdict/platform-adapters test`
- `pnpm --filter @agenticverdict/config test`
- `pnpm --filter @agenticverdict/api test`
- `pnpm run test:phase01-integration`

---

## Operational notes

- **pnpm** may report **ignored `esbuild` postinstall** until **`pnpm approve-builds`** (or equivalent) is used in locked-down environments; without the esbuild binary, bundle steps fail.
- **API/worker `dist/cli.mjs`** artifacts are **shell bundles** (local `src` coalesced, workspace and npm deps loaded at runtime from `node_modules`). **Mock-code elimination** is **asserted** on the **minified adapter-factory smoke** output, not on the full application graph.
- Default **`pnpm run build`** (Turbo **`tsc --noEmit`**) is unchanged; **`build:esbuild`** is additive for release hardening and CI scans.

---

## Related documentation

- [`docs/04-technology-research/compiler-driven-adapter-config-research.md`](../docs/04-technology-research/compiler-driven-adapter-config-research.md)
- [`docs/04-technology-research/compiler-driven-adapter-config-implementation-plan.md`](../docs/04-technology-research/compiler-driven-adapter-config-implementation-plan.md)
- [`docs/06-reference/migration-guide-compiler-driven-config.md`](../docs/06-reference/migration-guide-compiler-driven-config.md)
- [`docs/06-reference/mock-adapter-integration.md`](../docs/06-reference/mock-adapter-integration.md) (precedence and env flags; still authoritative for non-production mock toggles)
