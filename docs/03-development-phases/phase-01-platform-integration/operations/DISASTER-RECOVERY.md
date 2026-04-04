# Disaster recovery — platform adapters

## Objectives

- Restore **read path** availability when optional Redis is lost.
- Protect **tenant isolation** during failover (no cross-tenant cache keys).
- Recover **credentials** without exposing secrets in logs.

## Scenarios

### A. Upstash / Redis unavailable

**Impact:** Distributed cache misses; each Node instance uses only local memory if the bundle falls back, or cache errors degrade health.

**Procedure:**

1. Confirm outage scope (Upstash status, DNS, token revocation).
2. Temporarily allow degraded mode while Redis is repaired (health will report `degraded` or `down`).
3. After restore, verify `components.redis.detail` shows successful low-latency ping.
4. Expect cold cache: monitor origin QPS to vendors and rate limits.

**RPO/RTO notes:** Cache is **non-authoritative**. RPO for cached metrics is bounded by TTL; RTO is time to restore Redis or accept degraded caching.

### B. Region or deployment loss

**Procedure:**

1. Fail traffic to healthy region/revision.
2. Ensure env vars for Redis and secrets are present in the standby stack.
3. Run health smoke tests from [RUNBOOK-DEPLOYMENT.md](./RUNBOOK-DEPLOYMENT.md).

### C. Credential database compromise

**Procedure:**

1. Revoke tokens at each vendor for affected tenants.
2. Rotate encryption keys per security policy (Phase 0 database/crypto runbooks).
3. Force re-authentication flows; audit DLQ for leaked operations.

### D. Data corruption in cache (rare)

**Procedure:**

1. Purge adapter cache keys by tenant/platform prefix if you implement admin tooling; otherwise bump cache version in key strategy (code change) and redeploy.
2. Validate normalized output with `validateNormalizedSnapshot` in a batch job.

## Testing (documented posture)

- **Quarterly:** Run tabletop exercise: Redis disabled in staging, observe health and traffic.
- **Annually:** Full region failover drill if multi-region is in scope for production.

Record outcomes in your internal ticketing system; link to this document.
