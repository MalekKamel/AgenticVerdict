# Changelog: Foundation auth remediation plan execution

**Date:** 2026-04-27  
**Plan source:** [`docs/architecture/reviews/2026-04-27-foundation-auth-review/03-remediation-plan.md`](../docs/architecture/reviews/2026-04-27-foundation-auth-review/03-remediation-plan.md)  
**Scope:** Systematic execution of P0/P1/P2 remediation items across frontend auth flows, runtime artifact alignment, CI quality/security gates, and API security baseline.

---

## Summary

- Executed the remediation plan in risk order (P0 -> P1 -> P2), using parallel analysis tracks for auth/UI, CI/security, and runtime infrastructure.
- Eliminated sensitive password draft persistence in registration and added regression test protection.
- Aligned API/worker production runtime entrypoints with verified `dist/cli.mjs` bundle artifacts and enforced this contract via runtime policy lint.
- Expanded protected-route consistency (`beforeLoad`) to onboarding, and added contract tests for anonymous/unverified/verified states.
- Upgraded CI policy from informational to enforceable for dependency vulnerabilities (High/Critical), with a time-bound waiver manifest + validator.
- Added API security headers baseline and test assertions; documented policy boundaries (API headers vs frontend CSP ownership).

---

## Plan mapping

| Plan item                                             | Status | Delivered changes                                                                                                                                                                     |
| ----------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0 #1** Remove sensitive draft persistence          | ✅     | Registration draft persistence now strips `password` and `confirmPassword`; hydration resets those fields to empty; regression test added.                                            |
| **P0 #2** Align runtime artifact with verified bundle | ✅     | API/worker Docker production stages build Vite bundles and run `node dist/cli.mjs`; runtime policy lint enforces entrypoint alignment.                                                |
| **P1 #3** Route-level guards consistency              | ✅     | Added onboarding `beforeLoad` guard using the same protected-route policy path as dashboard; expanded route contract test matrix.                                                     |
| **P1 #4** Tighten CI quality gates                    | ✅     | Added API and worker package coverage runs to CI; expanded frontend coverage include set to critical auth-route policy files and raised thresholds.                                   |
| **P1 #5** Enforce vulnerability checks with waivers   | ✅     | CI dependency audit now blocks on High/Critical; Trivy scan now exits non-zero for High/Critical; waiver registry + validator script added with owner/expiry enforcement.             |
| **P2 #6** Consolidate auth hook API surface           | ✅     | Introduced canonical email verification hook module; migrated consumer to canonical import; legacy `useAuthMutation` converted to compatibility/deprecation facade.                   |
| **P2 #7** Resolve OAuth UX mismatch                   | ✅     | OAuth provider buttons and auto-trigger path now respect capability gate (`VITE_PUBLIC_ENABLE_OAUTH_LOGIN`); unavailable capability emits `capability_unavailable` analytics outcome. |
| **P2 #8** Add API security headers baseline           | ✅     | Registered global Fastify helmet middleware baseline, added integration test assertions, and documented API security header policy.                                                   |

---

## Added

### `apps/frontend`

- `src/components/auth/RegisterForm.persistence.test.ts` — regression test ensuring register draft persistence never serializes password fields.
- `src/hooks/useEmailVerificationMutation.ts` — canonical email verification mutation hooks (`useVerifyEmailMutation`, `useResendEmailVerificationMutation`).

### `docs/05-reference`

- `vulnerability-waivers.json` — auditable waiver registry scaffold with required metadata.
- `api-security-headers-baseline.md` — API header policy baseline and verification guidance.

### `scripts`

- `validate-vulnerability-waivers.mjs` — CI validator enforcing waiver shape, owner, and future expiry.

---

## Changed

### `apps/frontend`

- `src/components/auth/RegisterForm.tsx`
  - Persisted draft payload now excludes `password` and `confirmPassword`.
  - Session hydration restores non-sensitive fields only and explicitly keeps password fields memory-only.
  - Exported draft key/helper for focused regression testing.
- `src/routes/$locale/onboarding.tsx`
  - Added route-level `beforeLoad` protected access decision (SSR path), consistent with dashboard contract.
- `src/routes/$locale/auth/-auth-route-contracts.test.ts`
  - Added onboarding coverage for anonymous redirect, unverified redirect, and verified allow-path behavior.
- `src/hooks/useAuthMutation.ts`
  - Converted to compatibility module with canonical hook imports and reduced duplicate auth behavior pathways.
- `src/components/auth/VerifyEmailClient.tsx`
  - Migrated imports from legacy aggregate hook module to canonical email verification hooks.
- `src/hooks/useLoginMutation.ts`
  - Added OAuth capability gate helper (`VITE_PUBLIC_ENABLE_OAUTH_LOGIN`).
  - Updated OAuth unavailable analytics to `capability_unavailable` outcome.
- `src/components/auth/LoginForm.tsx`
  - OAuth controls now render only when capability is enabled.
  - OAuth auto-trigger path now avoids false-failure behavior when capability is disabled.
- `src/lib/observability/auth-funnel-analytics.ts`
  - Extended funnel outcome enum to include `capability_unavailable`.
- `src/vite-env.d.ts`
  - Added `VITE_PUBLIC_ENABLE_OAUTH_LOGIN` env typing.
- `vitest.config.mjs`
  - Expanded critical auth include globs (`auth-access-policy`, `protected-route-session`, protected route files) and raised thresholds.

### `apps/api`

- `Dockerfile`
  - Production stage now builds Vite bundle (`build:vite`) and runtime starts from `dist/cli.mjs`.
- `src/server.ts`
  - Added global `@fastify/helmet` baseline (CSP disabled at API layer; frontend remains CSP owner).
- `src/integration/api-health-metrics.integration.test.ts`
  - Added assertions for security headers on health responses.
- `package.json`
  - Added dependency: `@fastify/helmet`.
- `vitest.config.ts`
  - Added focused coverage configuration and thresholds for auth/tenant critical modules.

### `apps/worker`

- `Dockerfile`
  - Production stage now builds Vite bundle (`build:vite`) and runtime starts from `dist/cli.mjs`.
- `vitest.config.ts`
  - Added coverage configuration and baseline thresholds for tenant/queue critical modules.

### CI / policy / docs

- `.github/workflows/ci.yml`
  - Added waiver validation step.
  - Switched dependency audit to enforced `pnpm audit --audit-level=high`.
  - Added API + worker package coverage steps.
- `.github/workflows/docker-scan.yml`
  - Trivy now fails builds on High/Critical (`exit-code: 1`).
- `scripts/runtime-policy-lint.sh`
  - Added production runtime entrypoint checks for API/worker Dockerfiles.
- `docs/05-reference/dependency-audit-policy.md`
  - Updated policy from informational to enforceable mode with auditable waiver process.
- `docs/docker/container-images.md`
  - Updated runtime entrypoint docs to `node dist/cli.mjs` for API/worker.
- `vitest.config.ts` (repo root)
  - Removed broad app-layer exclusions; app coverage now governed by package-level configs.

---

## Verification

Executed:

- `pnpm --filter @agenticverdict/frontend exec vitest run src/components/auth/RegisterForm.persistence.test.ts src/routes/$locale/auth/-auth-route-contracts.test.ts src/lib/observability/auth-funnel-analytics.test.ts`
- `pnpm --filter @agenticverdict/api exec vitest run src/integration/api-health-metrics.integration.test.ts`
- `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
- `bash scripts/runtime-policy-lint.sh`
- `node scripts/validate-vulnerability-waivers.mjs`

---

## Outcome

P0 and P1 risk areas are now materially reduced: credential persistence risk removed, protected-route policy consistency improved, and CI/runtime security enforcement is stronger and closer to deployment reality. P2 hardening items for hook consolidation, OAuth capability semantics, and API security baseline are now in place with documentation and regression checks.
