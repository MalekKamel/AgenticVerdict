# Frontend Runtime Env Hardening: Incremental Implementation Plan

**Date:** 2026-04-27  
**Status:** Proposed  
**Scope:** Incremental hardening after frontend runtime regression on `/$locale` and production-like tRPC base URL resolution.

---

## 1) Context and problem statement

Recent frontend hardening introduced strict runtime checks for production-like environments:

- `API_URL` / `VITE_PUBLIC_API_URL` are now required for production-like tRPC base URL resolution.
- `VITE_PUBLIC_DEFAULT_TENANT_ID` is now required by the `/$locale` loader.

The implementation intent is correct (fail fast on invalid production config), but the container/runtime wiring did not initially provide the newly required variables, causing `500` responses on `http://localhost:3000/en`.

This plan defines incremental improvements to prevent recurrence, improve operability, and preserve secure fail-closed behavior.

---

## 2) Goals and non-goals

### Goals

- Keep production-like behavior fail-closed for critical runtime env contracts.
- Ensure Docker and local workflows always provide required env values.
- Surface configuration failures earlier (startup/preflight), not only on first request.
- Add CI guardrails so contract drift is caught before merge.
- Clarify tenant default strategy and migration path.

### Non-goals

- Re-architecting tenant resolution across the entire platform.
- Introducing tenant-specific hardcoding in code paths.
- Relaxing production-like auth/runtime guarantees.

---

## 3) Root cause summary

1. Frontend code introduced strict production-like env requirements (correct hardening).
2. Compose and Docker build/runtime configuration were not updated in lockstep.
3. `/$locale` loader moved from constant fallback to required env for default tenant.
4. No startup preflight existed to fail immediately with actionable diagnostics.
5. CI did not assert frontend runtime env contract completeness for container stacks.

---

## 4) Incremental improvements (all items)

## P0: Contract stabilization (immediate)

- Keep and document the split:
  - `API_URL` = frontend SSR/internal API base (`http://api:4000` in Compose network).
  - `VITE_PUBLIC_API_URL` = browser-visible API base (`http://localhost:4000` for local Docker host).
- Standardize and document:
  - `VITE_PUBLIC_DEFAULT_TENANT_ID` as required for current `/$locale` loader behavior.
- Ensure these are present in:
  - `docker-compose.apps.yml`
  - `docker-compose.dev.yml`
  - `.env.docker.example`
  - frontend Docker build args and environment mapping

**Acceptance criteria**

- `GET /` returns redirect to `/$locale`.
- `GET /en` returns `200` in Docker stack.
- No frontend runtime log errors referencing missing `API_URL`, `VITE_PUBLIC_API_URL`, or `VITE_PUBLIC_DEFAULT_TENANT_ID`.

---

## P1: Startup-time config validation (prevent request-time failures)

- Add a small frontend runtime config validator module invoked during server startup.
- Validator should:
  - Detect production-like runtime (`AGENTICVERDICT_RUNTIME_ENV` or `NODE_ENV`).
  - Assert required variables exist and are non-empty:
    - `API_URL` (SSR path)
    - `VITE_PUBLIC_API_URL` (browser path consistency)
    - `VITE_PUBLIC_DEFAULT_TENANT_ID` (current home loader contract)
  - Validate format:
    - URL vars must be valid absolute URLs.
    - tenant ID must be valid UUID.
- Fail fast with actionable error output listing missing/invalid variables.

**Acceptance criteria**

- Container exits early with clear error if contract is invalid.
- Regression tests cover valid and invalid startup config combinations.

---

## P1: CI runtime-contract enforcement

- Add CI checks that assert frontend container contract completeness:
  - Compose render check (`docker compose ... config`) includes required env keys.
  - Static check script validates required env contract for production-like frontend service definitions.
- Gate PRs touching frontend runtime files (`apps/frontend/**`, compose, Dockerfiles) on contract validation.

**Acceptance criteria**

- CI fails when required frontend runtime env is removed or renamed in compose/docker wiring.
- CI output points to missing contract key and target file.

---

## P1: Documentation parity and onboarding safety

- Add required vars to root `.env.example` with clear comments for:
  - host/browser URL
  - internal SSR URL
  - default tenant UUID behavior
- Keep `apps/frontend/README.md`, Docker docs, and runbooks aligned with one canonical contract section.
- Add a "Common misconfigurations" troubleshooting table:
  - symptom
  - likely missing variable
  - exact fix

**Acceptance criteria**

- New developer can run local Docker stack from docs without hidden env assumptions.
- Documentation references use consistent variable names and meanings.

---

## P2: Tenant default strategy hardening

- Short term (retain current behavior): `VITE_PUBLIC_DEFAULT_TENANT_ID` required for `/$locale`.
- Mid term (preferred): remove hard dependency on static default tenant for generic home route by introducing one of:
  1. Tenant resolution from authenticated session first, with fallback only in explicit local-dev mode.
  2. Lightweight unauthenticated public tenant bootstrap endpoint or config artifact.
  3. Explicit route split: demo home route uses demo tenant; production home route uses resolved tenant/session.
- Keep production-like fail-closed guarantees even if fallback behavior is introduced for local development.

**Acceptance criteria**

- Production path no longer depends on a hardcoded implicit tenant assumption.
- Local dev ergonomics preserved through explicit dev-only fallback behavior.

---

## 5) Assessment of using `VITE_PUBLIC_DEFAULT_TENANT_ID`

## Is it a valid solution now?

Yes, for the current implementation it is valid and necessary. The `/$locale` loader explicitly requires it, and supplying it restores deterministic behavior.

## Risks

- Coupling generic home route behavior to a static default tenant can hide tenant-resolution issues.
- Multi-tenant correctness may be reduced if teams rely on the default in places where session/domain resolution should be authoritative.
- Misalignment between environments can cause subtle UX inconsistencies.

## Recommended best approach

- **Best immediate:** keep `VITE_PUBLIC_DEFAULT_TENANT_ID` as a required, validated runtime contract (current fix).
- **Best strategic:** reduce production dependence on a static default tenant by prioritizing session/domain tenant resolution and limiting fallback to explicit dev/demo contexts.

In other words: treat `VITE_PUBLIC_DEFAULT_TENANT_ID` as a controlled compatibility bridge, not the long-term source of truth.

---

## 6) Implementation sequence

1. **Phase A (P0):** finalize env contract wiring + docs sync (done baseline, verify parity).
2. **Phase B (P1):** add startup validator + unit tests.
3. **Phase C (P1):** add CI contract checks for compose/docker env mappings.
4. **Phase D (P1):** update root env docs and troubleshooting matrix.
5. **Phase E (P2):** design and implement tenant default decoupling approach.

---

## 7) Verification plan

- Runtime smoke (Docker):
  - `GET /` -> redirect to locale.
  - `GET /en` -> `200`.
  - Protected route redirects and session probes still function.
- Negative tests:
  - Remove each required env var and verify startup fails with specific actionable message.
- CI checks:
  - Compose render contract check.
  - Runtime contract lint script.
- Frontend tests:
  - Existing route and auth contract tests remain green.

---

## 8) Ownership and rollout

- **Primary owner:** Frontend platform/runtime maintainers.
- **Supporting owners:** DevOps (compose/CI), Architecture (tenant strategy), QA (smoke + regression coverage).
- **Rollout:** Land P0/P1 in one small PR; P2 in a separate design-led PR to reduce risk and ease review.

---

## 9) Final recommendation

Adopt all incremental improvements in this plan. Keep `VITE_PUBLIC_DEFAULT_TENANT_ID` as the current required bridge for `/$locale` loader stability, but prioritize a follow-up to shift production tenant selection toward session/domain resolution as the long-term best architecture.
