# Runtime Mocking Comprehensive Guide

This guide defines how runtime mocking and stubbing are configured, enforced, and verified across AgenticVerdict.

It complements the SSOT policy summary in `docs/architecture/runtime-mock-dev-policy-single-source-of-truth.md` with implementation-level detail for developers and operators.

## Scope and goals

- Keep runtime behavior deterministic across local dev, CI, staging, and production.
- Centralize all mock/stub decisions in `@agenticverdict/config`.
- Enforce fail-closed behavior in production-like environments.
- Prevent direct and scattered env parsing in app-level runtime code.

## Authoritative contract

The supported runtime contract is:

- `AGENTICVERDICT_RUNTIME_ENV`: `development | test | staging | production`
- `AGENTICVERDICT_MOCK_MODE`: `off | selective | all`
- `AGENTICVERDICT_MOCK_CONNECTORS`: comma-separated connector list (required when mode is `selective`)
- `AGENTICVERDICT_MOCK_SCENARIO`: optional scenario key used by mock data factories
- `AGENTICVERDICT_STUB_REPORT_FORMATS`: `0 | 1`
- `AGENTICVERDICT_STUB_EMAIL_DELIVERY`: `0 | 1`
- `VITE_PUBLIC_AUTH_API_MODE`: `real | mock` (frontend; defaults to `real`)

No legacy mock/stub env variables are supported.

## Runtime policy APIs

Use these APIs from `@agenticverdict/config`:

- `resolveRuntimePolicy(env?)` to parse and normalize environment input.
- `assertProductionSafeRuntimePolicy(policy)` to block forbidden production-like toggles.
- `isFeatureMockEnabled(policy, feature, connector?)` to evaluate feature-level behavior.

Never implement parallel mock/stub logic by reading env vars directly in app runtime code.

## Security invariants

In `staging` and `production`:

- connector mocks are forbidden
- report-format stubs are forbidden
- email-delivery stubs are forbidden
- frontend auth mode must be `real`

Violations must fail startup (API/worker) or fail config resolution early (frontend/server utilities).

## Behavior matrix

| Runtime env | Connector mock mode | Report format stubs | Email delivery stubs | Frontend auth mode |
| ----------- | ------------------- | ------------------- | -------------------- | ------------------ | ------- | ----- | ----- |
| development | `off                | selective           | all`                 | allowed            | allowed | `real | mock` |
| test        | `off                | selective           | all`                 | allowed            | allowed | `real | mock` |
| staging     | `off` only          | forbidden           | forbidden            | `real` only        |
| production  | `off` only          | forbidden           | forbidden            | `real` only        |

### Selective connector rules

When `AGENTICVERDICT_MOCK_MODE=selective`:

- `AGENTICVERDICT_MOCK_CONNECTORS` is required.
- Connector names must map to supported `ConnectorType` values.
- An empty connector list is invalid and must throw.

## Application integration points

### `packages/config` (single source of truth)

- Hosts runtime policy parsing and assertions.
- Exposes `isMockEnabledForConnector(...)` through policy evaluation.
- Must remain free of app-specific behavior.

### API (`apps/api`)

- Enforce startup safety with:
  - `assertProductionSafeRuntimePolicy(resolveRuntimePolicy(process.env))`
- Gate test-only or synthetic workflow triggers via resolved runtime policy.

### Worker (`apps/worker`)

- Enforce startup safety with:
  - `assertProductionSafeRuntimePolicy(resolveRuntimePolicy(process.env))`
- Resolve email/report stubs through policy APIs only.
- Synthetic tenant fallback behavior is restricted to explicit test-safe contexts.

### Frontend (`apps/frontend`)

- Resolve auth mock mode via:
  - `VITE_PUBLIC_AUTH_API_MODE` (`real | mock`)
- Force real APIs in production builds and production-like runtime evaluation.
- Do not use deprecated frontend auth mock env toggles.

### Report generator and other packages

- Replace direct env checks with `resolveRuntimePolicy(...)` + `isFeatureMockEnabled(...)`.

## Docker and deployment guidance

- Production-like compose stacks should pin:
  - `AGENTICVERDICT_RUNTIME_ENV=production`
  - `AGENTICVERDICT_STUB_REPORT_FORMATS=0`
  - `AGENTICVERDICT_STUB_EMAIL_DELIVERY=0`
  - `AGENTICVERDICT_MOCK_MODE=off`
- Development overlays may enable selective or all mocks explicitly.
- Keep API and worker env policy aligned so queue jobs and API routes behave consistently.

## CI and guardrails

Use runtime policy linting to prevent regressions:

- `scripts/runtime-policy-lint.sh`

Recommended CI gates:

- Run runtime policy lint in pull requests and mainline builds.
- Run targeted tests for policy parser and startup assertions.
- Run environment validation checks for Docker compose overlays.

## Testing strategy

Minimum expected coverage:

- Unit tests for parser behavior (`resolveRuntimePolicy`) and per-feature decisions.
- Unit tests for production safety assertions.
- Integration tests that confirm API/worker startup fails on forbidden toggles in production-like envs.
- Frontend tests for auth mode resolution and production-safe behavior.

Suggested test matrix:

- `development` + `mock_mode=all`
- `development` + `mock_mode=selective` with connector list
- `test` + stubs enabled
- `staging` + any forbidden flag (must fail)
- `production` + any forbidden flag (must fail)

## Operational verification

Before promoting production-like deployments:

1. Confirm runtime env is set correctly (`staging` or `production`).
2. Confirm `AGENTICVERDICT_MOCK_MODE=off`.
3. Confirm stub flags are `0`.
4. Run startup checks for API and worker.
5. Run runtime policy lint and record artifacts in CI logs.

## Troubleshooting

### Startup fails with forbidden runtime policy

- Review env values injected by compose, deployment manifests, and CI.
- Remove mock/stub toggles for production-like environments.
- Re-run with policy lint script and startup tests.

### Selective mode throws connector configuration error

- Ensure `AGENTICVERDICT_MOCK_MODE=selective`.
- Ensure `AGENTICVERDICT_MOCK_CONNECTORS` is set and non-empty.
- Ensure connector names match supported connector identifiers.

### Frontend auth unexpectedly uses real APIs

- Confirm `VITE_PUBLIC_AUTH_API_MODE=mock` in development/test only.
- Verify build/runtime context is not production.
- Check frontend runtime policy helper usage in auth API code paths.

## Related references

- `docs/architecture/runtime-mock-dev-policy-single-source-of-truth.md`
- `docs/mock-adapter-configuration.md`
- `docs/05-reference/mock-adapter-integration.md`
- `docs/05-reference/runbooks/environment-variables.md`
- `scripts/runtime-policy-lint.sh`
