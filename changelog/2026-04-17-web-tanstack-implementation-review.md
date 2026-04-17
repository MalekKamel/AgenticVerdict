# Web TanStack Start — post-phase implementation review

**Date:** 2026-04-17  
**Location:** `changelog/` (implementation-period artifact; not a long-lived architecture SSOT—promote excerpts to `docs/architecture/` if the team wants a standing reference.)  
**Sources:** [`docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md), phase changelogs `changelog/2026-04-17-web-tanstack-phase-*.md`, and repository inspection of `apps/frontend/`.

---

## Executive summary

Phases 1–4 delivered a coherent **TanStack Start + Router + tRPC client** foundation with **tenant-aware headers**, **route error boundaries**, **session-based auth guarding**, **lazy route chunks**, **CWV console instrumentation with optional telemetry forwarding**, **Nitro cache and security headers**, and **gated tenant-ops surfaces** (mock feature flags, onboarding, white-label theme for a reference tenant). Overall readiness is **strong for continued integration** with the real API contract and production auth, but **not fully production-complete**: the **shared `AppRouter` type**, **real session/cookie-backed auth**, **lab/RUM success metrics**, **≥85% coverage on scoped business modules**, and several **Phase 4 operational items** (CSP, blocking audit policy, deploy/rollback automation, SAST/DAST) remain **open or partial**.

---

## Phase-by-phase assessment

### Phase 1 — Foundation (tenant, tRPC, errors, logging)

| Aspect               | Evidence                                                                                                                                                                                                                                                          | Verdict                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Stack / routing SSOT | `apps/frontend/README.md` version table; `src/router.tsx` imports `./routeTree.gen`; root `.gitignore` ignores `routeTree.gen.ts`; CI runs `pnpm --filter @agenticverdict/web build` (`.github/workflows/ci.yml`)                                                 | **Complete** for documented approach (generated tree, not committed).                                                        |
| Tenant root          | `apps/frontend/src/providers/TenantProvider.tsx`, `apps/frontend/src/lib/tenant/tenant-resolution.ts` + tests                                                                                                                                                     | **Complete** for auth-preferring + optional dev UUID; subdomain slug→UUID remains follow-up per changelog.                   |
| tRPC wiring          | `apps/frontend/src/lib/api/trpc-client.ts`, `buildTrpcHeaders()` tests                                                                                                                                                                                            | **Partial** — headers and client are real; **`AppRouter` is still a stub** (`apps/frontend/src/lib/api/app-router.stub.ts`). |
| Error baseline       | `apps/frontend/src/components/errors/AppRouteError.tsx`, `apps/frontend/src/lib/api/trpc-error-message.ts`, `errorComponent` on `apps/frontend/src/routes/__root.tsx`, `apps/frontend/src/routes/$locale/route.tsx`, `apps/frontend/src/routes/$locale/index.tsx` | **Complete** for baseline UX.                                                                                                |
| Logging              | `apps/frontend/src/lib/observability/client-log.ts`                                                                                                                                                                                                               | **Complete** for structured client logging; Phase 4 adds optional ingest.                                                    |

**Verdict:** **Complete** for Phase 1 scope, with an explicit **typing/integration debt** on the shared router.

---

### Phase 2 — Auth, RTL/a11y, testing & CI

| Aspect              | Evidence                                                                                                                                                                                                                      | Verdict                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Auth hardening      | `apps/frontend/src/providers/SessionProvider.tsx`, `apps/frontend/src/hooks/useRequireAuth.ts` + tests, `apps/frontend/src/lib/api/auth-api.ts` mock session bridge + tests, `apps/frontend/src/routes/$locale/dashboard.tsx` | **Partial** — behavior is consistent for **mock** session; **no `beforeLoad`/SSR session** yet (documented deferral). |
| MFA readiness       | `apps/frontend/src/lib/auth/mfa-readiness.ts` + tests, `apps/frontend/src/vite-env.d.ts`                                                                                                                                      | **Complete** as types + env gate (UI off by default).                                                                 |
| Design tokens in CI | `pnpm run validate:pen-files` in `.github/workflows/ci.yml`                                                                                                                                                                   | **Complete**.                                                                                                         |
| RTL / a11y          | `eslint-plugin-jsx-a11y` in `apps/frontend/eslint.config.mjs`; `apps/frontend/e2e/a11y-home.spec.ts` (home + login LTR/RTL)                                                                                                   | **Complete** for baseline; not an exhaustive site audit.                                                              |
| Test infra          | New unit tests listed in phase-2 changelog; monorepo coverage gate still excludes `apps/frontend/**` broadly (see Phase 3)                                                                                                    | **Partial** — infra improved; **global strategy** still split.                                                        |

**Verdict:** **Partial** — strong client-side guard + CI quality gates; **production auth parity** and **Storybook/docs** (plan optional) not done.

---

### Phase 3 — Performance, CWV, advanced errors, coverage

| Aspect               | Evidence                                                                                                                                                | Verdict                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Code splitting       | Lazy `-* .page.tsx` under `apps/frontend/src/routes/`; `rollup-plugin-visualizer` when `ANALYZE=true` (`apps/frontend/vite.config.ts`, `build:analyze`) | **Complete** for implemented routes.                                                                                        |
| Images / CLS hygiene | `apps/frontend/src/components/home/HomeContentClient.tsx` (Mantine `Image`, lazy, dimensions)                                                           | **Complete** for that surface only.                                                                                         |
| Caching              | Nitro `routeRules` for `/assets/**` in `apps/frontend/vite.config.ts`                                                                                   | **Complete** for hashed assets path.                                                                                        |
| RUM / CWV            | `apps/frontend/src/lib/observability/web-vitals.ts`, `apps/frontend/src/components/observability/WebVitalsReporter.tsx`                                 | **Partial** — **structured console + tenant id**; plan’s **lab/RUM thresholds** (LCP/INP/CLS) **not demonstrated** in-repo. |
| Error advanced       | `apps/frontend/src/lib/api/trpc-retry-policy.ts`, `apps/frontend/src/lib/api/trpc-error-mapping.ts` + tests                                             | **Complete** for client policy + mapping.                                                                                   |
| Coverage             | `apps/frontend/vitest.config.mjs` scoped includes + thresholds (~70% lines / stepped branches)                                                          | **Partial** — **not** the plan’s **≥85%** on designated business modules; intentionally narrower gate.                      |

**Verdict:** **Partial** — engineering deliverables are in place; **success metrics** for CWV and coverage are **not fully met** as written in the plan.

---

### Phase 4 — Observability ingest, security, tenant ops

| Aspect                | Evidence                                                                                                                            | Verdict                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Observability         | `apps/frontend/src/lib/observability/telemetry-ingest.ts` + tests; wiring in `client-log.ts`, `web-vitals.ts`, onboarding analytics | **Partial** — **optional** `VITE_PUBLIC_TELEMETRY_INGEST_URL`; backend contract/auth/sampling **follow-up**. |
| Deployment / rollback | Documented only as operational expectation in phase-4 changelog; no new pipeline in repo                                            | **At risk** vs plan exit criteria (rollback **exercised**, automation)—**not evidenced** in code.            |
| Security              | Nitro headers on `/**` in `apps/frontend/vite.config.ts`; informational `pnpm audit` in CI with artifact                            | **Partial** — **no CSP**; audit **non-blocking**; SAST/DAST/pen-test **out of scope** per changelog.         |
| Feature flags UI      | `apps/frontend/src/routes/$locale/dashboard/feature-flags.tsx`, `mock-feature-flag-snapshot.ts`, env gate                           | **Partial** — **mock rows** until `trpc.admin.featureFlags.list` (or equivalent).                            |
| White-label           | `apps/frontend/src/components/providers/TenantBrandedThemeProvider.tsx`, `apps/frontend/src/lib/tenant/tenant-branding.ts`          | **Partial** — **reference UUID** mapping; **CompanyConfig-driven** theme **deferred**.                       |
| Onboarding            | `apps/frontend/src/routes/$locale/onboarding.tsx`, readiness + `onboarding-analytics.ts`, env gate                                  | **Partial** — **product-gated**; analytics wired to same ingest path.                                        |

**Verdict:** **Partial** — valuable **optional** production hooks and **security baselines**; **Phase 4 exit criteria** for **on-call/rollback** and **full security program** are **not fully satisfied** in-repository.

---

## Stubs and incomplete areas

1. **`apps/frontend/src/lib/api/app-router.stub.ts`** — Minimal `AppRouter` with `_webClientProbe`; replace with shared export from `@agenticverdict/api` (or equivalent) when available.
2. **`apps/frontend/src/lib/api/auth-api.ts`** — **Mock browser session** and mock user until real `auth.getSession` / cookies / tRPC procedures are wired end-to-end.
3. **`apps/frontend/src/lib/feature-flags/mock-feature-flag-snapshot.ts`** — **`getMockFeatureFlagAdminRows()`** for dashboard UI; real reads via **`createFeatureFlagService`** + RBAC still pending.
4. **`apps/frontend/src/lib/tenant/tenant-branding.ts`** — UUID → packaged brand tokens; **CompanyConfig**-driven fetch not implemented (risk of theme flash noted in changelog).
5. **`apps/frontend/src/providers/TRPCProvider.tsx`** — Legacy **placeholder** context (`isInitialized: false`); **not** used by `apps/frontend/src/components/Providers.tsx` (actual stack uses `@trpc/react-query`). **Stale** relative to current integration; `apps/frontend/src/lib/api/README.md` / `AUTH_API_USAGE.md` still describe wrapping with `TRPCProvider`.
6. **Env-gated product surfaces** — `VITE_PUBLIC_ENABLE_MFA_UI`, `VITE_PUBLIC_ENABLE_FEATURE_FLAGS_ADMIN_UI`, `VITE_PUBLIC_ENABLE_ONBOARDING_WIZARD`, `VITE_PUBLIC_TELEMETRY_INGEST_URL` (see `apps/frontend/src/vite-env.d.ts` and readiness modules).
7. **Tenant resolution** — Browser **subdomain/path slug → tenant UUID** not implemented (auth store + dev default only); aligns with `packages/core` server-side resolution as future work.

---

## Gaps and missing work (prioritized)

| Priority | Item                                                                                                             | Rationale                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **P0**   | **Shared tRPC `AppRouter` + generated client types**                                                             | Eliminates stub drift; unlocks real procedures and type-safe usage across web/api.                        |
| **P0**   | **Production auth path** (cookies or bearer + `getSession` via API)                                              | Mock session cannot satisfy security/tenant isolation acceptance for real deployments.                    |
| **P1**   | **CSP + security header review**                                                                                 | Phase 4 calls out CSP absent; needed before strict hardening.                                             |
| **P1**   | **Telemetry ingest backend** — auth, schema, sampling, PII review                                                | `sendBeacon`/`fetch` without a controlled endpoint is incomplete operations-wise.                         |
| **P1**   | **Dependency audit remediation**                                                                                 | CI audit is informational; backlog blocks “failing the build on audit” per org policy.                    |
| **P2**   | **Lab or RUM dashboards** for CWV vs plan metrics                                                                | Instrumentation exists; **no** in-repo proof of LCP/INP/CLS targets.                                      |
| **P2**   | **Coverage expansion** toward testing-strategy **85%+** on agreed globs                                          | Scoped ~70% gate is explicit stopgap.                                                                     |
| **P2**   | **`beforeLoad`/SSR-aware auth** for protected routes                                                             | Avoids client-only flash and aligns with TanStack Router server patterns when session is server-readable. |
| **P2**   | **Deploy/rollback automation + exercised drill**                                                                 | Plan exit criteria; only narrative expectation in changelog today.                                        |
| **P2**   | **SAST/DAST / pen-test scheduling**                                                                              | Explicitly deferred; required for full “production readiness” narrative.                                  |
| **P3**   | **Storybook/Ladle or alternative**                                                                               | Plan open question; not started.                                                                          |
| **P3**   | **Documentation cleanup** — remove or redirect **TRPCProvider** instructions in `apps/frontend/src/lib/api/*.md` | Reduces onboarding confusion.                                                                             |

---

## Recommended next steps

| Action                                                                                                                | Suggested ownership    |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Export **`AppRouter`** (or shared contract package) from API; switch web imports from `app-router.stub.ts`            | Code (API + web)       |
| Implement **session API** and replace **mock** `auth-api` paths; add **integration tests** for session + tRPC headers | Code                   |
| Define **CSP** strategy (nonce/hash) for TanStack + Mantine; implement in Nitro                                       | Code + security review |
| Stand up **telemetry ingest** (or vendor) with **authentication** and **retention** policy                            | Infra + code           |
| Triage **`pnpm audit`** findings and schedule upgrades                                                                | Process + code         |
| Add **minimal RUM dashboard** or CI **lab** job documenting reference tenant/environment                              | Infra + QA             |
| Revisit **Vitest** globs to add **`apps/frontend`** to monorepo thresholds or keep **package-local 85%** target       | Process + code         |
| **Tabletop** rollback on staging; document **runbook** steps in `docs/`                                               | Ops + docs             |
| Archive or refactor **`TRPCProvider.tsx`** and align **README** docs with `Providers.tsx`                             | Code + docs            |

---

## Appendix — Plan / changelog / files (selected)

| Plan theme                       | Changelog               | Key files                                                                                                                                                                              |
| -------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rec 1 — TanStack Start / routing | Phase 1                 | `apps/frontend/vite.config.ts`, `apps/frontend/src/routes/`, `apps/frontend/src/router.tsx`, `apps/frontend/README.md`                                                                 |
| Rec 2 — Tenant context           | Phases 1, 4             | `apps/frontend/src/providers/TenantProvider.tsx`, `apps/frontend/src/lib/tenant/tenant-resolution.ts`, `apps/frontend/src/lib/tenant/tenant-branding.ts`                               |
| Rec 3 — Errors / observability   | Phases 1, 3, 4          | `apps/frontend/src/components/errors/AppRouteError.tsx`, `apps/frontend/src/lib/api/trpc-error-*.ts`, `apps/frontend/src/lib/observability/*`                                          |
| Rec 4 — Auth / MFA               | Phases 2, 4 (MFA types) | `apps/frontend/src/hooks/useRequireAuth.ts`, `apps/frontend/src/providers/SessionProvider.tsx`, `apps/frontend/src/lib/api/auth-api.ts`, `apps/frontend/src/lib/auth/mfa-readiness.ts` |
| Rec 5 — Performance              | Phase 3                 | `apps/frontend/vite.config.ts` (lazy, visualizer, Nitro rules), route `-* .page.tsx` files                                                                                             |
| Rec 6 — Testing                  | Phases 2–3              | `apps/frontend/vitest.config.mjs`, `apps/frontend/e2e/a11y-home.spec.ts`, `.github/workflows/ci.yml`                                                                                   |
| Rec 7 — Design / RTL             | Phases 2, 4             | `apps/frontend/eslint.config.mjs`, `apps/frontend/src/components/auth/*`, `TenantBrandedThemeProvider`                                                                                 |
| Rec 8 — Advanced tenancy         | Phase 4                 | `apps/frontend/src/routes/$locale/dashboard/feature-flags.tsx`, `apps/frontend/src/routes/$locale/onboarding.tsx`, feature-flag + onboarding libs                                      |
| Rec 9 — DX                       | Partial                 | CI + README; no Storybook                                                                                                                                                              |
| Rec 10 — Production readiness    | Phase 4 (partial)       | `telemetry-ingest.ts`, Nitro headers, CI audit artifact                                                                                                                                |

**Changelog index:**  
`changelog/2026-04-17-web-tanstack-phase-1-foundation-tenant-trpc-errors.md` ·  
`changelog/2026-04-17-web-tanstack-phase-2-auth-rtl-a11y-testing.md` ·  
`changelog/2026-04-17-web-tanstack-phase-3-performance-cwv-coverage.md` ·  
`changelog/2026-04-17-web-tanstack-phase-4-production-security-tenant-ops.md`

---

**Document control**  
**Version:** 1.0  
**Method:** Review against plan + phase changelogs + targeted code reads (2026-04-17).
