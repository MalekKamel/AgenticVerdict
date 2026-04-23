# Changelog: Tenant requirements — Phase 1 (core contracts) + Phase 2 (public auth transport)

**Date:** 2026-04-25  
**Scope:** Execution of **Phase 1 — Core contracts and error vocabulary** and **Phase 2 — Public auth transport (API + types)** from [`tenant-requirements-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md), aligned with the normative SSOT [`tenant-requirements-single-source-of-truth-2026-04-25.md`](../docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md) and the public-auth detail in [`tenant-context-trpc-remediation-plan-2026-04-25.md`](../docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md).

**Verification run:** `pnpm --filter @agenticverdict/core exec vitest run`, `pnpm --filter @agenticverdict/database exec vitest run test/db-scoped.unit.test.ts` (from `packages/database`), `pnpm --filter @agenticverdict/api exec vitest run`, `pnpm --filter @agenticverdict/frontend exec tsc --noEmit`, `pnpm --filter @agenticverdict/frontend run i18n:validate`, `pnpm --filter @agenticverdict/types exec tsc --noEmit`.

---

## Summary

### Phase 1 — Core contracts and error vocabulary

- **`TENANT_CONTEXT_REQUIRED`** added to **`TenantSecurityCode`** in [`packages/core/src/tenant-security-error.ts`](../packages/core/src/tenant-security-error.ts) (SSOT **NFR-T3**).
- **`resolveTenantIdentity`** ([`packages/core/src/tenant-resolution.ts`](../packages/core/src/tenant-resolution.ts)): when both a valid header UUID and JWT tenant claims are present, they **must match** or resolution returns **`TENANT_MISMATCH`** (SSOT **§9 Q-3**, **C-RES-2**). The previous “header wins and JWT is ignored” behavior is removed for that case.
- When no tenant can be resolved from headers, JWT, or slug resolution, the code is now **`TENANT_CONTEXT_REQUIRED`** with HTTP **400** (replacing **`MISSING_TENANT`** / **401** for that branch) for the empty-request case.
- **`requireTenantContext`** ([`packages/core/src/tenant-context.ts`](../packages/core/src/tenant-context.ts)) and **`dbScoped`** ([`packages/database/src/db-scoped.ts`](../packages/database/src/db-scoped.ts)) throw **`TenantSecurityError`** with **`TENANT_CONTEXT_REQUIRED`** (http **500**) instead of opaque `Error` strings.

### Phase 2 — Public auth transport (API + types)

- **Shared Zod field** **`optionalAuthTenantIdSchema`** and optional **`tenantId`** on pre-session inputs: **`login`**, **`verifyEmail`**, **`resendEmailVerification`**, **`requestPasswordReset`**, **`confirmPasswordReset`** (register already had optional `tenantId`) in [`packages/types/src/auth.ts`](../packages/types/src/auth.ts); re-exported from [`packages/types/src/index.ts`](../packages/types/src/index.ts) (**C-HTTP-1**).
- **Central resolver** [`apps/api/src/trpc/resolve-public-tenant-id.ts`](../apps/api/src/trpc/resolve-public-tenant-id.ts):
  - **`resolvePublicTenantId(req, input)`** — body `tenantId` and/or **`x-tenant-id`**; both present **must match** → **`TENANT_MISMATCH`**; neither valid → **`TENANT_CONTEXT_REQUIRED`**; invalid UUID in either channel → **`INVALID_TENANT_ID`** (**C-HTTP-2**, **C-HTTP-3**).
  - **`assertOptionalPublicTenantMatchesTenant(req, input, tenantId)`** for **`auth.confirmPasswordReset`**: if hints are present, they must match each other and the user row’s `tenantId`; token-only reset remains valid when no hints are sent.
- **Replaced** ad-hoc **`readTenantIdFromRequest`** and **`TRPCError` “Missing x-tenant-id”** in [`apps/api/src/trpc/routers/auth.ts`](../apps/api/src/trpc/routers/auth.ts) with the resolver; **register** no longer allows silent override between body and header (**C-HTTP-2**).
- **tRPC error shape:** [`apps/api/src/trpc/init.ts`](../apps/api/src/trpc/init.ts) **`errorFormatter`** attaches **`tenantSecurityCode`** to **`data`** when `error.cause` is **`TenantSecurityError`**, so clients can rely on a **stable code** alongside the human **`message`** (**NFR-T3**).
- **Frontend** [`apps/frontend/src/lib/api/auth-api.ts`](../apps/frontend/src/lib/api/auth-api.ts): **`AuthErrorCode`** extended with **`TENANT_CONTEXT_REQUIRED`** and **`TENANT_MISMATCH`**; **`extractErrorCode`** reads **`data.tenantSecurityCode`** from tRPC errors.
- **i18n:** New **`auth.errors.*`** block (API-normalized keys used by `auth-api`) in [`apps/frontend/messages/en.json`](../apps/frontend/messages/en.json), [`ar.json`](../apps/frontend/messages/ar.json), [`fr.json`](../apps/frontend/messages/fr.json), including **`tenantContextRequired`** and **`tenantMismatch`**.

### Tests

- **Core:** [`packages/core/src/tenant-isolation.test.ts`](../packages/core/src/tenant-isolation.test.ts) — header/JWT mismatch, **`TENANT_CONTEXT_REQUIRED`**, same-id acceptance.
- **Core:** [`packages/core/src/tenant-context.test.ts`](../packages/core/src/tenant-context.test.ts) — **`requireTenantContext`** throws structured **`TenantSecurityError`**.
- **Database:** [`packages/database/test/db-scoped.unit.test.ts`](../packages/database/test/db-scoped.unit.test.ts) — missing ALS throws **`TENANT_CONTEXT_REQUIRED`**.
- **API:** [`apps/api/src/trpc/resolve-public-tenant-id.test.ts`](../apps/api/src/trpc/resolve-public-tenant-id.test.ts) — happy path, mismatch, missing tenant, optional password-reset alignment.

---

## Added

| Location                                             | What                                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `apps/api/src/trpc/resolve-public-tenant-id.ts`      | Public tenant resolution + `trpcErrorFromTenantSecurity` + `assertOptionalPublicTenantMatchesTenant`      |
| `apps/api/src/trpc/resolve-public-tenant-id.test.ts` | Unit tests for resolver and password-reset hint checks                                                    |
| `packages/types/src/auth.ts` (and `index`)           | `optionalAuthTenantIdSchema`, optional `tenantId` on listed auth inputs, new **`AuthErrorCode`** variants |
| `apps/frontend/messages/*.json`                      | `auth.errors` map (including tenant messages) for `auth-api` message keys                                 |

---

## Changed

| Location                                     | What                                                                                                                                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core/src/tenant-security-error.ts` | **`TENANT_CONTEXT_REQUIRED`** in union                                                                                                                                                              |
| `packages/core/src/tenant-resolution.ts`     | Header/JWT agreement; final empty resolution → **`TENANT_CONTEXT_REQUIRED`** / 400                                                                                                                  |
| `packages/core/src/tenant-context.ts`        | **`requireTenantContext`** → **`TenantSecurityError`**                                                                                                                                              |
| `packages/database/src/db-scoped.ts`         | Missing tenant context → **`TenantSecurityError`**                                                                                                                                                  |
| `apps/api/src/trpc/init.ts`                  | **`errorFormatter`** exposes **`data.tenantSecurityCode`**                                                                                                                                          |
| `apps/api/src/trpc/routers/auth.ts`          | All pre-session tenant guards via **`resolvePublicTenantId`** / **`assertOptionalPublicTenantMatchesTenant`**; **`confirmPasswordReset`** takes optional `tenantId` and validates hints against row |
| `apps/frontend/src/lib/api/auth-api.ts`      | Map **`tenantSecurityCode`**; full **`auth.errors`** message table including tenant rows                                                                                                            |

---

## Plan mapping (Phases 1–2)

| Plan action                                                                                 | Delivered                                                                  |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **P1** Add **`TENANT_CONTEXT_REQUIRED`**, align **`requireTenantContext`** / **`dbScoped`** | New code; both throw **`TenantSecurityError`**                             |
| **P1** Header vs JWT policy in **`resolveTenantIdentity`**                                  | Mismatch → **`TENANT_MISMATCH`**; unit tests                               |
| **P2** Zod/input optional **`tenantId`** for listed procedures                              | **`@agenticverdict/types`** updated                                        |
| **P2** **`resolvePublicTenantId`**, **C-HTTP-2/3**                                          | `resolve-public-tenant-id.ts` + auth router                                |
| **P2** Replace free-text missing-tenant errors                                              | **`TRPCError`** from resolver with stable **`tenantSecurityCode`** in data |
| **P2** Register: no silent body/header override                                             | Single resolver enforces match                                             |

---

## Deferred (later plan phases)

- **Phase 3** — _Implemented_ — see [`2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md`](2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md) (tRPC + ALS; **`ctx.tenant`**, **§9 Q-1**).
- **Phase 4** — _Implemented in same changelog as Phase 3_ — `auth` / `admin` **`dbScoped`**, **`tenant`** router allowlist in README (**C-ALS-1**, **§9 Q-2**).
- **Phase 5** — _Implemented with Phase 6_ — see [`2026-04-25-tenant-requirements-phase-5-6-frontend-propagate-and-worker-als.md`](2026-04-25-tenant-requirements-phase-5-6-frontend-propagate-and-worker-als.md) (**C-FE-2**–**4**, worker **C-JOB-1**).

---

## References

- [`docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md)
- [`docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`](../docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md)
- [`docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md`](../docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md)
