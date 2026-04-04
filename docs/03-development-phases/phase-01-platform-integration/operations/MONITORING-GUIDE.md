# Monitoring guide — platform adapters

## What to observe

1. **HTTP health** — `/api/health`, `/api/health/adapters`, `/api/health/platforms/{platform}` (see OpenAPI spec in this folder).
2. **In-process metrics** — `AdapterMethodMetrics` snapshots embedded in health JSON (`successCount`, `failureCount`, `cacheHits`, `cacheMisses`, `latencyMsP50` / `p95` / `p99`).
3. **Infrastructure components** — `collectInfrastructureHealth` aggregates cache, Redis ping, DLQ backlog, and static notes for breaker/retry policy.

## Health JSON reference

Top-level `status` is `ok` or `degraded` when any of the following hold:

- Cache component not `ok`
- Redis configured but ping fails (`down`) or slow (`degraded`)
- Dead letter backlog **> 100**
- Any platform row has `status: degraded` (health score **< 80** with at least one recorded operation)

Platform rows with **no traffic yet** show `status: unknown` and do not alone degrade the bundle.

## Suggested alerts

| Signal          | Condition                                                                                       | Severity                          |
| --------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- |
| Adapters health | HTTP `503` from `/api/health/adapters` for 5+ minutes                                           | Page                              |
| Redis down      | `components.redis.status == "down"`                                                             | Page                              |
| DLQ backlog     | `components.deadLetter.backlog > 100`                                                           | Warning (already degrades health) |
| Auth failures   | Log rate of `PlatformAuthError` spikes vs baseline                                              | Warning                           |
| Circuit open    | Log rate of `PlatformCircuitOpenError`                                                          | Warning                           |
| Latency         | `adapter.latencyMsP95` above SLA (see [PERFORMANCE-BENCHMARKS.md](./PERFORMANCE-BENCHMARKS.md)) | Warning                           |

Wire these through your observability stack (Prometheus/Grafana, Datadog, CloudWatch, etc.) by scraping the JSON endpoints or by exporting metrics from application code in a future iteration.

## Dashboards (recommended panels)

- Request volume per `platform` (success vs failure).
- Cache hit ratio = `cacheHits / (cacheHits + cacheMisses)` per platform.
- p50/p95 latency per operation (`authenticate`, `fetchMetrics` as recorded).
- DLQ depth over time.
- Redis ping duration from `components.redis.detail` (parse or log separately for trends).

## Logging

Use structured logs with fields: `tenantId` (when known), `platform`, `operation`, `outcome`, `durationMs`. Never log raw tokens or full vendor responses containing PII.
