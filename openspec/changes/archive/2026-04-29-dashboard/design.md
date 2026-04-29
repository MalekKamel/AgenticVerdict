## Context

The existing dashboard route in `apps/frontend/src/routes/$locale/dashboard` is a prototype that does not satisfy production governance for architecture boundaries, accessibility, localization, and tenant safety. This change spans route composition, page orchestration, shared UI state patterns, and verification workflows, so a cross-cutting design is required before implementation. The solution must align with frontend governance precedence and deliver four dashboard surfaces (home, domain, agency/client, customization) without introducing tenant-specific logic.

## Goals / Non-Goals

**Goals:**

- Establish a production dashboard architecture with strict layering: route -> page -> component -> hook/service -> typed API.
- Deliver shared dashboard interaction primitives (filters, refresh, async-state handling) that are reused across all dashboard surfaces.
- Enforce route safety, tenant context propagation, tenant-scoped data/cache keys, and safe fallback behavior.
- Ensure WCAG 2.1 AA conformance and LTR/RTL localization support through reusable patterns rather than one-off fixes.
- Define release-hardening evidence gates for architecture, accessibility, i18n/RTL, route safety, and tenant safety.

**Non-Goals:**

- Implementing optional real-time streaming updates beyond existing backend support.
- Introducing new product analytics domains outside the four planned dashboard surfaces.
- Redesigning the global navigation system outside dashboard-specific guard and transition behavior.
- Replacing existing shared UI library primitives when equivalent `@agenticverdict/ui` components already exist.

## Decisions

### 1) Rebuild from a clean route skeleton instead of incrementally patching prototype code

- **Decision:** Remove prototype dashboard behavior from active route flow and start from a minimal guarded route/page scaffold.
- **Rationale:** Prototype code has mixed concerns and weak contract boundaries; incremental patching increases regression risk and leaves latent architecture debt.
- **Alternative considered:** Refactor prototype in place. Rejected because it makes layering verification and decommission completeness difficult.

### 2) Use a shared dashboard state model with deterministic async-state transitions

- **Decision:** Centralize shared state for range/comparison/context/view mode and define explicit loading, empty, error, success, partial, and refetch transitions.
- **Rationale:** Multiple surfaces require parity and predictable behavior for refresh/retry interactions.
- **Alternative considered:** Per-surface ad hoc state. Rejected because it creates inconsistent UX and duplicated edge-case logic.

### 3) Canonicalize route guards and redirect handling

- **Decision:** Keep route modules thin and place redirect ownership in canonical `beforeLoad` guard flow with target sanitization and deterministic fallback. Following the same approach in authentication pages.
- **Rationale:** Prevents redirect loops and unsafe target handling while preserving predictable deep-link behavior.
- **Alternative considered:** Mixed guard logic in route + page lifecycle. Rejected due to loop risk and harder testability.

### 4) Enforce tenant-safe data contracts at every dashboard query boundary

- **Decision:** Require tenant context for tenant-owned reads, use tenant-scoped cache keys, and return stable typed errors for missing/mismatched context.
- **Rationale:** Multi-tenant isolation is non-negotiable and must be guaranteed by default.
- **Alternative considered:** Soft tenant inference from client state. Rejected because inference can drift from server truth and risk leakage.

### 5) Build dashboard UI from design-system components with accessibility and localization baked in

- **Decision:** Compose dashboard sections using `@agenticverdict/ui` + Mantine v9 patterns, externalize copy, and use direction-aware layout primitives.
- **Rationale:** Ensures consistency, token compliance, keyboard operability, and RTL/LTR correctness across surfaces.
- **Alternative considered:** Custom one-off dashboard widgets. Rejected due to governance violations and higher maintenance cost.

### 6) Gate release with evidence-based validation

- **Decision:** Require targeted type checks, i18n validation when strings change, unit/integration tests for guard/data/state behavior, and critical-path E2E.
- **Rationale:** Dashboard spans high-risk UX and safety boundaries; evidence must be explicit for release sign-off.
- **Alternative considered:** Rely mostly on manual QA. Rejected because it is insufficient for tenant and route-safety regressions.

## Risks / Trade-offs

- **[Risk] Scope expansion across multiple surfaces** -> **Mitigation:** Phase-gated implementation with clear acceptance criteria per surface before enabling next phase.
- **[Risk] Hidden prototype dependencies reintroduced during migration** -> **Mitigation:** Decommission checklist and route-tree verification to confirm prototype code is not active.
- **[Risk] Async-state inconsistency across surfaces** -> **Mitigation:** Shared state/async components and parity tests for each surface.
- **[Risk] Tenant safety regressions in aggregate agency/client views** -> **Mitigation:** Negative-path tests for missing/mismatched tenant context and explicit scoping assertions.
- **[Risk] Accessibility/RTL regressions late in cycle** -> **Mitigation:** Include accessibility and direction checks in feature-level completion gates, not only final hardening.

## Migration Plan

1. Decommission active prototype dashboard route behavior while preserving validated reusable utilities only.
2. Introduce new guarded dashboard route/page skeleton with strict layering and typed contracts.
3. Implement home baseline surface first, then domain, agency/client, and customization surfaces with shared primitives.
4. Enable and verify tenant-scoped querying/caching and standardized async-state handling across all surfaces.
5. Execute hardening gates (type/test/i18n/a11y/RTL/tenant-safety/route-safety evidence) and finalize release readiness packet.
6. Rollback strategy: retain prior deploy artifact and route feature gate control to revert dashboard rollout if critical defects appear.

## Open Questions

- Should release 1 launch all dashboard surfaces simultaneously or use a phased feature-flag rollout?
- What default auto-refresh policy is required (global default only vs role/tenant configurable)?
- Which surfaces require real-time updates at launch, and what is the mandatory fallback when streams are unavailable?
- For layout persistence, what precedence should apply between tenant defaults and user overrides?
- What is the final permission model and security policy for export/share actions?
