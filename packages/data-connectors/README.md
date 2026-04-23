# `@agenticverdict/data-connectors`

Plugin boundary for **data connectors** (Meta, GA4, GSC, GBP, TikTok): authentication, raw metric fetch, normalization to `NormalizedConnectorSnapshot`, and health signals.

## Responsibilities

- **`ConnectorAdapter`** — `authenticate`, `fetchMetrics`, `normalizeData`, `isHealthy`.
- **`BaseConnectorAdapter`** — token bucket, optional cache, circuit breaker, exponential backoff around `fetchRawMetrics`.
- **`createAdapterRegistry`** — register `(context) => adapter` factories without pulling in `@agenticverdict/core`; each `resolve` gets a **new** adapter instance. If `context` is an object with a `tenantId` key, that value must be a non-empty string (throws `PlatformError` with `missing_tenant_id`); see tenant SSOT **C-CONN-1** in [`/docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`](../../docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md). `BaseConnectorAdapter` still enforces a tenant on construction.
- **Errors** — `PlatformError` hierarchy (connector id + machine code) for consistent handling upstream.
- **`MockConnectorAdapter`**, **`createSyntheticAdapter`**, **`useMockAdapter`** — deterministic tests without network.

## Deferred / evolving

- Production OAuth hardening, vendor SDK surface area, and credential decryption paths continue to grow per connector.
- Connector-specific normalizers implement the shared normalization pipeline under `src/normalization/`.

## Integration

1. Implement a concrete adapter extending **`BaseConnectorAdapter`** (or implement **`ConnectorAdapter`** directly if you supply your own resilience).
2. At bootstrap, **`createAdapterRegistry<TenantContext>()`** and **`register`** each enabled connector with a factory that receives tenant-scoped context (credentials, cache, rate limits).
3. **`resolve(connector, context)`** where `context` aligns with `app.current_tenant_id` and `TenantConfig` for the active request or job.

## Normalized metrics

`NormalizedConnectorSnapshot` carries `connector`, `dateRange`, and `records[]` with `metricKey`, `value`, optional `dimensions`, and `capturedAt` (ISO datetime).

## Performance and operations

- Automated guardrails: `registry.performance.test.ts` (in-process `resolve` p99).
- Human / DB checks: [`docs/06-reference/runbooks/connector-performance-validation.md`](../../docs/06-reference/runbooks/connector-performance-validation.md).

## See also

- [Connector-centric operations runbook](../../docs/06-reference/runbooks/connector-centric-operations.md)
- [Migration execution plan](../../docs/architecture/connector-refactoring-migration-execution-plan.md)
