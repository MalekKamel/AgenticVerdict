# Remediation known issues (Phases 00–02 → 03)

**Context**: `specs/00-core/REMEDIATION_PLAN.md` Part 3 validation (2026-04-04).

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
- Demos and tests build fixtures with `buildMarketingVerdictFixture` from `@agenticverdict/agent-runtime` (no legacy transform layer).
- API contract tests assert GET `/api/v1/verdicts` payloads parse with `marketingVerdictSchema`.

## Follow-ups before Phase 03 hardening

1. Persist analysis, insights, and verdicts; replace in-memory store with tenant-scoped DB reads.
2. Align rate-limit budgets per environment (dev vs. prod) and document in infra config.
3. Add Redoc static bundle or CI-published OpenAPI artifact if Swagger UI is insufficient for external partners.

## Troubleshooting: MarketingVerdict schema validation failures

Symptoms:

- Pipeline stage completion reaches verdict, then status returns `degraded`.
- Error message includes `Verdict JSON parse failed` and may include `fields=...`.

Typical failing fields:

- `sentiment` (must be `positive|neutral|negative`)
- `keyInsights.*.impact` (must be lowercase `high|medium|low`)
- `*.id` fields (must be UUID v4)
- `recommendations.*.estimatedImpact.*` (must be numbers)

Investigation checklist:

1. Inspect `packages/agent-runtime/src/specialized-marketing-agents.ts` (`JSON_VERDICT_SUFFIX`) for drift from `marketingVerdictSchema`.
2. Inspect `packages/types/src/verdict.ts` for schema changes that require prompt updates.
3. Reproduce with `packages/agent-runtime/src/agent-verdict-json.test.ts` focused tests.
4. Review `marketing_verdict_parse_failures_by_field_total` and `marketing_verdict_parse_degraded_total` metrics for spike patterns.
