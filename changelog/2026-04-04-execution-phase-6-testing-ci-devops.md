# Changelog entry: Execution Phase 6 (testing hardening, CI/CD, DevOps)

**Date:** 2026-04-04  
**Scope:** Phase 0 — [Execution Phase 6 — Testing hardening and CI/CD](docs/03-development-phases/phase-00-foundation/EXECUTION-PLAN.md) (`tasks.md` §9: 0.84–0.93, §10: 0.97–0.102 and related).

---

## Summary

- **Root Vitest workspace**
  - `vitest.config.ts` uses `test.projects` (monorepo packages + `apps/web`) with **`@vitest/coverage-v8`**, merged coverage, **70% line/statement** thresholds on **instrumented foundation code** (stub apps and DB connection-layer files excluded from coverage scope; see comments in config).
  - Root scripts: **`pnpm run test:unit`**, **`pnpm run test:coverage`**, **`pnpm run test:integration`** (Turbo → `@agenticverdict/database` Testcontainers suite), **`pnpm run test:e2e`** (Turbo → web Playwright).
- **`@agenticverdict/testing`**
  - Shared **`createTestCompanyConfig`**, **`createTestTenantContext`**, stable **tenant UUID constants** (including RLS test IDs), with unit tests.
- **`docker-compose.yml`**
  - Postgres 16 + Redis 7 with healthchecks for local dev (aligned with `.env.example`).
- **`.env.example`**
  - Expanded: `NODE_ENV`, `REDIS_URL`, optional Upstash vars, optional config hot-reload and env-merge hints.
- **GitHub Actions** — `.github/workflows/ci.yml`
  - **Quality:** `format:check`, `turbo run lint typecheck`, `check:cycles`, **`vitest run --coverage`** (single run).
  - **E2E:** Playwright after quality; triggers when `apps/web/playwright.config.mjs` exists.
  - Concurrency group; push branches: `main`, `feature/**`.
- **`apps/web`**
  - **Playwright** (`playwright.config.mjs`, port **3333**, `webServer` sets **`COMPANY_CONFIG_DIR`** for `loadCompanyConfig`); **`e2e/locale-smoke.spec.ts`** (en LTR / ar RTL).
  - **`vitest.config.ts`** for future unit/component tests.
  - **Fix:** `[locale]/layout.tsx` wraps the shell in **`NextIntlClientProvider`** + **`setRequestLocale`** so client hooks (`useTranslations`, etc.) work under **`next start`** (production / E2E).
- **README**
  - `pnpm run db:up`, corrected **pnpm** typo, **`turbo run typecheck`**, documented test scripts.

---

## Verification (local)

```bash
pnpm run db:up
pnpm run format:check
pnpm exec turbo run lint typecheck
pnpm run check:cycles
pnpm exec vitest run --coverage
pnpm --filter @agenticverdict/database run test:integration   # requires Docker
pnpm run test:e2e
```

---

## Carry-overs

- **0.89** API testing utilities — not added (no HTTP surface requirement in Phase 0 beyond health routes).
- **0.92** Performance testing utilities — deferred (low priority in `tasks.md`).
- **CI database integration tests** — omitted (no Postgres service in workflow); run locally via `pnpm run test:integration`.

---

## Related documentation

- [`docs/03-development-phases/phase-00-foundation/EXECUTION-PLAN.md`](docs/03-development-phases/phase-00-foundation/EXECUTION-PLAN.md) — Execution Phase 6.
- [`docs/03-development-phases/phase-00-foundation/acceptance-criteria.md`](docs/03-development-phases/phase-00-foundation/acceptance-criteria.md) — §7 Testing Infrastructure.
