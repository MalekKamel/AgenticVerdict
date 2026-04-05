# Changelog entry: Remediation plan (Phases 00–02 alignment and Phase 03 prerequisites)

**Date:** 2026-04-04  
**Scope:** [Comprehensive Remediation Plan](docs/03-development-phases/REMEDIATION_PLAN.md) — Part 1 (documentation), Part 2 (critical gap implementation R-1 through R-12), Part 3 (integration testing and handoff documentation R-13 through R-14).

This entry records work done to close gaps identified in the Phase 03 gap analysis: unified `MarketingVerdict` as the cross-phase verdict model, external REST API surface, validation and provenance foundations, template and design-token configuration schemas, worker email delivery, OpenAPI/Swagger exposure, and operational runbooks.

---

## Summary

- **Architecture:** Single **unified verdict schema** in `@agenticverdict/types` (`marketingVerdictSchema` / `MarketingVerdict`). _(Updated 2026-04-04: legacy LLM shape and **`legacyVerdictToMarketingVerdict`** removed; runtime uses **`parseMarketingVerdictFromAgentText`** / **`applyMarketingVerdictPipelineContext`** in **`packages/agent-runtime/src/agent-verdict-json.ts`** — remediation **R-LEGACY-001**.)_
- **API (`@agenticverdict/api`):** Fastify v1 routes for **insights**, **verdicts**, **analysis-results**, and **validation**; **JWT** middleware (`jose`, HS256) with optional **role** checks; **per-tenant rate limiting** (Upstash Redis when configured, otherwise in-memory); **JSON response cache** where implemented; **OpenAPI 3** via `@fastify/swagger` and **Swagger UI** at `/documentation` (spec at `/documentation/json`).
- **Types:** Shared **`GeneratedInsight`**, **`AnalysisResultResponse`**, **`ProvenanceInfo`**, date/metric helpers, and related Zod schemas in `packages/types/src/` (e.g. `insight.ts`, `analysis.ts`, `verdict.ts`, `common.ts`, `platform.ts`).
- **Config:** **`templateConfigSchema`** / template types and **`designTokensSchema`** / **`defaultDesignTokens`**, plus **`mantineThemeFromDesignTokens`**, **`designTokensToCssVariables`**, and JSON-schema export helpers in `packages/config/src/schemas/template.ts` and `branding.ts`.
- **Agent runtime:** **`DataQualityService`** (`validation/data-quality.ts`), **`ProvenanceTracker`** (`provenance/tracker.ts`), pipeline and verdict tooling updates consuming unified types where applicable.
- **Database:** **Provenance** table migration **`0002_provenance_records.sql`** and Drizzle schema in `packages/database/src/schema/provenance.ts` (journal updated under `migrations/meta/`).
- **Worker:** **Resend**-backed **`ResendEmailDeliveryService`**, **`sendReportEmail`**, HTML template **`apps/worker/src/templates/email/report-ready.html`**, and **`.env.example`** email variables.
- **Documentation:** Phase 00/01/02 phase docs refreshed; **`API_SPECIFICATIONS.md`**; Phase 03 report-generation folder updates (gap analysis, execution plan, tasks); **`docs/00-overview/development-status-summary.md`** and related roadmap/changelog entries as applicable; **runbooks** under `docs/06-reference/runbooks/`.
- **Testing:** API **contract** and **auth** tests, worker **email** tests (mocked HTTP), existing agent-runtime tests for data quality, provenance tracker, and verdict schema.

---

## Part 1: Documentation updates (tasks D-1 through D-4)

| Task    | Intent                                                                              | Primary locations                                                                                            |
| ------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **D-1** | Phase 00 docs: template foundation, design tokens, i18n status, acceptance criteria | `docs/03-development-phases/phase-00-foundation/overview.md`, `tasks.md`, `acceptance-criteria.md`           |
| **D-2** | Phase 01 docs: cache, freshness, performance baselines, adapters                    | `docs/03-development-phases/phase-01-platform-integration/overview.md`, `tasks.md`, `acceptance-criteria.md` |
| **D-3** | Phase 02 docs: API layer, unified verdict, insights, validation, provenance         | `docs/03-development-phases/phase-02-agent-intelligence/overview.md`, `tasks.md`, `acceptance-criteria.md`   |
| **D-4** | REST contract reference                                                             | `docs/03-development-phases/phase-02-agent-intelligence/API_SPECIFICATIONS.md`                               |

**Phase 03 documentation alignment** (supporting R-7 acceptance): analytic and planning artifacts under `docs/03-development-phases/phase-03-report-generation/` (e.g. `gap-analysis.md`, `execution-plan.md`, `tasks.md`, `analysis-summary.md`, `README.md`).

---

## Part 2: Critical gap implementation (tasks R-1 through R-12)

### Week 2: API layer (R-1 through R-6)

| Task    | Deliverable     | Code / notes                                                                                                                                                  |
| ------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-1** | Insight list    | `apps/api/src/routes/v1/insights.ts` — query: `type`, `minConfidence`, `minRelevance`, `sort`, `limit`, `offset`; cache TTL 300s                              |
| **R-2** | Verdict list    | `apps/api/src/routes/v1/verdicts.ts` — `campaignId`, `verdictType`, `start`/`end`; cache TTL 600s                                                             |
| **R-3** | Analysis bundle | `apps/api/src/routes/v1/analysis-results.ts` — tenant-scoped `GET /analysis-results/:id`                                                                      |
| **R-4** | Validation      | `apps/api/src/routes/v1/validation.ts` — `POST /insights/validate`, `POST /verdicts/validate` using `DataQualityService` and Zod from `@agenticverdict/types` |
| **R-5** | JWT auth        | `apps/api/src/middleware/auth.ts` — `jwtAuth`, `tenantSecurityErrorReply`; `FastifyRequest.auth` typing                                                       |
| **R-6** | Rate limits     | `apps/api/src/middleware/rate-limit.ts` — `rateLimit(redis, options)`; `Retry-After` on 429                                                                   |

**Server composition:** `apps/api/src/server.ts` (registers Swagger, `/health`, prefixed `/api/v1` routes, Swagger UI), `apps/api/src/cli.ts`, `apps/api/src/index.ts`.

**Demo / contract data:** `apps/api/src/services/analysis-store.ts` (per-tenant in-memory bundle, legacy JSON fixture converted to `MarketingVerdict`), `apps/api/src/services/response-cache.ts`.

### Week 3: Schemas and configuration (R-7 through R-9)

| Task    | Deliverable     | Code / notes                                                                                                                       |
| ------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **R-7** | Unified verdict | `packages/types/src/verdict.ts` — `marketingVerdictSchema`, nested verdict sub-schemas; exported via `packages/types/src/index.ts` |
| **R-8** | Template config | `packages/config/src/schemas/template.ts` — `templateConfigSchema`, `exportTemplateConfigJsonSchema`, types                        |
| **R-9** | Design tokens   | `packages/config/src/schemas/branding.ts` — `designTokensSchema`, `defaultDesignTokens`, Mantine/CSS helpers                       |

**Agent/runtime alignment with R-7:** `packages/agent-runtime/src/verdict-schema.ts`, `marketing-pipeline.ts`, and related tests (`verdict-schema.test.ts`, etc.).

### Week 4: Validation and tracking (R-10 through R-11)

| Task     | Deliverable  | Code / notes                                                                                                                                                                    |
| -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-10** | Data quality | `packages/agent-runtime/src/validation/data-quality.ts` — `validateInsight`, `validateVerdict`, `validateAnalysisResult`; `data-quality.test.ts`                                |
| **R-11** | Provenance   | `packages/agent-runtime/src/provenance/tracker.ts`, `tracker.test.ts`; `packages/database/src/schema/provenance.ts`; `packages/database/migrations/0002_provenance_records.sql` |

### Week 5: Email service (R-12)

| Task     | Deliverable  | Code / notes                                                                                                                                                                                                              |
| -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-12** | Report email | `apps/worker/src/services/email.ts` — `ResendEmailDeliveryService`, `createEmailDeliveryServiceFromEnv`, `sendReportEmail`; `apps/worker/src/templates/email/report-ready.html`; `apps/worker/src/services/email.test.ts` |

---

## Part 3: Testing and validation (tasks R-13 through R-14)

| Task     | Deliverable                             | Code / notes                                                                                                                                                                                                                               |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R-13** | Integration-style API and service tests | `apps/api/src/api.contract.test.ts`, `apps/api/src/middleware/auth.test.ts`; worker `email.test.ts`; agent-runtime validation/provenance/verdict tests                                                                                     |
| **R-14** | Published API docs and runbooks         | `apps/api/src/openapi.ts`; Swagger UI + `/documentation/json`; `docs/06-reference/runbooks/api-troubleshooting.md`, `email-service.md`, `remediation-known-issues.md`, `phase-03-handoff.md`; `docs/06-reference/README.md` runbooks index |

**Developer experience:** `apps/api/vitest.config.ts` sets `VITEST=true`; Fastify logging disabled during Vitest in `server.ts` to reduce noise.

---

## New and changed dependencies

| Package               | Change                                                                              |
| --------------------- | ----------------------------------------------------------------------------------- |
| `@agenticverdict/api` | Added `@fastify/swagger` (^9.x), `@fastify/swagger-ui` (^5.x, Fastify 5–compatible) |

---

## Environment variables (remediation-related)

| Variable                                              | Purpose                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| `JWT_SECRET`                                          | HS256 secret for API bearer tokens (required length per middleware) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional; when set, API rate limits and response cache use Upstash  |
| `RESEND_API_KEY`                                      | Worker: enable Resend email client                                  |
| `RESEND_FROM_EMAIL` / `SENDGRID_FROM_EMAIL`           | Sender fallback chain for worker email                              |
| `APP_URL`                                             | Base URL for report download links in email HTML                    |

See `.env.example` for commented examples (email block and related keys).

---

## Verification (local)

```bash
pnpm --filter @agenticverdict/api run typecheck
pnpm --filter @agenticverdict/api test
pnpm --filter @agenticverdict/worker test
pnpm --filter @agenticverdict/agent-runtime exec vitest run src/validation/data-quality.test.ts src/provenance/tracker.test.ts src/verdict-schema.test.ts
pnpm --filter @agenticverdict/database test
pnpm exec turbo run build lint test typecheck
```

With server running: browse `/documentation` and `GET /documentation/json` on the API port.

---

## Follow-ups (not fully covered by the plan text)

- **Persistence:** API analysis/insight/verdict data is **in-memory** per process for the current demo store; replacing with tenant-scoped database reads is a Phase 03+ hardening step (called out in `remediation-known-issues.md`).
- **Provenance:** DB migration and tracker exist; **full “store every run in DB”** wiring across all agent entrypoints may still be incremental.
- **Email:** **SendGrid** implementation and bounce webhooks are not primary; **SPF/DKIM/DMARC** remain operational tasks for the sending domain.
- **R-9 extras:** Plan mentions Mantine theme and CSS variables — implemented in config **helpers**; **automatic wiring into `apps/web`** may be a separate UI task.
- **Calendar:** Phase 03 **handoff session** scheduling remains a manual checklist item in `REMEDIATION_PLAN.md` Part 3.

---

## Related documentation

- [`docs/03-development-phases/REMEDIATION_PLAN.md`](docs/03-development-phases/REMEDIATION_PLAN.md) — full task breakdown and architecture decision (unified verdict).
- [`docs/03-development-phases/phase-02-agent-intelligence/API_SPECIFICATIONS.md`](docs/03-development-phases/phase-02-agent-intelligence/API_SPECIFICATIONS.md) — endpoint contracts.
- [`docs/06-reference/runbooks/`](docs/06-reference/runbooks/) — API, email, known issues, Phase 03 handoff checklist.
- Phase 03 planning: [`docs/03-development-phases/phase-03-report-generation/README.md`](docs/03-development-phases/phase-03-report-generation/README.md) and companion files in that directory.
