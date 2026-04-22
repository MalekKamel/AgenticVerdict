# Changelog entry: Phase 01 — GA4 (Google Analytics 4) adapter

**Date:** 2026-04-04  
**Scope:** Phase 1 (Platform Integration) — [Execution Phase 3 — GA4 adapter implementation](specs/00-core/01-connectors/EXECUTION-PLAN.md) (`tasks.md` Work Stream 2, Task 2.2).

This entry adds the second vendor adapter: Google Analytics Data API v1 (REST) reads with OAuth bearer validation and refresh-token exchange, automatic splitting of inclusive ranges longer than 365 days, per-UTC-day request budgeting aligned with the ~50k calls/day project quota, sampling detection on standard and realtime responses, optional funnel exploration via v1alpha, and normalization into the shared snapshot shape. It does **not** add browser OAuth routes in `apps/frontend`, GSC/GBP/TikTok adapters, load/performance automation (Execution Phase 7), or the cross-cutting normalization framework beyond GA4’s transformer (Work Stream 3 remains separate).

---

## Summary

- Implemented **`Ga4PlatformAdapter`** extending **`BasePlatformAdapter`**, with **`doAuthenticate`** validating tokens via Google **`tokeninfo`** or obtaining an access token from **`refresh_token` + client_id + client_secret`**, and **`fetchRawMetrics`** orchestrating chunked **`runReport`** calls (event × date and traffic × date), **`runRealtimeReport`**, and best-effort **`runFunnelReport`** (trailing 365-day window when the user range is longer).
- Added **REST helpers** (`ga4DataApiPost`, **`mapGa4DataApiHttpError`**, **`runGa4CoreReportsForRange`**, **`runGa4RealtimeReport`**, **`runGa4FunnelReportSafe`**, **`mergeGa4RunReports`**) targeting **`analyticsdata.googleapis.com`**.
- Added **OAuth helpers**: **`validateGoogleAccessToken`**, **`refreshGoogleAccessToken`**; credentials use **`ga4CredentialKeys`** (`propertyId`, `accessToken`, optional `refreshToken`, `clientId`, `clientSecret`).
- Added **`Ga4DailyQuotaTracker`** (injectable UTC day clock for tests) enforcing a hard **daily** request cap (default **50,000**); exhaustion throws **`PlatformError`** with code **`invalid_request`** so the base adapter does **not** apply exponential backoff (unlike upstream **`PlatformRateLimitError`**).
- Added **date utilities**: **`splitInclusiveDateRange`**, **`countInclusiveUtcDays`**, **`trailingInclusiveWindow`** for AC-1.2.5 and funnel windowing.
- Exposed **`normalizeGa4RawMetrics`** for **`ga4.*`** metric keys plus **`ga4.meta.sampled`**, **`ga4.meta.dataApiCalls`**, funnel markers; re-exported the GA4 surface from **`packages/platform-adapters`** **`index.ts`**.
- Expanded **Vitest** coverage (GA4 unit tests, **`error-classifier`** branches); optional **integration** test gated on **`GA4_INTEGRATION_ACCESS_TOKEN`** and **`GA4_INTEGRATION_PROPERTY_ID`**.

---

## Added

### `packages/platform-adapters`

- **`ga4/models.ts`** — REST response and **`Ga4RawMetricsPayload`** types.
- **`ga4/date-range-split.ts`** — Inclusive UTC day math, **365-day** chunking, trailing window helper.
- **`ga4/daily-quota.ts`** — **`Ga4DailyQuotaTracker`** with optional **`currentUtcDay`** override.
- **`ga4/sampling.ts`** — **`isRunReportSampled`**, **`mergeSamplingFlags`** (samples read vs space, data loss flag).
- **`ga4/data-client.ts`** — Data API POST client, core/realtime/funnel runners, report merge.
- **`ga4/oauth.ts`** — Tokeninfo validation and refresh-token exchange.
- **`ga4/transformers.ts`** — **`normalizeGa4RawMetrics`**.
- **`ga4/ga4-adapter.ts`** — **`Ga4PlatformAdapter`**, **`ga4CredentialKeys`**, **`normalizeGa4PropertyResourceId`** (via data-client).
- **Tests** — `*.test.ts` under **`ga4/`**, plus **`ga4.integration.test.ts`** (skipped unless env set).

---

## Changed

### `packages/platform-adapters`

- **`index.ts`** — Re-exports GA4 adapter, OAuth/Data API helpers, date utilities, quota tracker, and types.
- **`vitest.config.ts`** — Coverage **`exclude`** for **`src/ga4/models.ts`** (interfaces only).
- **`error-classifier.test.ts`** — Additional cases for generic **`Error`** / **`PlatformError`** retry classification (supports GA4 quota error behavior).

---

## Verification (local)

Commands that were run successfully after the changes:

- `pnpm --filter @agenticverdict/platform-adapters test`
- `pnpm exec vitest run --coverage` from **`packages/platform-adapters`** — meets package coverage thresholds
- `pnpm test` (Turbo workspace tests)
- `pnpm --filter @agenticverdict/frontend typecheck`
- `pnpm --filter @agenticverdict/platform-adapters lint`

---

## Known follow-ups (not in this change set)

- **Browser / authorization-code OAuth** — No Next.js OAuth routes yet; adapters expect **tokens** (and optional **refresh** + **client** secrets) in **`PlatformCredentials`**.
- **Distributed daily quota** — **`Ga4DailyQuotaTracker`** is in-process; multi-instance deployments need shared counters aligned with Google Cloud project quota.
- **Metric depth** — Traffic report uses **sessions**, **totalUsers**, **newUsers** for broad compatibility; **keyEvents**, **revenue**, and custom definitions can be layered when product requirements and property capabilities are fixed.
- **Funnel API availability** — **`runFunnelReport`** is **v1alpha**; failures are captured as **`funnelError`** without failing the whole fetch.
- **Automated load and latency SLAs** — AC-1.2.x / AC-2.x performance verification is not wired into CI (Execution Phase 7).
- **Remaining vendor adapters** — GSC, GBP, and optional TikTok (Execution Phases 4–5) are still outstanding.

---

## Related documentation

- [`specs/00-core/01-connectors/EXECUTION-PLAN.md`](specs/00-core/01-connectors/EXECUTION-PLAN.md) — Execution Phase 3 definition and verification.
- [`specs/00-core/01-connectors/tasks.md`](specs/00-core/01-connectors/tasks.md) — Task 2.2 (GA4).
- [`specs/00-core/01-connectors/acceptance-criteria.md`](specs/00-core/01-connectors/acceptance-criteria.md) — §1.2 GA4 (AC-1.2.1–AC-1.2.5), §1.2 normalization (AC-1.6.x), §5.1 authentication (AC-5.1.x).
