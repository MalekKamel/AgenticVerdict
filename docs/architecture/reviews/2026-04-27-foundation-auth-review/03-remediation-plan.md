# Remediation Plan

## Goal

Resolve identified deviations in a risk-first sequence while preserving current delivery momentum for upcoming core pages.

## Remediation Strategy

- **Phase 0 (Immediate):** close critical security/correctness issues
- **Phase 1 (Stabilization):** enforce consistency and governance
- **Phase 2 (Hardening):** improve maintainability and operational resilience

## Phase 0: Immediate Actions (0-3 days)

### 1) Remove sensitive draft persistence (P0)

- Remove `password` and `confirmPassword` from any `sessionStorage` or `localStorage` persistence.
- Keep password fields memory-only.
- Add regression test to assert no credential fields are persisted.
- Owner: Frontend auth
- Success criteria:
  - No password fields appear in serialized draft state.
  - Tests fail if secret fields are reintroduced.

### 2) Align runtime artifact with verified production bundle (P0)

- Standardize API/worker production entrypoints to compiled bundle artifacts.
- Ensure CI verifies the same artifact path used in runtime images.
- Owner: Platform/infrastructure
- Success criteria:
  - Runtime starts from compiled artifact only.
  - CI validates bundle integrity on the same path used for deployment.

## Phase 1: Stabilization (3-10 days)

### 3) Apply route-level guards consistently across protected routes (P1)

- Add route-level auth decisions for all protected route wrappers.
- Retain client hooks only as UX enhancement, not primary protection.
- Implement and enforce via route-guard SSOT: `docs/architecture/ui/04-pages/route-guards-single-source-of-truth.md`.
- Follow execution sequencing from: `docs/architecture/reviews/2026-04-27-route-guard-single-source-of-truth-implementation-plan.md`.
- Owner: Frontend architecture
- Success criteria:
  - Protected routes have uniform `beforeLoad` policy.
  - Contract tests cover anonymous/unverified/verified states consistently.

### 4) Tighten CI quality gates for critical surfaces (P1)

- Define and enforce coverage thresholds for auth/tenant/infrastructure-critical modules.
- Remove broad exclusions that hide app-layer risk without rationale.
- Owner: QA/platform
- Success criteria:
  - CI blocks merges below configured thresholds.
  - Coverage reports include critical runtime paths.

### 5) Make vulnerability checks enforceable by policy (P1)

- Convert severe vulnerability reporting from informational to enforceable with controlled waiver process.
- Track waivers with owner + expiry date.
- Owner: Security/platform
- Success criteria:
  - High/Critical findings fail CI unless waiver is approved.
  - Waivers are time-bound and auditable.

## Phase 2: Hardening (1-3 weeks)

### 6) Consolidate auth hook API surface (P2)

- Choose one canonical set of auth mutation hooks.
- Deprecate duplicate module and migrate imports.
- Owner: Frontend auth
- Success criteria:
  - Single source of truth for auth mutation hooks.
  - No duplicate behavior pathways remain.

### 7) Resolve OAuth UX mismatch (P2)

- Either hide provider buttons behind feature capability flags or implement end-to-end provider flow.
- Update analytics events to distinguish disabled capability from user failure.
- Owner: Frontend product/auth
- Success criteria:
  - UI behavior reflects actual capability state.
  - Funnel metrics become semantically accurate.

### 8) Add API security headers baseline (P2)

- Add secure default header middleware and document CSP policy strategy.
- Owner: API/platform
- Success criteria:
  - Security header baseline active in API runtime.
  - Policy documented and tested.

## Tracking and Governance

- Track each action as an issue with:
  - Priority (`P0/P1/P2`)
  - Owner
  - Due date
  - Verification artifact (test report, CI link, screenshot/log)
- Run a review checkpoint after each phase and re-score residual risks.

## Expected Outcome

After Phases 0 and 1, the implementation should be stable enough for confident expansion into core pages, with materially lower risk around security, regressions, and architectural drift.
