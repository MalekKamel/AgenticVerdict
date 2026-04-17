# Web app unit test coverage (scoped gate)

**Date:** 2026-04-17  
**Scope:** `apps/frontend` Vitest coverage (package-local; monorepo root Vitest excludes `apps/frontend/**`).

## Agreed globs

Coverage **include** paths are listed in `apps/frontend/vitest.config.mjs` under `test.coverage.include`. They intentionally focus on:

- tRPC client surface (`src/lib/api/trpc-*.ts`)
- Auth guard (`src/hooks/useRequireAuth.ts`)
- Tenant, observability (including `client-log`, `web-vitals`, `telemetry-sample-rate`), onboarding, and feature-flag readiness helpers

Broader `src/lib/**` and route modules are covered incrementally; thresholds are raised in small steps to avoid churn.

## Current floor (CI)

Vitest `coverage.thresholds` in `apps/frontend/vitest.config.mjs` are the enforced gate for `pnpm --filter @agenticverdict/web exec vitest run --coverage` (also run from root CI).

Target trajectory aligns with the repository testing strategy (~85% for business-critical modules); web reaches that on these globs first, then expands the include list.

## Aggregation

Monorepo-wide coverage aggregation is **not** required for this gate; keep `apps/frontend` package-local until the team standardizes Turbo coverage merge.
