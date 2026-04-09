# Team kickoff and Part 1 exit criteria (Weeks 1–5)

**Date:** 2026-04-04  
**Execution plan reference:** Part 1 milestone and exit criteria.

## Kickoff summary

Part 1 exists to **de-risk** Phase 03 core work: stable HTTP contracts, shared schemas, validation, provenance hooks, and outbound email. Roles below are indicative (RACI-style hints), not headcount assignments.

| Workstream            | Typical owner        | Notes                                                     |
| --------------------- | -------------------- | --------------------------------------------------------- |
| API contract workshop | Tech Lead + Backend  | Aligns with OpenAPI and `API_SPECIFICATIONS.md`.          |
| Schema alignment      | Architect + Backend  | Unified verdict, analysis bundle, template/design config. |
| Implementation        | Backend              | Routes, middleware, demo store, tests.                    |
| Security              | Security / Tech Lead | JWT claims, tenant isolation, rate limits.                |
| QA / integration      | QA                   | Contract tests, validation edge cases, email sandbox.     |
| DevOps                | DevOps               | Staging env vars, secrets, database availability.         |

## Exit criteria (must be true before Part 2)

The following mirror [Part 1 of the execution plan](../execution-plan.md):

1. **API endpoints** — `GET /api/v1/insights`, `GET /api/v1/verdicts`, `GET /api/v1/analysis-results/:id`, and `POST /api/v1/*/validate` return **200** with **valid, schema-aligned** payloads for authenticated tenants (demo store acceptable for early integration).
2. **Schemas** — `TemplateConfig`, `DesignTokens`, `ProvenanceInfo`, `MarketingVerdict`, and related Zod schemas are **documented** (this folder + types packages) and covered by **automated validation tests**.
3. **Data validation service** — `ValidationService` (alias of `DataQualityService`) operational and used by validation routes.
4. **Provenance** — `ProvenanceTracker` integrated into the **marketing pipeline** state; persistence to Postgres is available via schema/migration for workers to adopt incrementally.
5. **Email** — Resend and SendGrid paths implemented in the worker service; **at least one** provider verified in a non-production environment using real API keys.
6. **API documentation** — OpenAPI/Swagger published from the running server (`/documentation`).
7. **Phase 2 mock-pipeline health** — In the same dev/test environments used for Phase 03 integration, `marketing-analysis` workflow execution must be non-degraded: specialized marketing agents have platform fetch tools available, worker path injects platform adapter dependencies, and mock adapters provide non-empty metric data when configured for analysis scenarios (reference `/docs/06-reference/mock-adapter-pipeline-remediation-plan.md`).

When all items are checked, mark Part 1 **complete** in project tracking and begin **Part 2: Infrastructure Phase** per the execution plan.
