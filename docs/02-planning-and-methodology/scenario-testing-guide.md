# Scenario testing guide

**Version:** 1.0  
**Date:** 2026-04-06  
**Scope:** R01–R12 orchestration tests under `tests/scenarios/` only. Package unit tests are unchanged.

## Purpose

Scenario tests validate **cross-package workflows** described in the Docker testing execution plan (PDF/DOCX/XLSX paths, Phase-2 report merge, agent mock, tenant helpers, template HTML, delivery processor, schedule enqueue). They complement Vitest suites in `packages/` and `apps/` and do not replace them.

## Commands (repo root)

| Command                                    | Description                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `pnpm run test:scenarios:all`              | Run every scenario (R01–R12).                                                    |
| `pnpm run test:scenario R02`               | Run one scenario by id, alias (`R2`), or folder name.                            |
| `pnpm run test:scenarios:group generation` | Run a category: `generation`, `integration`, `delivery`, `scheduling`, `system`. |

Shell entrypoints (same behavior): `tests/scripts/run-all-scenarios.sh`, `run-scenario.sh`, `run-scenario-group.sh`.

## System and LLM validation

- **R12** — prerequisites (`pnpm run test:scenario R12`)
- **R11** — stack health (`pnpm run test:scenario R11`)
- **R06** — LLM providers and mock (`pnpm run test:scenario R06`)

Full suite: `pnpm run test:scenarios:all`. See `test-scripts-reference.md`.

## Environment

| Variable                      | Effect                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `SKIP_PLAYWRIGHT_PDF_TESTS=1` | Skips R01/R02 when Chromium is not installed (local dev only; CI should install Chromium). |

## Authoring a new scenario check

1. Add or extend `tests/scenarios/Rxx-*/**/*.test.ts` using Vitest.
2. Prefer **importing public APIs** from `@agenticverdict/*` workspaces (e.g. `report-generator`, `worker`, `agent-runtime`, `testing`).
3. Keep fixtures under the scenario’s `fixtures/` or shared `tests/fixtures/`.
4. For PDF checks, reuse `@av-scenario-utils/assertion-helpers` (magic/size) and `@av-scenario-utils/pdf-text` (Arabic text layer via `pdf-parse`) from `tests/utils/`.

## Scenario inventory

| ID  | Directory                      | Focus                                                                               |
| --- | ------------------------------ | ----------------------------------------------------------------------------------- |
| R01 | `R01-pdf-generation-en-ltr`    | English LTR PDF (Playwright).                                                       |
| R02 | `R02-pdf-generation-ar-rtl`    | Arabic RTL PDF + text-layer Arabic glyphs.                                          |
| R03 | `R03-docx-generation`          | DOCX / ZIP payload.                                                                 |
| R04 | `R04-xlsx-generation`          | XLSX stub registry contract.                                                        |
| R05 | `R05-multi-platform-report`    | Fixture JSON + `mergePhase2IntoReportModel`.                                        |
| R06 | `R06-llm-provider-integration` | Mock + multi-provider wiring; optional live LLM (`AGENT_RUNTIME_LIVE_LLM=1`).       |
| R07 | `R07-tenant-isolation`         | Tenant cache keys + `createTestTenantContext`.                                      |
| R08 | `R08-template-rendering`       | Composite template engine HTML.                                                     |
| R09 | `R09-report-delivery`          | `defaultReportDeliveryProcessor` + captured email params.                           |
| R10 | `R10-scheduled-reports`        | `CronSimulator` + `createDefaultReportScheduleProcessor`.                           |
| R11 | `R11-system-health-validation` | Docker Compose, DB, Redis, optional observability (`tests/utils/health-checks.ts`). |
| R12 | `R12-prerequisites-validation` | Node.js, pnpm, Docker checks (`tests/utils/prerequisites.ts`).                      |

## CI

The `CI` workflow runs `pnpm run test:scenarios:all` after root Vitest coverage, reusing the Chromium install used for report-generator PDF tests.

## References

- `docs/02-planning-and-methodology/test-scenario-orchestration-plan.md`
- `docs/02-planning-and-methodology/docker-testing-execution-plan.md`
- `tests/scenarios/README.md`
