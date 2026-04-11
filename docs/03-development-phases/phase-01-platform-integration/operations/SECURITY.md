# Security — Phase 01 platform integration

Centralized security model for `@agenticverdict/data-connectors`, vendor HTTP clients, and how they fit with tenancy and operations. Use this with [AUTHENTICATION-GUIDES.md](./AUTHENTICATION-GUIDES.md), [ARCHITECTURE-AND-DATA-FLOW.md](./ARCHITECTURE-AND-DATA-FLOW.md), and [DISASTER-RECOVERY.md](./DISASTER-RECOVERY.md).

---

## Overview

Phase 01 moves marketing metrics over HTTPS from vendor APIs into normalized snapshots. Security goals:

- **Confidentiality:** OAuth tokens, refresh tokens, and API secrets never appear in logs or cross-tenant caches.
- **Integrity:** Only intended tenants receive decrypted credentials and cached adapter results.
- **Availability:** Circuit breakers, rate limits, and health checks support graceful degradation without bypassing controls.

Defense in depth spans **transport**, **application context**, **database RLS**, and **operational secret management** (outside this package).

---

## Threat model (high-level)

| Threat                                   | Mitigation direction                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stolen or leaked OAuth tokens / API keys | Store only in secret managers or encrypted DB fields at the service boundary; rotate on compromise; short-lived access tokens where vendors allow.     |
| Cross-tenant data access                 | `tenantId` in adapter options for cache keys; `runWithTenantContext` + `dbScoped` for DB reads/writes; RLS on tenant-owned tables.                     |
| MITM or downgrade on vendor calls        | HTTPS only (`fetch` to `https://` endpoints); rely on Node TLS stack (TLS 1.2+). Validate production edge terminates TLS 1.3 where required by policy. |
| Log exfiltration of secrets or PII       | Structured logs without credential maps; redact tokens and verbose payloads in observability pipelines.                                                |
| Abuse of public health endpoints         | Health routes expose infrastructure status only; do not return tenant credentials or vendor payloads.                                                  |

This is not a formal STRIDE write-up; expand in a dedicated security review before production.

---

## Multi-tenancy and tenant isolation

**AsyncLocalStorage:** Request- and job-scoped tenant context is held in Node `AsyncLocalStorage` via `@agenticverdict/core` (`runWithTenantContext`, `getTenantContext`, `requireTenantContext`). Middleware and workers must set context before any tenant-aware DB or business logic.

**RLS:** PostgreSQL policies use `current_setting('app.current_tenant_id', true)::uuid` (see `packages/database/migrations/`). Tables that hold tenant data must remain under RLS as the schema grows.

**dbScoped:** All tenant-scoped database work should run inside `dbScoped` from `@agenticverdict/database`, which opens a transaction and sets `app.current_tenant_id` to match the active tenant context. Missing context throws; this blocks accidental unscoped access.

**Platform adapters:** When using the shared cache, always pass a real `tenantId` in `BaseConnectorAdapterOptions` so cache keys cannot collide across tenants (see architecture doc).

**References:** `packages/core/src/tenant-context.ts`, `packages/database/src/db-scoped.ts`, `packages/database/migrations/0000_initial_schema.sql`, `packages/database/test/rls.integration.test.ts`, [multi-tenancy-architecture.md](../../phase-00-foundation/multi-tenancy-architecture.md).

---

## Credentials and token handling

**OAuth and refresh:** Vendor-specific OAuth helpers live under `packages/data-connectors/src` (for example `meta/oauth.ts`, `google/oauth.ts`, `ga4/oauth.ts`, `tiktok/oauth.ts`). Implementations exchange authorization codes and refresh tokens per vendor docs; treat refresh tokens as highly sensitive.

**Never log secrets:** Do not log credential objects, query strings containing secrets, or full `Authorization` headers. Adapter code should assume upstream decryption already occurred and plaintext is only in memory for the request.

**At-rest storage:** Encrypted credential persistence is a service concern (`@agenticverdict/database` and application layers). **Verify in deployment** that production uses a secret manager or equivalent encryption for tokens and client secrets (AC-5.1.2, AC-5.1.4).

**Operational rotation:** Follow [DISASTER-RECOVERY.md](./DISASTER-RECOVERY.md) for credential rotation and cache invalidation after incidents.

---

## Transport

- **Vendor APIs:** All adapter traffic uses HTTPS URLs; Node’s TLS negotiates with the remote endpoint (typically TLS 1.2 or higher depending on the vendor).
- **Minimum expectation:** Document and verify **TLS 1.2+** for outbound connections as the baseline acceptance bar (maps to AC-5.2.1 “encrypted in transit”).
- **Production edge:** Termination at CDN/load balancer often supports **TLS 1.3** for browser and API clients. **Verify in deployment** (scan configs, SSL Labs, or cloud policy) that edge and internal mesh meet organizational TLS policy.

---

## Logging and PII

- Prefer **structured logs** (stable field names, correlation IDs) without embedding credential maps or raw vendor error bodies that might contain tokens.
- **Mask or omit** access tokens, refresh tokens, and `client_secret` anywhere logs are emitted; apply the same rules in APM and log pipelines.
- Normalized payloads and GBP-style content may include **PII**; default to conservative log levels in production and redact at the observability layer.

Project-wide constraint: no sensitive data in logs (see repository `CLAUDE.md`).

---

## Access control

- **Tenant-scoped resolution:** Resolve companies and credentials only after establishing tenant context (header, JWT, subdomain strategy per [multi-tenancy-architecture.md](../../phase-00-foundation/multi-tenancy-architecture.md)). Adapter calls should receive credentials from that path, not from ambient globals.
- **Least privilege:** Vendor OAuth scopes and service accounts should be minimal for the metrics required in Phase 01.
- **Public surfaces:** `apps/web` health routes report infrastructure health only; they must not become a channel for tenant data without authentication and authorization layers added in later phases or **verify in deployment** for any staging exposure.

---

## Audit logging

**Current state:** There is no dedicated `audit_log` table or unified audit emitter in this monorepo wired to every adapter call at the time of this document.

**Target posture (reference):** Per-tenant audit trails for credential access, configuration changes, and exports are described in technology research ([security-auth.md](../../../../04-technology-research/security/security-auth.md) — audit logging themes). When implemented, prefer append-only store, tenant id on every row, and retention aligned with compliance needs.

**Action:** Treat AC-5.2.4 as **planned / verify in deployment** until schema and middleware are added and reviewed.

---

## Operational checklist

- [ ] Tenant context set on every request and background job that touches tenant data or adapters with cache enabled.
- [ ] Secrets only from environment / secret manager / encrypted store; never committed to git.
- [ ] OAuth apps registered with correct redirect URIs and minimal scopes per vendor.
- [ ] TLS policy validated for production ingress and outbound egress where regulated.
- [ ] Log and APM sampling reviewed for accidental capture of headers or bodies.
- [ ] RLS migrations applied; integration tests for cross-tenant denial run in CI where Postgres is available.
- [ ] Incident playbooks ([INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md)) include token revocation and credential rotation.

---

## Verification matrix (AC-5.x)

Maps [acceptance-criteria.md](../acceptance-criteria.md) Section 5 items to repository locations or explicit follow-up. “Verify in deployment” means organizational or environment-specific evidence not fully encoded in this repo.

| ID           | Criterion (short)             | Evidence in repo / next step                                                                                                                                                                                                                                                    |
| ------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AC-5.1.1** | OAuth 2.0 flows               | `packages/data-connectors/src/meta/oauth.ts`, `google/oauth.ts`, `ga4/oauth.ts`, `tiktok/oauth.ts`; [AUTHENTICATION-GUIDES.md](./AUTHENTICATION-GUIDES.md)                                                                                                                      |
| **AC-5.1.2** | Tokens stored securely        | **Verify in deployment** (encryption at rest, secret manager). Design direction: `CLAUDE.md`, [ARCHITECTURE-AND-DATA-FLOW.md](./ARCHITECTURE-AND-DATA-FLOW.md) (“Future `@agenticverdict/database`”)                                                                            |
| **AC-5.1.3** | Token refresh                 | Refresh paths in `tiktok/oauth.ts`, Meta/Google GA4 modules; tests e.g. `tiktok/oauth.test.ts`, `meta/oauth.test.ts`, `ga4/oauth.test.ts`                                                                                                                                       |
| **AC-5.1.4** | API credentials secured       | **Verify in deployment** (secret injection, KMS). Code assumes decrypted strings only at boundary; see [DISASTER-RECOVERY.md](./DISASTER-RECOVERY.md)                                                                                                                           |
| **AC-5.2.1** | Data encrypted in transit     | HTTPS vendor URLs across adapters; Node TLS. **Verify in deployment** for TLS 1.3 at edge and any legacy endpoints                                                                                                                                                              |
| **AC-5.2.2** | Sensitive data masked in logs | Policy: `CLAUDE.md`; adapter guidance: [ARCHITECTURE-AND-DATA-FLOW.md](./ARCHITECTURE-AND-DATA-FLOW.md). **Verify in deployment** with log/APM sampling review                                                                                                                  |
| **AC-5.2.3** | Access controls               | `packages/core/src/tenant-context.ts`, `packages/database/src/db-scoped.ts`, `packages/database/migrations/0000_initial_schema.sql`, `packages/database/test/rls.integration.test.ts`; [multi-tenancy-architecture.md](../../phase-00-foundation/multi-tenancy-architecture.md) |
| **AC-5.2.4** | Audit logging                 | **Verify in deployment** / planned schema per technology research; not yet implemented as end-to-end audit stream in repo                                                                                                                                                       |

---

## Related documents

- [AUTHENTICATION-GUIDES.md](./AUTHENTICATION-GUIDES.md)
- [ARCHITECTURE-AND-DATA-FLOW.md](./ARCHITECTURE-AND-DATA-FLOW.md)
- [ERROR-CODES.md](./ERROR-CODES.md)
- [DISASTER-RECOVERY.md](./DISASTER-RECOVERY.md)
- [acceptance-criteria.md](../acceptance-criteria.md) — Section 5
