# Changelog: Web TanStack Start — Phase 3 (performance, CWV/RUM, advanced errors, coverage & CI)

**Date:** 2026-04-17  
**Scope:** Execution of **Phase 3 (Weeks 5–6) — Optimization** from [`web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md): route-level code splitting for non-critical surfaces, long-cache headers for hashed client assets, Core Web Vitals instrumentation with tenant correlation, structured tRPC → `AppError` mapping and centralized retry policy, bundle analysis tooling, scoped Vitest coverage thresholds for hooks and tRPC modules, production web build and scoped coverage in CI, Mantine `Image` with lazy loading for CLS hygiene, and an additional axe E2E for the authenticated dashboard. Aligns with [Decision 11](../docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support) (domain RPC on `apps/api`).

**Verification run:** `pnpm exec turbo run lint typecheck --filter=@agenticverdict/web`, `pnpm --filter @agenticverdict/web test`, `pnpm --filter @agenticverdict/web test:coverage`, `pnpm --filter @agenticverdict/web build`, `ANALYZE=true pnpm --filter @agenticverdict/web build` (local bundle treemap), `pnpm --filter @agenticverdict/web test:e2e` (recommended after a11y spec change).

---

## Summary

- **P3-1 Code splitting:** Auth routes (`/$locale/auth/*`) and **`/$locale/dashboard`** now use **`lazyRouteComponent`** with colocated **`-*.page.tsx`** modules so locale home and shell stay on the critical path while auth/dashboard chunks load on demand. **`rollup-plugin-visualizer`** runs when **`ANALYZE=true`** and writes **`dist/bundle-stats.html`** (gitignored via `dist/`). Script: **`pnpm --filter @agenticverdict/web run build:analyze`**.
- **P3-2 Images:** **`HomeContentClient`** includes a decorative **`/globe.svg`** via Mantine **`Image`** with fixed **120×120** layout and **`loading="lazy"`** to limit CLS on the marketing/home surface.
- **P3-3 Caching:** **Nitro** **`routeRules`** set **`cache-control: public, max-age=31536000, immutable`** for **`/assets/**`** (hashed Vite client chunks under `.output/public/assets`).
- **P3-4 RUM / CWV:** **`web-vitals`** (**LCP**, **INP**, **CLS**) reports structured **`[web-vitals]`** console lines with **`tenantId`** from **`getEffectiveTenantId`** (no PII). **`WebVitalsReporter`** is mounted once under **`trpc.Provider`** in **`Providers`**. Forwarding to an observability backend remains a Phase 4 follow-up.
- **P3-5 Error advanced:** **`trpc-retry-policy.ts`** centralizes query/mutation retry rules (no retry on stable tRPC client-error codes such as **`UNAUTHORIZED`** / **`BAD_REQUEST`**; transient/network and most 5xx paths retried). **`trpc-error-mapping.ts`** maps **`TRPCClientError`** to **`AppError`** for logging alignment with connector/server **`PlatformError`** semantics (browser never receives live **`PlatformError`** instances from tRPC). **`logWebClientError`** adds **`appErrorType`** / **`appErrorCode`** when mapping succeeds.
- **P3-6 Coverage push:** **`apps/frontend/vitest.config.mjs`** defines **scoped** coverage **`include`** ( **`useRequireAuth`**, tRPC modules, **`mfa-readiness`**, **`tenant-resolution`** ) and **thresholds** (lines/statements **≥ 70%**, branches **≥ 64%**, functions **≥ 62%**). Script **`test:coverage`** added. **ESLint** ignores **`coverage/**`** so HTML reports do not warn. Monorepo root **`vitest.config.ts`** still excludes **`apps/frontend/**`** from **global** thresholds; CI runs **scoped** web coverage explicitly.
- **CI:** **Quality** job runs **`pnpm --filter @agenticverdict/web exec vitest run --coverage`** and **`pnpm --filter @agenticverdict/web build`** so Phase 3 gates run on every PR.
- **A11y:** **`e2e/a11y-home.spec.ts`** adds an English **dashboard** axe scan after mock login (**`Test123!`**), complementing home + login WCAG smoke. The file uses **`test.describe.configure({ mode: "serial" })`** so the login flow is stable under Playwright parallel workers, and **`pressSequentially`** for email/password so Mantine **uncontrolled** form state matches the DOM (plain **`fill`** can leave validation stuck on “required”).

---

## Added

### `apps/frontend`

- **`src/routes/$locale/auth/-login.page.tsx`**, **`-register.page.tsx`**, **`-forgot-password.page.tsx`**, **`-reset-password.page.tsx`**, **`-verify-email.page.tsx`** — lazy route page modules (default export).
- **`src/routes/$locale/-dashboard.page.tsx`** — lazy dashboard page module.
- **`src/lib/api/trpc-retry-policy.ts`** — **`shouldRetryTrpcQuery`** / **`shouldRetryTrpcMutation`**.
- **`src/lib/api/trpc-retry-policy.test.ts`** — retry classification tests.
- **`src/lib/api/trpc-error-mapping.ts`** — **`trpcClientErrorToAppError`**.
- **`src/lib/api/trpc-error-mapping.test.ts`** — mapping smoke tests.
- **`src/lib/observability/web-vitals.ts`** — CWV registration and structured logging.
- **`src/components/observability/WebVitalsReporter.tsx`** — client-only effect wrapper.

### Dependencies

- **`web-vitals`** (runtime), **`rollup-plugin-visualizer`** (dev).

---

## Changed

### `apps/frontend`

- **`src/lib/api/trpc-client.ts`** — uses **`trpc-retry-policy`** for default React Query retries.
- **`src/lib/observability/client-log.ts`** — enriches payload with mapped **`AppError`** type/code when applicable.
- **`src/lib/api/trpc-error-message.test.ts`** — covers **`TRPCClientError`** path.
- **`src/components/Providers.tsx`** — mounts **`WebVitalsReporter`**.
- **`src/components/home/HomeContentClient.tsx`** — Mantine **`Image`** for **`/globe.svg`**.
- **`vite.config.ts`** — Nitro **`routeRules`** for **`/assets/**`**; conditional **`rollup-plugin-visualizer`** when **`ANALYZE=true`\*\*.
- **`package.json`** — **`build:analyze`**, **`test:coverage`** scripts.
- **`vitest.config.mjs`** — scoped coverage **`include`** / **`thresholds`** / **`exclude`** (**`app-router.stub`**).
- **`eslint.config.mjs`** — ignore **`coverage/**`\*\*.

### `.github/workflows/ci.yml`

- Steps: **Web app unit coverage (scoped hooks + tRPC modules)**, **Web production build**.

### `apps/frontend/e2e`

- **`a11y-home.spec.ts`** — post-login dashboard axe test.

---

## Work packages mapping

| Plan ID | Delivered in this change                                                            |
| ------- | ----------------------------------------------------------------------------------- |
| P3-1    | `lazyRouteComponent` + `-*.page` chunks; `build:analyze` + visualizer; CI web build |
| P3-2    | Mantine `Image`, lazy load, reserved dimensions                                     |
| P3-3    | Nitro `routeRules` for `/assets/**` immutable cache                                 |
| P3-4    | `web-vitals` + tenant id on console payload; `WebVitalsReporter`                    |
| P3-5    | `trpc-retry-policy`, `trpc-error-mapping`, `logWebClientError` enrichment           |
| P3-6    | Scoped `test:coverage` thresholds; CI step; eslint `coverage` ignore                |

---

## Deferred / follow-ups (Phase 4+)

- **Ship CWV / errors to observability backend** (OpenTelemetry web, vendor RUM, or internal ingest) with sampling and privacy review.
- **Lab or RUM dashboards** for LCP / INP / CLS against a reference tenant and environment (plan Success Metrics).
- **Raise coverage** to **≥ 85%** on additional globs (`src/lib/utils`, validations) per testing strategy when ready.
- **Upload `bundle-stats.html`** as a CI artifact for PR review (optional; file is local-only today).

---

## References

- [`docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md) — Phase 3 exit criteria and work packages.
- [`docs/architecture/ui/04-decision-record.md`](../docs/architecture/ui/04-decision-record.md) — Decision 11 (tRPC unified API).
- [`changelog/2026-04-17-web-tanstack-phase-2-auth-rtl-a11y-testing.md`](2026-04-17-web-tanstack-phase-2-auth-rtl-a11y-testing.md) — Phase 2 baseline.
- [`packages/data-connectors/src/errors.ts`](../packages/data-connectors/src/errors.ts) — server **`PlatformError`** hierarchy (tRPC surfaces as coded client errors in the browser).
