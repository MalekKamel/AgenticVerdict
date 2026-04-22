# Changelog entry: Phase 01 — Meta (Facebook/Instagram) adapter

**Date:** 2026-04-04  
**Scope:** Phase 1 (Platform Integration) — [Execution Phase 2 — Meta adapter implementation](specs/00-core/01-connectors/EXECUTION-PLAN.md) (`tasks.md` Work Stream 2, Task 2.1).

This entry summarizes the first vendor-specific adapter: Marketing API reads, OAuth-style token handling (validation + long-lived exchange), cursor pagination, per-request throttling aligned with Meta’s hourly budget, and normalization into the shared snapshot shape. It does **not** cover GA4, GSC, GBP, or TikTok adapters, browser OAuth UI in `apps/frontend`, automated load/performance gates (Execution Phase 7), or the cross-platform normalization framework beyond Meta’s transformer (Work Stream 3 remains separate).

---

## Summary

- Implemented **`MetaPlatformAdapter`** extending **`BasePlatformAdapter`**, with **`doAuthenticate`** / **`fetchRawMetrics`** wired to the **Graph API** (`v21.0`): campaigns, ad sets, ads, and **campaign-level insights** over an inclusive ISO date range.
- Added **Graph helpers** (`metaGraphGet`, **`metaGraphGetAllPages`**) that follow **`paging.next`**, map HTTP/Graph errors to **`PlatformAuthError`**, **`PlatformRateLimitError`**, and other **`PlatformError`** codes, and support an optional **`beforeRequest`** hook for throttling.
- Added **OAuth helpers**: **`exchangeMetaLongLivedToken`** (`fb_exchange_token`) and **`validateMetaAccessToken`** (`/me`); credentials use **`metaCredentialKeys`** (`accessToken`, `adAccountId`, optional `appId` / `appSecret` / `refreshToken` or `tokenToExchange`).
- Corrected **Meta rate shaping** in **`platform-rate-config`**: **~200 calls/hour** token bucket (replacing an incorrect high RPM default); **`MetaPlatformAdapter`** disables the base adapter’s **`tokenBucket`** and **consumes once per Graph HTTP call** via **`perRequestBucket`** (optional **`requestTokenBucket`**, including **`null`** for tests).
- Exposed **`normalizeMetaRawMetrics`** for **`meta.*`** metric keys (impressions, clicks, spend, ctr, cpc, reach, conversions, catalog budgets) and re-exported the Meta surface from **`packages/platform-adapters`** **`index.ts`**.
- Expanded **Vitest** coverage for Meta, **`oauth`**, **`graph-client`**, and **`transformers`**; excluded type-only **`src/meta/models.ts`** from coverage; optional **integration** test gated on **`META_INTEGRATION_*`** env vars.

---

## Added

### `packages/platform-adapters`

- **`meta/models.ts`** — Graph list paging, campaign/ad set/ad/insight, and **`MetaRawMetricsPayload`** types.
- **`meta/graph-client.ts`** — **`META_GRAPH_API_VERSION`**, **`META_GRAPH_ORIGIN`**, **`mapMetaGraphHttpError`**, **`metaGraphGet`**, **`metaGraphGetAllPages`**.
- **`meta/oauth.ts`** — **`exchangeMetaLongLivedToken`**, **`validateMetaAccessToken`**; hardening for empty or non-object JSON on successful exchange responses.
- **`meta/transformers.ts`** — **`normalizeMetaRawMetrics`** → **`NormalizedPlatformSnapshot`**.
- **`meta/meta-adapter.ts`** — **`MetaPlatformAdapter`**, **`MetaPlatformAdapterOptions`**, **`metaCredentialKeys`**, **`normalizeMetaAdAccountId`**.
- **Tests** — **`meta-adapter.test.ts`**, **`graph-client.test.ts`**, **`oauth.test.ts`**, **`transformers.test.ts`**; **`meta.integration.test.ts`** (skipped unless **`META_INTEGRATION_ACCESS_TOKEN`** and **`META_INTEGRATION_AD_ACCOUNT_ID`** are set).

---

## Changed

### `packages/platform-adapters`

- **`platform-rate-config.ts`** — Meta uses **`requestsPerHour: 200`** with **`createPlatformTokenBucket("meta")`**; other platforms unchanged (RPM-based buckets).
- **`platform-rate-config.test.ts`** — Asserts Meta hourly capacity and refill rate.
- **`index.ts`** — Re-exports Meta adapter, Graph/OAuth helpers, **`normalizeMetaRawMetrics`**, and primary Meta types.
- **`vitest.config.ts`** — Coverage **`exclude`** for **`src/meta/models.ts`** (interfaces only).

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

- **Authorization code / browser OAuth** — No Next.js OAuth routes yet; adapters expect **tokens (and optional app secrets)** in **`PlatformCredentials`**.
- **Distributed rate limiting** — Per-process token bucket still applies; multi-instance Meta traffic needs a shared limiter (see adapter infrastructure changelog).
- **Marketing API depth** — Insights are **campaign-level** only in this slice; ad set / ad-level insights and async reporting jobs can be added when product requirements demand them.
- **Automated load and latency SLAs** — AC-1.1.5 / AC-2.x performance verification (e.g. 1000-request load, **<2s** uncached) is not wired into CI (Execution Phase 7).
- **Remaining vendor adapters** — GA4, GSC, GBP, and optional TikTok (Execution Phases 3–5) are still outstanding.

---

## Related documentation

- [`specs/00-core/01-connectors/EXECUTION-PLAN.md`](specs/00-core/01-connectors/EXECUTION-PLAN.md) — Execution Phase 2 definition and verification.
- [`specs/00-core/01-connectors/tasks.md`](specs/00-core/01-connectors/tasks.md) — Task 2.1 (Meta).
- [`specs/00-core/01-connectors/acceptance-criteria.md`](specs/00-core/01-connectors/acceptance-criteria.md) — §1.1 Meta (AC-1.1.1–AC-1.1.5), §1.2 normalization (AC-1.6.x), §5.1 authentication (AC-5.1.x).
