# Changelog entry: Execution Phase 2 (configuration system and shared types)

**Date:** 2026-04-04  
**Scope:** Phase 0 — [Execution Phase 2 — Configuration system and shared types](specs/00-core/00-foundation/EXECUTION-PLAN.md) (`tasks.md` §2: 0.14–0.22).

This entry records the configuration package work that satisfies Phase 0 acceptance for file-backed tenant config, Zod validation, env merge patches, caching, and schema documentation generation.

---

## Summary

- Split **Zod schemas** into focused modules: localization, platform/KPI, AI, feature flags, and composed `TenantConfig`.
- Introduced a **`ConfigManager`** class with **per-instance TTL cache**, directory resolution (unchanged discovery rules), and **deep JSON merge** from per-tenant environment variables before validation.
- Added **`ConfigValidationError`**, **`parseTenantConfigPayload` / `assertValidTenantConfig`**, optional **filesystem watch** for dev hot reload (`AGENTICVERDICT_CONFIG_HOT_RELOAD=1`), and a **`generate:schema-doc`** script (JSON Schema via `zod-to-json-schema`).
- Added a **second sample tenant** (`22222222-2222-4222-8222-222222222222.json`) alongside the existing Masafh file; **Vitest** coverage for manager, merge, middleware, schema edges, and repo configs.

---

## Environment variables

| Variable                                         | Purpose                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `TENANT_CONFIG_DIR`                              | Override directory for `<uuid>.json` tenant files                                      |
| `AGENTICVERDICT_TENANT_MERGE_<uuid_underscores>` | JSON object merged on top of the file config before validation                         |
| `AGENTICVERDICT_CONFIG_HOT_RELOAD`               | When `1` or `true`, `watchTenantConfigDirectory` invalidates cache on `*.json` changes |

---

## Added

- `packages/config/src/schemas/localization.ts`, `platform.ts`, `ai.ts`, `feature-flags.ts` (refactored `tenant.ts`).
- `packages/config/src/config-errors.ts`, `env-merge.ts`, `middleware.ts`, `hot-reload.ts`.
- `packages/config/scripts/generate-schema-reference.ts` → output `packages/config/generated/tenant-config.schema.md`.
- `packages/config/test/*.test.ts`, `packages/config/test/fixtures/tenants/*.json`.
- `configs/tenants/22222222-2222-4222-8222-222222222222.json`.

## Changed

- `packages/config/src/config-manager.ts`: class-based loading, TTL cache, env merge integration.
- `packages/config/src/index.ts`: public exports for schemas, manager, errors, env helpers, hot reload, middleware.
- `packages/config/package.json`: `generate:schema-doc` script; devDependencies `tsx`, `zod-to-json-schema`.

---

## Verification (local)

- `pnpm --filter @agenticverdict/config run test`
- `pnpm --filter @agenticverdict/config run generate:schema-doc`
- `pnpm exec turbo run build lint test typecheck`
- `pnpm run format:check`
- `pnpm run check:cycles`

---

## Follow-ups (not in this change set)

- Acceptance **§2** asks for **90%** coverage on config logic; current tests are substantial but not yet at that threshold across all branches (e.g. hot-reload paths, invalid env JSON).
- **E2E “app fails on invalid config”** belongs with `apps/api` / `apps/frontend` bootstrap once those apps load `ConfigManager` at startup.
- **`packages/types`**: `PlatformType` remains the shared enum source; `TenantConfig` stays on `@agenticverdict/config` to avoid a dependency cycle with Zod.

---

## Related documentation

- [`specs/00-core/00-foundation/EXECUTION-PLAN.md`](specs/00-core/00-foundation/EXECUTION-PLAN.md) — Execution Phase 2 definition.
- [`specs/00-core/00-foundation/tasks.md`](specs/00-core/00-foundation/tasks.md) — tasks 0.14–0.22.
