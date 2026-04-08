# Test Scripts Reference

**Document Version:** 2.0  
**Date:** 2026-04-06  
**Status:** Active

Reference for **pnpm commands**, **scenario orchestration** (`tests/scenarios/`, `tests/scripts/`), and **environment variables** used in testing. Legacy `scripts/test-glm.sh` and `scripts/test-system.sh` have been **removed**; use scenarios **R06**, **R11**, and **R12** instead.

---

## Table of Contents

1. [Overview](#overview)
2. [Scenario orchestration](#scenario-orchestration)
3. [Layered testing commands](#layered-testing-commands)
4. [Environment variables](#environment-variables)
5. [CI/CD examples](#cicd-examples)
6. [Troubleshooting](#troubleshooting)
7. [Related documentation](#related-documentation)

---

## Overview

| Command                                | Purpose                                                                         | Typical duration | Notes                                              |
| -------------------------------------- | ------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------- |
| `pnpm run test`                        | Unit tests (Turbo / packages)                                                   | Varies           | Primary package coverage                           |
| `pnpm run test:integration`            | Package integration tests                                                       | Varies           | API, DB, adapters                                  |
| `pnpm run test:e2e`                    | Playwright E2E                                                                  | Varies           | `apps/web`                                         |
| `pnpm run test:coverage`               | Root Vitest + coverage                                                          | Varies           | Includes `tests/utils` project                     |
| `pnpm run test:scenarios:all`          | Scenarios R01–R12                                                               | ~2–15 min        | Chromium for PDF scenarios                         |
| `pnpm run test:scenario R12`           | Prerequisites (Node, pnpm, Docker)                                              | Seconds          | Run first when debugging env                       |
| `pnpm run test:scenario R11`           | Stack health (Compose, DB, Redis, observability)                                | Seconds–minutes  | Degrades gracefully without stack                  |
| `pnpm run test:scenario R06`           | LLM / mock integration                                                          | Seconds          | Live probes need keys + `AGENT_RUNTIME_LIVE_LLM=1` |
| `pnpm run test:scenarios:group <name>` | Subset: `generation` \| `integration` \| `delivery` \| `scheduling` \| `system` | Varies           | `tests/scripts/run-scenario-group.sh`              |

Shell entrypoints (repo root): `tests/scripts/run-all-scenarios.sh`, `run-scenario.sh`, `run-scenario-group.sh`, `validate-scenario.sh`.

---

## Scenario orchestration

| Command                                     | Description                                             |
| ------------------------------------------- | ------------------------------------------------------- |
| `pnpm run test:scenarios:all`               | All scenario directories via Vitest                     |
| `pnpm run test:scenario R02`                | One scenario by id (`R2`), canonical id, or folder name |
| `pnpm run test:scenarios:group generation`  | R01, R02, R03, R04, R08                                 |
| `pnpm run test:scenarios:group integration` | R05, R06, R07, R11                                      |
| `pnpm run test:scenarios:group system`      | R11, R12                                                |

**Authoring:** `docs/02-planning-and-methodology/scenario-testing-guide.md`, `tests/scenarios/README.md`.

**PDF scenarios:** install Chromium for report-generator / scenarios (see CI workflow). `SKIP_PLAYWRIGHT_PDF_TESTS=1` skips R01/R02 when Chromium is unavailable.

---

## Layered testing commands

Typical local or CI flow:

1. `pnpm install` and `pnpm exec turbo run lint typecheck` as needed
2. `pnpm run test` — unit tests
3. `pnpm run test:integration` / `pnpm run test:e2e` when validating those layers
4. `pnpm run test:scenarios:all` — orchestration scenarios

For a minimal “is my machine wired?” check: `pnpm run test:scenario R12` then `pnpm run test:scenario R11`.

**Agent-runtime package tests** (chat models, pipeline, etc.): `pnpm --filter @agenticverdict/agent-runtime test`.

---

## Environment variables

### Scenarios and PDFs

| Variable                      | Effect                                   |
| ----------------------------- | ---------------------------------------- |
| `SKIP_PLAYWRIGHT_PDF_TESTS=1` | Skip R01/R02 when Chromium not installed |

### LLM (R06, agent-runtime)

| Variable                           | Effect                                                                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`                | Anthropic                                                                               |
| `OPENAI_API_KEY`                   | OpenAI                                                                                  |
| `GLM_API_KEY` + `GLM_API_BASE_URL` | GLM (OpenAI-compatible base URL)                                                        |
| `GLM_MODEL`                        | GLM model id (default in code/docs: `glm-4`)                                            |
| `AGENT_RUNTIME_LIVE_LLM=1`         | Allow non-mock paths in `LLMTestHelper.getLLMProvider()` and live GLM when keys are set |

### Health checks (R11, `tests/utils/health-checks.ts`)

| Variable                                                     | Effect                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| `DATABASE_URL`                                               | Postgres probe                                          |
| `REDIS_URL`                                                  | Redis probe (default `redis://127.0.0.1:6379` if unset) |
| `HEALTH_CHECK_TIMEOUT`                                       | Timeout ms for checks                                   |
| `PROMETHEUS_URL` / `GRAFANA_URL` / `OBSERVABILITY_STACK_URL` | Optional observability                                  |

---

## CI/CD examples

### GitHub Actions (align with repo `ci.yml`)

```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm exec vitest run --coverage
- run: pnpm run test:scenarios:all
```

Optional: run system scenarios only:

```yaml
- run: pnpm run test:scenarios:group system
```

### GitLab CI (illustrative)

```yaml
test:
  script:
    - pnpm install --frozen-lockfile
    - pnpm run test
    - pnpm run test:scenarios:all
```

---

## Troubleshooting

| Issue                          | What to try                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Docker Compose / no containers | R11 may report `degraded` for docker-stack; start `docker compose up -d` or ignore if you only need unit tests                             |
| Postgres / Redis unreachable   | Set `DATABASE_URL` / `REDIS_URL`; check `docker compose ps`                                                                                |
| PDF scenarios fail             | Install Playwright Chromium (see CI) or set `SKIP_PLAYWRIGHT_PDF_TESTS=1` locally                                                          |
| GLM / API errors               | Confirm `GLM_API_BASE_URL` has no trailing slash issues; use `pnpm --filter @agenticverdict/agent-runtime test` for package-level failures |
| Verbose Vitest                 | Pass extra args: `pnpm run test:scenario R06 -- --reporter=verbose`                                                                        |

**Logs:** Vitest stdout; `docker compose logs <service>`; coverage under `coverage/`.

---

## Related documentation

- [`scenario-testing-guide.md`](./scenario-testing-guide.md)
- [`testing-strategy.md`](./testing-strategy.md)
- [`unified-testing-system-implementation-plan.md`](./unified-testing-system-implementation-plan.md)
- [`../docker/README.md`](../docker/README.md)
- [`../../scripts/health-check.sh`](../../scripts/health-check.sh)

**Change history**

- 2026-04-06: v2.0 — Removed legacy `test-glm.sh` / `test-system.sh`; scenario-only reference.
- 2026-04-06: v1.0 — Initial version.
