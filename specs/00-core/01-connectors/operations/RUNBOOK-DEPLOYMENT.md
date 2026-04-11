# Runbook — deployment (platform adapters)

## Scope

Rolling out changes to `@agenticverdict/data-connectors`, health routes under `apps/web/src/app/api/health/`, and Redis-backed cache configuration.

## Preconditions

- Phase 01 integration tests green locally: `pnpm run test:phase01-integration`
- Monorepo quality gate green: `pnpm run format:check`, `pnpm exec turbo run lint typecheck`, `pnpm exec vitest run --coverage`

## Environment variables

| Variable                   | Service                   | Purpose                                                |
| -------------------------- | ------------------------- | ------------------------------------------------------ |
| `UPSTASH_REDIS_REST_URL`   | web, workers using bundle | Enables `UpstashPlatformCache` + Redis ping in health. |
| `UPSTASH_REDIS_REST_TOKEN` | web, workers              | Upstash auth.                                          |

When unset, the default bundle uses **in-memory L1 cache** only (per-process, not shared across instances).

## Staged rollout

1. **Build artifacts** — `pnpm run build` (or CI pipeline equivalent) for affected packages and `apps/web`.
2. **Deploy to staging** — Point staging at sandbox or test vendor credentials; run smoke `curl` against `/api/health` and `/api/health/adapters`.
3. **Canary (optional)** — Route a small share of traffic to the new revision; watch error rate and p95 latency on health and business metrics.
4. **Full promote** — Shift remaining traffic; confirm no sustained `503` from `/api/health/adapters`.

## Rollback

1. Revert to the previous deployment revision (container image / Vercel rollback / k8s rollout undo).
2. If schema or credential format changed forward-only, restore compatible env and database migration state per your migration strategy (Drizzle down or forward-fix).
3. Invalidate edge caches only if you serve health through CDN (generally avoid caching health).

## Post-deploy verification

```bash
curl -sf "$BASE_URL/api/health" | jq '.status, .infrastructure.status'
curl -sf "$BASE_URL/api/health/adapters" | jq '.status, .components.redis.status'
```

Expect `infrastructure.status` of `ok` when Redis (if configured) pings, DLQ backlog is low, and no platform row is `degraded` after warm-up traffic.

## Tenant credential rollout

Adapter code deploys independently of per-tenant OAuth tokens. When rotating client secrets at a vendor:

1. Update app configuration in vendor console.
2. Bulk re-auth tenants or run refresh-token migration scripts (product-specific; not in this package).
3. Monitor `auth_failed` rate via logs and `failureCount` in platform health snapshots.
