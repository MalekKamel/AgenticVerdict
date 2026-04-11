# Phase 01 — Platform integration: operations and documentation

**Execution Phase 8** of the [execution plan](../EXECUTION-PLAN.md): API reference, authentication guides, error catalog, OpenAPI for health endpoints, and runbooks for deploy, monitoring, incidents, troubleshooting, disaster recovery, plus architecture and performance baselines.

**Primary audience:** backend engineers, SREs, and on-call responders working with `@agenticverdict/data-connectors` and the Next.js health routes in `apps/web`.

## Document map

| Document                                                                         | Purpose                                                                                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [API-REFERENCE.md](./API-REFERENCE.md)                                           | `ConnectorAdapter`, `BaseConnectorAdapter`, registry, infrastructure bundle, per-platform adapter public surface   |
| [USAGE-EXAMPLES.md](./USAGE-EXAMPLES.md)                                         | TypeScript usage patterns; Python examples for HTTP health checks and future service boundaries                    |
| [ERROR-CODES.md](./ERROR-CODES.md)                                               | Typed `PlatformErrorCode` values, HTTP health errors, resolutions                                                  |
| [AUTHENTICATION-GUIDES.md](./AUTHENTICATION-GUIDES.md)                           | Step-by-step OAuth and credential keys per vendor (Meta, Google GA4/GSC/GBP, TikTok)                               |
| [openapi/platform-adapters-health.yaml](./openapi/platform-adapters-health.yaml) | OpenAPI 3.0 for `/api/health*`; validate with `pnpm run lint:openapi` ([`redocly.yaml`](../../../../redocly.yaml)) |
| [RUNBOOK-DEPLOYMENT.md](./RUNBOOK-DEPLOYMENT.md)                                 | Staged rollout, env vars, rollback                                                                                 |
| [MONITORING-GUIDE.md](./MONITORING-GUIDE.md)                                     | Metrics fields, health JSON, suggested alerts                                                                      |
| [INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md)                                   | Common failure playbooks                                                                                           |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)                                       | Known symptoms and fixes                                                                                           |
| [DISASTER-RECOVERY.md](./DISASTER-RECOVERY.md)                                   | Cache/Redis loss, credential rotation, restore posture                                                             |
| [ARCHITECTURE-AND-DATA-FLOW.md](./ARCHITECTURE-AND-DATA-FLOW.md)                 | Diagrams, data path, security notes                                                                                |
| [SECURITY.md](./SECURITY.md)                                                     | Phase 01 security model: threat notes, tenancy, credentials, TLS, logging, AC-5.x verification matrix              |
| [PERFORMANCE-BENCHMARKS.md](./PERFORMANCE-BENCHMARKS.md)                         | SLA targets and lab baseline from Phase 01 integration tests                                                       |

## Source of truth

- **Types and behavior:** `packages/data-connectors/src/`
- **Health HTTP surface:** `apps/web/src/app/api/health/`
- **Synthetic lab tests:** `tests/phase01-platform-integration/`

## Acceptance criteria mapping

See [acceptance-criteria.md §4](../acceptance-criteria.md) (AC-4.1.x through AC-4.3.x). OpenAPI validation runs in CI via `pnpm run lint:openapi`.
