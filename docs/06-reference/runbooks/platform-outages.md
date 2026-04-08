# Platform outages (Meta, GA4, GSC, GBP, TikTok)

## Symptoms

- Spike in adapter errors or **circuit breaker open** metrics (`agenticverdict_circuit_breaker_state`).
- Customer-visible gaps in cross-platform reports.

## Diagnosis

1. Open **Circuit breaker & retry health** Grafana dashboard.
2. Check vendor **status pages** and regional outages.
3. Inspect tenant credentials (expired OAuth, revoked tokens) via secure audit tools only.

## Resolution

1. **Wait out** transient vendor outages; circuit breaker protects downstream.
2. **Refresh tokens** per platform OAuth runbooks (stored only in vault).
3. **Reduce scope** temporarily (disable a platform in tenant config) if business approves.
4. After recovery, **replay** failed jobs or re-run workflows as designed.

## Verification

- Breaker transitions return to **closed**; fetch success rate normalized.
- [platform-validation-results.md](../platform-validation-results.md) spot-check after major vendor incidents.

## Prevention

- Rate-limit and backoff already instrumented; monitor **retry exhaustion** alerts.
- Stagger bulk backfills across tenants.
