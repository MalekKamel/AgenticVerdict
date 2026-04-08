# Scenarios (R01–R12)

**Vitest directories under this folder were removed in Phase 4 (production-flow full migration).**  
Scenarios **R01–R12** are implemented in the **worker** (`apps/worker/src/queues/production-flow-scenarios-extended.ts`, `workflow-trigger-production-flow.ts`) and exercised through the **orchestrator** client tests:

- `tests/orchestrator/scenarios/production-flow-scenarios.test.ts` (mocked HTTP)
- Trigger path: `POST /api/v1/workflows/trigger` with `config.productionFlowScenarioId`

## Commands (repo root)

```bash
pnpm run test:production-flow
pnpm run test:scenarios:all
pnpm run test:scenario R03
pnpm run test:scenarios:group generation
```

The **`@agenticverdict/scenarios`** workspace package is a **stub**; use the commands above instead of `pnpm --filter @agenticverdict/scenarios test`.

## Environment (worker / Docker)

- **`AGENTICVERDICT_PRODUCTION_FLOW_MOCK_EMAIL=1`** — required for **R09** when no Resend/SendGrid keys are set.
- **`SKIP_PLAYWRIGHT_PDF_TESTS=1`** — skips **R01/R02** PDF jobs in the worker when Chromium is unavailable.
