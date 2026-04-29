# Dashboard prototype classification

## Scope

`apps/frontend/src/routes/$locale/dashboard` and co-located route modules as of the dashboard OpenSpec change.

## Prototype-only (removed or superseded by production layers)

| Artifact                      | Classification | Notes                                                                                                                                                                                                                          |
| ----------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `-dashboard.page.tsx` (prior) | Prototype      | Placeholder home: user email echo, ad-hoc links, no typed data contracts, no shared dashboard state, no section-level async semantics. Replaced by production page composition under `components/dashboard` + `lib/dashboard`. |

## Production / reusable (retained)

| Artifact                                                          | Classification           | Notes                                                                                           |
| ----------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `dashboard.tsx` `beforeLoad` using `createProtectedBeforeLoad`    | Reusable pattern         | Canonical protected-session guard; extended with dashboard `validateSearch` where needed.       |
| `dashboard/feature-flags.tsx` + `-feature-flags.page.tsx`         | Production admin surface | tRPC-backed feature flag table; gated by env/readiness. Not part of tenant analytics prototype. |
| `@/lib/auth/route-guards/*`, `@/lib/auth/safe-auth-redirect.ts`   | Shared utilities         | Redirect sanitization and loop-safe defaults reused by dashboard search validation.             |
| `@/components/layout/app-shell-context`, `@/hooks/useRequireAuth` | Shared shell             | Breadcrumbs and client-side auth reconciliation for protected pages.                            |
| `@/lib/feature-flags/feature-flags-readiness.ts`                  | Shared                   | Gates feature-flags route visibility.                                                           |

## New production layers (post-change)

| Layer              | Path                                                 | Role                                                             |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------------------------- |
| Contracts & errors | `apps/frontend/src/lib/dashboard/`                   | Typed payloads, stable error mapping, tenant-scoped query keys.  |
| Data access        | `apps/frontend/src/lib/dashboard/dashboard-api.ts`   | Boundary for dashboard reads; ready for tRPC wiring.             |
| Shared state       | `apps/frontend/src/lib/dashboard/dashboard-store.ts` | Date range, comparison, context, view mode, refresh timestamps.  |
| UI                 | `apps/frontend/src/components/dashboard/`            | Surfaces, async sections, landmarks, keyboard-friendly controls. |
