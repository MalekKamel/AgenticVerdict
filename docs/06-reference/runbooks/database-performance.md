# Database performance runbook

## Symptoms

- Elevated API latency on DB-backed routes.
- Connection pool exhaustion errors.
- Slow query log entries above threshold (when enabled).

## Diagnosis

1. Check **active connections** vs pool limit (app and PgBouncer if used).
2. Identify **top queries** via `pg_stat_statements` or APM.
3. Correlate with **recent migrations** or report templates ( heavy JSON ).
4. **Prometheus (P2):** When `createDatabaseClient` is built with `queryMetrics.enabled`, scrape the API or whichever process exposes `/metrics` and review `agenticverdict_db_query_duration_seconds` and `agenticverdict_db_slow_queries_total` (see Grafana dashboard **Database query performance**, UID `av-database-performance`).

## Resolution

1. **Kill runaways** only via approved admin scripts; prefer `pg_cancel_backend` over terminate.
2. **Add or fix indexes** per explain plans (in dev first).
3. **Scale pool** or read replicas for read-heavy workloads.
4. **Cache** hot reads at Redis where tenant-safe.

## Verification

- p95 latency restored; pool usage < 70% steady state.
- No repeated lock storms on the same relation.

## Prevention

- P2 remediation: structured **slow query metrics** and review cadence.
- Migration checklist: index for new foreign keys and filters.
