# Runtime Mock/Dev Policy Single Source of Truth

`@agenticverdict/config` is the only source of truth for runtime mock/stub behavior.

## Contract

- `AGENTICVERDICT_RUNTIME_ENV`: `development | test | staging | production`
- `AGENTICVERDICT_MOCK_MODE`: `off | selective | all`
- `AGENTICVERDICT_MOCK_CONNECTORS`: comma-separated connector list when mode is `selective`
- `AGENTICVERDICT_MOCK_SCENARIO`: optional scenario name
- `AGENTICVERDICT_STUB_REPORT_FORMATS`: `0 | 1`
- `AGENTICVERDICT_STUB_EMAIL_DELIVERY`: `0 | 1`
- `VITE_PUBLIC_AUTH_API_MODE`: `real | mock` (default: `real`)

## Security Invariants

- In `staging` and `production`:
  - connector mocks are forbidden
  - report-format stubs are forbidden
  - email-delivery stubs are forbidden
  - frontend auth mode must be `real`
- Runtime validation is enforced by:
  - `resolveRuntimePolicy(env)`
  - `assertProductionSafeRuntimePolicy(policy)`

## Usage

- API/worker startup must call `assertProductionSafeRuntimePolicy(resolveRuntimePolicy(process.env))`.
- Runtime code must avoid direct mock/stub `process.env` reads outside `@agenticverdict/config`.
