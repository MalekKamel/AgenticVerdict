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
| [`factories/`](./factories/)                                       | `PlatformDataFactory`, `createFakerBackedMockAdapter`, etc.                                                                                        |
| [`fixture-loaders/`](./fixture-loaders/)                           | `CompositeFixtureLoader` for layered JSON under `fixtures/`.                                                                                       |
| [`fixtures/`](./fixtures/)                                         | Base + scenario JSON (`base/`, `scenarios/`, `companies/`).                                                                                        |
| [`scripts/`](./scripts/)                                           | `pnpm run test:scenario`, `test:scenarios:all`, `test:scenarios:group`.                                                                            |
| [`phase01-platform-integration/`](./phase01-platform-integration/) | Phase 01 integration suite (separate from production flow scenarios).                                                                              |
| [`scenarios/`](./scenarios/)                                       | **Legacy workspace** — scenarios now run from `tests/orchestrator/`.                                                                               |
| [`scenarios/visual-baselines/`](./scenarios/visual-baselines/)     | Committed PNG baselines for R01/R02 HTML previews (pixelmatch).                                                                                    |

---

## Test layers (where to run what)

| Layer                                                  | Location                        | Command                                 |
| ------------------------------------------------------ | ------------------------------- | --------------------------------------- |
| Package / app tests                                    | `packages/**`, `apps/**`        | `pnpm run test`                         |
| Root Vitest workspace (incl. `tests/utils` unit tests) | `vitest.config.ts` projects     | `pnpm run test:unit` or `pnpm run test` |
| Production flow scenarios                              | `tests/orchestrator/`           | `pnpm run test:production-flow`         |
| Single scenario                                        | `tests/orchestrator/scenarios/` | `pnpm run test:scenario R01`            |
| Live pipeline validation                               | `scripts/live-llm-verdict.mjs`  | `node scripts/live-llm-verdict.mjs`     |

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

## Further reading

- **Local testing guide:** [`docs/02-planning-and-methodology/local-testing-guide.md`](../docs/02-planning-and-methodology/local-testing-guide.md)
- **Authoring scenarios:** [`docs/02-planning-and-methodology/scenario-testing-guide.md`](../docs/02-planning-and-methodology/scenario-testing-guide.md)
- **Static data patterns:** [`docs/02-planning-and-methodology/static-data-injection-best-practices.md`](../docs/02-planning-and-methodology/static-data-injection-best-practices.md)
- **Report testing research:** [`docs/04-technology-research/quality-assurance/report-generation-testing-best-practices.md`](../docs/04-technology-research/quality-assurance/report-generation-testing-best-practices.md)
