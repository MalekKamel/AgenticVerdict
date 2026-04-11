# API troubleshooting runbook

**Scope**: `@agenticverdict/api` (Fastify), JWT auth, rate limiting, v1 REST routes.

## Quick checks

1. **Process health**: `GET /health` should return `{ "ok": true, "service": "@agenticverdict/api" }` without authentication.
2. **OpenAPI**: With the server running, open `GET /documentation/json` for the machine-readable spec or browse `/documentation` for Swagger UI (remediation R-14).
3. **Auth**: Protected routes require `Authorization: Bearer <JWT>`. The token must be HS256-signed with `JWT_SECRET`, and include `sub` (user id) and `tenant_id` (UUID). Optional `roles` array is enforced when routes use `jwtAuth({ roles: [...] })`.

## Symptom: 401 Unauthorized

| Cause                                       | What to verify                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| Missing or malformed `Authorization` header | Header must be `Bearer <token>`.                                       |
| Wrong or expired JWT                        | Re-issue token; confirm clock skew is minimal.                         |
| Missing claims                              | Payload must include string `sub` and `tenant_id`.                     |
| `JWT_SECRET` unset or too short             | Server returns 500 for misconfiguration; set a secret with length ≥ 8. |

## Symptom: 403 Forbidden

- The route may require specific `roles` in the JWT. Add the role or adjust route configuration in `apps/api/src/middleware/auth.ts` usage.

## Symptom: 429 Too Many Requests

- Limits are per tenant (from `request.auth.tenantId`) unless middleware sets `perTenant: false`.
- **Redis**: When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, counters are distributed. Otherwise the API uses an in-memory limiter (single instance only; not valid behind multiple replicas).
- Response includes `Retry-After` (seconds). Validation routes use a stricter budget than list routes; see `apps/api/src/routes/v1/*.ts` `rateLimit(...)` options.

## Symptom: 404 on analysis results

- Bundles are tenant-scoped. A valid UUID for another tenant returns **404** by design (see integration tests in `apps/api/src/api.contract.test.ts`).

## Symptom: Empty or stale data

- Insights and verdicts for development are seeded in-memory per tenant in `apps/api/src/services/analysis-store.ts` (not production persistence).
- List endpoints may cache responses in Redis when configured; TTLs are defined in route handlers (`writeJsonCache`).

## Integration tests

Automated coverage for auth, filters, validation, rate limits, OpenAPI exposure, and tenant isolation lives in:

- `apps/api/src/api.contract.test.ts`
- `apps/api/src/middleware/auth.test.ts`

Run: `pnpm --filter @agenticverdict/api test`

## Related documentation

- `specs/00-core/02-intelligence/API_SPECIFICATIONS.md` — canonical endpoint contracts.
