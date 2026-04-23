# Changelog: Tenant requirements — Phase 7 (observability, rate limits, documentation)

**Date:** 2026-04-25  
**Scope:** Execution of **Phase 7 — Observability, rate limits, documentation** from [`docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md), after **Phases 1–2** ([`2026-04-25-tenant-requirements-phase-1-2-implementation.md`](2026-04-25-tenant-requirements-phase-1-2-implementation.md)), **Phases 3–4** ([`2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md`](2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md)), and **Phases 5–6** ([`2026-04-25-tenant-requirements-phase-5-6-frontend-propagate-and-worker-als.md`](2026-04-25-tenant-requirements-phase-5-6-frontend-propagate-and-worker-als.md)). Delivers **NFR-T5**-aligned **structured access logs** with an explicit `tenantId` on `http_access` when derivable (JWT `request.auth` → `request.tenantContext` → validated `x-tenant-id`), **tRPC** warn-level `trpc_tenant_security` events for failed procedures whose `cause` is a `TenantSecurityError` (stable `code` in log + existing response `tenantSecurityCode`), **per-tenant rate-limit keys** that include the same resolution so unauthenticated clients with a valid `x-tenant-id` are not all counted as a single `anonymous` bucket (**§3.3** operational fairness), **connector registry** fail-closed when `resolve` context includes a `tenantId` key with an empty/whitespace value (**C-CONN-1** / W13), and **documentation** updates: **implementation guide** cross-links to the tenant SSOT and implementation plan with PR checklist **§11** and observability notes; **tRPC README** Phase 7; **data-connectors README** registry contract. Same resolution helper is shared by access logging and rate limiting to avoid drift.

**Verification run:** `pnpm --filter @agenticverdict/api exec tsc --noEmit`, `pnpm --filter @agenticverdict/api exec vitest run`, `pnpm --filter @agenticverdict/data-connectors exec vitest run src/registry.test.ts`

---

## Summary

### Observability (NFR-T5, plan §3.4)

- **[`getHttpAccessLogTenantId`](../apps/api/src/middleware/request-logging.ts)** — Single source for “which tenant id to attribute to this HTTP request” for support-oriented logs, without PII: prefer session-bound `request.auth.tenantId`, else resolved `request.tenantContext.tenantId`, else a v4-UUID–validated `x-tenant-id` header (pre-session tRPC and proxies).
- **`http_access`** — Pino `info` payload now includes `tenantId` when the helper returns a value. This complements (does not replace) the existing `@agenticverdict/observability` `createPinoLogger` **mixin** that injects `tenantId` from `getTenantContext()` for lines emitted **inside** `runWithTenantContext` (where ALS is active; `onResponse` may run outside that scope, so explicit request fields are important for log queries).
- **tRPC `errorFormatter`** — When `error.cause` is a `TenantSecurityError`, `ctx.req.log.warn` records `trpc_tenant_security` with `code`, `trpcPath`, `requestId`, and the same `tenantId` resolution as access logs. Response shape is unchanged (still includes `data.tenantSecurityCode` for clients).

### Rate limits (SSOT §3.3, plan Phase 7)

- **[`rateLimit`](../apps/api/src/middleware/rate-limit.ts)** — The Redis/in-memory key suffix for `perTenant !== false` is now `getHttpAccessLogTenantId(request) ?? "anonymous"`, so tenant-hinted unauthenticated traffic is throttled per tenant, not in one global anonymous pool.

### Connectors (W13, C-CONN-1)

- **[`createAdapterRegistry`](../packages/data-connectors/src/registry.ts)** `resolve` — If `context` is an object that **declares** `tenantId`, the value must be a non-empty string; otherwise `PlatformError` with `missing_tenant_id`. Contexts that omit `tenantId` are unchanged (factories may still require tenant via `BaseConnectorAdapter`).

### Documentation

- **[`implementation-guide.md`](../docs/architecture/business/implementation-guide.md)** — New paragraph under the tenant context pattern: SSOT + plan links, NFR-T5/mixin + `http_access` note, §11 PR checklist pointer.
- **[`apps/api/src/trpc/README.md`](../apps/api/src/trpc/README.md)** — Phase 7: logs, Pino mixin, rate keys, PR checklist, connector note.
- **[`packages/data-connectors/README.md`](../packages/data-connectors/README.md)** — Registry `tenantId` validation and SSOT link.

**Exit criteria (plan):** “PR checklist §11 routinely satisfied on tenant PRs” is supported by documenting §11 in the implementation guide and tRPC README, not by automation in this change.

---

## Added

| Location                                                                                                | What                                                                               |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`apps/api/src/middleware/request-logging.ts`](../apps/api/src/middleware/request-logging.ts)           | `TENANT_UUID_RE`, `getHttpAccessLogTenantId`, `tenantId` on `http_access` when set |
| [`apps/api/src/middleware/request-logging.test.ts`](../apps/api/src/middleware/request-logging.test.ts) | Unit tests for resolution precedence and invalid header                            |

### `apps/api/src/trpc`

| File                                      | What                                                              |
| ----------------------------------------- | ----------------------------------------------------------------- |
| [`init.ts`](../apps/api/src/trpc/init.ts) | `trpc_tenant_security` warn logs for `TenantSecurityError` causes |

### `apps/api/src/trpc/README.md`

| Section     | What                                                                 |
| ----------- | -------------------------------------------------------------------- |
| **Phase 7** | NFR-T5, mixin note, rate-limit keys, §11 checklist, C-CONN-1 pointer |

### `docs/architecture/business/implementation-guide.md`

| Subsection                            | What                                 |
| ------------------------------------- | ------------------------------------ |
| After **§3.2 Tenant Context Pattern** | SSOT, plan, NFR-T5, §11 PR checklist |

### `packages/data-connectors`

| File                                                                       | What                                   |
| -------------------------------------------------------------------------- | -------------------------------------- |
| [`src/registry.test.ts`](../packages/data-connectors/src/registry.test.ts) | “empty tenantId when key present” case |

---

## Changed

| Location                                                                                                      | What                                                                                        |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`apps/api/src/middleware/rate-limit.ts`](../apps/api/src/middleware/rate-limit.ts)                           | Per-tenant key via `getHttpAccessLogTenantId` (and `perTenant: false` → `global` unchanged) |
| [`packages/data-connectors/src/registry.ts`](../packages/data-connectors/src/registry.ts)                     | `resolve` validation for non-empty `tenantId` when key is present                           |
| [`packages/data-connectors/README.md`](../packages/data-connectors/README.md)                                 | Registry + SSOT C-CONN-1                                                                    |
| [`docs/architecture/business/implementation-guide.md`](../docs/architecture/business/implementation-guide.md) | Normative tenant / observability / PR pointers                                              |

---

## Plan mapping (Phase 7)

| Plan action                                                         | Delivered                                                                                                                                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tenant id on structured logs for auth + tRPC + worker (policy-safe) | `http_access` + `trpc_tenant_security`; worker unchanged — existing Pino `mixin` + Phase 5–6 ALS already cover job-scoped `tenantId` in [`packages/observability/src/logger.ts`](../packages/observability/src/logger.ts) |
| Rate limits keyed by tenant where applicable                        | REST `rateLimit` uses same tenant resolution as access logs; auth router in-memory rate maps already keyed by `tenantId`+email in prior phases                                                                            |
| Update implementation guide and router READMEs to point at SSOT     | Implementation guide + tRPC README + data-connectors README                                                                                                                                                               |
| W13 (connector registry)                                            | `resolve` guard + test + package README                                                                                                                                                                                   |
| PR checklist §11                                                    | Cited in implementation guide and tRPC README                                                                                                                                                                             |

---

## Deferred / follow-ups

- **Auth router** in-procedure in-memory rate trackers (`verify` / resend) — already per `(tenantId, email)`; no change required for Phase 7.
- **Prometheus** app-wide counters with `tenant` labels for every tRPC call — not added (NFR-T5 is satisfied by logs + existing production-flow test metrics with `tenant_id` where used); add only if SRE needs cardinality-controlled series.
- **E2E** — Optional assertion that `http_access` (or log drain) includes `tenantId` on a known tRPC + header scenario; omitted here.

---

## References

- [`docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md)
- [`docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`](../docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md) — NFR-T5, §3 business, §11 PR checklist, C-CONN-1
- [`docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md`](../docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md)
- [`changelog/2026-04-25-tenant-requirements-phase-1-2-implementation.md`](2026-04-25-tenant-requirements-phase-1-2-implementation.md)
- [`changelog/2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md`](2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md)
- [`changelog/2026-04-25-tenant-requirements-phase-5-6-frontend-propagate-and-worker-als.md`](2026-04-25-tenant-requirements-phase-5-6-frontend-propagate-and-worker-als.md)
- [`changelog/2026-04-17-web-tanstack-post-review-p1-p2-implementation.md`](2026-04-17-web-tanstack-post-review-p1-p2-implementation.md) — changelog style reference
