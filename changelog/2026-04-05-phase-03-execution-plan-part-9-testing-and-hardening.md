# Changelog entry: Phase 03 execution plan — Part 9 testing and hardening (Weeks 35–38)

**Date:** 2026-04-05  
**Scope:** [Execution plan Part 9](specs/00-core/03-insights/execution-plan.md) — **integration & security tests** (Vitest): dedicated-tenant **report write rate limit** (`429` + `Retry-After`), **cross-tenant report download** isolation, **invalid share token**, **oversized title** / **non-UUID** param validation, **concurrent list** smoke, **template preview** `lang`/`dir` assertions for RTL accessibility. **Performance:** `template-rendering-perf.test.ts` adds **executive-summary** iteration budget. **E2E:** `@axe-core/playwright` **WCAG 2 A/AA** smoke on `/en` and `/ar`; **Playwright** uses **webpack** `next build` for the preview server (Turbopack client bundle could not load `node:fs` from the `@agenticverdict/i18n` barrel). **Cross-browser:** Firefox + WebKit projects run when **`CI=true`** or **`E2E_ALL_BROWSERS=1`** (after `playwright install`). **i18n package:** export `@agenticverdict/i18n/formatters` so the web client does not pull `load-messages` / `fs`. **UI polish:** Mantine **primaryShade**, language switcher **outline** inactive state, **gray.7** secondary text, **outline** badge — to satisfy axe **color-contrast**. **API Vitest:** `fileParallelism: false`; **`__clearRateLimitMemoryForTests`** on in-memory rate limiter. **Docs:** [`docs/06-reference/runbooks/phase-03-testing-and-production-readiness.md`](docs/06-reference/runbooks/phase-03-testing-and-production-readiness.md). **Not in repo:** formal pen-test, k6/Artillery scripts, real staging/prod deploy, 24/7 on-call dashboards.

---

## Summary

- **`apps/api` — `middleware/rate-limit.ts`:** `__clearRateLimitMemoryForTests()` clears the in-memory fixed window map.
- **`apps/api` — `vitest.config.ts`:** `fileParallelism: false` avoids cross-file flakes on shared rate-limit state.
- **`apps/api` — `api.contract.test.ts`:** Part 9 scenarios (see Scope); `beforeEach` calls `__clearRateLimitMemoryForTests`.
- **`packages/report-generator` — `template-rendering-perf.test.ts`:** Executive-summary perf smoke case.
- **`packages/i18n` — `package.json`:** `exports["./formatters"]` → `src/formatters.ts`.
- **`apps/web` — `HomeContentClient.tsx`:** Import formatters from `@agenticverdict/i18n/formatters`; subtitle + demo **Badge** contrast.
- **`apps/web` — `Providers.tsx`:** `createTheme` with `primaryShade` for filled controls.
- **`apps/web` — `LanguageSwitcher.tsx`:** Inactive locale `variant="outline"`.
- **`apps/web` — `AppShellLayout.tsx`:** Navbar hint uses `gray.7` instead of `dimmed`.
- **`apps/web` — `playwright.config.mjs`:** `next build` + `next start` for E2E; conditional Firefox/WebKit projects.
- **`apps/web` — `e2e/a11y-home.spec.ts`:** Axe **wcag2a** + **wcag2aa** on EN/AR home.
- **`apps/web` — `package.json`:** devDependency `@axe-core/playwright`.

---

## Verification (local)

```bash
pnpm --filter @agenticverdict/api test
pnpm --filter @agenticverdict/report-generator test -- src/template-rendering-perf.test.ts
pnpm --filter @agenticverdict/web test:e2e
# Optional full browser matrix (install browsers first):
# pnpm exec playwright install
# E2E_ALL_BROWSERS=1 pnpm --filter @agenticverdict/web test:e2e
```

---

## Follow-ups (not in this change)

- **Load tests:** committed k6 or Artillery scenarios and CI job.
- **E2E against API:** Playwright or supertest against a running `@agenticverdict/api` instance (not only Next.js).
- **Darker theme tokens** for dark mode + high-contrast scheme audits.
- **Replace in-memory** report/rate-limit stores with Redis + Postgres for multi-instance accuracy.

---

## Related documentation

- [`specs/00-core/03-insights/execution-plan.md`](specs/00-core/03-insights/execution-plan.md) — Part 9 (Weeks 35–38)
- [`docs/06-reference/runbooks/phase-03-testing-and-production-readiness.md`](docs/06-reference/runbooks/phase-03-testing-and-production-readiness.md)
- [`changelog/2026-04-05-phase-03-execution-plan-part-8-history-versioning.md`](changelog/2026-04-05-phase-03-execution-plan-part-8-history-versioning.md)
