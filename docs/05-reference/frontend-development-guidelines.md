# Web platform development guidelines

**Status:** Enforced reference (day-to-day development contract)  
**Date:** 2026-05-03  
**Traceability:** Implements the normative intent of [`web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md) (Recommendations 1–10, phased themes, cross-cutting concerns). The implementation plan remains the backlog and audit traceability artifact; **this document** is what engineers apply in PRs.

**Audience:** Engineers implementing and reviewing changes in `apps/frontend`, coordinated changes in `apps/api` (tRPC contract), and shared packages (`@agenticverdict/ui`, `@agenticverdict/config`, types, database feature flags).

---

## 1. How to use this document

- **In implementation:** Treat sections marked with **MUST** as non-negotiable unless an explicit architecture decision record supersedes them. **SHOULD** items are defaults; deviations need a short rationale in the PR.
- **In code review:** Use [§9 Review checklist](#9-review-checklist) and the per-area rules below.
- **When in doubt:** See **Links to authoritative sources** at the end—do not reinterpret architecture in this file if SSOT docs conflict; raise a doc fix.

---

## 2. Principles (non-negotiable)

| Principle                             | Rule                                                                                                                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unified API surface (Decision 11)** | **MUST** use **tRPC v11** on `apps/api` (Fastify) for **business** queries and mutations. **MUST NOT** introduce ad-hoc REST/fetch clients for domain operations parallel to tRPC.                   |
| **Server functions boundary**         | `createServerFn` and similar **MUST NOT** be the platform RPC surface for **domain** operations. Non-domain edge cases (e.g. progressive enhancement) **SHOULD** be rare, documented, and justified. |
| **Multi-tenancy**                     | **MUST** keep tenant isolation: tenant id and config flow through established providers/middleware; **MUST NOT** hardcode tenant-specific product logic—use `TenantConfig` and feature flags.        |
| **Errors**                            | **MUST** surface user-safe messages; **MUST NOT** leak stack traces or internal details in production UI. Map tRPC errors through shared mappers.                                                    |
| **Accessibility**                     | **MUST** meet **WCAG 2.1 AA** for new and materially changed UI (keyboard, contrast, labels, focus).                                                                                                 |
| **Localization**                      | **MUST** support **RTL and LTR** via logical CSS and theme/locale from routing and tenant config—not hardcoded `left`/`right` for layout.                                                            |
| **Observability**                     | **MUST** attach **tenant** and **correlation/request** context to client logs and telemetry where the pipeline supports it; **MUST NOT** log secrets or unredacted PII (see telemetry runbook).      |

---

## 3. Traceability: recommendations → guidance sections

| Rec    | Theme                                             | Primary section                                                                     |
| ------ | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **1**  | TanStack Start + file-based routing               | [§4.1 Routing & framework](#41-routing--framework-rec-1)                            |
| **2**  | Tenant context + tRPC metadata                    | [§4.2 Tenant context & data identity](#42-tenant-context--data-identity-rec-2)      |
| **3**  | Errors, boundaries, logging                       | [§4.3 Errors & observability](#43-errors--observability-rec-3)                      |
| **4**  | Authentication & session                          | [§4.4 Authentication & session](#44-authentication--session-rec-4)                  |
| **5**  | Performance & CWV                                 | [§4.5 Performance & Core Web Vitals](#45-performance--core-web-vitals-rec-5)        |
| **6**  | Testing                                           | [§4.6 Testing & quality gates](#46-testing--quality-gates-rec-6)                    |
| **7**  | Design system, Mantine, RTL, a11y                 | [§4.7 Design system & UI](#47-design-system--ui-rec-7)                              |
| **8**  | Advanced tenancy (flags, white-label, onboarding) | [§4.8 Advanced multi-tenancy features](#48-advanced-multi-tenancy-features-rec-8)   |
| **9**  | Developer experience                              | [§4.9 Developer experience](#49-developer-experience-rec-9)                         |
| **10** | Production readiness                              | [§4.10 Production readiness & security](#410-production-readiness--security-rec-10) |

Cross-cutting concerns (tenant, errors, auth, tRPC, RTL, a11y, observability) apply in every phase; **§5** states them as a single checklist.

---

## 4. Architecture boundaries

### 4.0 Package and repo boundaries

- **`apps/frontend`:** TanStack Start, route tree, UI, client tRPC, browser observability, i18n/locale routing.
- **`apps/api`:** Fastify, tRPC routers, auth, tenant middleware, telemetry ingest—**contract owner** for types shared with the web client.
- **`packages/ui` / `@agenticverdict/ui`:** Reusable components aligned with design tokens; **MUST NOT** embed tenant business rules (pass config/props).
- **`packages/config`:** `TenantConfig` and schemas—tenant-facing defaults and validation.
- **`packages/database` + `apps/api`:** Feature flags and admin surfaces **MUST** use the established services; web **MUST NOT** bypass API tenancy rules.

---

### 4.1 Routing & framework (Rec 1)

- **MUST** use **file-based routes** under `apps/frontend/src/routes/` as the SSOT for URL structure; follow existing `$locale` and layout patterns.
- **MUST** keep the **generated route tree** (`routeTree.gen.ts` import in `src/router.tsx`) building cleanly in **local dev and CI**—do not commit broken route conventions.
- **MUST** type the router via `@tanstack/react-router` `Register` (and TanStack Start registration) so navigation stays type-safe.
- **SHOULD** use **loaders** and TanStack patterns consistent with existing routes; prefer **tRPC** for server-backed data in line with Decision 11.
- **SHOULD** document any new top-level route segment or auth gate in the same PR (one paragraph in description is enough).

#### Locale-aware URLs and auth `redirect` params

- **MUST** compose localized absolute paths with **`withLocalePrefix`** from `@/router/utils/navigation` (re-exported via `@/i18n/navigation` / router SSOT) whenever the path may already include a leading locale segment (for example values from `redirect` search params, `returnTo`, or other stored return URLs). **MUST NOT** naively concatenate `` `/${locale}${path}` `` unless `path` is guaranteed to be locale-relative (leading segment is never a supported locale code).
- **SHOULD** store **locale-relative** pathname values in login and post-auth **`redirect`** query params using the same helper as SSR protected routes: **`buildProtectedRedirectTarget`** in `apps/frontend/src/lib/auth/route-guards/redirect-target.ts` (strips the first path segment so stored paths look like `/dashboard/...`, not `/en/dashboard/...`). That keeps SSR guards, client navigation, and `sanitizeAuthRedirectTarget` aligned.
- **MUST** keep **auth access policy** targets locale-safe (for example signed-in users leaving public auth routes): use **`withLocalePrefix`** when turning a redirect target string into a full path—see `resolveRouteAccessDecision` in `apps/frontend/src/lib/auth/auth-access-policy.ts`.

---

### 4.2 Tenant context & data identity (Rec 2)

- **MUST** resolve **tenant id** and branding/theme through the **tenant provider / pipeline** (not ad-hoc globals).
- **MUST** pass **tenant (and auth) context** into **tRPC link** configuration so queries are not accidentally cached across tenants.
- **MUST** scope **React Query keys** (and any normalized cache) by tenant (and user where applicable)—**no silent cross-tenant reuse**.
- **SHOULD** align tenant resolution with API middleware and documented **Open questions** from the plan (subdomain vs path vs claim) once product/platform lock a single approach.

---

### 4.3 Errors & observability (Rec 3)

- **MUST** provide **route `errorComponent`** (and root-level error handling) for routes with loaders or async data so failures are contained.
- **MUST** map **tRPC errors** to UI via shared helpers (e.g. mapping layers in `src/lib/api/`); **MUST** distinguish user-facing vs developer messages (dev-only detail).
- **MUST** use **structured client logging** with redaction for tokens/PII; follow [`telemetry-ingest.md`](./runbooks/telemetry-ingest.md) for browser → API telemetry.
- **SHOULD** apply **retry policies** only to **transient** failures (documented in shared tRPC retry helpers), not to auth/validation failures.

---

### 4.4 Authentication & session (Rec 4)

- **MUST** use **one coherent pattern** for protection: router guards (`beforeLoad` / loaders), `useRequireAuth` (or successor), and **session query**—no competing sources of truth.
- **MUST** avoid **redirect loops** and unbounded session refresh; changes in this area **MUST** include or update tests (unit and/or E2E).
- **SHOULD** keep **MFA readiness** behind feature flags / explicit API contracts until product enables MFA (see plan Epic B).

#### Route guards and session data (SSR vs SPA)

- **MUST NOT** treat undocumented or unwired **`route` / `context` properties** (for example **`context.auth`**) as session truth in `beforeLoad`. If the framework does not assign a field, it is indistinguishable from “missing wiring”—**never** interpret that as “signed out” and throw a login redirect; that alternates forever with “signed-in user leaves login” once post-login URLs are valid.
- **MUST** derive SSR `beforeLoad` auth and tenant facts from the same **session probe** used by established guards: **`fetchProtectedRouteSession`** in `apps/frontend/src/lib/auth/protected-route-session.ts`, and follow the **SPA vs non-SPA** policy documented there (`import.meta.env.MODE === "spa"` typically defers enforcement to **`useRequireAuth`**, tenant capability checks on the page, or other client gates—mirroring `createProtectedBeforeLoad`).
- **MUST** add or extend **unit tests** when changing redirect composition or guard logic (auth policy, locale prefix helpers, dashboard route guards).

---

### 4.5 Performance & Core Web Vitals (Rec 5)

- **SHOULD** use **route-based splitting** and avoid heavy imports on critical paths; use bundle analysis (`ANALYZE`, CI) when touching large dependencies.
- **MUST** follow image and layout practices that protect **CLS** (dimensions, lazy loading, Mantine `Image` where applicable).
- **MUST** respect **static asset caching** headers for hashed assets and deployment conventions (see `vite.config.ts` / Nitro route rules).
- **SHOULD** instrument **Web Vitals** / client telemetry with **tenant** dimension where RUM is enabled; align evidence with [`web-core-web-vitals-evidence.md`](./web-core-web-vitals-evidence.md).

---

### 4.6 Testing & quality gates (Rec 6)

- **MUST** add or extend **Vitest** coverage for **business-critical helpers** touched by the change (auth, tRPC client, tenant, observability)—see [`web-unit-test-coverage-policy.md`](./web-unit-test-coverage-policy.md) for **scoped gates** and globs.
- **MUST** keep **E2E** (Playwright) green for **locale + critical auth paths** when changing routing, auth, or shell providers.
- **MUST** run **a11y** automation where the CI job covers changed surfaces; fix or file issues for **new** violations in scope.
- **SHOULD** align **coverage trajectory** with [`testing-strategy.md`](../02-planning-and-methodology/testing-strategy.md) (critical code ≥ agreed thresholds).

---

### 4.7 Design system & UI (Rec 7)

- **MUST** implement UI with **`@agenticverdict/ui`** and **Mantine v9** patterns documented in [`design-system/README.md`](../../design-system/README.md).
- **MUST** edit **`.pen`** design files **only** via **Pencil MCP** tools; run `pnpm run validate:pen-files` after design changes (see `.cursor/rules/ui-guidelines.mdc`).
- **MUST** use **logical properties** for directional layout and verify **RTL** for Arabic-facing flows when changing layout primitives.
- **SHOULD** keep visual drift low by honoring **tokens** and shared molecules/atoms instead of one-off styled clones.

---

### 4.8 Advanced multi-tenancy features (Rec 8)

- **MUST** gate **feature flags UI**, **white-label**, **onboarding**, and **analytics** behaviors behind explicit **flags/config** and API support—no half-wired admin surfaces.
- **MUST** keep **SSR-safe** theming for tenant branding (avoid prolonged flash of wrong theme; test with reference tenant).
- **SHOULD** coordinate schema/config changes across `packages/config`, `packages/database`, and `apps/api` in the same delivery slice when introducing a new tenant-visible capability.

---

### 4.9 Developer experience (Rec 9)

- **SHOULD** add generators or scripts under `tools/` only when they **encode stable conventions** from this guideline (avoid one-off codegen that drifts).
- **SHOULD** prefer **documented patterns** in `apps/frontend` README / `src/lib/api/README.md` over tribal knowledge.
- **MAY** adopt Storybook/Ladle/docs-only per design-system decision; until then, rely on design-system docs + Pencil workflow.

---

### 4.10 Production readiness & security (Rec 10)

- **MUST** keep **CI** parity: `pnpm --filter @agenticverdict/frontend build`, tests, and documented jobs (Lighthouse, axe, etc.) green when touching gated areas.
- **MUST** maintain **security headers** and **CSP nonce** patterns for SSR where the stack uses them (`src/start.ts`, `src/lib/csp.ts`, Vite/Nitro config)—changes **MUST** be reviewed for XSS and nonce correctness.
- **MUST** follow deployment/rollback runbooks such as [`web-deploy-rollback.md`](./runbooks/web-deploy-rollback.md) for production-impacting releases.
- **SHOULD** keep **dependency and security scanning** policy aligned with [`security-scanning-backlog-2026-04-17.md`](./security-scanning-backlog-2026-04-17.md) and org requirements.

---

## 5. Cross-cutting checklist (all phases)

Use this on every substantive web PR:

| Concern            | Verify                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **Tenant context** | Tenant id available to providers and tRPC client; caches scoped.                                  |
| **Errors**         | User-safe surfaces; tRPC mapping; no production leakage.                                          |
| **Auth**           | Guards + session query agree; no refresh loops; locale-safe redirects; no unwired `context` auth. |
| **tRPC**           | No parallel ad-hoc REST for domain operations; types from shared router.                          |
| **RTL/LTR**        | Logical CSS; locale from routing.                                                                 |
| **Accessibility**  | Keyboard and labels; axe where applicable.                                                        |
| **Observability**  | Logs/telemetry include correlation and tenant where supported; no PII/secrets.                    |

---

## 6. Dependencies and ordering (from the plan)

These **sequencing** rules reduce rework:

- **Tenant resolution** is prerequisite for **tenant-scoped E2E** and **RUM by tenant**.
- **Auth hardening** before **MFA** and **admin feature flags** (when enabled).
- **Error taxonomy and mapping** before **alerting** on raw client error rates.

Parallel work is allowed (e.g. API tenant middleware tests + web tRPC client tests) **without** importing circular dependencies—prefer **contract tests** and shared types.

---

## 7. Success metrics (engineering interpretation)

- **Reliability:** No unhandled loader/route failures without error UI in production smoke scenarios.
- **Quality:** Scoped coverage floors in `apps/frontend` met for touched critical modules; E2E critical paths green.
- **Performance:** Reference tenant **CWV** budgets and evidence doc updated when instrumentation or layout changes affect metrics.
- **Security:** Headers/CSP/telemetry secrets hygiene per runbooks; no regressions on security jobs.

---

## 8. Links to authoritative sources

| Topic                                       | Document                                                                                                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implementation plan (traceability, phases)  | [`web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md) |
| Research memo (recommendations 1–10 origin) | [`web-tanstack-start-standards-research-memo-2026-04-16.md`](../03-technology-research/frontend/web-tanstack-start-standards-research-memo-2026-04-16.md)                         |
| Decision 11 (tRPC unified API)              | [`docs/architecture/ui/04-decision-record.md`](../architecture/ui/04-decision-record.md)                                                                                          |
| Repo conventions                            | [`CLAUDE.md`](../../CLAUDE.md)                                                                                                                                                    |
| Testing strategy                            | [`testing-strategy.md`](../02-planning-and-methodology/testing-strategy.md)                                                                                                       |
| Web coverage gate                           | [`web-unit-test-coverage-policy.md`](./web-unit-test-coverage-policy.md)                                                                                                          |
| CWV evidence                                | [`web-core-web-vitals-evidence.md`](./web-core-web-vitals-evidence.md)                                                                                                            |
| Telemetry ingest                            | [`runbooks/telemetry-ingest.md`](./runbooks/telemetry-ingest.md)                                                                                                                  |
| Deploy / rollback                           | [`runbooks/web-deploy-rollback.md`](./runbooks/web-deploy-rollback.md)                                                                                                            |
| Design system                               | [`design-system/README.md`](../../design-system/README.md)                                                                                                                        |
| Auth API patterns                           | [`apps/frontend/src/lib/api/README.md`](../../apps/frontend/src/lib/api/README.md), [`AUTH_API_USAGE.md`](../../apps/frontend/src/lib/api/AUTH_API_USAGE.md)                      |
| Router, locale-aware navigation, redirects  | [`router-navigation-guide.md`](./router-navigation-guide.md)                                                                                                                      |

---

## 9. Review checklist

**Reviewer MUST confirm:**

1. **Boundaries:** Domain data uses **tRPC**; no new REST shortcuts for business operations.
2. **Tenant:** No cross-tenant cache sharing; headers/metadata consistent with `trpc-client` patterns.
3. **Auth:** Protected routes and session handling remain consistent; **no login ↔ protected loops** from unwired `context` auth or duplicated locale segments in redirects; guards align with §4.4 and [`router-navigation-guide.md`](./router-navigation-guide.md); tests updated.
4. **Errors:** Route/root error handling; mapped tRPC errors; safe user messaging in prod.
5. **A11y/RTL:** Logical properties for layout; critical flows still pass automated a11y where applicable.
6. **Observability:** Logging/telemetry changes respect redaction and ingest runbook.
7. **Tests:** Vitest/E2E updates match [`web-unit-test-coverage-policy.md`](./web-unit-test-coverage-policy.md) scope for changed code.
8. **Security:** CSP/header-sensitive edits reviewed; no secrets in client bundles except documented public tokens.
9. **Design system:** UI uses `@agenticverdict/ui`/tokens; `.pen` edits only via Pencil MCP if applicable.

---

## Document control

| Version | Date       | Notes                                               |
| ------- | ---------- | --------------------------------------------------- |
| 1.0     | 2026-04-17 | Initial guideline from TanStack implementation plan |
| 1.1     | 2026-05-03 | Locale-safe redirects; route guard vs session SSOT  |

**Next review:** After Phase 2 exit of the implementation plan, or quarterly—whichever comes first.
