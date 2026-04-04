# Remediation known issues (Phases 00–02 → 03)

**Context**: `docs/03-development-phases/REMEDIATION_PLAN.md` Part 3 validation (2026-04-04).

## Implemented vs. planned

| Area                   | Status                 | Notes                                                                                                                                                                                            |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API v1 contract tests  | Covered                | `apps/api/src/api.contract.test.ts` exercises list/filter/validate routes, JWT, tenant isolation, rate limit (in-memory when Redis unset), OpenAPI JSON.                                         |
| Role-based 403         | Partial at route level | `jwtAuth` supports `roles`; most v1 routes do not require admin-only roles yet. Isolated test: `apps/api/src/middleware/auth.test.ts`.                                                           |
| “Real data” end-to-end | Partial                | Current API uses in-memory seeded analysis bundles per tenant (`analysis-store.ts`), not PostgreSQL-backed analysis rows. Treat integration tests as **contract** tests until persistence lands. |
| Redis rate limits      | Environment-dependent  | With Upstash env vars, limits are distributed; without them, single-process memory windows apply (see API runbook).                                                                              |
| Email production       | Behind env             | Resend integration is real when `RESEND_API_KEY` is set; CI uses mocks only.                                                                                                                     |

## Unified verdict schema

- Canonical Zod + types: `packages/types/src/verdict.ts` (`marketingVerdictSchema`).
- Legacy fixture conversion for demos: `legacyVerdictToMarketingVerdict` in `@agenticverdict/agent-runtime`.
- API contract tests assert GET `/api/v1/verdicts` payloads parse with `marketingVerdictSchema`.

## Follow-ups before Phase 03 hardening

1. Persist analysis, insights, and verdicts; replace in-memory store with tenant-scoped DB reads.
2. Align rate-limit budgets per environment (dev vs. prod) and document in infra config.
3. Add Redoc static bundle or CI-published OpenAPI artifact if Swagger UI is insufficient for external partners.
