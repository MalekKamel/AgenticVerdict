# Changelog — 2026-04-06

All items below reflect **the current Git staged index** for this workstream (scenario orchestration, test utilities, agent-runtime LLM support, CI, and documentation).

**Scope:** 91 files changed, 4753 insertions, 323 deletions (`git diff --staged --shortstat`).

---

## Added

### Scenario orchestration (`tests/scenarios/`)

- Workspace **`@agenticverdict/scenarios`** with `package.json`, `tsconfig.json`, and Vitest config aliasing `tests/utils`.
- **R01** — English LTR PDF generation (fixtures, validation, `pdf-generation.test.ts`).
- **R02** — Arabic RTL PDF generation, text-layer checks, `validate-pdf.sh`, RTL checklist and requirements.
- **R03** — DOCX generation from HTML fixture.
- **R04** — XLSX generation stub / contract test.
- **R05** — Multi-platform report merge using GA4, GSC, GBP, Meta, TikTok fixtures.
- **R06** — LLM provider integration (mock model, `createGlmChatModel` / multi-provider wiring, optional live probes via `AGENT_RUNTIME_LIVE_LLM`), provider fixtures and validation JSON.
- **R07** — Tenant isolation (cache keys, test tenant context).
- **R08** — Composite template rendering.
- **R09** — Report delivery with mock email capture.
- **R10** — Scheduled reports with cron simulator mock.
- **R11** — System health (Docker Compose, Postgres, Redis, optional observability HTTP checks).
- **R12** — Prerequisites (Node.js, pnpm, Docker / Compose detection).
- **`tests/scenarios/README.md`** describing layout and commands.

### Shell entrypoints (`tests/scripts/`)

- `run-scenario.sh` — run a single scenario by id or folder.
- `run-all-scenarios.sh` — run the full Vitest scenario suite.
- `run-scenario-group.sh` — run by group: `generation`, `integration`, `delivery`, `scheduling`, `system`.
- `validate-scenario.sh` — verify a scenario directory contains Vitest tests.

### Shared test utilities (`tests/utils/`)

- **`scenario-runner.ts`** — scenario registry (R01–R12), metadata, dependency hooks.
- **`tenant-context.ts`**, **`database-helpers.ts`**, **`assertion-helpers.ts`**, **`pdf-text.ts`** — helpers for tenants, DB facade, PDF assertions, text extraction.
- **`health-checks.ts`** — structured health results for Compose, database, Redis, observability, LLM delegation.
- **`prerequisites.ts`** — toolchain checks and monorepo root resolution.
- **`llm-provider-helpers.ts`** — env parsing and minimal HTTP connectivity probes (Anthropic, OpenAI, GLM).
- Matching **`*.test.ts`** and **`vitest.config.ts`** so utils are covered by root Vitest.

### Fixtures (`tests/fixtures/`)

- Tenant JSON fixtures (default, Arabic, multilingual) and **`scenario-templates.json`**.

### Root tooling

- **`package.json`** scripts: `test:scenario`, `test:scenarios:all`, `test:scenarios:group`.
- Root **`vitest.config.ts`** — register **`tests/utils`** as a Vitest project.

### CI

- **`.github/workflows/ci.yml`** — step **Scenario orchestration tests (R01–R12)** running `pnpm run test:scenarios:all` after unit coverage.

### Documentation

- **`docs/00-overview/system-overview.md`** — system reference (architecture, testing, operations).
- **`docs/02-planning-and-methodology/scenario-testing-guide.md`** — how to author and run scenarios.
- **`docs/02-planning-and-methodology/test-scripts-reference.md`** — pnpm commands, env vars, CI examples.
- **`docs/02-planning-and-methodology/unified-testing-system-implementation-plan.md`** — unified testing design and rollout notes.

### Application / packages

- **`apps/worker/package.json`** — export subpath **`./services/email`** → `./src/services/email.ts` for consumers and scenarios.

### `@agenticverdict/agent-runtime`

- **GLM** support: `GLM_API_KEY`, `GLM_API_BASE_URL`, `GLM_MODEL` in **`llm-env.ts`** (Zod-validated).
- **`ChatGlm`** (OpenAI-compatible client), **`createGlmChatModel`**, **`DEFAULT_GLM_MODEL`**, tri-provider ordering and **`isLlmProviderConfigured`** in **`chat-models.ts`**.
- **`createPrimaryAndFallbackChatModels`** extended for GLM and optional temperature override; **`AgentFactory`** delegates to it via **`AgentLlmCredentialEnv`**.
- **`checkAgentRuntimeHealth`** treats configured GLM as invokable.
- **`index.ts`** exports for GLM and credential types.
- Tests updated in **`chat-models.test.ts`**, **`llm-env.test.ts`**, **`agent-runtime-health.test.ts`**.

### Meta

- This **`changelog/2026-04-06-scenario-testing-orchestration-system.md`** entry.

---

## Changed

- **`packages/database/scripts/seed.ts`** — when **`AGENTICVERDICT_SKIP_SEED_MIGRATIONS=1`**, skip **`runMigrations`** so seed can run against an already-applied schema (e.g. after `drizzle-kit push`).
- **`pnpm-lock.yaml`** — lockfile refresh for new workspace and dependencies.

---

## Removed

- **`docs/02-planning-and-methodology/report-generation-system-test-plan.md`** — superseded by the scenario orchestration docs and plan above.

---

## Notes for consumers

- Run all scenarios: **`pnpm run test:scenarios:all`**.
- PDF scenarios need Chromium where applicable; use **`SKIP_PLAYWRIGHT_PDF_TESTS=1`** only when intentionally skipping R01/R02.
- Optional live LLM checks in R06: set provider keys and **`AGENT_RUNTIME_LIVE_LLM=1`**; keep **`USE_MOCK_LLM`** / mock paths for CI without credentials.
