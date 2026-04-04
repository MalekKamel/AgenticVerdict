# Troubleshooting — platform adapters

## Health endpoint returns `503`

1. `GET /api/health/adapters` and inspect `components`:
   - **Redis `down`** — fix Upstash credentials or network egress.
   - **Cache degraded + errors** — distributed cache throwing; check Upstash quotas and client version.
   - **Dead letter `degraded`** — inspect queue size; see [INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md).
2. Inspect `platforms[]` for `status: degraded` — usually high `failureCount` vs `successCount` or poor latency scores.

## `unknown_platform` (400)

The path parameter must be exactly `meta`, `ga4`, `gsc`, `gbp`, or `tiktok` (see `apps/web/src/app/api/health/platforms/[platform]/route.ts`).

## GA4 "property" or quota errors

- Confirm `propertyId` includes `properties/` when required.
- Large ranges: adapter splits by 365-day windows; extreme ranges still cost quota — watch `Ga4DailyQuotaTracker` behavior in logs.
- Sampling: check normalized metadata from transformers for sampled reports.

## GSC date range rejected

Search analytics is limited to roughly **16 months** of history. Narrow `DateRangeIso` or expect guard errors from `assertGscSearchAnalyticsDateRange`.

## Meta ad account errors

- Normalize id with `normalizeMetaAdAccountId` (`act_` prefix).
- Confirm token has access to the ad account.

## TikTok sandbox vs production

Credential key `sandbox: "true"` switches hosts. Mismatch with token type causes auth or 404-class errors.

## Circuit breaker always open

- Check consecutive upstream failures; fix vendor or params.
- Temporarily tune `CircuitBreakerOptions` only in controlled incidents (avoid permanent loose thresholds).

## No metrics in health (`unknown` platform status)

No calls recorded yet for that platform in this process. Drive a test `fetchMetrics` or wait for production traffic.

## Tests fail locally

- Run `pnpm run test:phase01-integration` from repo root.
- Ensure no port collision for the mock gateway (tests pick ephemeral ports).
