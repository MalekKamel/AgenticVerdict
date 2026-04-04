# Changelog entry: Phase 01 — Google Search Console + Business Profile adapters

**Date:** 2026-04-04  
**Scope:** Phase 1 (Platform Integration) — [Execution Phase 4 — Google platform adapters (GSC + GBP)](docs/03-development-phases/phase-01-platform-integration/EXECUTION-PLAN.md) (`tasks.md` Work Stream 2, Tasks 2.3 and 2.4).

This entry implements Search Console and Google Business Profile reads on top of the shared adapter infrastructure, with Google OAuth aligned to GA4’s token refresh and validation pattern. It does **not** cover browser OAuth UI, TikTok, the cross-cutting normalization framework (Work Stream 3 beyond per-adapter transformers), or automated load/performance CI gates (Execution Phase 7).

---

## Summary

- Added **shared Google primitives** in **`packages/platform-adapters`**: **`google/oauth.ts`** (`validateGoogleAccessTokenForPlatform`, `refreshGoogleAccessTokenForPlatform` with correct **`PlatformAuthError` platform tags**) and **`google/http.ts`** (`mapGoogleJsonApiHttpError`, **`readGoogleApiJsonBody`**). **`ga4/oauth.ts`** now thin-wraps the shared module so existing GA4 imports stay stable.
- Implemented **`GscPlatformAdapter`**: Webmasters v3 **search analytics** (paginated **`startRow` / `rowLimit`**), **sitemaps**, optional **URL Inspection API** when **`inspectionUrl`** is present in credentials, **~16-month** search analytics guard (**`assertGscSearchAnalyticsDateRange`** / **`GSC_MAX_INCLUSIVE_HISTORY_DAYS`**), and **`normalizeGscRawMetrics`** into **`NormalizedPlatformSnapshot`**.
- Implemented **`GbpPlatformAdapter`**: **Account Management** account listing, **Business Information** location listing (paginated), **v4 reviews** per location (best-effort), **Business Profile Performance** daily metric time series per location, optional **`accountResourceName`** filter, constructor **`maxLocations`** cap for large chains/tests, and **`normalizeGbpRawMetrics`**.
- Tuned **GSC rate shaping** to **~5 QPS** via **`createPlatformTokenBucket("gsc")`** (**300** RPM capacity / **5** tokens/sec refill) and **per-request** consumption on each HTTP call (same pattern as GA4/Meta).
- Expanded **Vitest** coverage (including **`google/*`**, **`gsc/*`**, **`gbp/*`**, **`gsc/api-client`**, **`gbp/api-client`** pagination/error paths, **`infrastructure-health`** DLQ degradation) so package **branch** coverage stays **≥85%**.
- Added **optional integration** tests gated on **`GSC_INTEGRATION_ACCESS_TOKEN`** + **`GSC_INTEGRATION_SITE_URL`** and **`GBP_INTEGRATION_ACCESS_TOKEN`** (optional **`GBP_INTEGRATION_ACCOUNT_RESOURCE_NAME`**).

---

## Added

### `packages/platform-adapters`

- **`google/oauth.ts`**, **`google/http.ts`** — shared OAuth + JSON error mapping for all Google-backed adapters.
- **`google/oauth.test.ts`**, **`google/http.test.ts`**.
- **`gsc/`** — **`api-client.ts`**, **`date-range-guard.ts`**, **`gsc-adapter.ts`**, **`transformers.ts`**, **`models.ts`**, tests + **`gsc.integration.test.ts`**.
- **`gbp/`** — **`api-client.ts`**, **`gbp-adapter.ts`**, **`transformers.ts`**, **`models.ts`**, tests + **`gbp.integration.test.ts`**.
- **`index.ts`** — exports for GSC/GBP adapters, shared Google helpers, and key client utilities.

---

## Changed

### `packages/platform-adapters`

- **`ga4/oauth.ts`** — delegates to **`google/oauth.ts`**; public **`validateGoogleAccessToken` / `refreshGoogleAccessToken`** signatures unchanged for callers.
- **`platform-rate-config.ts`** — **`gsc`** profile set to **300** RPM (~**5 QPS**).
- **`platform-rate-config.test.ts`** — asserts GSC bucket capacity/refill.
- **`vitest.config.ts`** — coverage excludes for **`gsc/models.ts`** and **`gbp/models.ts`** (type-heavy).
- **`infrastructure-health.test.ts`** — DLQ backlog degradation case.

---

## Verification (local)

Commands that were run successfully after the changes:

- `pnpm --filter @agenticverdict/platform-adapters test`
- `pnpm exec vitest run --coverage` from **`packages/platform-adapters`** — meets package coverage thresholds
- `pnpm test` (Turbo workspace tests)
- `pnpm --filter @agenticverdict/web typecheck`
- `pnpm --filter @agenticverdict/platform-adapters lint` (exit **0**; existing warning may appear under **`coverage/`** if generated locally)

---

## Known follow-ups (not in this change set)

- **Browser / authorization-code OAuth** — Adapters still expect **tokens** (and optional **client id/secret + refresh token**) in **`PlatformCredentials`**; no Next.js OAuth routes yet.
- **GSC “coverage” in the broad SEO sense** — Bulk index coverage like the UI’s historical charts is not fully represented as a single API; the adapter combines **sitemaps**, **URL inspection** (when configured), and **search analytics** metrics. **Core Web Vitals** as a dedicated Search Console API surface is limited; inspection/mobile usability fields are surfaced when returned.
- **GBP API variance** — Some accounts may not expose **Performance** or **v4 reviews** uniformly; failures are captured as **`gbp.performance.error`** / omitted review blocks rather than failing the whole fetch.
- **Distributed rate limiting** — In-process token buckets only; multi-instance deployments still need a shared limiter (see adapter infrastructure changelog).
- **Execution Phase 7** — Automated **<2s** uncached / **<200ms** cached SLA verification in CI remains future work.

---

## Related documentation

- [`docs/03-development-phases/phase-01-platform-integration/EXECUTION-PLAN.md`](docs/03-development-phases/phase-01-platform-integration/EXECUTION-PLAN.md) — Execution Phase 4 definition and verification.
- [`docs/03-development-phases/phase-01-platform-integration/tasks.md`](docs/03-development-phases/phase-01-platform-integration/tasks.md) — Tasks 2.3 (GSC) and 2.4 (GBP).
- [`docs/03-development-phases/phase-01-platform-integration/acceptance-criteria.md`](docs/03-development-phases/phase-01-platform-integration/acceptance-criteria.md) — §1.3 GSC (AC-1.3.1–AC-1.3.5), §1.4 GBP (AC-1.4.1–AC-1.4.5), §1.2 normalization (AC-1.6.x).
