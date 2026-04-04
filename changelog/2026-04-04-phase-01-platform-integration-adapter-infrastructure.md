# Changelog entry: Phase 01 — Adapter infrastructure foundation

**Date:** 2026-04-04  
**Scope:** Phase 1 (Platform Integration) — [Execution Phase 1 — Adapter infrastructure foundation](docs/03-development-phases/phase-01-platform-integration/EXECUTION-PLAN.md) (`tasks.md` Work Stream 1: Tasks 1.1–1.6).

This entry summarizes changes that implement shared adapter resilience, caching, rate shaping, dead-letter capture, metrics, and health reporting. It does **not** cover vendor-specific adapters (Meta, GA4, GSC, GBP, TikTok), the normalization framework (Work Stream 3), or load/chaos automation (Execution Phase 7).

---

## Summary

- Hardened **`@agenticverdict/platform-adapters`** with a **token bucket**, **priority queue**, **memory and Upstash-backed cache**, **retry with jitter**, **error classification**, **in-memory dead-letter queue**, and **infrastructure health aggregation**.
- Upgraded **`CircuitBreaker`** defaults to match acceptance criteria: **5** consecutive failures to open, **60s** open window, **3** consecutive successes in half-open to close.
- Extended **`BasePlatformAdapter`** with optional **cache**, **token bucket**, **method metrics**, and **DLQ** wiring; introduced **`doAuthenticate`** as the extension point (public **`authenticate`** records metrics).
- Wired **Next.js** health APIs to the shared infrastructure bundle: enriched **`GET /api/health`**, plus **`/api/health/adapters`** and **`/api/health/platforms/[platform]`**.
- Raised **unit/integration test coverage** for the package with **Vitest coverage thresholds** (90% lines/statements/functions, 85% branches) scoped to `packages/platform-adapters`.

---

## Added

### `packages/platform-adapters`

- **`error-classifier.ts`** — `isRetryablePlatformError` for backoff vs fail-fast behavior.
- **`dead-letter-queue.ts`** — `DeadLetterQueue` interface and **`InMemoryDeadLetterQueue`** (bounded, process-local).
- **`token-bucket.ts`** — **`TokenBucket`** with `tryConsume`, `consume` (cooperative wait), and `snapshot`.
- **`priority-queue.ts`** — **`RequestPriorityQueue`** for prioritized outbound work scheduling.
- **`platform-rate-config.ts`** — Default RPM profiles and **`createPlatformTokenBucket`** per **`PlatformType`**.
- **`adapter-metrics.ts`** — **`AdapterMethodMetrics`** (success/failure, cache hit/miss, latency percentiles) and **`healthScoreFromMetrics`**.
- **`infrastructure-health.ts`** — **`collectInfrastructureHealth`** aggregating cache, Redis probe, DLQ backlog, and per-platform rows.
- **`adapter-infrastructure.ts`** — **`createDefaultAdapterInfrastructure()`** returning cache, optional Redis client, metrics, DLQ, and **`getHealth()`**.
- **`redis-env.ts`** — **`createOptionalUpstashRedis()`** (same env vars as **`@agenticverdict/database`**).
- **`cache/`** — **`PlatformCache`** contract, **`MemoryPlatformCache`**, **`UpstashPlatformCache`**, **`buildAdapterCacheKey`**, **`defaultAdapterCacheTtlSeconds`**.
- **Tests** — Coverage across circuit breaker recovery, backoff/jitter, cache hit rate, DLQ, token bucket, priority queue, registry, Upstash cache (mocked Redis), adapter cache integration, edge cases (corrupt cache JSON, DLQ vs circuit-open), infrastructure health, Redis env, and adapter infrastructure bundle.
- **`vitest.config.ts`** — Package-local **`coverage`** include/exclude and **thresholds** (see Summary).

### `apps/web`

- **`src/lib/adapter-infrastructure.ts`** — Process-local singleton **`getSharedAdapterInfrastructure()`** backed by **`createDefaultAdapterInfrastructure()`**.
- **`src/app/api/health/adapters/route.ts`** — **`GET`** returns aggregated infrastructure health (**503** when `status !== "ok"`).
- **`src/app/api/health/platforms/[platform]/route.ts`** — **`GET`** returns one platform row from the same health snapshot (**400** / **404** for bad or missing platform).

### Dependencies

- **`@agenticverdict/platform-adapters`**: **`@upstash/redis`**.
- **`@agenticverdict/web`**: **`@agenticverdict/platform-adapters`**, **`@agenticverdict/types`** (platform enum validation on the dynamic health route).

---

## Changed

### `packages/platform-adapters`

- **`circuit-breaker.ts`** — Half-open recovery with **`halfOpenSuccessThreshold`** (default **3**); default **`resetTimeoutMs`** **60_000**; failure-driven transitions aligned with AC-1.7.4 / AC-1.7.5.
- **`rate-limit.ts`** — Default backoff ladder **1s → 16s**, **±20% jitter** via **`applyBackoffJitter`**, up to **6** attempts; **`retryOn`** delegates to **`isRetryablePlatformError`**.
- **`adapter.ts`** — Template method **`doAuthenticate`**; **`fetchMetrics`** pipeline: optional token bucket → cache read → breaker + backoff → raw fetch → cache write; metrics and DLQ hooks; circuit-open mapped to **`PlatformCircuitOpenError`** without DLQ noise.
- **`mock-adapter.ts`** — Implements **`doAuthenticate`** instead of overriding **`authenticate`** directly.
- **`index.ts`** — Re-exports new public surface (cache, resilience, health, infrastructure factory).

### `apps/web`

- **`src/app/api/health/route.ts`** — **`async GET`**; JSON includes **`infrastructure`** from **`getSharedAdapterInfrastructure().getHealth()`**; HTTP **200** with **`status: "ok" | "degraded"`** in the body (degraded does not fail the route, to match “endpoint operational” probes).

---

## Verification (local)

Commands that were run successfully after the changes:

- `pnpm install`
- `pnpm test` (Turbo workspace tests)
- `pnpm --filter @agenticverdict/web typecheck`
- `pnpm run check:cycles` — no circular dependencies on configured entrypoints
- `pnpm exec vitest run --coverage` from **`packages/platform-adapters`** — meets package coverage thresholds

---

## Known follow-ups (not in this change set)

- **Distributed rate limiting** — Token bucket is in-process; multi-instance deployments need a Redis- or gateway-backed limiter aligned with platform quotas.
- **DLQ durability** — **`InMemoryDeadLetterQueue`** is suitable for development and single-worker processes; **BullMQ** (or equivalent) should back permanent failures in **`apps/worker`**.
- **Cache warming / invalidation policies** — TTLs exist; proactive warming and domain-specific invalidation are still open (Task 1.2 deliverables in `tasks.md`).
- **Observability stack** — No Grafana/Datadog assets; health JSON is the operational hook for now (Task 1.6 dashboards/alerts).
- **Vendor adapters and OAuth** — Execution Phases 2–5 in the Phase 01 execution plan remain outstanding.

---

## Related documentation

- [`docs/03-development-phases/phase-01-platform-integration/EXECUTION-PLAN.md`](docs/03-development-phases/phase-01-platform-integration/EXECUTION-PLAN.md) — Execution Phase 1 definition and verification.
- [`docs/03-development-phases/phase-01-platform-integration/tasks.md`](docs/03-development-phases/phase-01-platform-integration/tasks.md) — Tasks 1.1–1.6 (Work Stream 1).
- [`docs/03-development-phases/phase-01-platform-integration/acceptance-criteria.md`](docs/03-development-phases/phase-01-platform-integration/acceptance-criteria.md) — §1.3 Infrastructure (AC-1.7.1–AC-1.7.8).
