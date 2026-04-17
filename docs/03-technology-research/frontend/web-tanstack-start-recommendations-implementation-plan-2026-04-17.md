# TanStack Start recommendations — implementation plan (AgenticVerdict)

**Date:** 2026-04-17  
**Status:** Authoritative planning artifact (execution backlog)  
**Source memo:** [Web TanStack Start Standards Research Memo (2026-04-16)](./web-tanstack-start-standards-research-memo-2026-04-16.md) — Section 7 (Recommendations 1–10), Implementation Phasing (Phases 1–4), Success Metrics  
**Architectural anchor:** [Decision 11: tRPC as unified API layer for multi-client support](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support) — all **business** queries and mutations go through **tRPC v11** on **`apps/api`** (Fastify), consumed in web via **`@trpc/react-query`** / **`@tanstack/start-trpc`**; **`createServerFn`** is not the platform RPC surface for domain operations.

---

## 1. Executive summary

This plan operationalizes **every** numbered recommendation (1–10) from Section 7 of the research memo, using the memo’s **four-phase** timeline (Weeks 1–8) as a **baseline sequence** while splitting work into verifiable **work packages** with dependencies, risks, validation, and exit criteria tied to the memo’s **Success Metrics**. It assumes **[Decision 11](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support)** (single tRPC contract for web, mobile, CLI), **multi-tenant isolation** via tenant context and `CompanyConfig`-driven behavior (no hardcoded tenant logic), and the existing stack described in [`CLAUDE.md`](../../../CLAUDE.md) (Turborepo, Vite, TanStack Start, Mantine v9, `@agenticverdict/ui`). Cross-cutting requirements—**tenant context**, **error boundaries**, **auth**, **tRPC client usage**, **RTL/LTR**, **WCAG 2.1 AA**, and **observability**—are explicit in each phase rather than left as implicit “quality bars.”

**Phase alignment (memo baseline → this plan):** **Phase 1** focuses on framework completeness, tenant-aware wiring, and minimum viable error handling; **Phase 2** hardens authentication, design-system and RTL/a11y baselines, and test/E2E scaffolding; **Phase 3** optimizes performance (CWV, bundles, caching) and deepens automated quality (coverage, a11y automation); **Phase 4** delivers production operations (monitoring, security pipeline, deployment automation) and advanced tenant-facing capabilities where product-ready.

---

## 2. Traceability matrix

| Rec #  | Memo theme                 | Planned initiatives (summary)                                                                                                                                               | Phase (memo)                                                   | Primary codebase / package areas                                                                                                                                 |
| ------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | TanStack Start v1 fully    | Pin/adopt Start v1 + Router v1 stack; enforce file-based routes under `src/routes/`; keep `routeTree.gen.ts` in build; standardize loaders + tRPC for data                  | **1**                                                          | `apps/frontend` (`vite.config.ts`, `src/routes/`, `src/router.tsx`, `src/routeTree.gen.ts`), `packages/ui` as needed                                             |
| **2**  | Tenant context propagation | Introduce/complete a **tenant root** (context + optional query-key strategy) feeding theme, direction, and tRPC client metadata; align with API tenant headers / JWT claims | **1** (foundation) + **2** (auth linkage)                      | `apps/frontend/src/components/Providers.tsx`, new `src/providers/*` or `src/context/*`, `src/lib/api/trpc-client.ts`, `apps/api` middleware (coordination only)  |
| **3**  | Error handling             | Route-level `errorComponent` patterns; global/root boundary; structured errors + user-safe surfaces; logging with tenant/request id                                         | **1** (baseline) + **3** (advanced patterns, monitoring hooks) | `apps/frontend/src/routes/**`, `src/lib/utils/error-handlers.ts`, `src/lib/types/errors.ts`, observability hooks                                                 |
| **4**  | Authentication flow        | Protected routes, session refresh, MFA readiness; align TanStack Router guards with existing auth hooks and `apps/api` auth                                                 | **2**                                                          | `apps/frontend/src/hooks/useRequireAuth.ts`, `src/hooks/useSessionQuery.ts`, `src/routes/$locale/auth/*`, `src/stores/auth-store.ts`, `apps/api` auth procedures |
| **5**  | Performance                | Route-based splitting, image strategy, static asset headers, CWV/RUM                                                                                                        | **3**                                                          | `apps/frontend` Vite/build, route components, `public/` / asset pipeline, optional RUM package                                                                   |
| **6**  | Testing strategy           | Unit coverage for business logic; integration tests for routes + tRPC; Playwright E2E; axe in CI                                                                            | **2** (infra) + **3** (coverage targets)                       | `apps/frontend/src/**/*.test.ts`, `apps/frontend/test/e2e/`, `apps/frontend/e2e/`, Vitest config                                                                 |
| **7**  | Design system integration  | Pencil MCP → tokens; Mantine/theme consistency; RTL; WCAG 2.1 AA verification                                                                                               | **2** (baseline) + ongoing                                     | `/design` (Pencil MCP), `packages/ui`, `apps/frontend` components                                                                                                |
| **8**  | Advanced multi-tenancy     | Feature flags UI, white-label, analytics, onboarding wizard                                                                                                                 | **4** (and product-gated)                                      | `apps/frontend` features, `packages/config`, `packages/database` feature flags, `apps/api`                                                                       |
| **9**  | Developer experience       | Generators, Storybook/docs, quality gates, dev ergonomics                                                                                                                   | **2–4** (incremental)                                          | `tools/`, `apps/frontend`, repo docs (scoped)                                                                                                                    |
| **10** | Production readiness       | Monitoring/alerting, deployment automation, DR/rollback, security scanning                                                                                                  | **4**                                                          | CI/CD, observability stack, `apps/frontend` + `apps/api` deploy configs                                                                                          |

**Phase adjustments vs. memo (rationale):** **Recommendation 3** is split: **baseline** error boundaries in Phase 1 to avoid uncaught loader failures, with **advanced** error taxonomy and production logging in Phase 3–4. **Recommendation 6** starts in Phase 2 (so auth/design work has tests) but **coverage targets** align with Phase 3 per Success Metrics. **Recommendation 8** remains Phase 4 because it depends on stable auth, theming, and feature-flag infrastructure.

---

## 3. Phased plan

### Cross-cutting concerns (all phases)

| Concern              | How it is enforced                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant context**   | Single context (or loader context) for `tenantId` / company config; tRPC links and query keys scoped; no silent cross-tenant cache reuse |
| **Error boundaries** | Root + route `errorComponent`; map tRPC errors to UI; dev vs prod messaging                                                              |
| **Auth**             | Router guards + session queries; tokens refreshed safely; protected routes documented                                                    |
| **tRPC client**      | Only **public** procedures from shared router types; no parallel ad-hoc REST for domain operations                                       |
| **RTL/LTR**          | `DirectionProvider` + logical CSS; locale from routing/i18n (`$locale`)                                                                  |
| **Accessibility**    | WCAG 2.1 AA: keyboard, contrast, labels; eslint + axe + spot checks                                                                      |
| **Observability**    | Correlation IDs, tenant id on logs, web vitals/RUM where applicable                                                                      |

Default **owners** (assign in planning tool): _Web Platform_ (apps/frontend), _API Platform_ (apps/api), _Design Systems_ (`@agenticverdict/ui` + Pencil), _QA/CI_ (test infra).

---

### Phase 1 (Weeks 1–2) — Foundation

**Goals:** TanStack Start v1 alignment end-to-end, tenant context **wired**, and **baseline** error handling so failures are contained and observable.

**Exit criteria (maps to Success Metrics):**

- Route tree generation and production build succeed (`routeTree.gen.ts` generated in CI).
- **No unhandled** loader/render failures without a route or root error UI (manual smoke + one automated test).
- Tenant id available **consistently** to providers and tRPC client configuration (verified by unit test or integration test).

**Work packages**

| ID   | Package                | Description                                                                                                                                                                 | Dependencies | Risks                         | Suggested order | Validation                                |
| ---- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------- | --------------- | ----------------------------------------- |
| P1-1 | **Stack verification** | Confirm `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query` versions per memo compatibility; document in `apps/frontend` package README or tech note | None         | Version drift                 | 1               | `pnpm --filter @agenticverdict/web build` |
| P1-2 | **Routing SSOT**       | Audit `src/routes/` for file-based conventions; ensure dynamic segments and `$locale` align with i18n                                                                       | P1-1         | Breaking URL changes          | 2               | Router typecheck + E2E locale smoke       |
| P1-3 | **Tenant root**        | Implement `TenantProvider` (or extend existing providers) with explicit `tenantId` resolution (from host, path, or auth—**product decision**); pass into tRPC headers       | P1-2         | Wrong tenant resolution       | 3               | Unit tests + manual multi-tenant smoke    |
| P1-4 | **tRPC context**       | Ensure `trpc-client` attaches auth + tenant headers; document pattern for loaders vs components                                                                             | P1-3         | Duplicate clients             | 4               | Integration test against mock API         |
| P1-5 | **Error baseline**     | Add/standardize `errorComponent` on critical routes; ensure tRPC errors map to UI                                                                                           | P1-2         | User-facing leak of internals | 5               | Unit tests for mappers + manual check     |
| P1-6 | **Logging baseline**   | Centralize client error logging with request/tenant context (where available)                                                                                               | P1-5         | PII in logs                   | 6               | Log review checklist                      |

**Covers recommendations:** **1**, **2** (MVP), **3** (baseline).

---

### Phase 2 (Weeks 3–4) — Core features

**Goals:** Authentication flows match TanStack Router patterns; design system and RTL/a11y **baselines**; testing **infrastructure** and E2E for critical paths.

**Exit criteria:**

- Protected routes behave consistently (redirect unauthenticated users; session refresh does not loop).
- **RTL/LTR** verified for at least one Arabic path; no hardcoded physical left/right in new code (lint rule or review).
- **Storybook** or equivalent component docs **started** (if product agrees) OR documented alternative (see Open questions).
- E2E: auth + locale + critical path green in CI.

**Work packages**

| ID   | Package            | Description                                                                                         | Dependencies  | Risks                  | Suggested order | Validation                  |
| ---- | ------------------ | --------------------------------------------------------------------------------------------------- | ------------- | ---------------------- | --------------- | --------------------------- |
| P2-1 | **Auth hardening** | Unify `useRequireAuth`, session query, and route `beforeLoad`/`loader` guards; token refresh policy | P1-4          | Session desync         | 1               | E2E + unit tests            |
| P2-2 | **MFA readiness**  | Design API contract + UI placeholders (if MFA enabled per tenant)                                   | P2-1, product | Scope creep            | 2               | Feature flag off by default |
| P2-3 | **Design tokens**  | MCP-driven token sync workflow: `validate:pen-files` in CI; map tokens to Mantine theme             | P1-1          | Drift vs design        | 3               | CI + visual spot check      |
| P2-4 | **RTL baseline**   | Audit `@agenticverdict/ui` + web for logical properties; fix top issues                             | P2-3          | Third-party components | 4               | RTL E2E + manual            |
| P2-5 | **A11y baseline**  | eslint-plugin-jsx-a11y + axe in CI for key pages                                                    | P2-4          | Flaky E2E              | 5               | axe job + manual keyboard   |
| P2-6 | **Test infra**     | Vitest coverage reporting; MSW or tRPC mocks for integration tests; Playwright stability            | P1-5          | Slow CI                | 6               | Coverage thresholds staged  |

**Covers recommendations:** **4**, **6** (infra), **7** (baseline), **9** (partial: docs/quality).

---

### Phase 3 (Weeks 5–6) — Optimization

**Goals:** **Core Web Vitals** and bundle performance; **deeper** error handling; **test coverage** toward memo targets.

**Exit criteria (Success Metrics):**

- **CWV:** LCP &lt; 2.5s, INP/FID &lt; 100ms, CLS &lt; 0.1 on a **defined** reference tenant and environment (lab or RUM—see Open questions).
- **Quality:** Business-logic coverage **≥ 85%** for designated modules (align with [`testing-strategy.md`](/docs/02-planning-and-methodology/testing-strategy.md) and team scope).
- **Accessibility:** WCAG 2.1 AA **verified** on primary flows (automated + sampled manual).

**Work packages**

| ID   | Package            | Description                                                                    | Dependencies | Risks              | Suggested order | Validation               |
| ---- | ------------------ | ------------------------------------------------------------------------------ | ------------ | ------------------ | --------------- | ------------------------ |
| P3-1 | **Code splitting** | Lazy routes for non-critical paths; audit heavy imports                        | P2-6         | UX regressions     | 1               | Bundle analyzer in CI    |
| P3-2 | **Images**         | Mantine `Image` + lazy loading; responsive sources where needed                | P3-1         | Layout shift       | 2               | CLS measurement          |
| P3-3 | **Caching**        | HTTP cache headers for static assets; CDN config if applicable                 | P1-1         | Cache invalidation | 3               | Headers + smoke          |
| P3-4 | **RUM / CWV**      | Instrument LCP/INP/CLS with tenant dimension                                   | P1-6         | Privacy review     | 4               | Dashboard + alerts       |
| P3-5 | **Error advanced** | Structured `PlatformError` usage end-to-end; retry policies for transient tRPC | P1-5         | Over-engineering   | 5               | Unit + integration tests |
| P3-6 | **Coverage push**  | Raise coverage for hooks, auth, and domain logic                               | P2-6         | Test maintenance   | 6               | Coverage report in CI    |

**Covers recommendations:** **3** (advanced), **5**, **6** (coverage + a11y automation), **7** (ongoing verification).

---

### Phase 4 (Weeks 7–8) — Production readiness

**Goals:** **Monitoring**, **security**, **deployment automation**, and **advanced** tenant features (where approved).

**Exit criteria:**

- On-call runbook: dashboards, alerts, and **rollback** path documented and exercised once.
- Security: dependency scan + SAST/DAST in CI (per org policy); CSP/security headers reviewed for web.
- **Tenant satisfaction** proxy: white-label and onboarding **behind flags** do not regress core paths.

**Work packages**

| ID   | Package               | Description                                                                    | Dependencies | Risks                | Suggested order | Validation           |
| ---- | --------------------- | ------------------------------------------------------------------------------ | ------------ | -------------------- | --------------- | -------------------- |
| P4-1 | **Observability**     | Frontend errors + vitals to observability backend; tie to tenant               | P3-4         | Cost                 | 1               | Staging drill        |
| P4-2 | **Deployment**        | Blue/green or canary; automated rollback; artifact promotion                   | P1-1         | Downtime             | 2               | Tabletop exercise    |
| P4-3 | **Security**          | OWASP-oriented checks; pen-test scheduling; secrets hygiene                    | P4-2         | Finding backlog      | 3               | Scan reports         |
| P4-4 | **Feature flags UI**  | Surface `createFeatureFlagService` capabilities to admin UI (if product scope) | P2-1         | UX complexity        | 4               | E2E with flag on/off |
| P4-5 | **White-label**       | Logo/colors from `CompanyConfig`; SSR-safe theme                               | P2-3         | Flash of wrong theme | 5               | Visual + E2E         |
| P4-6 | **Onboarding wizard** | Multi-step flow; analytics events                                              | P4-1         | Scope                | 6               | Product sign-off     |

**Covers recommendations:** **8**, **9** (tooling hardening), **10**.

---

## 4. Consolidated backlog (prioritized, deduplicated)

**Epic A — Framework & routing (Rec 1)**  
_Parallel with:_ Epic B (tenant) after P1-1.  
_Sequential:_ Must complete before heavy E2E expansion.

- A1: Version matrix locked and documented.
- A2: Route conventions documented; `routeTree.gen.ts` in CI.
- A3: Loader + tRPC patterns documented (no `createServerFn` for domain).

**Epic B — Tenant & auth context (Rec 2, 4)**  
_Parallel:_ Partial overlap with A after P1-2.  
_Sequential:_ B1 tenant resolution before B2 protected routes.

- B1: Tenant provider + tRPC headers.
- B2: Auth guards + session refresh.
- B3: MFA (flagged).

**Epic C — Errors & observability (Rec 3, 10)**  
_Parallel:_ C1 with A/B; C2–C3 after P1-5.

- C1: Route/global error UI.
- C2: Structured logging + tenant/request correlation.
- C3: RUM + dashboards (Phase 3–4).

**Epic D — Performance (Rec 5)**  
_Parallel:_ D1 bundle work with C1; D2–D3 after baselines stable.

- D1: Lazy routes + bundle budgets.
- D2: Image + CLS.
- D3: Cache headers / CDN.

**Epic E — Quality & testing (Rec 6, 7)**  
_Parallel:_ E1 lint/a11y with B2; E2 coverage with D1.

- E1: axe + jsx-a11y in CI.
- E2: Coverage ≥ 85% scoped modules.
- E3: Pencil MCP token pipeline + Mantine alignment.

**Epic F — Advanced tenant & DX (Rec 8, 9)**  
_Parallel:_ F1 generators after conventions stable; F2 Storybook optional.  
_Sequential:_ Epic F after B and E baselines.

- F1: Code generators (CRUD/auth scaffolds).
- F2: Storybook or alternative doc surface.
- F3: White-label + onboarding + tenant analytics.

**What can run in parallel**

- **P1-1 / P1-2** with **design token audit** (prep for Phase 2).
- **E2E stabilization** (Phase 2) with **bundle analysis** (Phase 3) **only after** auth guards stable.
- **API-side** tenant middleware tests (apps/api) with **web** tRPC client tests (no circular dependency if using contract tests).

**What must stay sequential**

- **Tenant resolution rules** before **tenant-scoped E2E** and **RUM by tenant**.
- **Auth hardening** before **MFA** and **admin feature flags**.
- **Error mapping** before **alerting** on error rates.

---

## 5. Open questions / decisions

| Topic                                   | Why it matters                                                             | Proposed resolution / owner                                             |
| --------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Tenant resolution source**            | Drives `TenantProvider` and tRPC headers                                   | Product + Platform: subdomain vs path vs post-login claim               |
| **RUM provider**                        | Decision record mentions Vercel Speed Insights; stack may be self-hosted   | Architecture: choose Vercel vs OpenTelemetry web vs other               |
| **MFA scope**                           | Rec 4 lists MFA; may be tenant-specific                                    | Security + Product: required vs optional; timeline                      |
| **Storybook vs alternatives**           | Rec 9                                                                      | Design Systems: Storybook vs Ladle vs docs-only; cost/benefit           |
| **Coverage scope for “business logic”** | Success Metric says &gt;85%                                                | Define file globs (`src/hooks`, `src/lib`, `packages/core` touchpoints) |
| **i18n / decision record alignment**    | Decision record mentions next-intl; web uses `$locale` + custom `src/i18n` | Confirm single SSOT approach; avoid duplicate routing models            |
| **Server functions**                    | Allowed for non-domain edge cases only                                     | Document allowlist (e.g. progressive enhancement) vs **Decision 11**    |

---

## 6. References

- [Web TanStack Start Standards Research Memo (2026-04-16)](./web-tanstack-start-standards-research-memo-2026-04-16.md)
- [Decision 11: tRPC as unified API layer](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support)
- [Testing strategy](/docs/02-planning-and-methodology/testing-strategy.md)
- [CLAUDE.md](../../../../CLAUDE.md) (repo conventions)

---

**Document control**  
**Version:** 1.0  
**Next review:** After Phase 2 exit (or quarterly, whichever comes first)
