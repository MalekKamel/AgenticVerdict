# Changelog: Connector Part 2 — Interface and type renaming (2026-04-10)

## Summary

Executed **Part 2: Interface Renaming** from `docs/architecture/connector-refactoring-migration-execution-plan.md`: connector-centric names replace the old “platform adapter” vocabulary across types, `@agenticverdict/data-connectors`, config/runtime shape, health APIs, and dependents. **No stub APIs** were added.

## Type renames (canonical mapping)

| Former                                                     | New                                                                     |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `PlatformType`                                             | `ConnectorType` (`packages/types/src/connector-types.ts`, string union) |
| `PlatformAdapter`                                          | `ConnectorAdapter`                                                      |
| `BasePlatformAdapter`                                      | `BaseConnectorAdapter`                                                  |
| `BasePlatformAdapterOptions`                               | `BaseConnectorAdapterOptions`                                           |
| `PlatformCredentials`                                      | `ConnectorCredentials`                                                  |
| `NormalizedPlatformSnapshot`                               | `NormalizedConnectorSnapshot`                                           |
| `NormalizedPlatformSnapshotParsed`                         | `NormalizedConnectorSnapshotParsed`                                     |
| `normalizedPlatformSnapshotSchema`                         | `normalizedConnectorSnapshotSchema`                                     |
| `parseNormalizedPlatformSnapshot`                          | `parseNormalizedConnectorSnapshot`                                      |
| `PlatformDataNormalizer`                                   | `ConnectorDataNormalizer`                                               |
| `MockPlatformAdapter` / options                            | `MockConnectorAdapter` / `MockConnectorAdapterOptions`                  |
| `MetaPlatformAdapter`, `Ga4PlatformAdapter`, …             | `MetaConnectorAdapter`, `Ga4ConnectorAdapter`, …                        |
| `createPlatformAdapter`                                    | `createConnectorAdapter`                                                |
| `platformAdapterTypes`                                     | `connectorAdapterTypes`                                                 |
| `PlatformAdapterRegistry`                                  | `ConnectorAdapterRegistry`                                              |
| `PlatformAdapterMetricSnapshot`                            | `ConnectorAdapterMetricSnapshot`                                        |
| `isMockEnabledForPlatform`                                 | `isMockEnabledForConnector`                                             |
| `mockAdapterPlatformSchema`                                | `mockAdapterConnectorSchema`                                            |
| `refreshGoogleAccessTokenForPlatform`                      | `refreshGoogleAccessTokenForConnector`                                  |
| `validateGoogleAccessTokenForPlatform`                     | `validateGoogleAccessTokenForConnector`                                 |
| `defaultPlatformRateProfile` / `createPlatformTokenBucket` | `defaultConnectorRateProfile` / `createConnectorTokenBucket`            |
| `isRetryablePlatformError`                                 | `isRetryableConnectorError`                                             |
| `PLATFORM_ADAPTERS_PACKAGE_VERSION`                        | `DATA_CONNECTORS_PACKAGE_VERSION`                                       |

## Domain field renames

- **`ConnectorAdapter`**: `readonly platform` → **`readonly connector`**.
- **`NormalizedConnectorSnapshot`** (and Zod schema): top-level **`platform`** → **`connector`** (JSON shape for normalized snapshots).
- **`AdapterFactoryConfig`**: **`readonly platform`** → **`readonly connector`** for `createConnectorAdapter`.
- **`MockStaticDataOptions`**, **`MockAdapterFactoryConfig`**, **`AdapterCacheKeyInput`**, **`DeadLetterRecord`**, **`AdapterOperationEvent`**: connector identity fields aligned to **`connector`** where they referred to `ConnectorType`.
- **`PlatformError`**: **`readonly platform`** → **`readonly connector`** (class names `PlatformError` / `PlatformAuthError` / … kept to limit churn; constructor parameters use `connector`).
- **Infrastructure health**: return type field **`platforms`** → **`connectors`**; row type **`PlatformHealthReport`** → **`ConnectorHealthReport`**; per-row **`platform`** → **`connector`**; `snapshotForPlatform` → **`snapshotForConnector`**.
- **Runtime config** (`RuntimeConfig`): **`adapters.mocks.platforms`** → **`adapters.mocks.connectors`** (Zod: `packages/config/src/schemas/runtime-config.ts`).

## Intentionally unchanged names

- **Marketing / tenant config** (`platformConfigSchema`, channel object field **`platform`**) — still “which channel” in `TenantConfig`, not the adapter interface.
- **Agent DB tools** — Zod fields remain **`platform`** (optional filter) with **`connectorTypeSchema`** validation; store rows still use **`MarketingMetricsRow.platform`** (DB column semantics).
- **Prometheus label names** in `@agenticverdict/observability` — still **`platform`** on metrics counters/histograms (deployment compatibility).
- **HTTP route** `apps/frontend/src/app/api/health/platforms/[platform]/` — URL segment unchanged; handler resolves **`ConnectorType`** against **`report.connectors`**.

## Documentation

- **`CLAUDE.md`**, **`README.md`**: updated plugin section to **`ConnectorAdapter`** / **`ConnectorType`** / **`NormalizedConnectorSnapshot`**.

## Verification

- `pnpm --filter @agenticverdict/types typecheck`
- `pnpm --filter @agenticverdict/config typecheck`
- `pnpm --filter @agenticverdict/data-connectors typecheck` + **`test`** (291 tests passed; 5 integration tests skipped as before)
- `pnpm --filter @agenticverdict/agent-runtime typecheck` + **`test`**
- `pnpm --filter @agenticverdict/mock-platform-server typecheck`
- `pnpm --filter @agenticverdict/frontend typecheck`
- `pnpm --filter @agenticverdict/worker typecheck`

**Note:** `@agenticverdict/api` still reports pre-existing Fastify `FastifyInstance` / logger generic mismatches under `turbo run typecheck` (unchanged by this work).

## References

- Plan: `docs/architecture/connector-refactoring-migration-execution-plan.md` — Part 2: Interface Renaming
- Part 1 changelog: `changelog/2026-04-10-connector-refactoring-part1-code-restructuring.md`
