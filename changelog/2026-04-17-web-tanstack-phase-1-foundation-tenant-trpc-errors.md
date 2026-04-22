# Changelog: Web TanStack Start — Phase 1 foundation (tenant context, tRPC wiring, route errors)

**Date:** 2026-04-17  
**Scope:** Execution of **Phase 1 (Weeks 1–2) — Foundation** from [`web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md): stack SSOT documentation, file-based routing notes, tenant resolution for the browser client, tRPC client headers aligned with the API (`x-tenant-id`, `x-request-id`), baseline route error UI, and structured client-side error logging. Aligns with [Decision 11](../docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support) (tRPC on `apps/api`, not TanStack server functions for domain RPC).

**Verification run:** `pnpm --filter @agenticverdict/frontend test`, `pnpm --filter @agenticverdict/frontend typecheck`, `pnpm --filter @agenticverdict/frontend lint`, `pnpm --filter @agenticverdict/frontend build`.

---

## Summary

- **P1-1 Stack verification:** Documented pinned TanStack / tRPC / Vite versions and Phase 1 references in `apps/frontend/README.md`.
- **P1-2 Routing SSOT:** Documented `src/routes/` conventions, `$locale` behavior, and `routeTree.gen.ts` generation (gitignored; produced by the Router Vite plugin on build).
- **P1-3 Tenant root:** Added `TenantProvider` and `getEffectiveTenantId()` — priority is authenticated `authStore.tenantId` (valid UUID), then optional `VITE_PUBLIC_DEFAULT_TENANT_ID` for local/dev. Subdomain slug → UUID remains a product/API follow-up (see `packages/core` tenant resolution).
- **P1-4 tRPC context:** Wrapped the app with `trpc.Provider` + shared `trpcClient`; fixed `createTRPCReact<AnyRouter>()` typing by introducing a minimal `AppRouter` stub (`app-router.stub.ts`) until the API exports a shared router type. HTTP batch link sends `x-tenant-id` and per-request `x-request-id`.
- **P1-5 Error baseline:** Added `AppRouteError` and `errorComponent` on `__root`, `/$locale`, and `/$locale/` with user-safe copy via `getTrpcSafeUserMessage` (tRPC-aware, no raw stacks in production UI).
- **P1-6 Logging baseline:** Added `logWebClientError` for route errors (tenant id + tRPC code/http fields only; no tokens/PII).

---

## Added

### `apps/frontend`

- **`src/lib/tenant/tenant-resolution.ts`** — UUID validation and `getEffectiveTenantId()` for client SSOT.
- **`src/lib/tenant/tenant-resolution.test.ts`** — unit tests for UUID validation and auth-preferring resolution.
- **`src/providers/TenantProvider.tsx`** — React context (`useTenant()`) driven by `useAuthStore` + `getEffectiveTenantId`.
- **`src/lib/api/app-router.stub.ts`** — minimal `initTRPC` router for `AppRouter` typing only (replace with shared API export when available).
- **`src/lib/api/trpc-error-message.ts`** — `getTrpcSafeUserMessage()` for route boundaries.
- **`src/lib/api/trpc-error-message.test.ts`** — basic message coverage.
- **`src/lib/api/trpc-client.test.ts`** — asserts `buildTrpcHeaders()` emits `x-tenant-id` when the auth store holds a UUID.
- **`src/lib/observability/client-log.ts`** — `logWebClientError()` for structured console logging before future RUM forwarding.
- **`src/components/errors/AppRouteError.tsx`** — accessible, Mantine-free fallback for errors that may render outside `Providers`.

---

## Changed

### `apps/frontend`

- **`src/lib/api/trpc-client.ts`** — Exported `buildTrpcHeaders()`; `trpcClient` via `trpc.createClient`; tenant + request correlation headers; `AppRouter` from stub instead of `AnyRouter` (restores `Provider` / `createClient` types).
- **`src/components/Providers.tsx`** — Nested `trpc.Provider` → `TenantProvider` → existing theme stack.
- **`src/routes/__root.tsx`**, **`src/routes/$locale/route.tsx`**, **`src/routes/$locale/index.tsx`** — `errorComponent` wired to `AppRouteError`.
- **`README.md`** — TanStack version table, routing SSOT, tenant/tRPC header behavior, optional `VITE_PUBLIC_DEFAULT_TENANT_ID` env example.

---

## Work packages mapping

| Plan ID | Delivered in this change                                           |
| ------- | ------------------------------------------------------------------ |
| P1-1    | README version matrix + stack pointers                             |
| P1-2    | README routing + `routeTree.gen.ts` behavior                       |
| P1-3    | `TenantProvider`, `getEffectiveTenantId`, `useTenant`              |
| P1-4    | `trpc.Provider`, `buildTrpcHeaders`, `AppRouter` stub              |
| P1-5    | `AppRouteError`, `getTrpcSafeUserMessage`, route `errorComponent`s |
| P1-6    | `logWebClientError` + use in `AppRouteError`                       |

---

## Follow-ups (Phase 2+)

- **Shared `AppRouter` type** from `@agenticverdict/api` (remove `_webClientProbe` stub procedure).
- **Subdomain / path tenant resolution** in the browser when product defines slug → UUID (and optional admin override).
- **Integration test** hitting a mock API to assert headers on real tRPC calls (Phase 1 uses unit tests + manual smoke).
- **Auth + tRPC** E2E once protected routes and session flows are hardened (Phase 2).

---

## References

- [`docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md) — Phase 1 exit criteria and work packages.
- [`docs/architecture/ui/04-decision-record.md`](../docs/architecture/ui/04-decision-record.md) — Decision 11 (tRPC unified API).
- [`packages/core/src/tenant-resolution.ts`](../packages/core/src/tenant-resolution.ts) — server-side `x-tenant-id` / JWT / subdomain priority (web client mirrors header contract only).
