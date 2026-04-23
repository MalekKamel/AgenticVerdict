# Tenant requirements — single source of truth (SSOT)

**Status:** Active (authoritative for engineering tenant behavior)  
**Date:** 2026-04-25  
**Audience:** API, worker, frontend, database, observability, security reviewers  
**Assumption:** Greenfield, pre-production. No general obligation to preserve legacy tenant transport shapes, error strings, or undocumented client behavior unless explicitly listed under **Compatibility**.

---

## 1. Authority and precedence

This document is the **canonical checklist** for **tenant-related product and engineering requirements** across AgenticVerdict. When other documents disagree on tenant behavior, **this file wins** until it is updated via an explicit architecture change.

**Narrative and domain depth** remain in:

- `/docs/architecture/business/business-architecture.md` — business model, agency vs direct tenant, isolation expectations
- `/docs/architecture/business/technical-architecture.md` — stack-level tenancy, RLS, middleware patterns
- `/docs/architecture/business/implementation-guide.md` — implementation patterns (may lag code; verify against this SSOT)
- `/docs/architecture/ui/02-system-entities/tenant-tenant.md` — tenant/tenant UX and entity attributes
- `/docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md` — **targeted** plan for public `auth.*` tRPC + browser tenant propagation

---

## 2. Definitions

| Term                            | Meaning                                                                                                                                                                                                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tenant**                      | The customer organization whose data and configuration must be isolated. In persistence and APIs this is typically the tenant **primary key** UUID (`tenantId` / `tenantId` used interchangeably in code—both MUST refer to the same UUID for a given tenant).                                                                 |
| **Tenant context**              | Runtime binding of `tenantId`, loaded **`TenantConfig`**, `requestId`, and optional `userId`, carried via **`AsyncLocalStorage`** (`TenantContext` in `@agenticverdict/core`).                                                                                                                                                 |
| **`TenantConfig`**              | Zod-validated per-tenant configuration (localization, features, AI settings, etc.). **Authoritative schema** lives in `@agenticverdict/config`; storage may be database-backed, file-backed in dev, or hybrid—callers MUST treat the loaded object as the effective config for the active tenant after resolution checks pass. |
| **RLS session**                 | PostgreSQL session state **`app.current_tenant_id`** set for the duration of a transactional unit of work, enabling row-level security policies on tenant-owned tables.                                                                                                                                                        |
| **Authenticated tenant**        | Tenant derived from verified identity (for example JWT/session) and MUST match the tenant of the resources being accessed unless a documented cross-tenant admin capability exists (none assumed in core product paths).                                                                                                       |
| **Public / pre-session tenant** | Tenant selected for **unauthenticated** flows (login, verify email, password reset). May be carried by **headers**, **validated procedure input**, or **host-based slug resolution** per the contracts in §5.2 and the remediation plan.                                                                                       |
| **Transport tenant hint**       | Out-of-band values such as **`x-tenant-id`** used for routing, SSR forwarding, observability, or bootstrap. Never sufficient alone to authorize access to private data without matching session/JWT rules where authentication applies.                                                                                        |

---

## 3. Business-driven requirements

These are **non-negotiable** product expectations derived from the B2B multi-tenant SaaS model (direct businesses and agency partners managing client tenants).

1. **Data isolation** — Customers must only see and mutate their tenant’s data. Accidental cross-tenant reads or writes are **severity: incident**.
2. **Configuration isolation** — Branding, locale, feature flags, AI settings, and quotas are **per tenant** (`TenantConfig` and related stores).
3. **Operational fairness** — Rate limits, quotas, and cost controls are **tenant-scoped** where applicable.
4. **Auditability** — Security-relevant actions MUST be attributable to **tenant + actor + request** where logging is used for compliance (without logging secrets or unnecessary PII).
5. **Agency model** — Where the product allows switching client tenants, UX MUST make the **active tenant** obvious; engineering MUST preserve **one active tenant per request/job** unless a future capability explicitly defines multi-tenant fan-out.

---

## 4. Non-functional requirements (NFRs)

| ID                                       | Requirement                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NFR-T1 Isolation depth**               | Tenant-owned tables MUST use **RLS** (or equivalent enforced guard) in production paths; application code MUST still scope queries deliberately (`dbScoped` + query constraints) so defense stays meaningful if RLS is misconfigured.       |
| **NFR-T2 Propagation**                   | Any async work that touches tenant data MUST run inside **`runWithTenantContext`** (or equivalent scope established by the job runner) so `getTenantContext()` is defined for downstream `dbScoped`, logging, and cache key construction.   |
| **NFR-T3 Explicit failure**              | Missing tenant when one is required MUST fail with a **stable, machine-readable error code** (for example `TENANT_CONTEXT_REQUIRED`, `TENANT_MISMATCH`) suitable for UI and tests—not only free-text messages.                              |
| **NFR-T4 No silent production defaults** | Production MUST NOT rely on hidden hardcoded tenant UUIDs in application code. Development MAY use documented env defaults; misconfiguration SHOULD surface at startup or first request with clear documentation (see remediation Phase C). |
| **NFR-T5 Observability**                 | Structured logs and metrics SHOULD include **tenant id** where useful for support, subject to PII policies.                                                                                                                                 |
| **NFR-T6 Performance**                   | Tenant resolution and `TenantConfig` loading SHOULD be **cached appropriately** per request/job; cache keys MUST be **tenant-prefixed**.                                                                                                    |
| **NFR-T7 Testability**                   | Tenant-sensitive code paths MUST be unit-testable without relying on undeclared module globals except where a **documented bridge** exists and is covered by tests (bridge is **transitional** per §5.2).                                   |

---

## 5. Functional requirements and contracts

### 5.1 Core runtime (`@agenticverdict/core`, `@agenticverdict/database`)

| ID           | MUST / SHOULD / MAY | Statement                                                                                                                                                                                            |
| ------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-ALS-1**  | MUST                | Production database mutations on tenant-owned data that depend on RLS MUST go through **`dbScoped`**, which requires **`getTenantContext()`** and sets `app.current_tenant_id` inside a transaction. |
| **C-ALS-2**  | MUST                | HTTP domain routes that perform tenant work MUST establish **`TenantContext`** before handlers run (Fastify middleware + **`runWithTenantContext`** / route wrapping as implemented in `apps/api`).  |
| **C-ALS-3**  | SHOULD              | Prefer **`runWithTenantContext`** for bounded operations; use `bindTenantContextAsyncContinuation` only where framework integration requires it and behavior is documented.                          |
| **C-RES-1**  | MUST                | **`resolveTenantContextFromHttp`** (and related resolution) MUST validate consistency: resolved tenant UUID MUST match **`TenantConfig.tenantId`**.                                                  |
| **C-RES-2**  | MUST                | Invalid or non-UUID tenant hints in security-sensitive resolution MUST surface as **`TenantSecurityError`** (or equivalent) rather than being coerced.                                               |
| **C-DATA-1** | MUST                | Resource operations MUST verify row **`tenantId`** matches active tenant when loading mutable tenant resources (use **`assertResourceTenantId`** / equivalent patterns).                             |

### 5.2 Transport and public tRPC (`auth.*`, `tenant.*`)

| ID           | MUST / SHOULD / MAY | Statement                                                                                                                                                                                                                                                                                                                                                         |
| ------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-HTTP-1** | MUST                | For **pre-session** tenant-scoped `auth.*` mutations, the API MUST accept tenant identity via **one documented resolver**: optional **`tenantId` in validated input** plus optional **`x-tenant-id`**, with **centralized resolution** (target: `resolvePublicTenantId` per `/docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md`). |
| **C-HTTP-2** | MUST                | If both header and body carry a tenant UUID, they **MUST match** or the server MUST reject with **`TENANT_MISMATCH`**.                                                                                                                                                                                                                                            |
| **C-HTTP-3** | MUST                | If neither source yields a valid UUID where required, the server MUST reject with **`TENANT_CONTEXT_REQUIRED`** (message human-readable; code stable).                                                                                                                                                                                                            |
| **C-HTTP-4** | SHOULD              | Clients SHOULD still send **`x-tenant-id`** when known for SSR, proxies, and consistency with non-auth routers.                                                                                                                                                                                                                                                   |
| **C-HTTP-5** | MAY                 | Host/slug-based tenant discovery MAY complement headers for branding and bootstrap; it does not remove the obligation to align authenticated access with session/JWT tenant.                                                                                                                                                                                      |

**Implementation alignment (see §9):** REST v1 and tRPC today differ in how **`TenantContext`** is installed. **Target:** authenticated tRPC procedures receive **first-class tenant context** (`ctx.tenant` / equivalent) built from the **same resolution rules** as REST, with **`runWithTenantContext`** (or equivalent) applied consistently. **Until then:** each tRPC router MUST document whether it assumes ALS, JWT-only scoping, header+SQL guards, or a combination; **new routers MUST** use the shared authenticated path as soon as it exists, and MUST NOT add new one-off global tenant state.

### 5.3 Workers and background jobs

| ID          | MUST / SHOULD / MAY | Statement                                                                                                                                                                     |
| ----------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-JOB-1** | MUST                | Jobs that process tenant data MUST reconstruct **`TenantContext`** at entry (payload includes tenant id + request correlation) and run work under **`runWithTenantContext`**. |
| **C-JOB-2** | SHOULD              | Queue payloads SHOULD carry enough information to load **`TenantConfig`** without ambiguous defaults.                                                                         |

### 5.4 Frontend (`apps/frontend`)

| ID         | MUST / SHOULD / MAY | Statement                                                                                                                                                                                                          |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **C-FE-1** | MUST                | The effective tenant id used for authenticated UX MUST be derived from a **single documented resolver** (`TenantProvider` / `getEffectiveTenantId` and related utilities).                                         |
| **C-FE-2** | MUST                | Pre-session mutations MUST pass **`tenantId` in procedure input** whenever the route or UX knows it (verify email, resend, password reset, login if extended)—not rely on **`httpBatchLink` headers alone**.       |
| **C-FE-3** | SHOULD              | SSR session probes MUST forward **`x-tenant-id`** when the incoming request provides it, or use a **documented server default** consistent with §5.2.                                                              |
| **C-FE-4** | MAY                 | A module bridge from React to tRPC headers MAY exist only as a **temporary** measure; it MUST be covered by tests and scheduled for removal once **C-HTTP-1** and **C-FE-2** are satisfied for all affected flows. |

### 5.5 Connectors and integrations

| ID           | MUST / SHOULD / MAY | Statement                                                                                                                                      |
| ------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-CONN-1** | MUST                | Connector construction MUST fail closed if **`tenantId`** is missing (`ConnectorError` / `missing_tenant_id` pattern in implementation guide). |

---

## 6. Threat model notes (minimum bar)

1. **Header spoofing** — Untrusted clients can always send arbitrary **`x-tenant-id`**. **MUST NOT** trust header alone for authorization; authenticated flows MUST bind to JWT/session tenant and SQL guards.
2. **Enumeration** — Public auth responses MUST avoid leaking whether an email exists in another tenant where product policy requires non-enumerating behavior (see security notes in remediation plan).
3. **Mismatch attacks** — **C-HTTP-2** prevents divergent header/body tenant selection in proxies and malicious clients.

---

## 7. Traceability matrix

| SSOT section     | Primary references                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| §3 Business      | `docs/architecture/business/business-architecture.md` (multi-tenancy, isolation)                                                    |
| §5.1 ALS / DB    | `packages/core/src/tenant-context.ts`, `packages/database/src/db-scoped.ts`, `docs/architecture/business/technical-architecture.md` |
| §5.2 Public tRPC | `docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md`, `apps/api/src/trpc/routers/auth.ts`             |
| §5.3 Workers     | `packages/agent-runtime`, `apps/worker` queue patterns                                                                              |
| §5.4 Frontend    | `apps/frontend/src/providers/TenantProvider.tsx`, `apps/frontend/src/lib/api/trpc-client.ts`, `apps/frontend/src/lib/tenant/*`      |
| Entity UX        | `docs/architecture/ui/02-system-entities/tenant-tenant.md`                                                                          |
| Research         | `docs/architecture/business/research/multi-tenant-saas-business-models.md`                                                          |

---

## 8. Reconciliations and known documentation drift

| Topic                                                       | Resolution                                                                                                                                                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`TenantConfig` storage**                                  | SSOT: logical model is **per-tenant `TenantConfig`**; physical storage is an implementation detail. Docs showing JSON files vs database are **alternate deployment modes**; code MUST enforce **`tenantId` consistency** after load. |
| **“All tRPC procedures use middleware”** vs public `auth.*` | SSOT: **aspiration** is uniform middleware; **current** public auth requires explicit resolver per §5.2 until middleware and context types converge.                                                                                 |

---

## 9. Architectural decisions (resolved)

The following were triaged as open questions in the first SSOT revision; **decisions below are normative** for greenfield implementation unless changed by an explicit architecture amendment.

### Q-1 — tRPC first-class `ctx.tenant` vs router-explicit?

| Field        | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**    | Platform API                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Decision** | **Converge:** tRPC MUST expose **first-class tenant context** for **authenticated** procedures (for example `ctx.tenant` carrying `tenantId`, loaded `TenantConfig`, and `requestId`), resolved with the **same logical rules** as REST (JWT/session primary, consistency checks, ALS binding where the stack uses ALS). **Transition:** router-specific tenant logic is **temporary debt only**—new work MUST use shared helpers and the unified context shape; existing routers SHOULD be migrated rather than extended ad hoc. |

### Q-2 — Non-`dbScoped` reads: which routers, under what guarantees?

| Field        | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**    | Database + API                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Decision** | **Default deny:** any access to **tenant-owned** or **PII-bearing** data MUST use **`dbScoped`** (or an equivalent documented mechanism that still sets **`app.current_tenant_id`** for the statement). **Allowlist exceptions** are permitted only when **all** hold: (1) the query is **read-only**; (2) the surface is **public by design** (for example slug → tenant id / branding metadata); (3) columns exposed are **minimal** and **non-sensitive**; (4) **RLS or an audited alternative** explicitly permits the access path without a prior `SET LOCAL`, or the table is **not** tenant-owned; (5) the exception is **listed next to the router** in code or router-level README and reviewed with Security. Anything returning **user rows, credentials, or tenant business data** is **never** an exception. |

### Q-3 — JWT-only tenant for public procedures?

| Field        | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**    | Security + API                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Decision** | **Hybrid, not JWT-only for public:** **Pre-session** procedures **cannot** rely on JWT for tenant (no session yet). They MUST keep the **normalized dual channel** in §5.2 (**validated `tenantId` in input** plus optional **`x-tenant-id`**, single server resolver, **mismatch rejected**). For **authenticated** procedures, **primary tenant** MUST come from **signed session/JWT**; optional header/body hints MUST **match** when present and MUST **never** override or “upgrade” the authenticated tenant. |

### Q-4 — Desktop / Electron: single vs dual tenant channel?

| Field        | Value                                                                                                                                                                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**    | Desktop workstream (`docs/architecture/desktop/`)                                                                                                                                                                                                                                        |
| **Decision** | **Same contract as web:** **`tenantId` in procedure input** is **primary** wherever the desktop UX or runtime knows it; **`x-tenant-id`** remains **secondary** for parity with proxies, observability, and shared API middleware. Desktop MUST NOT introduce a third canonical channel. |

---

## 10. Out of scope

- Per-connector vendor API details beyond tenant id requirement.
- Billing and invoice data models (must still be tenant-scoped when implemented).
- Cross-region replication and data residency (record as future NFR when defined).
- **JWT-only tenant selection for public (pre-session) procedures** — **not** a target architecture (see §9 Q-3); remediation’s optional long-term JWT emphasis applies only to **authenticated** paths where a session already exists.

---

## 11. Compliance checklist (for PRs touching tenant behavior)

- [ ] Tenant source documented (ALS, header, input, JWT) for new endpoints.
- [ ] `dbScoped` used for tenant mutations relying on RLS.
- [ ] Tests cover **happy path**, **missing tenant**, and **mismatch** where multiple sources exist.
- [ ] Logs and errors use **stable codes** (`TENANT_CONTEXT_REQUIRED`, `TENANT_MISMATCH`, domain-specific codes).
- [ ] No new silent hardcoded production tenant UUIDs.
- [ ] Frontend mutations pass **`tenantId`** in input for pre-session flows per remediation Phase B once API supports it.

---

## 12. Revision history

| Date       | Change                                                                                                                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-25 | Initial SSOT authored from remediation plan, business/technical architecture docs, UI tenant entity spec, and codebase survey (REST vs tRPC tenant wiring).                                                                                 |
| 2026-04-25 | §9 promoted from open questions to **resolved architectural decisions** (Q-1–Q-4); §5.2 implementation note aligned; §8 restored `apps/frontend` path reconciliation row; §10 bullet aligned with §9 Q-3 (no JWT-only public tenant track). |
