# Changelog: Frontend runtime env hardening — incremental implementation (P0/P1)

**Date:** 2026-04-27  
**Scope:** Execution of the incremental hardening plan in [`docs/architecture/reviews/2026-04-27-frontend-runtime-env-hardening-incremental-implementation-plan.md`](../docs/architecture/reviews/2026-04-27-frontend-runtime-env-hardening-incremental-implementation-plan.md) for frontend runtime environment contract stability, startup fail-fast validation, CI contract enforcement, and documentation parity.

**Verification run:** `pnpm --filter @agenticverdict/frontend exec vitest run src/lib/runtime/validate-frontend-runtime-env.test.ts src/lib/auth/resolve-server-api-base-urls.test.ts`, `bash scripts/validate-frontend-runtime-env-contract.sh`.

---

## Summary

### P0 — Contract stabilization and parity checks

- Preserved and reinforced the contract split:
  - **`API_URL`** for frontend SSR/internal API resolution.
  - **`VITE_PUBLIC_API_URL`** for browser-visible API resolution.
  - **`VITE_PUBLIC_DEFAULT_TENANT_ID`** for current `/$locale` home loader contract.
- Kept Docker wiring aligned across:
  - `docker-compose.apps.yml`
  - `docker-compose.dev.yml`
  - `.env.docker.example`
  - `apps/frontend/Dockerfile`
- Added explicit CI/runtime checks so drift in this contract is detected before merge.

### P1 — Startup-time config validation

- Added a dedicated frontend startup validator that runs in production-like runtime and fails fast with actionable diagnostics if required env variables are missing/invalid.
- Validator enforces:
  - `API_URL` is present and absolute `http(s)` URL.
  - `VITE_PUBLIC_API_URL` is present and absolute `http(s)` URL.
  - `VITE_PUBLIC_DEFAULT_TENANT_ID` is present and valid UUID.
- Validator is invoked during startup initialization in `apps/frontend/src/start.ts`, moving failure from first-request time to startup time.

### P1 — CI runtime-contract enforcement

- Added `scripts/validate-frontend-runtime-env-contract.sh` to validate:
  - Static contract declarations in compose/env/Dockerfile files.
  - Rendered compose stacks include required frontend runtime environment keys.
- Wired the script into:
  - `.github/workflows/ci.yml`
  - `.github/workflows/docker-compose-validate.yml`
- Updated image workflows to pass required frontend build args:
  - `.github/workflows/docker-build.yml`
  - `.github/workflows/docker-release.yml`

### P1 — Documentation parity and onboarding safety

- Added frontend runtime contract section to root `.env.example`.
- Updated `apps/frontend/README.md` environment guidance to use the canonical contract values and semantics.
- Added a “Runtime env misconfigurations (production-like)” troubleshooting table mapping symptom → missing/invalid variable → exact fix.
- Updated `docs/docker/container-images.md` with a dedicated frontend runtime env contract section and fail-fast behavior note.

---

## Added

### `apps/frontend`

- **`src/lib/runtime/validate-frontend-runtime-env.ts`**
  - Startup-time runtime env contract validator for production-like runtime.
  - Aggregates missing/invalid variable diagnostics into one actionable error.
- **`src/lib/runtime/validate-frontend-runtime-env.test.ts`**
  - Positive and negative unit coverage for required env contract behavior.

### `scripts`

- **`validate-frontend-runtime-env-contract.sh`**
  - Static and rendered-compose checks for required frontend runtime env contract keys.

---

## Changed

### `apps/frontend`

- **`src/start.ts`**
  - Invokes `validateFrontendRuntimeEnvContract()` during startup to fail fast in production-like runtime.
- **`README.md`**
  - Canonicalized env contract instructions.
  - Added misconfiguration troubleshooting matrix.

### Root / Docker / CI

- **`.env.example`**
  - Added documented frontend runtime env contract variables and semantics.
- **`docs/docker/container-images.md`**
  - Added frontend runtime env contract section for production-like deployments.
- **`.github/workflows/ci.yml`**
  - Added `Frontend runtime env contract` check step.
- **`.github/workflows/docker-compose-validate.yml`**
  - Added `Frontend runtime env contract` check step.
- **`.github/workflows/docker-build.yml`**
  - Frontend image build now passes `VITE_PUBLIC_API_URL` and `VITE_PUBLIC_DEFAULT_TENANT_ID` build args.
- **`.github/workflows/docker-release.yml`**
  - Frontend image release build now passes `VITE_PUBLIC_API_URL` and `VITE_PUBLIC_DEFAULT_TENANT_ID` build args.

---

## Plan mapping

| Plan section                              | Delivered                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **P0: Contract stabilization**            | Compose + Docker + env template contract preserved and re-validated with explicit script checks.                  |
| **P1: Startup-time config validation**    | Dedicated startup validator module and test suite; startup invocation in `start.ts`.                              |
| **P1: CI runtime-contract enforcement**   | New contract script + CI wiring in both general quality and compose validation workflows.                         |
| **P1: Documentation parity**              | `.env.example`, frontend README, and Docker docs aligned to one contract vocabulary and troubleshooting guidance. |
| **P2: Tenant default strategy hardening** | Not implemented in this increment; current `VITE_PUBLIC_DEFAULT_TENANT_ID` bridge retained intentionally.         |

---

## Follow-ups

- Implement P2 tenant-default decoupling path (session/domain-first production resolution with explicit dev-only fallback).
- Add Docker smoke assertion (`GET /` redirect and `GET /en` `200`) in CI after compose up for runtime contract end-to-end verification.
- Extend frontend runtime contract checks to fail on accidental key renames in additional deployment overlays.

---

## References

- [`docs/architecture/reviews/2026-04-27-frontend-runtime-env-hardening-incremental-implementation-plan.md`](../docs/architecture/reviews/2026-04-27-frontend-runtime-env-hardening-incremental-implementation-plan.md)
- [`changelog/2026-04-17-web-tanstack-post-review-p1-p2-implementation.md`](2026-04-17-web-tanstack-post-review-p1-p2-implementation.md)
