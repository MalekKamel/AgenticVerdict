# Changelog: Web TanStack Start — Phase 4 (observability ingest, security baselines, tenant ops surfaces)

**Date:** 2026-04-17  
**Scope:** Execution of **Phase 4 (Weeks 7–8) — Production readiness** from [`web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md): optional browser telemetry forwarding for structured errors, web vitals, and product analytics; HTTP security headers on Nitro; non-blocking `pnpm audit` reporting in CI; an admin **feature flags** snapshot route aligned with `createFeatureFlagService` / Postgres schema (mock data until tRPC exposes admin reads); **white-label** theme resolution for the reference Masafh tenant UUID via packaged `BrandTokens`; and a gated **onboarding** wizard with product-event telemetry. Aligns with [Decision 11](../docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support) (domain RPC remains on `apps/api`; admin reads are a documented follow-up).

**Verification run:** `pnpm --filter @agenticverdict/web lint`, `pnpm --filter @agenticverdict/web typecheck`, `pnpm --filter @agenticverdict/web test`, `pnpm --filter @agenticverdict/web exec vitest run --coverage`, `pnpm --filter @agenticverdict/web build`.

---

## Summary

- **P4-1 Observability:** Introduced **`telemetry-ingest.ts`** — when **`VITE_PUBLIC_TELEMETRY_INGEST_URL`** is set, **`forwardTelemetry`** sends JSON envelopes (**`client_error`**, **`web_vital`**, **`product_event`**) via **`navigator.sendBeacon`** (fallback **`fetch`** with **`keepalive`**). **`logWebClientError`** and **`web-vitals`** emission paths now call **`forwardTelemetry`** after structured console logs; **`logOnboardingEvent`** records onboarding funnel steps to the same channel. No PII; **tenant id** only when resolvable.
- **P4-2 Deployment:** CI already performs a **web production build** (Phase 3). Phase 4 does **not** introduce a separate deploy runtime: **rollback** remains “re-deploy prior successful **`main`** artifact / image” per your hosting orchestrator — operational expectation captured here for on-call alignment, not a new pipeline.
- **P4-3 Security:** **Nitro** **`routeRules`** apply baseline headers on **`/**`**: **`X-Content-Type-Options: nosniff`**, **`Referrer-Policy: strict-origin-when-cross-origin`**, **`Permissions-Policy`** (camera/microphone/geolocation disabled). **`cache-control`** for **`/assets/**`** unchanged (Phase 3). CI runs **`pnpm audit`** as an **informational** step (**`continue-on-error: true`**) and uploads **`pnpm-audit-report.txt`** because the workspace currently reports outstanding advisories — findings must be triaged and upgraded on a separate security runway (no gate breakage).
- **P4-4 Feature flags UI:** **`/$locale/dashboard/feature-flags`** (lazy) renders a Mantine **Table** from **`getMockFeatureFlagAdminRows()`**, typed alongside **`packages/database`** flag definitions. Gated by **`VITE_PUBLIC_ENABLE_FEATURE_FLAGS_ADMIN_UI`**. Direct navigation when disabled redirects to the dashboard.
- **P4-5 White-label:** **`TenantBrandedThemeProvider`** wraps **`@agenticverdict/ui`** **`ThemeProvider`**, keying remounts by tenant and passing **`resolveBrandTokensForTenantId()`** — **Masafh** reference UUID (**`11111111-1111-4111-8111-111111111111`**) maps to packaged **`masafhTheme`**; other tenants use **`defaultBrandTheme`** until **CompanyConfig**-driven fetch lands in **`useTenantTheme`**.
- **P4-6 Onboarding:** **`/$locale/onboarding`** (lazy) uses Mantine **Stepper** and **`logOnboardingEvent`**. Gated by **`VITE_PUBLIC_ENABLE_ONBOARDING_WIZARD`**; when off, redirects to the dashboard. Dashboard shows links to onboarding / feature flags when the respective env flags are **`"true"`** (navigation copy added under **`navigation.onboarding`** / **`navigation.featureFlags`**).

---

## Added

### `apps/frontend`

- **`src/lib/observability/telemetry-ingest.ts`** + **`telemetry-ingest.test.ts`** — optional ingest URL, `forwardTelemetry`, Vitest coverage for fetch path when **`sendBeacon`** returns false.
- **`src/lib/tenant/tenant-branding.ts`** + **`tenant-branding.test.ts`** — Masafh UUID → **`masafhTheme`**.
- **`src/components/providers/TenantBrandedThemeProvider.tsx`** — tenant-scoped **`ThemeProvider`** (**`key`** + **`initialTheme`**).
- **`src/lib/feature-flags/feature-flags-readiness.ts`**, **`mock-feature-flag-snapshot.ts`**, **`feature-flags-readiness.test.ts`** — env gate + static snapshot rows.
- **`src/lib/onboarding/onboarding-readiness.ts`**, **`onboarding-analytics.ts`**, **`onboarding-readiness.test.ts`** — env gate + **`product_event`** telemetry.
- **`src/routes/$locale/dashboard/feature-flags.tsx`**, **`-feature-flags.page.tsx`** — protected admin-style table (mock).
- **`src/routes/$locale/onboarding.tsx`**, **`-onboarding.page.tsx`** — gated onboarding flow.

### `.github/workflows`

- **`ci.yml`** — post-install **Dependency audit (informational)** + **Upload dependency audit report** artifact.

---

## Changed

### `apps/frontend`

- **`src/components/Providers.tsx`** — **`TenantBrandedThemeProvider`** replaces bare **`ThemeProvider`** (white-label).
- **`src/lib/observability/client-log.ts`** — forwards **`client_error`** envelopes when ingest URL is set.
- **`src/lib/observability/web-vitals.ts`** — forwards **`web_vital`** envelopes after **`[web-vitals]`** console lines.
- **`src/vite-env.d.ts`** — **`VITE_PUBLIC_TELEMETRY_INGEST_URL`**, **`VITE_PUBLIC_ENABLE_FEATURE_FLAGS_ADMIN_UI`**, **`VITE_PUBLIC_ENABLE_ONBOARDING_WIZARD`**.
- **`src/routes/$locale/-dashboard.page.tsx`** — conditional links for onboarding / feature flags.
- **`vite.config.ts`** — security headers on **`/**`** (in addition to **`/assets/**`** caching).
- **`vitest.config.mjs`** — scoped coverage includes telemetry + branding + onboarding/feature-flag readiness modules.

### `apps/frontend/messages`

- **`en.json`**, **`ar.json`** — **`navigation.onboarding`**, **`navigation.featureFlags`**, **`admin.featureFlags.*`**, **`onboarding.*`**.

---

## Work packages mapping

| Plan ID | Delivered in this change                                                          |
| ------- | --------------------------------------------------------------------------------- |
| P4-1    | `telemetry-ingest`, wire `client-log` + `web-vitals` + onboarding `product_event` |
| P4-2    | Runbook note: rollback = redeploy last good artifact (no new automation in-repo)  |
| P4-3    | Nitro security headers; informational `pnpm audit` + CI artifact                  |
| P4-4    | `/dashboard/feature-flags` mock table + env gate                                  |
| P4-5    | `TenantBrandedThemeProvider` + `resolveBrandTokensForTenantId`                    |
| P4-6    | `/onboarding` wizard + `logOnboardingEvent`                                       |

---

## Deferred / follow-ups

- **Ingest backend contract** — authenticate/sanitize **`VITE_PUBLIC_TELEMETRY_INGEST_URL`**; sampling, retention, and vendor choice (OpenTelemetry web, self-hosted, etc.).
- **Blocking dependency policy** — clear **`pnpm audit`** backlog (drizzle-orm, fastify, transitive **protobufjs** / **handlebars**, …) so the audit step can fail the build per org policy.
- **CSP** — content-security-policy not yet set (hash/nonce strategy needed for TanStack + Mantine); review with security before enabling.
- **SAST/DAST & pen-test scheduling** — out of scope for this code change; track with security separately.
- **`trpc.admin.featureFlags.list`** — replace **`getMockFeatureFlagAdminRows`** when **`createFeatureFlagService`** is exposed on the shared router with RBAC.
- **CompanyConfig theme API** — replace UUID allowlist with server-driven **`BrandTokens`** (eliminate theme flash when backend lands).

---

## References

- [`docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md) — Phase 4 exit criteria and work packages.
- [`docs/architecture/ui/04-decision-record.md`](../docs/architecture/ui/04-decision-record.md) — Decision 11 (tRPC unified API).
- [`packages/database/src/feature-flag-service.ts`](../packages/database/src/feature-flag-service.ts) — **`createFeatureFlagService`** (server-side resolution).
- [`changelog/2026-04-17-web-tanstack-phase-3-performance-cwv-coverage.md`](2026-04-17-web-tanstack-phase-3-performance-cwv-coverage.md) — Phase 3 CWV + retry/error mapping baseline.
