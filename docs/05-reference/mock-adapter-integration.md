# Mock Adapter Integration

This reference is aligned with the runtime policy single source of truth.

## Required environment contract

- `AGENTICVERDICT_RUNTIME_ENV`: `development | test | staging | production`
- `AGENTICVERDICT_MOCK_MODE`: `off | selective | all`
- `AGENTICVERDICT_MOCK_CONNECTORS`: comma-separated list (required when mode is `selective`)
- `AGENTICVERDICT_MOCK_SCENARIO`: optional scenario

## Examples

```bash
# All connector mocks in local development
AGENTICVERDICT_RUNTIME_ENV=development
AGENTICVERDICT_MOCK_MODE=all
AGENTICVERDICT_MOCK_SCENARIO=normal
```

```bash
# Selective connector mocks
AGENTICVERDICT_RUNTIME_ENV=test
AGENTICVERDICT_MOCK_MODE=selective
AGENTICVERDICT_MOCK_CONNECTORS=meta,ga4
```

## Security constraints

- In `staging` and `production`, mock mode must be `off`.
- Startup safety is enforced via `resolveRuntimePolicy(...)` and `assertProductionSafeRuntimePolicy(...)` from `@agenticverdict/config`.

## Related docs

- `docs/architecture/runtime-mock-dev-policy-single-source-of-truth.md`
- `docs/05-reference/runbooks/environment-variables.md`
