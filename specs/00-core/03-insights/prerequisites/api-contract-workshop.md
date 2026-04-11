# API definition workshop — outcomes (Week 1)

**Date:** 2026-04-04  
**Execution plan reference:** Part 1, Week 1 (Day 1) and Week 2–3 (PR-1).

## Scope

The external HTTP API is implemented under **`@agenticverdict/api`** (Fastify) with routes prefixed **`/api/v1`**. All authenticated routes expect a **Bearer JWT** unless documented otherwise.

## Authentication

- **Algorithm:** HS256.
- **Secret:** `JWT_SECRET` (minimum length enforced by middleware).
- **Claims:** `sub` (user id), `tenant_id` (UUID, tenant scope), optional `roles` (string array) for future RBAC.

Missing or invalid tokens receive **401**; insufficient roles **403** (when role checks are enabled on a route).

## Core resources

| Method | Path                           | Summary                                                                               |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/insights`             | Tenant-scoped list with query filters (`type`, confidence, sort, pagination).         |
| `GET`  | `/api/v1/verdicts`             | Tenant-scoped list; unified `MarketingVerdict` payloads.                              |
| `GET`  | `/api/v1/analysis-results/:id` | Single analysis bundle (insights, verdicts, provenance) for the authenticated tenant. |
| `POST` | `/api/v1/insights/validate`    | Data-quality validation over one or more insights.                                    |
| `POST` | `/api/v1/verdicts/validate`    | Data-quality validation for a unified verdict.                                        |

## Cross-cutting behavior

- **Rate limiting:** Per-tenant throttling via Redis (Upstash REST) when configured; in-memory fallback for local development. **429** responses may include retry guidance.
- **Caching:** Response caching on list endpoints where implemented (TTL documented in code).
- **OpenAPI:** Specification exposed with **Swagger UI** at `/documentation` and JSON at `/documentation/json`.

## Canonical reference

Field-level contracts, error shapes, and examples live in:

- [`../../02-intelligence/API_SPECIFICATIONS.md`](../../02-intelligence/API_SPECIFICATIONS.md)

Workshop outcome: **single source of truth** is the combination of that document, the registered Fastify routes, and the generated OpenAPI document served by the running API.
