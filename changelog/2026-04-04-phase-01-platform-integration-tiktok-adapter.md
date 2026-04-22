# Changelog entry: Phase 01 — TikTok adapter (Execution Phase 5)

**Date:** 2026-04-04  
**Scope:** Phase 1 (Platform Integration) — [Execution Phase 5 — TikTok adapter implementation (conditional)](specs/00-core/01-connectors/EXECUTION-PLAN.md) (`tasks.md` Work Stream 2: Task 2.5).

This entry adds the optional TikTok Marketing API (`open_api/v1.3`) read path: OAuth token exchange and validation, advertiser scoping, cursor-style list pagination for campaigns / ad groups / ads, integrated report pulls with automatic **30-day** date windows (aligned with TikTok stat-time reporting limits), per-request token-bucket throttling, normalization into the shared snapshot shape, and opt-in **sandbox** hosts. It does **not** add TikTok Pixel ingestion (called out separately in `tasks.md`), browser OAuth UI in `apps/frontend`, the cross-cutting normalization framework beyond TikTok’s transformer (Work Stream 3), or automated load/performance CI gates (Execution Phase 7).

---

## Summary

- Introduced **`TikTokPlatformAdapter`** with **`doAuthenticate`**: optional **`refresh_token`** or **`authorization_code`** exchange via **`POST .../oauth2/access_token/`**, validation via **`GET .../user/info/`**, and advertiser access check via **`GET .../advertiser/info/`** (with `advertiser_ids` JSON array).
- Implemented **`campaign/get/`**, **`adgroup/get/`**, **`ad/get/`**, and **`report/integrated/get/`** (AUCTION / BASIC / AUCTION_CAMPAIGN, `campaign_id` + `stat_time_day`) with **page** / **page_size** pagination helpers.
- Mapped TikTok **`code`** / HTTP responses to **`PlatformAuthError`**, **`PlatformRateLimitError`**, and retryable **`upstream_error`** (including documented transient business codes).
- Lowered default TikTok **RPM** token-bucket profile to **60** for conservative steady-state pacing against per-app QPS limits.
- Extended **coverage tooling**: exclude **`src/tiktok/models.ts`** (type-only surface, consistent with other adapters), and added tests for **infrastructure health**, **adapter metrics**, and **mock adapter** branches to keep package **branch coverage ≥ 85%**.

---

## Added

### `packages/platform-adapters`

- **`tiktok/http.ts`** — Host selection (`business-api` vs `sandbox-ads`), **`mapTikTokHttpError`**, **`mapTikTokBusinessCode`**, **`assertTikTokSuccess`**, **`tiktokParseResponse`**.
- **`tiktok/oauth.ts`** — **`tiktokOauth2AccessToken`**, **`validateTikTokAccessToken`**.
- **`tiktok/api-client.ts`** — **`tiktokMarketingGet`**, **`tiktokFetchAllListPages`**, **`tiktokFetchIntegratedCampaignReport`**, **`TikTokApiRequestOptions`**.
- **`tiktok/transformers.ts`** — **`normalizeTikTokRawMetrics`**.
- **`tiktok/tiktok-adapter.ts`** — **`TikTokPlatformAdapter`**, **`tiktokCredentialKeys`** (`accessToken`, `advertiserId`, `appId`, `appSecret`, `refreshToken`, `authCode`, `sandbox`).
- **Tests** — `http`, `oauth`, `api-client`, `transformers`, `tiktok-adapter`, and **skipped-by-default** **`tiktok.integration.test.ts`** (`TIKTOK_INTEGRATION_ACCESS_TOKEN`, `TIKTOK_INTEGRATION_ADVERTISER_ID`).

### `packages/platform-adapters` (supporting test / config updates)

- **`infrastructure-health.test.ts`** — Redis slow ping, distributed cache ok/degraded, null cache, low platform health score.
- **`adapter-metrics.test.ts`** — cache hit/miss, sample cap trim, failure-only percentiles.
- **`mock-adapter.test.ts`** — pre-auth fetch, records override, empty `records` fallback.

---

## Changed

- **`platform-rate-config.ts`** — TikTok **`requestsPerMinute`** **120 → 60** (commented rationale).
- **`index.ts`** — Public exports for TikTok adapter, HTTP helpers, OAuth, transformer, and model types used by consumers.
- **`vitest.config.ts`** — Coverage exclude **`src/tiktok/models.ts`**.

---

## Verification (local)

Commands run successfully after the changes:

- `pnpm test` (Turbo workspace tests)
- `pnpm --filter @agenticverdict/frontend typecheck`
- `pnpm exec vitest run --coverage` from **`packages/platform-adapters`** (meets package coverage thresholds)

---

## Known follow-ups (not in this change set)

- **TikTok Pixel** — Separate from Marketing API ads entities; still open per Task 2.5 checklist in `tasks.md`.
- **Browser OAuth routes** — No `apps/frontend` OAuth callback wiring; credentials are expected from your identity / vault layer.
- **Live integration** — Opt-in env-gated test; obtain Business API access and sandbox or production credentials to unskip **`tiktok.integration.test.ts`**.
- **Execution Phase 6** — Cross-platform normalization / validation framework remains the next major bundle in the execution plan.

---

## Related documentation

- [`specs/00-core/01-connectors/EXECUTION-PLAN.md`](specs/00-core/01-connectors/EXECUTION-PLAN.md) — Execution Phase 5 definition and verification.
- [`specs/00-core/01-connectors/tasks.md`](specs/00-core/01-connectors/tasks.md) — Task 2.5 (conditional TikTok adapter).
- [`specs/00-core/01-connectors/acceptance-criteria.md`](specs/00-core/01-connectors/acceptance-criteria.md) — §1.5 TikTok (AC-1.5.1–AC-1.5.4), §1.2 normalization (AC-1.6.x), §5.1 authentication (AC-5.1.x).
