# Changelog: Tenant requirements — Phase 3 (tRPC authenticated context + ALS) + Phase 4 (DB access from tRPC)

**Date:** 2026-04-25  
**Scope:** Execution of **Phase 3 — tRPC authenticated context and ALS** and **Phase 4 — Database access from tRPC (default deny)** from [`tenant-requirements-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md), building on **Phase 1–2** ([`2026-04-25-tenant-requirements-phase-1-2-implementation.md`](2026-04-25-tenant-requirements-phase-1-2-implementation.md)). Delivers tRPC traffic that is isolated under **session + tenant** pre-handlers, **`TrpcContext.tenant`**, a stricter **`authedProcedure`**, **ALS continuity** for procedure bodies via `bindTenantContextAsyncContinuation`, **`dbScoped` + `assertResourceTenantId`** on `auth` and `admin` tenant paths, a documented **public/auth → RLS** helper module, **JWT vs `x-tenant-id` agreement** in `bindJwtTenantAsyncContext` (headers forwarded into `resolveTenantContextFromHttp`), a **token-only** password-reset RLS path via **`runWithKnownTenantForRls`**, and a **router README** listing **§9 Q-2** allowlist rows for the small `auth` / `admin` / `tenant` surface. Aligns with the SSOT [`tenant-requirements-single-source-of-truth-2026-04-25.md`](../docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md) (**C-ALS-2**, **§9 Q-1**, **C-ALS-1**, **§9 Q-2**, **C-DATA-1**).

**Verification run:** `pnpm --filter @agenticverdict/api exec tsc --noEmit`, `pnpm --filter @agenticverdict/api exec vitest run`.

---

## Summary

### Phase 3 — tRPC authenticated context and ALS

- **tRPC-only pre-handlers** — [`register-fastify.ts`](../apps/api/src/trpc/register-fastify.ts) registers the Fastify tRPC plugin under an **encapsulated child** with prefix `/trpc` (still **`/api/v1/trpc`** from the app). **`attachTrpcRequestAuth`** ( [`auth.ts`](../apps/api/src/middleware/auth.ts) ) mirrors **`verifyBearerSessionFromRequest`**: it sets `request.auth` from **`Authorization: Bearer`** or the **`av_session`** cookie so tenant resolution runs for browser sessions, not only bare Bearer middleware. Then **`bindJwtTenantAsyncContext`** sets **`request.tenantContext`** when a full session is present. **`bindTenantContextAsyncContinuation`** ( `@agenticverdict/core` ) is applied when `tenantContext` exists so `getTenantContext()` and **`dbScoped`** see ALS inside tRPC work (C-ALS-2, §5.2 as in plan).
- **`TrpcContext`** — [`context.ts`](../apps/api/src/trpc/context.ts) now includes optional **`tenant`** (same as REST `request.tenantContext`); `createTrpcContext` copies **`req.tenantContext`**.
- **`authedProcedure`** — [`procedures.ts`](../apps/api/src/trpc/procedures.ts) requires: valid session, **`ctx.tenant`**, and **equality** of **`ctx.tenant.tenantId`** with **`session.auth.tenantId`**. Missing tenant uses **`TENANT_CONTEXT_REQUIRED`**; mismatch uses **`TENANT_MISMATCH`**, with **`errorFormatter`**-visible codes via tRPC `cause` (§9 Q-1, Q-3).
- **JWT + header policy for tenant bind** — [`jwt-tenant-context.ts`](../apps/api/src/middleware/jwt-tenant-context.ts) passes **`headers`** and **`host`** into **`resolveTenantContextFromHttp`**, so **§9 Q-3** header vs JWT cross-check is enforced for any route using this middleware (including tRPC). New regression test: [`jwt-tenant-context.test.ts`](../apps/api/src/middleware/jwt-tenant-context.test.ts) (**403** / **`tenant_mismatch`**) when **`x-tenant-id`** and JWT `tenant_id` differ.

### Phase 4 — Database access from tRPC (default deny)

- **Public-tenant RLS execution** — [`public-tenant-context.ts`](../apps/api/src/trpc/public-tenant-context.ts): **`runWithPublicAuthTenantRls`** ( **`resolvePublicTenantId`** + **`resolveTenantContextFromHttp`** + **`runWithTenantContext`** ) and **`runWithKnownTenantForRls`** (known UUID after other guards — used when body/header hints are not required, e.g. after opaque token row resolution).
- **`auth` router** — [`routers/auth.ts`](../apps/api/src/trpc/routers/auth.ts): pre-session flows wrap tenant-owned reads/writes in **`dbScoped`** after public tenant resolution; **`getSession`** (DB path) uses **`dbScoped`** and **`assertResourceTenantId`**; **`login`**, **`register`**, **`verifyEmail`**, **`resendEmailVerification`**, **`requestPasswordReset`** use **`runWithPublicAuthTenantRls` / `requireTenantContext` + `dbScoped`**; **`confirmPasswordReset`**: allowlisted **unscoped** `select` by **reset token** (per §9 Q-2), then **`assertOptionalPublicTenantMatchesTenant`**, then **`runWithKnownTenantForRls` + `dbScoped`** for the **update** (C-DATA-1).
- **`admin` router** — [`routers/admin.ts`](../apps/api/src/trpc/routers/admin.ts): **`admin.featureFlags.list`** runs **`listAdminSnapshot`** inside **`dbScoped`** (Drizzle transaction + `app.current_tenant_id`).
- **`tenant` router** (audit only) — public **`resolveSlug`** / **`getBranding`** remain **non–`dbScoped`**: slug discovery and on-disk `TenantConfig` read; see README.

- **Operator documentation** — [`apps/api/src/trpc/README.md`](../apps/api/src/trpc/README.md): phase mapping, per-router `dbScoped` vs public-exception rows, and pointer to security review for the allowlist.

---

## Added

| Location                                                                                      | What                                                                     |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`apps/api/src/middleware/auth.ts`](../apps/api/src/middleware/auth.ts)                       | **`attachTrpcRequestAuth`** (Bearer or cookie → `request.auth` for tRPC) |
| [`apps/api/src/trpc/public-tenant-context.ts`](../apps/api/src/trpc/public-tenant-context.ts) | **`runWithPublicAuthTenantRls`**, **`runWithKnownTenantForRls`**         |
| [`apps/api/src/trpc/README.md`](../apps/api/src/trpc/README.md)                               | tRPC **Phase 3–4** router / exception matrix                             |

## Changed

| Location                                                                                                      | What                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [`apps/api/src/middleware/jwt-tenant-context.ts`](../apps/api/src/middleware/jwt-tenant-context.ts)           | Pass **`headers`** + **`host`** into tenant HTTP resolution (§9 Q-3)                                                                       |
| [`apps/api/src/trpc/register-fastify.ts`](../apps/api/src/trpc/register-fastify.ts)                           | tRPC child plugin + pre-handlers + **`bindTenantContextAsyncContinuation`**; nested **`prefix: "/trpc"`**                                  |
| [`apps/api/src/trpc/context.ts`](../apps/api/src/trpc/context.ts)                                             | **`tenant` on `TrpcContext`**, from **`req.tenantContext`**                                                                                |
| [`apps/api/src/trpc/procedures.ts`](../apps/api/src/trpc/procedures.ts)                                       | **`authedProcedure`** enforces **session + `ctx.tenant` + id match**                                                                       |
| [`apps/api/src/trpc/routers/auth.ts`](../apps/api/src/trpc/routers/auth.ts)                                   | **ALS + `dbScoped` + `assertResourceTenantId`** for tenant data paths; **`confirmPasswordReset`** RLS on update after token allowlist read |
| [`apps/api/src/trpc/routers/admin.ts`](../apps/api/src/trpc/routers/admin.ts)                                 | **`dbScoped`** for **`featureFlags.list`**                                                                                                 |
| [`apps/api/src/middleware/jwt-tenant-context.test.ts`](../apps/api/src/middleware/jwt-tenant-context.test.ts) | Header / JWT **tenant** disagreement case                                                                                                  |

---

## Plan mapping (Phases 3–4)

| Plan action                                                    | Delivered                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------- |
| **P3** Run tRPC with Fastify pre-handlers for session + tenant | tRPC-encapsulated pre-chain + `bindTenantContextAsyncContinuation`  |
| **P3** `TrpcContext` / `ctx.tenant`                            | `context.ts` + `createTrpcContext`                                  |
| **P3** `authedProcedure` + JWT alignment                       | `procedures.ts` + tenant bind headers                               |
| **P3** Document router assumptions                             | `trpc/README.md`                                                    |
| **P4** `auth` → `dbScoped` / ALS                               | `public-tenant-context.ts` + `auth` router refactors                |
| **P4** `admin` / `tenant` audit + allowlist                    | `admin` uses `dbScoped`; `tenant` public reads documented in README |
| **P4** `assertResourceTenantId` on mutable paths               | `auth` selections / updates                                         |

---

## Deferred (later plan phases)

- **Phase 5–6** — _Implemented_ — see [`2026-04-25-tenant-requirements-phase-5-6-frontend-propagate-and-worker-als.md`](2026-04-25-tenant-requirements-phase-5-6-frontend-propagate-and-worker-als.md) (pre-session JSON `tenantId`, SSR default header, worker ALS, `buildTenantContextForJob`).
- **Phase 7** — Observability, rate limits, and SSOT cross-links in the implementation guide (**NFR-T5**).

---

## References

- [`docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md)
- [`docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`](../docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md)
- [`docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md`](../docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md)
- [`changelog/2026-04-25-tenant-requirements-phase-1-2-implementation.md`](2026-04-25-tenant-requirements-phase-1-2-implementation.md)
