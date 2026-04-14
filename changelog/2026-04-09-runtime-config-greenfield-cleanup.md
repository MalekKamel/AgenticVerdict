# Changelog entry: Runtime configuration deduplication and greenfield API cleanup

**Date:** 2026-04-09  
**Scope:** Follow-up to `changelog/2026-04-08-layered-runtime-config-docker-mock-adapters.md`. Removes parallel/legacy surfaces introduced during the layered-config rollout so there is **one** env parser for mock toggles, **one** convenience config object on the public API, and **`RuntimeConfig`** fields that match actual `isMockEnabledForPlatform` semantics. Assumes **no backward compatibility** outside this monorepo (greenfield).

This entry is **documentation + API tightening only** for the config and platform-adapter packages: no database migrations, no Docker or Compose file changes, and no changes to production bundle verification behavior beyond what already passed after the edits.

---

## Summary

- **Deleted** `packages/config/src/schemas/mock-adapters.ts` and **`mock-adapters.test.ts`**. Mock-related environment variables are parsed only in **`packages/config/src/configuration.ts`** (`parseBinaryFlag`, `isMockEnabledForPlatform`, `buildRuntimeConfig`); the validated aggregate remains **`RuntimeConfig`** / **`runtimeConfigSchema`** in **`schemas/runtime-config.ts`**.
- **Corrected** `RuntimeConfig.adapters.mocks`: **`enabled`** is true when **at least one** platform is mock-enabled (including **per-platform-only** env such as `AGENTICVERDICT_MOCK_GA4=1` without the master flag). **`platforms`** lists exactly those platforms instead of always mirroring the full enum or an empty list.
- **Removed** the standalone **`MOCK_ADAPTERS_ENABLED`** export from **`@agenticverdict/config`**. Build-time coarse signal stays on **`BUILD_CONFIG.mockAdaptersEnabled`** (`NODE_ENV !== "production"`); runtime eligibility for applying env toggles uses **`canEnableMocksViaEnv`** and **`ConfigurationService`** / **`isMockEnabledForPlatform`**.
- **Removed** the redundant **`appConfig`** export; **`config`** is the single accessor object (`config.build`, `config.runtime`, `config.mocksEnabled`, `config.isMockEnabledForPlatform`).
- **`@agenticverdict/platform-adapters`** re-exports **`config`** from **`@agenticverdict/config/configuration`** (dropped the **`adapterConfig`** alias).
- **Documentation** updates: mock adapter integration guide (§2.4), compiler-driven migration guide (imports and `canEnableMocksViaEnv` vs `BUILD_CONFIG`), **`CLAUDE.md`**, manual testing guide (Layer 2 wording), research solution summary snippet, and cross-links from the layered changelog.

---

## Removed

### `packages/config`

| Item                                                                                                                     | Notes                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **`src/schemas/mock-adapters.ts`**                                                                                       | Duplicate Zod surface for the same env keys; parsing rules diverged from security throws in `isMockEnabledForPlatform`.   |
| **`src/schemas/mock-adapters.test.ts`**                                                                                  | Coverage replaced by **`configuration.test.ts`** (including per-platform-only mock enablement).                           |
| Barrel exports **`mockAdapterEnvSchema`**, **`parseMockAdapterEnv`**, **`MockAdapterEnv`**, **`MockAdapterScenarioEnv`** | Consumers should use **`ConfigurationService.load`**, **`config.runtime()`**, or **`isMockEnabledForPlatform`** directly. |
| **`MOCK_ADAPTERS_ENABLED`** (top-level export)                                                                           | Replaced by **`BUILD_CONFIG.mockAdaptersEnabled`** plus runtime helpers above.                                            |
| **`appConfig`** export                                                                                                   | Duplicate of **`config`**; removed to avoid two names for the same object.                                                |

### `packages/platform-adapters`

| Item                          | Notes                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| **`adapterConfig`** re-export | Use **`config`** from **`@agenticverdict/platform-adapters`** or **`@agenticverdict/config`**. |

---

## Changed

### `packages/config/src/build-constants.ts`

- Introduced internal **`mockAdaptersPermittedByBuild`** feeding **`BUILD_CONFIG.mockAdaptersEnabled`**, with a comment that **actual** mock usage requires **`ConfigurationService`** / env toggles, not this flag alone.

### `packages/config/src/configuration.ts`

- **`mockEnabledPlatformsFromEnv`**: filters **`ALL_MOCK_PLATFORMS`** with **`isMockEnabledForPlatform`** when **`canEnableMocksViaEnv`** is true.
- **`buildRuntimeConfig`**: sets **`adapters.mocks.enabled`** from **`mockPlatforms.length > 0`** and **`adapters.mocks.platforms`** from that list.

### `packages/config/src/configuration.test.ts`

- Clears **`AGENTICVERDICT_MOCK_GA4`** in **`afterEach`** where needed.
- New test: master flag unset, **`AGENTICVERDICT_MOCK_GA4=1`** → **`enabled: true`**, **`platforms: ["ga4"]`**.

### `packages/config/src/build-constants.test.ts`

- Assertions use **`BUILD_CONFIG.mockAdaptersEnabled`** instead of the removed **`MOCK_ADAPTERS_ENABLED`** binding.

### `packages/platform-adapters/src/adapter-factory.ts` and **`src/index.ts`**

- Re-export **`config`** (no alias).

---

## Breaking changes

Intentional for greenfield; update any external or forked code that relied on:

1. **`import { MOCK_ADAPTERS_ENABLED } from "@agenticverdict/config"`** → use **`BUILD_CONFIG.mockAdaptersEnabled`** and/or **`canEnableMocksViaEnv`**.
2. **`import { appConfig } from "@agenticverdict/config"`** → use **`config`**.
3. **`import { adapterConfig } from "@agenticverdict/platform-adapters"`** → use **`config`**.
4. **`mockAdapterEnvSchema` / `parseMockAdapterEnv`** → use **`ConfigurationService`**, **`runtimeConfigSchema`**, or **`isMockEnabledForPlatform`**.

---

## Migration notes

**Prefer:**

```typescript
import {
  BUILD_CONFIG,
  canEnableMocksViaEnv,
  config,
  ConfigurationService,
} from "@agenticverdict/config";
```

- **`BUILD_CONFIG.mockAdaptersEnabled`**: coarse “non-production build” signal (startup logs, coarse UI).
- **`canEnableMocksViaEnv(env)`**: whether mock **env** toggles are allowed (blocks production/staging-style processes).
- **`ConfigurationService.load()`** or **`config.runtime()`**: full validated **`RuntimeConfig`** snapshot.
- **`isMockEnabledForPlatform(platform, env?)`**: per-platform decision (matches adapter factory when not forcing **`useMock`**).

**Adapter factory consumers** continue to use **`createPlatformAdapter`**; mock selection semantics are unchanged aside from **`RuntimeConfig`** accuracy.

---

## Verification

Commands run after this cleanup:

- **`pnpm exec vitest run packages/config`**
- **`pnpm check:cycles`**
- **`pnpm typecheck`**
- **`pnpm verify:production-bundle`** (API/worker Vite bundles + adapter-factory smoke bundle: **no mock symbols** in scanned outputs)

---

## Related documentation

- `docs/06-reference/mock-adapter-integration.md` (§2.4 validation / `RuntimeConfig` pointer; examples use **`AGENTICVERDICT_*`** names)
- `docs/06-reference/migration-guide-compiler-driven-config.md` (barrel imports; **`canEnableMocksViaEnv`** vs **`BUILD_CONFIG.mockAdaptersEnabled`**)
- `CLAUDE.md` (Layer 2 runtime configuration wording)
- `tests/docs/manual-testing-guide.md` (Layer 2 — **`config`** only)
- `docs/04-technology-research/docker-mock-adapter-solution-summary.md` (snippet: re-export **`config`**)

---

## Related changelog entries

- **`changelog/2026-04-08-layered-runtime-config-docker-mock-adapters.md`** — original layered runtime config, Docker stages, feature flags, observability (this cleanup refines that work)
- **`changelog/2026-04-08-compiler-driven-adapter-config.md`** — **`build-constants`** and production bundle verification (**note:** that entry’s summary still names **`MOCK_ADAPTERS_ENABLED`**; the **standalone export** was removed in favor of **`BUILD_CONFIG.mockAdaptersEnabled`** as documented here)
- **`changelog/2026-04-07-phase-01-mock-adapter-integration.md`** — historical note: introduced **`mock-adapters`** schema (since removed; see **Removed** above)
