# Changelog: UI infrastructure plan — Phase A auth stabilization (A1-A5)

**Date:** 2026-04-22  
**Scope:** Execution of **Phase A (Immediate: 0-2 weeks)** from [`ui-infrastructure-research-and-implementation-plan-2026-04-22.md`](../docs/03-technology-research/frontend/ui-infrastructure-research-and-implementation-plan-2026-04-22.md): architecture baseline publication (A1), auth-shell unification (A2), auth state-contract normalization (A3), hook/API transition hardening (A4), and register/verify-email E2E gap closure (A5).

**Verification run:** `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`, `pnpm --filter @agenticverdict/frontend exec vitest run src/hooks/useLoginMutation.test.ts`, `pnpm --filter @agenticverdict/frontend test:e2e e2e/register-flow.spec.ts e2e/verify-email-flow.spec.ts`

---

## Summary

### A1 — Auth architecture baseline contract

- Published a dedicated baseline note at [`docs/03-technology-research/frontend/auth-architecture-baseline-phase-a-2026-04-22.md`](../docs/03-technology-research/frontend/auth-architecture-baseline-phase-a-2026-04-22.md).
- Established explicit route -> page -> component -> hook -> API boundaries for `/$locale/auth/*`.
- Documented a unified loading/error/success/focus contract and locale-aware redirect safety rules.
- Captured Phase A acceptance checks linked directly to A2-A5 outcomes.

### A2 — Shared auth shell/layout parity (including verify-email)

- Refactored verify-email page composition to use the shared [`AuthLayout`](../apps/frontend/src/components/auth/AuthLayout.tsx), removing the standalone Mantine `Box` shell.
- Added auth-shell nav links on verify-email page (`Sign In`, `Back to Register`) for parity with other auth surfaces.
- Kept route-level lazy-loading and search validation unchanged while normalizing presentation.

### A3 — Auth interaction-state normalization

- Normalized verify-email interaction semantics:
  - state-specific status regions (`role="status"` / `role="alert"`),
  - focus handoff to state region on non-loading transitions,
  - shared spinner behavior and shell-level consistency.
- Reduced drift by removing isolated visual structure from `VerifyEmailClient` so status content lives inside the shared auth shell contract.
- Updated register button behavior to avoid disabled-state deadlock (`disabled={register.isPending}`), allowing consistent submit + validation handling.

### A4 — Hook/API transitions, redirect hardening, and runtime safety

- Added redirect-search handling to login route (`redirect` query contract) in [`login.tsx`](../apps/frontend/src/routes/$locale/auth/login.tsx).
- Hardened post-login redirect behavior in [`useLoginMutation.ts`](../apps/frontend/src/hooks/useLoginMutation.ts):
  - safe internal-path redirect support,
  - auth-loop prevention (`/auth/*` blocked),
  - deterministic fallback to `/dashboard`.
- Added unit coverage for redirect resolver logic in [`useLoginMutation.test.ts`](../apps/frontend/src/hooks/useLoginMutation.test.ts).
- Aligned reset-password client and hook token flow by passing token explicitly from page state to mutation.
- Fixed browser/runtime resilience around AsyncLocalStorage imports in shared server-oriented helpers:
  - [`apps/frontend/src/lib/csp-nonce.server.ts`](../apps/frontend/src/lib/csp-nonce.server.ts)
  - [`packages/core/src/tenant-context.ts`](../packages/core/src/tenant-context.ts)
    These now no-op gracefully when `AsyncLocalStorage` is unavailable in browser bundles.

### A5 — Register + verify-email E2E coverage

- Added dedicated Playwright suites:
  - [`apps/frontend/e2e/register-flow.spec.ts`](../apps/frontend/e2e/register-flow.spec.ts)
  - [`apps/frontend/e2e/verify-email-flow.spec.ts`](../apps/frontend/e2e/verify-email-flow.spec.ts)
- Register suite covers:
  - baseline form rendering and required fields,
  - mismatch edge path,
  - checkbox interaction with valid input,
  - terms-not-accepted validation path.
- Verify-email suite covers:
  - success path with mocked verify mutation response,
  - missing-token failure edge path,
  - shared auth-shell navigation affordances.

---

## Added

### `docs/03-technology-research/frontend`

- **`auth-architecture-baseline-phase-a-2026-04-22.md`** — Phase A auth implementation contract and acceptance guardrails.

### `apps/frontend/src/hooks`

- **`useLoginMutation.test.ts`** — unit tests for safe post-login redirect resolution.

### `apps/frontend/e2e`

- **`register-flow.spec.ts`** — dedicated register E2E scenarios for Phase A.
- **`verify-email-flow.spec.ts`** — dedicated verify-email E2E scenarios for Phase A.

---

## Changed

### `apps/frontend` auth route/page/component/hook stack

- **`src/routes/$locale/auth/login.tsx`** — validates optional `redirect` query.
- **`src/routes/$locale/auth/-verify-email.page.tsx`** — migrated verify-email page into shared `AuthLayout` shell + shell-aligned fallback.
- **`src/components/auth/VerifyEmailClient.tsx`** — status-region semantics/focus normalization; removed standalone card-shell rendering.
- **`src/components/auth/RegisterForm.tsx`** — submit gating and checkbox event wiring for consistent form-state transitions.
- **`src/components/auth/ResetPasswordFormClient.tsx`** — passes token through mutation payload for explicit reset contract.
- **`src/hooks/useLoginMutation.ts`** — redirect-loop hardening (`resolvePostLoginRedirect`) and deterministic locale-aware post-login routing.
- **`src/hooks/usePasswordReset.ts`** — accepts token override and supports explicit token payloads.
- **`src/lib/csp-nonce.server.ts`** — safe AsyncLocalStorage fallback to prevent browser-side runtime crashes.

### Shared packages

- **`packages/core/src/tenant-context.ts`** — AsyncLocalStorage guarded for browser compatibility.
- **`packages/ui/src/atoms/Checkbox/Checkbox.tsx`** — forwards native `onChange` and uses `useId()` (SSR-safe id generation) to avoid hydration drift and ensure form integration works reliably.

---

## Phase A plan mapping

| Phase A task                                     | Delivered outcome                                                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A1** Publish auth architecture baseline        | Dedicated baseline note with explicit implementation contract and acceptance checks                                                              |
| **A2** Unify auth pages under shared shell       | Verify-email route now rendered through shared `AuthLayout` with parity nav/structure                                                            |
| **A3** Normalize auth form state contract        | Verify-email status semantics + focus behavior normalized; register submit-state deadlock removed                                                |
| **A4** Harden hook/API transitions and redirects | Safe redirect parser + auth-loop prevention + locale-aware fallback; reset token flow explicit; browser AsyncLocalStorage crash resilience added |
| **A5** Close register/verify-email E2E gaps      | New dedicated Playwright suites with success/failure/edge coverage for both flows                                                                |

---

## Notes and follow-ups

- Vite still logs informational externalization warnings for `node:async_hooks` in browser builds; functional regressions from this path are addressed by runtime guards in shared modules.
- The register E2E suite intentionally focuses on deterministic UI contract checks under current auth-mode/runtime behavior; verify-email success path uses explicit network stubbing for stability.

---

## References

- [`docs/03-technology-research/frontend/ui-infrastructure-research-and-implementation-plan-2026-04-22.md`](../docs/03-technology-research/frontend/ui-infrastructure-research-and-implementation-plan-2026-04-22.md)
- [`docs/03-technology-research/frontend/auth-architecture-baseline-phase-a-2026-04-22.md`](../docs/03-technology-research/frontend/auth-architecture-baseline-phase-a-2026-04-22.md)
- [`changelog/2026-04-17-web-tanstack-post-review-p1-p2-implementation.md`](2026-04-17-web-tanstack-post-review-p1-p2-implementation.md)
