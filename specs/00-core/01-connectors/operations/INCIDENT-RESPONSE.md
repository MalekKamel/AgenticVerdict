# Incident response — platform adapters

## Severity guide

- **SEV1** — Complete inability to fetch metrics for multiple tenants or multiple platforms; data pipeline stopped.
- **SEV2** — Single platform degraded for many tenants, or Redis down in production.
- **SEV3** — Elevated errors or latency isolated to one tenant or one region.

## Common scenarios

### 1. Vendor outage or elevated 5xx

**Symptoms:** `upstream_error`, retries exhausted, circuit breaker opens.

**Steps:**

1. Confirm vendor status page.
2. Inspect error rate per platform in logs and health JSON.
3. If breaker opens system-wide, enable cached reads only where business rules allow stale data.
4. Communicate ETA; after recovery, verify half-open success counts before closing incident.

### 2. OAuth / token failures

**Symptoms:** `auth_failed`, Meta/Google/TikTok OAuth errors in logs.

**Steps:**

1. Identify scope vs credential age (expired refresh token).
2. For systemic failures, check client id/secret rotation at vendor.
3. Re-run tenant OAuth or refresh flows; verify one tenant manually using [AUTHENTICATION-GUIDES.md](./AUTHENTICATION-GUIDES.md).
4. Clear DLQ records after replay if applicable.

### 3. Rate limiting

**Symptoms:** `rate_limited`, vendor throttle headers.

**Steps:**

1. Reduce job concurrency for affected platform.
2. Increase cache TTL where data freshness allows.
3. Review token bucket config in `platform-rate-config.ts` vs vendor documented limits.

### 4. Redis / cache failures

**Symptoms:** `components.redis.status: down`, cache errors in metrics, degraded health.

**Steps:**

1. Verify `UPSTASH_REDIS_REST_URL` and token secrets.
2. Fail open: app continues with in-memory cache per instance (not shared); expect lower hit rate.
3. Restore Redis; monitor cache hit ratio recovery.

### 5. DLQ backlog

**Symptoms:** `deadLetter.status: degraded`, backlog > 100.

**Steps:**

1. Sample DLQ entries (internal tooling) for recurring error class.
2. Fix root cause (auth, date range, invalid ids).
3. Replay or discard after review per data governance policy.

## Communication template

- **Impact:** Which platforms/tenants.
- **Customer data:** Whether reports are stale or missing.
- **Mitigation:** Cache-only, rollback, vendor workaround.
- **Next update:** Timebox in minutes.

## Post-incident

- Open a blameless review if SEV1/SEV2.
- Add a regression test in `tests/phase01-platform-integration/` if the failure mode is reproducible with mocks.
