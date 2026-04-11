# Changelog: Connector refactoring — Part 3: Testing strategy (2026-04-10)

This entry records work executed against **Part 3: Testing Strategy** in `docs/architecture/connector-refactoring-migration-execution-plan.md`, aligned with the **current** codebase (not the illustrative snippets in the plan that reference APIs such as `fetchData` / `getMetrics` that differ from `ConnectorAdapter` today).

## Goals (from the plan)

- **Unit tests**: Fast, isolated coverage of connector registry and adapter contracts.
- **Integration tests**: Multi-component behavior; tenant-scoped isolation is already covered in `@agenticverdict/core` (see below).
- **Contract tests**: Every shipped connector adapter satisfies the `ConnectorAdapter` surface (`authenticate`, `fetchMetrics`, `normalizeData`, `isHealthy`) and exposes a canonical `connector` id.
- **Test data management**: Shared fixtures/factories in `@agenticverdict/testing` for apps and packages that already depend on Vitest.
- **Mock adapters**: No new vendor-specific mock classes; `MockConnectorAdapter` and `createSyntheticAdapter` in `@agenticverdict/data-connectors` remain the deterministic, no-network path.

## What changed

### `@agenticverdict/testing`

- **Dependencies**: `workspace:*` on `@agenticverdict/data-connectors` and `@agenticverdict/types` so fixtures can import `ConnectorAdapter` and `ConnectorType` with correct TypeScript resolution.
- **`src/fixtures/connectors.ts`**: New `mockConnector()` — Vitest `vi.fn`-based `ConnectorAdapter` double for unit tests outside `data-connectors`. Documented when to prefer `createSyntheticAdapter` from `data-connectors` instead.
- **`src/factories/tenant.ts`**: New `createTenant()` and `TestTenant` type — minimal shape aligned with `companies` (tenant) rows for DB/integration scenarios.
- **`src/connector-test-support.test.ts`**: Tests for the above.
- **`src/index.ts`**: Re-exports `mockConnector`, `createTenant`, `TestTenant`.
- **`src/index.test.ts`**: Public API smoke checks for the new exports.

### `@agenticverdict/data-connectors`

- **`src/connector-adapter.contract.test.ts`**: Contract suite constructing each vendor adapter with `requestTokenBucket: null`, `tokenBucket: null`, `cache: null`, and `tenantId: testAdapterTenantId`, plus `MockConnectorAdapter`, and asserting the shared adapter surface.
- **`src/registry.test.ts`**: Test titles updated from “platform” to “connector”; new case asserting the registry **invokes the factory on every `resolve`** (fresh instances per call).

## Mapping plan terminology to the repo

| Plan concept                                     | Repo implementation                                                                                                               |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `ConnectorRegistryService` with tag filtering    | `createAdapterRegistry` / `ConnectorAdapterRegistry` (no tag index yet; tags are a future registry concern per architecture docs) |
| `fetchData` / `getMetrics` on `ConnectorAdapter` | `fetchMetrics` only; no `getMetrics` on the interface                                                                             |
| Dedicated `GA4MockConnector` class               | `MockConnectorAdapter` + `createSyntheticAdapter`                                                                                 |
| New integration file for tenant isolation        | Existing `packages/core/src/tenant-isolation.test.ts` and related tenant context tests                                            |

## Coverage targets (§3.1)

- **`@agenticverdict/data-connectors`** already defines Vitest **v8 coverage thresholds** in `vitest.config.ts` (lines/branches/functions/statements), consistent with the plan’s emphasis on high coverage for connector logic.
- **Monorepo-wide** enforcement of the plan’s 70% / 85% / 90% buckets remains a separate CI/turbo policy task; Part 3 did not add new global gates.

## Verification

```bash
pnpm --filter @agenticverdict/testing typecheck
pnpm --filter @agenticverdict/testing test
pnpm --filter @agenticverdict/data-connectors test
```

## Follow-ups (optional, not stubbed)

- Tag-based connector discovery tests when/if a `ConnectorRegistryService` (or equivalent) lands in `data-connectors` or another package.
- Optional Vitest coverage thresholds for `@agenticverdict/testing` if the package grows beyond thin fixtures.
