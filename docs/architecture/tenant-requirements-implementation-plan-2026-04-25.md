# Tenant requirements — project-wide implementation plan

**Status:** Active execution plan  
**Date:** 2026-04-25  
**Normative requirements:** `/docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md` (SSOT)  
**Targeted UI/API remediation (detail):** `/docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md`  
**Assumption:** Greenfield, pre-production — no general backward-compatibility obligation for undocumented transport or error strings (per SSOT).

---

## 1. Executive summary

The SSOT defines **one logical tenant model** (ALS `TenantContext`, `TenantConfig` consistency, RLS via `dbScoped`, stable security codes, hybrid public transport, first-class authenticated tRPC tenant context). The codebase **partially** implements this: **core** resolution and `dbScoped` exist; **REST** paths use JWT-bound tenant resolution; **tRPC** is **not** wired through the same ALS + resolution stack as REST; **public `auth.*`** uses ad-hoc header reads and asymmetric procedure contracts; the **frontend** relies on **`x-tenant-id`** and a **module bridge** for most pre-session flows instead of uniform **`tenantId` in procedure input**; **workers** establish tenant ALS **only** for the agent-job marketing pipeline, not uniformly at every job entry.

**Recommended dependency order:** (1) **shared resolution + error codes** in `@agenticverdict/core` and API error mapping; (2) **`resolvePublicTenantId`** (or equivalent) + **procedure input schemas** for all pre-session auth mutations; (3) **tRPC context + middleware** so authenticated procedures get **`ctx.tenant`** and ALS where required; (4) **migrate auth/admin/tenant routers** to `dbScoped` / documented read exceptions per §9 Q-2; (5) **frontend** body + header alignment and **bridge removal** criteria; (6) **worker** entry wrappers + payload contracts; (7) **observability and test** hardening.

---

## 2. Gap analysis (current state vs SSOT)

### 2.1 Core (`@agenticverdict/core`)

| SSOT                     | Current                                                                                                                                           | Gap                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-RES-1**, **C-RES-2** | `resolveTenantContextFromHttp` loads config and can emit `TenantSecurityError` with codes including `TENANT_MISMATCH` vs `TenantConfig.tenantId`. | `resolveTenantIdentity` can **prefer header UUID and skip JWT**, so **header vs JWT cross-check** when both exist is **not** implemented as SSOT §6 / §9 Q-3 imply for authenticated paths. |
| **NFR-T3**               | `TenantSecurityCode` includes `MISSING_TENANT`, `INVALID_TENANT_ID`, `TENANT_MISMATCH`, etc.                                                      | **`TENANT_CONTEXT_REQUIRED`** is **not** a defined code; `requireTenantContext` / `dbScoped` throw **generic `Error`** strings, not machine-readable SSOT codes.                            |

**Primary paths:** `packages/core/src/tenant-context.ts`, `tenant-request-context.ts`, `tenant-resolution.ts`, `tenant-security-error.ts`.

### 2.2 Database (`@agenticverdict/database`)

| SSOT                    | Current                                                                                                     | Gap                                                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-ALS-1**, **NFR-T1** | `dbScoped` sets `app.current_tenant_id` via transaction-local `set_config` and requires ALS tenant context. | **Satisfied at helper level**; gap is **callers** (especially tRPC) not running inside `runWithTenantContext` / not using `dbScoped` for tenant mutations. |

**Primary paths:** `packages/database/src/db-scoped.ts`, `packages/database/test/db-scoped.unit.test.ts`.

### 2.3 API — REST vs tRPC

| SSOT                       | Current                                                                                                                                              | Gap                                                                                                                                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-ALS-2**                | REST protected routes use JWT tenant middleware and route wrapping when `request.tenantContext` is set.                                              | **tRPC** `createTrpcContext` returns **`{ req, res }` only**; Fastify tenant ALS pipeline is **not** applied uniformly to tRPC the same way as REST.                                                                                                                                            |
| **§9 Q-1**                 | N/A                                                                                                                                                  | **`authedProcedure`** exposes **`ctx.auth`** (`tenantId`, etc.) but **no `ctx.tenant`** (`TenantContext` + loaded `TenantConfig` + unified resolution with REST).                                                                                                                               |
| **C-HTTP-1–3**, **§9 Q-3** | `auth.register` allows `input.tenantId ?? header`; other public procedures are **header-only**; `readTenantIdFromRequest` is **local** to `auth.ts`. | **No centralized `resolvePublicTenantId`**; **no `TENANT_MISMATCH`** when both body and header differ on register (**input can override header silently**); public procedures use **`TRPCError`** + free text (e.g. `Missing x-tenant-id`) instead of **`TenantSecurityError`** / stable codes. |
| **§9 Q-2**                 | Some domain code uses `dbScoped` patterns elsewhere.                                                                                                 | **`auth` router** uses **raw `requireTrpcDatabase()`** client — **not `dbScoped`** for tenant-owned mutations/queries that should be RLS-scoped. **`admin`**, **`tenant`** routers similarly need audit vs SSOT default-deny.                                                                   |

**Primary paths:** `apps/api/src/server.ts`, `apps/api/src/middleware/jwt-tenant-context.ts`, `apps/api/src/middleware/tenant-route-als.ts`, `apps/api/src/trpc/context.ts`, `register-fastify.ts`, `procedures.ts`, `apps/api/src/trpc/routers/auth.ts`, `tenant.ts`, `admin.ts`.

**Router inventory (tRPC):** `auth`, `tenant`, `admin` — small surface, migration is tractable.

### 2.4 Workers

| SSOT                    | Current                                                                     | Gap                                                                                                                                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-JOB-1**, **NFR-T2** | `runAgentJob` uses `runWithTenantContext` for the marketing/agent pipeline. | **BullMQ processors** (`report-queues.ts` and related) are **not** uniformly wrapped at entry; non-pipeline branches (`foundationWorkflowResult`, production-flow scenarios) **may lack** ALS; **`createTestTenantContext`** used in production-shaped paths is a **naming / clarity** debt. |

**Primary paths:** `apps/worker/src/cli.ts`, `apps/worker/src/queues/report-queues.ts`, `packages/agent-runtime/src/agent-job.ts`, `apps/worker/src/connector-factory.ts`.

### 2.5 Frontend

| SSOT                   | Current                                                                                           | Gap                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-FE-1**             | `getEffectiveTenantId` in `tenant-resolution.ts` is documented as client SSOT for logical tenant. | **Outbound tRPC tenant** uses **`getTenantIdForTrpcRequest`** + **`trpc-tenant-bridge`** (module global) + **DEV hardcoded UUID** — **dual source of truth** vs pure `getEffectiveTenantId`.               |
| **C-FE-2**             | Register schema allows optional `tenantId`.                                                       | **Forms/mutations** do **not** pass **`tenantId` in JSON** for register, login, verify, resend, password reset — **header-dependent**; verify-email uses **query param → auth store** to populate headers. |
| **C-FE-3**             | `fetchProtectedRouteSession` forwards `x-tenant-id` if present.                                   | **No synthesis** of tenant when the incoming request has no header (SSR bootstrap gap per remediation doc).                                                                                                |
| **C-FE-4**, **NFR-T7** | `resetTenantBridgeForTests` exists.                                                               | **No dedicated tests** for bridge ordering, provider-published tenant vs env-only, or removal readiness.                                                                                                   |

**Primary paths:** `apps/frontend/src/providers/TenantProvider.tsx`, `apps/frontend/src/lib/tenant/trpc-tenant-bridge.ts`, `apps/frontend/src/lib/tenant/tenant-resolution.ts`, `apps/frontend/src/lib/api/trpc-client.ts`, `apps/frontend/src/lib/auth/protected-route-session.ts`, auth hooks/forms under `apps/frontend/src/hooks/` and `components/auth/`.

### 2.6 Connectors

| SSOT         | Current                                                                                  | Gap                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-CONN-1** | `BaseConnectorAdapter` throws `PlatformError` / `missing_tenant_id` if `tenantId` empty. | **Met** for adapters constructed through the base class; **`registry.resolve`** does not itself validate `tenantId`\*\* — document / lint rule so future factories cannot bypass. |

**Primary paths:** `packages/data-connectors/src/adapter.ts`, `adapter-factory.ts`, `registry.ts`.

### 2.7 Observability

| SSOT       | Current                                   | Gap                                                                                                                                                     |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NFR-T5** | Partial structured logging exists in API. | **Systematic** tenant id on security-relevant logs/metrics for tRPC + worker paths should be verified and extended where missing (without PII leakage). |

---

## 3. Phased roadmap

Each phase lists **exit criteria** and **SSOT mapping**.

### Phase 0 — Planning lock and traceability (complete)

- **Deliverable:** SSOT + this plan + remediation plan for public auth detail.
- **Exit:** Stakeholders agree SSOT §9 decisions are normative.
- **SSOT:** §1, §9.

### Phase 1 — Core contracts and error vocabulary

**Goal:** One vocabulary for missing tenant, mismatch, and invalid hints across REST and tRPC.

| Action                                                                                                           | SSOT            |
| ---------------------------------------------------------------------------------------------------------------- | --------------- |
| Add **`TENANT_CONTEXT_REQUIRED`** (and map from `MISSING_TENANT` where appropriate, or alias in HTTP layer)      | **NFR-T3**      |
| Align `requireTenantContext` / `dbScoped` failure with **`TenantSecurityError`** or a documented API wrapper     | **NFR-T3**      |
| Implement **header vs JWT tenant disagreement** policy in `resolveTenantIdentity` (or HTTP layer) per **§9 Q-3** | **C-RES-2**, §6 |

**Exit criteria:** Unit tests for new branches; REST and tRPC error JSON expose **stable `code`** fields acceptable to frontend and E2E.

### Phase 2 — Public auth transport (API + types)

**Goal:** Remove header-only asymmetry; single server resolver.

| Action                                                                                                                                              | SSOT                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Extend Zod/input types so **login, verifyEmail, resend, requestPasswordReset, (confirmPasswordReset as applicable)** accept optional **`tenantId`** | **C-HTTP-1**, remediation Phase A |
| Implement **`resolvePublicTenantId({ req, input })`** (name as in remediation; colocate under `apps/api/src/trpc/` or shared API tenant module)     | **C-HTTP-1**                      |
| Enforce **both present → must match** → **`TENANT_MISMATCH`**                                                                                       | **C-HTTP-2**                      |
| Enforce **neither valid → `TENANT_CONTEXT_REQUIRED`**                                                                                               | **C-HTTP-3**                      |
| Replace **`TRPCError` “Missing x-tenant-id”** with stable codes                                                                                     | **NFR-T3**                        |
| Register: **stop silent override** of header by body or vice versa — enforce match                                                                  | **C-HTTP-2**                      |

**Exit criteria:** API contract tests for happy, missing, mismatch; types published from `@agenticverdict/types` updated.

### Phase 3 — tRPC authenticated context and ALS

**Goal:** Same logical tenant as REST for authenticated procedures.

| Action                                                                                                          | SSOT                             |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Run tRPC through Fastify **preHandlers** / wrapper equivalent to REST tenant + JWT resolution                   | **C-ALS-2**, §5.2 alignment note |
| Extend **`TrpcContext`** with **`tenant` / `ctx.tenant`** (`TenantContext` + `TenantConfig`)                    | **§9 Q-1**                       |
| Implement **`authedProcedure`** to require **`ctx.tenant`** consistent with session JWT                         | **§9 Q-1**, **§9 Q-3**           |
| Document each router’s tenant assumptions until migration complete (only **auth**, **tenant**, **admin** today) | §5.2 “until then”                |

**Exit criteria:** `getTenantContext()` defined inside authenticated tRPC handlers; no new routers without shared path.

### Phase 4 — Database access from tRPC (default deny)

**Goal:** Tenant-owned / PII paths use `dbScoped` or allowlisted exceptions.

| Action                                                                                                           | SSOT                    |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Migrate **`auth`** mutations/queries that touch tenant-owned tables to **`runWithTenantContext` + `dbScoped`**   | **C-ALS-1**, **§9 Q-2** |
| Audit **`admin`**, **`tenant`** routers; add **router-level README** rows for any **read-only public** exception | **§9 Q-2**              |
| Use **`assertResourceTenantId`** (or equivalent) on mutable resource loads                                       | **C-DATA-1**            |

**Exit criteria:** Security review sign-off on any allowlisted non-`dbScoped` read path.

### Phase 5 — Frontend propagation and bridge retirement

**Goal:** Procedure input carries **`tenantId`** wherever the UI knows it; headers remain secondary.

| Action                                                                                             | SSOT                            |
| -------------------------------------------------------------------------------------------------- | ------------------------------- |
| Pass **`tenantId`** from route/search/state into **all** pre-session auth mutations                | **C-FE-2**, remediation Phase B |
| Keep sending **`x-tenant-id`** when known                                                          | **C-HTTP-4**, **C-FE-3**        |
| SSR: document **server default** or forward path when header absent (align with Phase 2 API)       | **C-FE-3**                      |
| Add tests for **`trpc-tenant-bridge`** / ordering; then **remove bridge** once API + inputs stable | **C-FE-4**, **NFR-T7**          |
| Remove **DEV hardcoded tenant UUID** from production bundles; gate strictly to dev                 | **NFR-T4**                      |

**Exit criteria:** E2E for verify-email / reset / login without relying on bridge-only timing; `i18n:validate` if copy changes.

### Phase 6 — Workers and jobs

**Goal:** Every job that can touch tenant data enters under **`runWithTenantContext`**.

| Action                                                                                                              | SSOT                        |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Wrap **each** BullMQ processor entry with tenant reconstruction from payload (`tenantId`, `requestId`, config load) | **C-JOB-1**                 |
| Ensure payloads carry enough to load **`TenantConfig`** without ambiguous defaults                                  | **C-JOB-2**                 |
| Replace **`createTestTenantContext`** in production paths with a **production-named factory** (same shape)          | **NFR-T2**, maintainability |

**Exit criteria:** No processor path calls `dbScoped` without prior ALS; integration test with mock job.

### Phase 7 — Observability, rate limits, documentation

| Action                                                                      | SSOT             |
| --------------------------------------------------------------------------- | ---------------- |
| Tenant id on structured logs/metrics for auth + tRPC + worker (policy-safe) | **NFR-T5**, §3.4 |
| Rate limits keyed by tenant where applicable                                | §3.3             |
| Update **implementation guide** and **router READMEs** to point at SSOT     | §8               |

**Exit criteria:** PR checklist §11 routinely satisfied on tenant PRs.

---

## 4. Work breakdown (assignable)

| ID  | Work item                                                                           | Owner suggestion    | Depends on          |
| --- | ----------------------------------------------------------------------------------- | ------------------- | ------------------- |
| W1  | Add/normalize **`TENANT_CONTEXT_REQUIRED`** and error mapping for REST + tRPC       | Platform API + Core | Phase 1             |
| W2  | **`resolveTenantIdentity`**: JWT vs header agreement rules + tests                  | Core / Security     | Phase 1             |
| W3  | **`resolvePublicTenantId`** + replace `readTenantIdFromRequest` usages in `auth.ts` | Platform API        | Phase 1–2           |
| W4  | **`packages/types`** auth input schemas + consumer spec updates                     | API + Types         | Phase 2             |
| W5  | Fastify + **`register-fastify.ts`**: tenant ALS + JWT for tRPC                      | Platform API        | Phase 3             |
| W6  | **`ctx.tenant`** typing + **`authedProcedure`** implementation                      | Platform API        | Phase 3             |
| W7  | **`auth` router**: `dbScoped` migration + resource assertions                       | API + Database      | Phase 4             |
| W8  | **`tenant` / `admin` router** audit + exceptions list                               | API + Security      | Phase 4             |
| W9  | Frontend forms/hooks: **`tenantId` on input** for all pre-session flows             | Frontend            | Phase 2 (API ready) |
| W10 | SSR session fetch: default or documented behavior without client header             | Frontend            | Phase 2, W9         |
| W11 | Tests: bridge, mismatch, missing tenant; remove dev UUID from prod path             | Frontend + QA       | Phase 5             |
| W12 | Worker: uniform **`runWithTenantContext`** at job entry                             | Worker              | Phase 1, 4          |
| W13 | Connector registry guardrails (doc or runtime check)                                | Data connectors     | Phase 7             |

---

## 5. Risks and mitigations

| Risk                                                              | Mitigation                                                                                                           |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Tight coupling** between Fastify middleware order and tRPC      | Integration tests that hit tRPC over HTTP with/without JWT and headers.                                              |
| **User-visible error changes** when replacing messages with codes | Greenfield: update frontend **`useAuthMutation`** / error mappers to read **`code`**; keep human `message` for a11y. |
| **Race:** first tRPC call before `TenantProvider` effect          | **Procedure `tenantId`** removes dependence on bridge timing (Phase 5).                                              |
| **Worker regression** if `dbScoped` introduced before ALS wrap    | Phase ordering: W12 before or with W7 on shared code paths.                                                          |
| **Over-broad `dbScoped`** on truly public metadata                | Strict **§9 Q-2** allowlist + security review.                                                                       |

---

## 6. Traceability matrix (SSOT → plan → verification)

| SSOT ID        | Plan phase / work item                                       | Verification                                                 |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **NFR-T1**     | Phase 4, W7–W8                                               | DB integration tests; RLS policy checks in staging           |
| **NFR-T2**     | Phase 6, W12                                                 | Worker integration test with `getTenantContext()` assertion  |
| **NFR-T3**     | Phase 1–2, W1 W3                                             | Unit + API tests on `code` field                             |
| **NFR-T4**     | Phase 5, W11                                                 | `grep` / build-time guard for hardcoded UUIDs in prod bundle |
| **NFR-T5**     | Phase 7                                                      | Log/metric sampling review                                   |
| **NFR-T6**     | Phase 3–4 (caching in resolution — follow existing patterns) | Perf notes in PR                                             |
| **NFR-T7**     | Phase 5, W11                                                 | Vitest coverage for bridge and resolution                    |
| **C-ALS-1**    | Phase 4, W7                                                  | Code review + DB tests                                       |
| **C-ALS-2**    | Phase 3, W5                                                  | E2E authenticated tRPC                                       |
| **C-RES-1**    | Phase 1–3                                                    | Resolution unit tests + config load                          |
| **C-RES-2**    | Phase 1, W2                                                  | Invalid UUID → security error                                |
| **C-DATA-1**   | Phase 4, W7                                                  | Mutation tests cross-tenant denial                           |
| **C-HTTP-1–5** | Phase 2, W3 W4 W9                                            | Contract tests + E2E                                         |
| **C-JOB-1–2**  | Phase 6, W12                                                 | Job processor tests                                          |
| **C-FE-1–4**   | Phase 5, W9–W11                                              | E2E auth flows                                               |
| **C-CONN-1**   | Phase 7, W13                                                 | Connector factory tests                                      |
| **§9 Q-1**     | Phase 3, W5 W6                                               | Context shape in `TrpcContext`                               |
| **§9 Q-2**     | Phase 4, W8                                                  | Written allowlist                                            |
| **§9 Q-3**     | Phase 1–2, W2 W3                                             | Public vs authenticated tests                                |
| **§9 Q-4**     | Phase 5 (desktop parity — same as web)                       | Desktop checklist when workstream active                     |

---

## 7. Open questions

| Topic                                                                                     | Proposed default                                                                         | Escalation                                                       |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **REST `resolveTenantContextFromHttp`** currently omits raw **headers** in JWT middleware | Extend call site to pass headers so **header vs JWT** policy is enforceable consistently | Security + Platform API                                          |
| **`TENANT_CONTEXT_REQUIRED` vs `MISSING_TENANT`**                                         | Add SSOT-named code and **map** legacy code in one release for tests                     | Architecture doc amendment if only one code is desired long-term |
| **Desktop Electron** parity timing                                                        | Defer to desktop roadmap; **no third channel** (§9 Q-4)                                  | Desktop workstream owner                                         |
| **Enumeration** on public auth errors                                                     | Follow remediation plan security notes; align copy with legal/product                    | Security                                                         |

---

## 8. Revision history

| Date       | Change                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| 2026-04-25 | Initial plan from SSOT + remediation + parallel codebase surveys (API/tRPC, frontend, DB/worker/connectors). |
