# Auth architecture baseline (Phase A)

**Date:** 2026-04-22  
**Status:** Active baseline for Phase A (A1-A4)  
**Applies to:** `apps/frontend` auth routes under `/$locale/auth/*`

---

## Purpose

Define a single implementation contract for authentication pages so route composition, UX state handling, and API transitions remain consistent while Phase A refactors are in progress.

---

## Route -> page -> component -> hook -> API contract

1. **Route files** (`apps/frontend/src/routes/$locale/auth/*.tsx`)
   - Own URL shape and `validateSearch`.
   - Keep route files thin (metadata, validation, lazy page import only).
   - Login route accepts optional `redirect` search param.

2. **Page files** (`apps/frontend/src/routes/$locale/auth/-*.page.tsx`)
   - Use shared `AuthLayout`.
   - Pass page-level title/description/nav links from i18n.
   - Delegate interaction logic to feature components.

3. **Feature components** (`apps/frontend/src/components/auth/*`)
   - Render fields, status surfaces, and accessibility semantics.
   - Enforce unified form-state contract:
     - `loading`: submit controls disabled, loading indicator visible.
     - `error`: rendered inside alert semantics (`role="alert"`, assertive where needed).
     - `success`: rendered as status semantics (`role="status"`).
     - `focus`: first actionable field focused on initial paint; status/error surfaces receive focus after state transitions.

4. **Hooks** (`apps/frontend/src/hooks/*`)
   - Own mutation orchestration and redirect decisions.
   - Redirects must remain locale-aware via `@/i18n/navigation`.
   - Login redirect must prevent auth-loop destinations (do not redirect to `/auth/*`).
   - Hooks should preserve mock/live compatibility through `authApi`.

5. **Auth API client** (`apps/frontend/src/lib/api/auth-api.ts`)
   - Single typed boundary for auth mutations/queries.
   - Normalize error mapping and success/failure shape.
   - Keep mock/live behavior explicitly gated (`isAuthApiMockEnabled`).

---

## Shared UX/layout standards

- All auth pages (login/register/forgot/reset/verify) must render in `AuthLayout`.
- `verify-email` is not a special layout exception.
- Use shared UI primitives (`@agenticverdict/ui`) and existing tokenized styles.
- Keep locale-prefixed navigation (`/$locale/...`) through local navigation helpers.

---

## Redirect and transition rules

- **Login success:** use `redirect` search param if provided and safe, else `/dashboard`.
- **Safe redirect definition:** internal absolute path that does not point to `/auth/*`.
- **Reset password success:** navigate to login via locale-aware router.
- **Verify email success/failure:** stay within auth shell and use clear CTA links.

---

## Phase A acceptance checks tied to this baseline

- A2: no auth route renders outside shared auth shell.
- A3: each auth form/verification state exposes consistent loading/error/success/focus behavior.
- A4: login/reset/verify transitions are deterministic and locale-aware, with no redirect loops.
- A5: register + verify-email E2E specs cover success, failure, and edge cases.
