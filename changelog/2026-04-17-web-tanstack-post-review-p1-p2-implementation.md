# Changelog: Web TanStack — post-review plan (P1 hardening + P2 quality, metrics, SSR auth)

**Date:** 2026-04-17  
**Scope:** Execution of **§6 (P1 — Security and operations)** and **§7 (P2 — Metrics, quality, SSR, release engineering)** from [`web-tanstack-post-review-implementation-plan-2026-04-17.md`](../docs/03-technology-research/frontend/web-tanstack-post-review-implementation-plan-2026-04-17.md), building on the phase changelogs (`changelog/2026-04-17-web-tanstack-phase-*.md`) and the implementation review ([`changelog/2026-04-17-web-tanstack-implementation-review.md`](2026-04-17-web-tanstack-implementation-review.md)). Delivers production **Content-Security-Policy** and framing controls, a **versioned telemetry envelope** shared with the API, an authenticated **telemetry ingest** HTTP endpoint on Fastify, **dependency audit policy** alignment in CI, **Lighthouse CI** for lab CWV signals, **scoped Vitest** threshold nudges with a written coverage policy, **`beforeLoad` SSR-aware protection** for the dashboard tree, operational **runbooks** (telemetry ingest, deploy/rollback), a **security scanning backlog** note (SAST/DAST/pen-test), and a **Playwright** check that anonymous users cannot land on the dashboard shell. Aligns with [Decision 11](../docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support) (tRPC on `apps/api`; ingest is a separate REST route under `/api/v1`).

**Verification run:** `pnpm exec turbo run lint typecheck --filter=@agenticverdict/frontend --filter=@agenticverdict/api --filter=@agenticverdict/types`, `pnpm --filter @agenticverdict/frontend exec vitest run --coverage`, `pnpm --filter @agenticverdict/api exec vitest run`, `pnpm --filter @agenticverdict/frontend build`, `pnpm --filter @agenticverdict/frontend exec playwright test e2e/protected-routes.spec.ts`, optional `cd apps/frontend && npx @lhci/cli@0.14.0 autorun --config=./lighthouserc.cjs` (after build).

---

## Summary

### P1 — Security and operations

- **CSP and headers (production):** Nitro **`routeRules`** in **`apps/frontend/vite.config.ts`** apply **`X-Frame-Options: DENY`**, **`nosniff`**, **`Referrer-Policy`**, **`Permissions-Policy`** (no static CSP). **`Content-Security-Policy`** is set per HTML response in **`apps/frontend/src/start.ts`** with **`script-src`** and **`style-src`** nonces (see **`buildContentSecurityPolicy`**); **`style-src-attr 'unsafe-inline'`** covers React **`style={{…}}`** props. Non-production builds skip CSP middleware to preserve local DX. **`apps/frontend/README.md`** documents verification on home, login, and dashboard.
- **Telemetry contract:** **`@agenticverdict/types`** exports **`telemetryEnvelopeSchema`**, **`TelemetryEnvelope`**, and **`TELEMETRY_ENVELOPE_VERSION`**. The web client’s **`forwardTelemetry`** uses the shared type; when **`VITE_PUBLIC_TELEMETRY_INGEST_TOKEN`** is set, it **POST**s via **`fetch`** with **`Authorization: Bearer`** ( **`sendBeacon`** cannot set custom headers ).
- **Telemetry ingest API:** **`POST /api/v1/telemetry/ingest`** ([`apps/api/src/routes/v1/telemetry-ingest.ts`](../apps/api/src/routes/v1/telemetry-ingest.ts)) validates payloads with Zod, enforces a body size cap, applies global rate limiting, and in **`NODE_ENV=production`** requires **`TELEMETRY_INGEST_SECRET`** ( **`503`** if unset; **`401`** if the secret is set but credentials don’t match ). **`apps/api/src/server.ts`** registers the route under the existing **`/api/v1`** prefix.
- **Dependency audit policy:** [`docs/05-reference/dependency-audit-policy.md`](../docs/05-reference/dependency-audit-policy.md) records that CI **`pnpm audit`** remains informational until critical backlog is cleared; **`.github/workflows/ci.yml`** links to the policy above the audit step.
- **Runbook:** [`docs/05-reference/runbooks/telemetry-ingest.md`](../docs/05-reference/runbooks/telemetry-ingest.md) covers auth, rotation, and PII expectations. **`.env.example`** documents **`TELEMETRY_INGEST_SECRET`** and pairing with the public client token.

### P2 — Metrics, quality, SSR, release engineering

- **Lab CWV / Lighthouse:** **`apps/frontend/lighthouserc.cjs`** drives **`@lhci/cli`** against the production Nitro server (English home and login). **`.github/workflows/web-lighthouse-ci.yml`** runs on **`main`** (path-filtered) and **`workflow_dispatch`**. [`docs/05-reference/web-core-web-vitals-evidence.md`](../docs/05-reference/web-core-web-vitals-evidence.md) lists thresholds and local run instructions. **`apps/frontend/.gitignore`** ignores **`.lighthouseci`**.
- **Coverage policy:** [`docs/05-reference/web-unit-test-coverage-policy.md`](../docs/05-reference/web-unit-test-coverage-policy.md) records agreed globs and the package-local gate; **`apps/frontend/vitest.config.mjs`** thresholds are raised incrementally (lines/statements/branches/functions).
- **SSR / `beforeLoad` auth:** [`apps/frontend/src/lib/auth/protected-route-session.ts`](../apps/frontend/src/lib/auth/protected-route-session.ts) exposes **`fetchProtectedRouteSession`** (server function) that forwards **`Authorization`**, **`Cookie`**, and **`x-tenant-id`** to **`auth.getSession`**. Default **dev auth mock** skips the SSR gate so the in-memory mock stays client-only; **`useRequireAuth`** remains the client guard. [`apps/frontend/src/routes/$locale/dashboard.tsx`](../apps/frontend/src/routes/$locale/dashboard.tsx) **`beforeLoad`** redirects unauthenticated users to **`/{locale}/auth/login?redirect=…`**.
- **Deploy / rollback:** [`docs/05-reference/runbooks/web-deploy-rollback.md`](../docs/05-reference/runbooks/web-deploy-rollback.md) — copy-paste deploy/rollback and tabletop checklist (fill when a drill is executed).
- **Security backlog:** [`docs/05-reference/security-scanning-backlog-2026-04-17.md`](../docs/05-reference/security-scanning-backlog-2026-04-17.md) — SAST/DAST/pen-test scheduling placeholders.
- **E2E:** [`apps/frontend/e2e/protected-routes.spec.ts`](../apps/frontend/e2e/protected-routes.spec.ts) asserts unauthenticated navigation to **`/en/dashboard`** ends on login with a **`redirect`** query.

---

## Added

### `packages/types`

- **`src/telemetry.ts`** — **`telemetryEnvelopeSchema`**, **`telemetryKindSchema`**, **`TELEMETRY_ENVELOPE_VERSION`**, **`TelemetryEnvelope`**.
- **`src/telemetry.test.ts`** — schema parse/reject coverage.

### `packages/database`

- **`src/schema/users.ts`** — credential and email-verification fields: **`password_hash`**, **`email_verified`**, **`email_verification_token_hash`**, **`email_verification_expires_at`**, **`password_reset_token_hash`**, **`password_reset_expires_at`**.

### `apps/api`

- **`src/lib/auth-password.ts`**, **`src/lib/auth-password.test.ts`** — scrypt password hashing.
- **`src/lib/auth-opaque-token.ts`** — SHA-256 hashing for verification/reset opaque tokens.
- **`src/lib/auth-session-cookie.ts`**, **`src/lib/auth-session-cookie.test.ts`** — **`av_session`** parse and **`Set-Cookie`** serialization.
- **`src/lib/auth-session-jwt.ts`** — HS256 session JWT signing (aligned with **`jwtAuth`** / **`getSession`**).
- **`src/middleware/auth-session.test.ts`** — cookie-based session verification.
- **`src/routes/v1/telemetry-ingest.ts`** — Fastify **`POST /telemetry/ingest`** (mounted as **`/api/v1/telemetry/ingest`**).
- **`src/routes/v1/telemetry-ingest.test.ts`** — auth, validation, and production-unconfigured behavior.

### `apps/frontend`

- **`src/start.ts`** — **`createStart`** request middleware: production CSP nonce + **`setResponseHeader('Content-Security-Policy', …)`** (skips **`/_serverFn`**; dev skips CSP).
- **`src/lib/csp.ts`**, **`src/lib/csp.test.ts`** — shared CSP string builder.
- **`src/lib/csp-nonce.server.ts`**, **`src/lib/csp-nonce.stub.ts`** — SSR **`AsyncLocalStorage`** vs client **`meta[property="csp-nonce"]`** reader; resolved via **`cspNonceResolvePlugin`** in **`vite.config.ts`**.
- **`src/lib/auth/protected-route-session.ts`** — server session probe for protected **`beforeLoad`**.
- **`lighthouserc.cjs`** — Lighthouse CI collection + assertions.
- **`e2e/protected-routes.spec.ts`** — dashboard redirect smoke.

### `docs/05-reference`

- **`dependency-audit-policy.md`** — audit triage and CI policy.
- **`web-unit-test-coverage-policy.md`** — web Vitest globs and floor.
- **`web-core-web-vitals-evidence.md`** — lab thresholds + workflow reference.
- **`security-scanning-backlog-2026-04-17.md`** — SAST/DAST/pen-test track.
- **`runbooks/telemetry-ingest.md`** — operations for ingest.
- **`runbooks/web-deploy-rollback.md`** — deploy, rollback, drill template.

### `.github/workflows`

- **`web-lighthouse-ci.yml`** — build web + Lighthouse CI artifact upload (best-effort).

---

## Changed

### `apps/frontend`

- **`src/lib/api/auth-api.ts`** — map tRPC message **`EMAIL_NOT_VERIFIED`** to **`AuthErrorCode`** for login.
- **`vite.config.ts`** — production vs development HTML security headers (CSP via **`src/start.ts`**, not static **`routeRules`**); **`cspNonceResolvePlugin`** for **`@web-csp-nonce`**.
- **`src/router.tsx`** — **`ssr.nonce`** from **`getCspNonce()`** when present.
- **`src/vite-env.d.ts`** — **`declare module '@web-csp-nonce'`**; **`VITE_PUBLIC_TELEMETRY_INGEST_TOKEN`**.
- **`src/lib/observability/telemetry-ingest.ts`** — shared envelope type; optional **`Authorization`** when token env is set.
- **`src/lib/observability/telemetry-ingest.test.ts`** — bearer header path.
- **`src/routes/$locale/dashboard.tsx`** — **`beforeLoad`** + redirect with **`defaultStringifySearch`** for return path.
- **`vitest.config.mjs`** — slightly higher coverage thresholds.
- **`README.md`** — CSP section, telemetry env vars, protected routes (SSR vs client).
- **`.gitignore`** — **`/.lighthouseci`**.

### `packages/types`

- **`src/index.ts`** — re-exports telemetry symbols.

### `packages/database`

- **`src/schema/users.ts`** — auth credential + token columns (apply with **`pnpm --filter @agenticverdict/database db:push`** or generated migrations).

### `apps/api`

- **`src/trpc/routers/auth.ts`** — real **`login`**, **`register`**, **`logout`**, **`verifyEmail`**, **`requestPasswordReset`**, **`confirmPasswordReset`** against Drizzle; **`getSession`** rejects orphaned JWTs without a DB user row.
- **`src/middleware/auth.ts`** — export **`resolveJwtSecret`**; **`verifyBearerSessionFromRequest`** also reads **`av_session`**.
- **`src/server.ts`** — registers **`registerTelemetryIngestRoutes`**.

### Root

- **`.env.example`** — **`TELEMETRY_INGEST_SECRET`** comment.
- **`.github/workflows/ci.yml`** — comment linking the informational dependency audit step to [`dependency-audit-policy.md`](../docs/05-reference/dependency-audit-policy.md).

---

## Post-review plan mapping

| Plan section                               | Delivered                                                                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§6.1** CSP + security header review      | Production CSP (`script-src` + `style-src` nonces via `start.ts`; `style-src-attr` for React inline styles) + `X-Frame-Options`; dev slim headers; README |
| **§6.2** Telemetry ingest backend          | Zod envelope in `types`; Fastify ingest; client bearer + tests; runbook                                                                                   |
| **§6.3** Dependency audit remediation      | Policy doc + CI pointer                                                                                                                                   |
| **§7.1** Lab / RUM CWV                     | Lighthouse CI workflow + evidence doc (lab); RUM still via existing client web-vitals + optional ingest                                                   |
| **§7.2** Coverage toward 85%               | Policy doc + incremental thresholds                                                                                                                       |
| **§7.3** `beforeLoad` / SSR-aware auth     | `protected-route-session` + dashboard `beforeLoad`; README semantics                                                                                      |
| **§7.4** Deploy / rollback                 | `web-deploy-rollback` runbook                                                                                                                             |
| **§7.5** SAST / DAST / pen-test scheduling | Security scanning backlog doc                                                                                                                             |

---

## Deferred / follow-ups

- **P0 — auth (partially addressed 2026-04-17):** Shared **`AppRouter`** remains exported from **`@agenticverdict/api/trpc`** (plan §5.1). **Session + DB-backed mutations (plan §5.2):** **`auth.login` / `register` / `logout` / `verifyEmail` / `requestPasswordReset` / `confirmPasswordReset`** now run against PostgreSQL (Drizzle) when **`DATABASE_URL`** is set; **`auth.login`** issues the same HS256 JWT as the legacy bearer flow and sets an HttpOnly **`av_session`** cookie (`SameSite=Lax`, **`Secure`** in production). **`verifyBearerSessionFromRequest`** accepts **`Authorization: Bearer`** first, then **`av_session`**, so browser **`credentials: "include"`** tRPC calls and SSR/session forwarding stay aligned. **`getSession`** returns **`user: null`** if the JWT is valid but the user row is missing (revoked/deleted). **Still deferred:** outbound email for verification / password-reset links (tokens are generated and stored; **`void` raw token** wired for a future mailer), refresh-token / server-side revocation lists, optional **`accessToken`** in JSON for non-browser clients, and cross-origin cookie policies beyond same-origin dev proxy / deployment assumptions.
- **CSP tightening (addressed 2026-04-17 follow-up):** Production **`script-src`** and **`style-src`** use the **same per-request nonce** (`src/start.ts` + `AsyncLocalStorage`, `router.options.ssr.nonce`, `buildContentSecurityPolicy`). **`style-src-attr 'unsafe-inline'`** remains for React **`style={{…}}`** (narrower than blanket **`style-src 'unsafe-inline'`**). Client **`@web-csp-nonce`** reads **`meta[property="csp-nonce"]`** for hydration parity. Optional: **`strict-dynamic`**, DAST, or reducing inline style attributes over time.
- **Telemetry:** ~~sampling, retention, and forwarding from API logs~~ — client (`VITE_PUBLIC_TELEMETRY_SAMPLE_RATE`) and server log (`TELEMETRY_INGEST_LOG_SAMPLE_RATE`) sampling; runbook + `.env.example` for retention/forwarding; rotate secrets per runbook.
- **Lighthouse:** tune numeric thresholds after stable CI baselines (comment in `lighthouserc.cjs`); HTML artifact upload in `web-lighthouse-ci.yml`.
- **Coverage:** expand **`vitest.config.mjs`** `include` globs toward **≥ 85%** on agreed modules per testing strategy (`client-log`, `web-vitals`, `telemetry-sample-rate` added).
- **Dated rollback drill:** complete the tabletop in **`web-deploy-rollback.md`** with participants and timestamps when exercised (drill record table added).
- **P3** product/DX items — **implemented 2026-04-17** (see [P3 implementation](#p3-implementation-2026-04-17)).

---

## P3 implementation (2026-04-17)

Product follow-ups from plan §8 / deferred list:

- **Feature-flag admin (real Postgres):** `FeatureFlagService.listAdminSnapshot` in [`packages/database/src/feature-flag-service.ts`](../packages/database/src/feature-flag-service.ts); authenticated **`admin.featureFlags.list`** on the unified tRPC router; dashboard [`-feature-flags.page.tsx`](../apps/frontend/src/routes/$locale/dashboard/-feature-flags.page.tsx) reads live rows via **`trpc.admin.featureFlags.list`** (mock snapshot file removed).
- **TenantConfig-driven branding:** optional **`ui.brand`** on **`TenantConfig`** ([`packages/config/src/schemas/tenant-ui.ts`](../packages/config/src/schemas/tenant-ui.ts)); Masafh fixture updated in [`configs/tenants/11111111-1111-4111-8111-111111111111.json`](../configs/tenants/11111111-1111-4111-8111-111111111111.json); public **`tenant.getBranding`** serves validated brand tokens from disk config; [`TenantBrandedThemeProvider`](../apps/frontend/src/components/providers/TenantBrandedThemeProvider.tsx) merges API brand with packaged fallbacks from [`tenant-branding.ts`](../apps/frontend/src/lib/tenant/tenant-branding.ts).
- **Subdomain / slug → tenant UUID:** **`tenant.resolveSlug`** resolves **`tenants.slug`** (case-insensitive); web sets **`VITE_PUBLIC_TENANT_BASE_DOMAINS`** (e.g. `localhost` for `acme.localhost`), uses **`extractTenantSlugFromHost`** from **`@agenticverdict/core`**, and extends [`getEffectiveTenantId`](../apps/frontend/src/lib/tenant/tenant-resolution.ts) + [`TenantProvider`](../apps/frontend/src/providers/TenantProvider.tsx) so **`x-tenant-id`** aligns with slug-derived tenants before login.
- **Infra:** shared TRPC DB helper [`apps/api/src/trpc/database.ts`](../apps/api/src/trpc/database.ts); **`authedProcedure`** in [`procedures.ts`](../apps/api/src/trpc/procedures.ts); **`@agenticverdict/types`** exports admin + tenant-public Zod contracts.

---

## References

- [`docs/03-technology-research/frontend/web-tanstack-post-review-implementation-plan-2026-04-17.md`](../docs/03-technology-research/frontend/web-tanstack-post-review-implementation-plan-2026-04-17.md) — full P0–P3 checklist.
- [`changelog/2026-04-17-web-tanstack-implementation-review.md`](2026-04-17-web-tanstack-implementation-review.md) — source findings.
- [`changelog/2026-04-17-web-tanstack-phase-3-performance-cwv-coverage.md`](2026-04-17-web-tanstack-phase-3-performance-cwv-coverage.md) — CWV instrumentation + scoped coverage baseline.
- [`changelog/2026-04-17-web-tanstack-phase-4-production-security-tenant-ops.md`](2026-04-17-web-tanstack-phase-4-production-security-tenant-ops.md) — prior telemetry/header/audit context (superseded in part by this changelog for CSP + ingest contract).
- [`docs/architecture/ui/04-decision-record.md`](../docs/architecture/ui/04-decision-record.md) — Decision 11 (tRPC unified API).
