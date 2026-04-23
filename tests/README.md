# Tests

This directory holds **shared test utilities**, **fixtures**, **scenario orchestration** (R01–R12), and helpers for local testing. It does **not** replace package-level unit tests under `packages/**` and `apps/**`.

## Implementation context

Scenario testing for report generation, static platform data, and LLM integration is specified here:

**Usage guide (commands, env vars):** [`USAGE.md`](./USAGE.md)

---

## Layout

| Path                                                               | Purpose                                                                                                                                            |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`orchestrator/`](./orchestrator/)                                 | **Production flow scenarios** — **R01–R12** run via **`pnpm run test:production-flow`**. See [`orchestrator/README.md`](./orchestrator/README.md). |
| [`utils/`](./utils/)                                               | Shared helpers: LLM provider helpers, scenario runner metadata, PDF/DOCX/visual assertions. Root Vitest includes `**/*.test.ts` here.              |
| [`test-output/`](./test-output/)                                   | **Archived test artifacts** — captured from live API testing (workflow responses, analysis results, poll logs).                                    |
| [`docs/`](./docs/)                                                 | Manual testing documentation — integration guide, full-pipeline procedures, archiving, localization testing.                                       |
| [`factories/`](./factories/)                                       | `PlatformDataFactory`, `createFakerBackedMockAdapter`, etc.                                                                                        |
| [`fixture-loaders/`](./fixture-loaders/)                           | `CompositeFixtureLoader` for layered JSON under `fixtures/`.                                                                                       |
| [`fixtures/`](./fixtures/)                                         | Base + scenario JSON (`base/`, `scenarios/`, `tenants/`).                                                                                          |
| [`scripts/`](./scripts/)                                           | Test execution scripts — scenario runners, artifact verification, capture. See [`scripts/README.md`](./scripts/README.md).                         |
| [`phase01-platform-integration/`](./phase01-platform-integration/) | Phase 01 integration suite (separate from production flow scenarios).                                                                              |
| [`scenarios/`](./scenarios/)                                       | **Legacy workspace** — scenarios now run from `tests/orchestrator/`.                                                                               |
| [`scenarios/visual-baselines/`](./scenarios/visual-baselines/)     | Committed PNG baselines for R01/R02 HTML previews (pixelmatch).                                                                                    |
| [`artifact-verification.test.ts`](./artifact-verification.test.ts) | **Live API artifact verification** — tests workflow status, analysis results, PDF reports. Requires `TEST_TOKEN`.                                  |

---

## Test layers (where to run what)

| Layer                                                  | Location                                  | Command                                                                                              |
| ------------------------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Package / app tests                                    | `packages/**`, `apps/**`                  | `pnpm run test`                                                                                      |
| Root Vitest workspace (incl. `tests/utils` unit tests) | `vitest.config.ts` projects               | `pnpm run test:unit` or `pnpm run test`                                                              |
| Production flow scenarios                              | `tests/orchestrator/`                     | `pnpm run test:production-flow`                                                                      |
| Single scenario                                        | `tests/orchestrator/scenarios/`           | `pnpm run test:scenario R01`                                                                         |
| Live API artifact verification                         | `tests/artifact-verification.test.ts`     | `TEST_TOKEN=$(node scripts/generate-dev-jwt.mjs --tenant <id>) pnpm test artifact-verification`      |
| Manual artifact capture                                | `tests/scripts/capture-test-artifacts.sh` | `TOKEN=$(node scripts/generate-dev-jwt.mjs --tenant <id>) ./tests/scripts/capture-test-artifacts.sh` |
| Live pipeline validation                               | `scripts/live-llm-verdict.mjs`            | `node scripts/live-llm-verdict.mjs`                                                                  |

Scenarios **call into production packages**; keep narrow unit tests inside those packages for speed and coverage.

---

## Quick start

```bash
pnpm install
pnpm run build

# Run all tests
pnpm run test

# Run production flow scenarios
pnpm run test:production-flow

# Run single scenario
pnpm run test:scenario R02

# Live pipeline validation (requires LLM API keys)
node scripts/live-llm-verdict.mjs
```

---

## Local Development Services

For local testing that requires PostgreSQL and Redis:

```bash
# Start development services
pnpm run db:up

# Stop development services
pnpm run db:down
```

**Note:** These services are for development, not testing. Tests use mocks or in-memory alternatives.

---

## Live API Testing & Artifacts

### Automated Artifact Capture

The `tests/scripts/capture-test-artifacts.sh` script runs live API workflows and saves all artifacts:

```bash
export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
./tests/scripts/capture-test-artifacts.sh
```

**Captured artifacts:**

- Request/response pairs for all workflow triggers
- Analysis results (AI insights, verdicts, recommendations)
- Poll logs with execution timing
- Manifest with execution IDs and summary

**Output:** `tests/test-output/archive/YYYY-MM-DD_test-run/`

### Manual Artifact Verification

Run the artifact verification test suite:

```bash
export TEST_TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
pnpm test artifact-verification
```

**Tests:**

- Workflow status retrieval and polling
- Production-flow PDF reports (R01)
- Analysis results structure and content
- Processing metadata (LLM detection)
- Verdict-generation full pipeline
- Error cases (400/401/403/404)

See [`test-output/README.md`](./test-output/README.md) for detailed artifact structure.

---

## Further reading

- **Local testing guide:** [`docs/02-planning-and-methodology/local-testing-guide.md`](../docs/02-planning-and-methodology/local-testing-guide.md)
- **Authoring scenarios:** [`docs/02-planning-and-methodology/scenario-testing-guide.md`](../docs/02-planning-and-methodology/scenario-testing-guide.md)
- **Static data patterns:** [`docs/02-planning-and-methodology/static-data-injection-best-practices.md`](../docs/02-planning-and-methodology/static-data-injection-best-practices.md)
- **Report testing research:** [`docs/04-technology-research/quality-assurance/report-generation-testing-best-practices.md`](../docs/04-technology-research/quality-assurance/report-generation-testing-best-practices.md)
