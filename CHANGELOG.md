# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Detailed release notes:** dated, package-level write-ups live under [`changelog/`](changelog/) (for example [`changelog/2026-04-03-phase-0-foundation-implementation.md`](changelog/2026-04-03-phase-0-foundation-implementation.md)).

## [Unreleased]

### Added

- **Docker testing removal and local testing migration:** Complete removal of Docker E2E testing infrastructure in favor of local Vitest execution. See [`changelog/2026-04-07-docker-testing-removal-local-testing-migration.md`](changelog/2026-04-07-docker-testing-removal-local-testing-migration.md) and implementation plan [`docs/02-planning-and-methodology/docker-testing-removal-plan.md`](docs/02-planning-and-methodology/docker-testing-removal-plan.md).
- **Phase 03 Part 9 (testing & hardening):** API contract tests for report rate limits, tenant isolation, share-token and validation edge cases, concurrent read smoke, template preview `lang`/`dir`; report-generator executive-summary perf case; Playwright axe WCAG smoke; i18n `/formatters` export for client-safe imports; Part 9 production-readiness runbook. See [`changelog/2026-04-05-phase-03-execution-plan-part-9-testing-and-hardening.md`](changelog/2026-04-05-phase-03-execution-plan-part-9-testing-and-hardening.md).
- **Phase 03 Part 8 (history & versioning):** API report byte versioning, compare-metadata endpoint, archival and retention sweep, in-memory audit trail and compliance summary/audit export. See [`changelog/2026-04-05-phase-03-execution-plan-part-8-history-versioning.md`](changelog/2026-04-05-phase-03-execution-plan-part-8-history-versioning.md).
- **Phase 03 Part 1 (prerequisites):** `specs/00-core/03-insights/prerequisites/` — API workshop summary, schema transformation spec, technology selection, environment checklist, kickoff/exit criteria; Phase 03 README links the index.
- **`@agenticverdict/agent-runtime`:** Unified **`MarketingVerdict`** parsing (`parseMarketingVerdictFromAgentText`, `applyMarketingVerdictPipelineContext`, `resolveWorkflowAnalysisUuid`, `extractJsonObjectText` in `src/agent-verdict-json.ts`); fixture helpers `buildMarketingVerdictFixture` / `buildMinimalMarketingVerdict`; `ValidationService` alias for `DataQualityService`; `AGENT_RUNTIME_PACKAGE_VERSION` **0.10.0**; marketing pipeline attaches `ProvenanceTracker` output to `MarketingPipelineState.provenance`.
- **`@agenticverdict/worker`:** `SendGridEmailDeliveryService` and provider selection in `createEmailDeliveryServiceFromEnv` (Resend preferred, then SendGrid).
- **Phase 03 Part 4 (format generation):** `@agenticverdict/report-generator` — Playwright HTML→PDF (`PlaywrightPdfFormatGenerator`, shared Chromium + `closeSharedChromiumBrowser`), print CSS for columns and page-break hints, tagged PDF; HTML→DOCX (`HtmlDocxFormatGenerator`, `docx` + `node-html-parser`, tables/images/TOC marker); `createStubFormatRegistry()` and `AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS`; worker `close()` tears down Chromium; package version **0.3.0**. See [`changelog/2026-04-04-phase-03-execution-plan-part-4-format-generation.md`](changelog/2026-04-04-phase-03-execution-plan-part-4-format-generation.md).

### Changed

- **Documentation:** `docs/05-project-management/requirements.md` v1.1 — platform adapters require explicit `tenantId`; security requirements reference Phase 01 `operations/SECURITY.md`; tenant context examples aligned with `tenantId`; research doc paths point at `docs/04-technology-research/`. Synced hub and status docs (`docs/README.md`, `docs/00-overview/development-status-summary.md`, `docs/01-getting-started/project-overview.md`, `navigation.md`, phase 01 README, `phase-overview.md`, `project-charter.md`, `roadmap-development.md`, implementation review header). See `changelog/2026-04-04-phase-01-*.md` for code-level Phase 01 notes.
- **API validation routes** use `ValidationService` (`apps/api/src/routes/v1/validation.ts`).
- **Email runbook** and **`.env.example`** describe Resend vs SendGrid precedence.
- **LLM verdict prompt/schema remediation:** tightened media verdict JSON schema instructions (UUID v4, explicit enums, numeric `estimatedImpact`, confidence ranges), removed redundant verdict JSON instruction from pipeline goal, added parse-failure field diagnostics and observability counters. See [`changelog/2026-04-07-llm-prompt-schema-validation-remediation.md`](changelog/2026-04-07-llm-prompt-schema-validation-remediation.md).
- **Detailed notes:** [`changelog/2026-04-04-phase-03-execution-plan-part-1-prerequisites.md`](changelog/2026-04-04-phase-03-execution-plan-part-1-prerequisites.md), [`changelog/2026-04-04-phase-03-execution-plan-part-2-infrastructure.md`](changelog/2026-04-04-phase-03-execution-plan-part-2-infrastructure.md), [`changelog/2026-04-04-phase-03-execution-plan-part-3-template-system.md`](changelog/2026-04-04-phase-03-execution-plan-part-3-template-system.md), [`changelog/2026-04-04-phase-03-execution-plan-part-4-format-generation.md`](changelog/2026-04-04-phase-03-execution-plan-part-4-format-generation.md), [`changelog/2026-04-05-phase-03-execution-plan-part-8-history-versioning.md`](changelog/2026-04-05-phase-03-execution-plan-part-8-history-versioning.md).

### Fixed

- Placeholder.

### Removed

- **Docker E2E testing infrastructure:** Removed all Docker-based testing in favor of local Vitest execution. This includes:
  - Test files: `docker-health-check.test.ts`, `docker-stack-reachability.integration.test.ts`, `prerequisites.test.ts`, `vitest.docker-stack.config.ts`, `health-checks.ts`, `rls.integration.test.ts`
  - Docker configuration: `docker-compose.test.yml`, `docker-compose.test.alt-network.yml`, `docker-compose.networks.yml`, `Dockerfile.test`, `packages/mock-platform-server/Dockerfile`
  - CI/CD workflow: `.github/workflows/e2e-docker-tests.yml`
  - Scripts: `scripts/docker-scenarios-with-host-log.sh`
  - Documentation: `e2e-docker-testing-implementation-plan.md`, `docs/docker/testing.md`, `docs/docker/observability-and-testing.md`
  - Dependencies: `@testcontainers/postgresql`
  - Scripts: `test:docker:ci-up`, `test:docker:down`, `test:docker:health`, `test:docker:scenarios`, `test:docker:scenarios:verbose`, `test:docker:scenarios:tee`, `test:docker:up`
- **`@agenticverdict/agent-runtime`:** Legacy verdict stack (`legacyVerdictSchema`, `legacyVerdictToMarketingVerdict`, `transformVerdict`, `parseVerdictFromAgentText`, deprecated type/schema aliases). `verdict-schema.ts` now exports **`VerdictParseError`** only.

### Security

- Placeholder.

---

## [0.1.0] — 2026-04-03

Phase 0 foundation: monorepo scaffold, core packages, web shell, and phase documentation alignment.

### Added

- Turborepo + pnpm workspace at the repository root (`turbo.json`, `pnpm-workspace.yaml`, shared tooling).
- Shared TypeScript and ESLint configuration for the workspace (`tsconfig.json`, `eslint.config.mjs`, Prettier).
- Package `@agenticverdict/types` with shared platform type aliases.
- Package `@agenticverdict/config` with Zod `CompanyConfig` schema, file-based `loadCompanyConfig` with in-memory cache and monorepo-friendly config directory resolution.
- Package `@agenticverdict/core` with `AsyncLocalStorage` tenant context helpers (`runWithTenantContext`, `getTenantContext`, `requireTenantContext`) and unit tests.
- Package `@agenticverdict/database` with Drizzle ORM, initial `companies` schema, `createDatabaseClient`, and `dbScoped` helper using PostgreSQL `set_config` for tenant session state.
- Application `@agenticverdict/frontend` (Next.js 15, App Router): Mantine with `DirectionProvider` for RTL/LTR, `next-intl` with `/en` and `/ar`, demo home page loading validated company config from disk.
- Sample company configuration at `configs/companies/11111111-1111-4111-8111-111111111111.json`.
- Environment template at `.env.example` (`DATABASE_URL`, `COMPANY_CONFIG_DIR`).
- Phase 0 developer scope document `specs/00-core/00-foundation/implementation-scope.md` (waves, deferred work vs `tasks.md`, config source of truth).

### Changed

- Phase 0 index `specs/00-core/00-foundation/README.md`: status to in progress, architecture/package list aligned with the target monorepo layout, link to implementation scope.
- `specs/00-core/00-foundation/tasks.md`: sequencing note pointing to implementation scope; task 0.46 clarified as Mantine-first styling.
- `specs/00-core/00-foundation/acceptance-criteria.md`: ConfigManager primary loading from versioned files; optional database-backed config deferred.
- `.gitignore`: stop ignoring `pnpm-lock.yaml` so the workspace lockfile can be committed.

### Fixed

- N/A (initial tracked release).

### Security

- N/A (initial tracked release).

<!-- When publishing, add compare/release links at the bottom (Keep a Changelog style), e.g.
[Unreleased]: https://github.com/ORG/REPO/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ORG/REPO/releases/tag/v0.1.0
-->
