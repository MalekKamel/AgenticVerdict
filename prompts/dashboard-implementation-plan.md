# Dashboard Rebuild Implementation Plan (Refined)

## 1) Objective

Replace the current prototype at `/apps/frontend/src/routes/$locale/dashboard` with a production-ready dashboard implementation that is:

- architecture-compliant,
- design-system compliant,
- WCAG 2.1 AA accessible,
- RTL/LTR correct,
- and multi-tenant safe by default.

## 2) Governance and Source-of-Truth Precedence

When guidance conflicts, apply this order:

1. `/docs/05-reference/frontend-ui-architecture-guidelines.md`
2. `/design-system/README.md`
3. `/docs/05-reference/frontend-development-guidelines.md`
4. `/CLAUDE.md`

Additional authoritative sources used for this plan:

- `/docs/architecture/ui/00-overview.md`
- `/docs/architecture/ui/04-pages/dashboard.md`
- `/docs/architecture/ui/01-research-findings/best-practices.md`
- `/docs/architecture/ui/01-research-findings/accessibility-standards.md`
- `/docs/architecture/ui/04-pages/route-guards-single-source-of-truth.md`
- `/docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`
- `/docs/architecture/business/business-architecture.md`
- `/docs/04-project-management/requirements.md`
- `/docs/04-project-management/roadmap-development.md`
- `/docs/04-project-management/future-roadmap-gaps-and-enhancements-2026-04-08.md`
- `/specs/00-core/02-intelligence/README.md`
- `/specs/00-core/03-insights/README.md`
- `/specs/00-core/04-production-hardening/acceptance-criteria.md`

## 3) Requirements Baseline (MUST/SHOULD/MAY)

### MUST

1. Remove prototype dashboard implementation and rebuild from clean architecture boundaries.
2. Keep route layering strict: route -> page -> component -> hook/service -> typed API.
3. Use `@agenticverdict/ui` and Mantine v9 patterns; avoid one-off primitives.
4. Implement Home, Domain, Agency, and Customization dashboard surfaces.
5. Support standardized loading, empty, error, success, and partial-data states.
6. Ensure route safety (no redirect loops, no unsafe redirect targets).
7. Meet WCAG 2.1 AA and full keyboard operability.
8. Support LTR/RTL and locale-aware formatting from config, not hardcoded logic.
9. Enforce multi-tenant safety: tenant context propagation, tenant-scoped data access/caching, no tenant hardcoding.
10. Do not use `any` in production code.

### SHOULD

1. Implement refresh model (manual + interval-based auto-refresh + freshness indicator).
2. Implement export/share flows with role-based permission controls.
3. Deliver progressive rendering (critical KPI first, heavier blocks after).
4. Add standardized shortcuts/help patterns if keyboard shortcuts are included.

### MAY

1. Add optional real-time updates where backend support is available.
2. Include advanced comparison and drill-down enhancements not required for initial go-live.

## 4) Conflict Resolution Decisions (Applied)

1. **Framework/version drift in legacy research docs**
   - Decision: treat TanStack Start + Mantine v9 architecture docs as implementation authority; treat older framework references as conceptual only.
2. **RTL sidebar directional inconsistency in page doc wording**
   - Decision: enforce logical mirroring through direction-aware layout and logical CSS properties.
3. **Breakpoint and mobile nav pattern variance across docs**
   - Decision: follow dashboard page spec as baseline; record alternatives as post-release UX enhancements.
4. **Keyboard shortcut set mismatch across documents**
   - Decision: maintain one canonical shortcut registry and expose shortcut help in a unified pattern.

## 5) Current-State Analysis and Decommission Plan

The existing dashboard route is prototype-grade and does not represent the required production model.

### Decommission actions

1. Audit prototype files and classify:
   - reusable generic utilities,
   - disposable prototype UI/state logic,
   - migration blockers.
2. Remove disposable prototype logic and route wiring.
3. Preserve only reusable utility code that passes governance checks.
4. Confirm no prototype components remain in active route tree.

## 6) Target Solution Architecture

### Route and guards

- Keep route files minimal; no business logic in route modules.
- Use canonical route guard patterns and `beforeLoad` redirect ownership.
- Validate all redirect targets and apply deterministic safe fallbacks.

### Data contracts and state

- Use typed tRPC contracts only.
- Centralize dashboard state for date range, comparison, domain/client context, and view mode.
- Ensure deterministic transitions for loading/refetch/error/partial recovery.
- Keep cache keys tenant-scoped (and user-scoped where required).

### UI composition

- Build with reusable atoms/molecules/organisms from shared design system.
- Standardize core sections:
  - KPI overview,
  - insights summary,
  - connector health,
  - chart/table panels,
  - quick actions.
- Standardize async states and retry patterns through shared components.

### Accessibility and localization

- Externalize all copy.
- Ensure focus visibility, semantics, landmarks, and aria live/status behavior for async updates.
- Validate interaction and layout in both LTR and RTL.

### Multi-tenant safety integration

- Require tenant context for tenant-owned reads/writes.
- Reject missing/mismatched tenant inputs with stable error semantics.
- Prevent cross-tenant data aggregation in UI queries and server responses.
- Keep logs telemetry-safe (no secrets/tokens/raw PII).

## 7) Comprehensive Phased Plan

## Phase 0 - Alignment and Execution Readiness

Goal: lock scope, constraints, and acceptance criteria before coding.

Tasks:

1. Build requirement traceability matrix (see Section 9).
2. Confirm surface scope for release 1 (full vs staged rollout).
3. Finalize route map and module ownership.
4. Finalize validation matrix and evidence format.

Exit criteria:

- Approved scope statement.
- Approved acceptance checklist.
- Approved test/evidence checklist.

## Phase 1 - Prototype Removal and Architecture Skeleton

Goal: establish clean implementation foundation.

Tasks:

1. Remove existing prototype route implementation.
2. Create new route/page/component/hook/service skeleton.
3. Add guarded navigation and deterministic fallback behavior.
4. Create common dashboard layout shell and shared async-state components.

Exit criteria:

- Prototype route removed from active behavior.
- New skeleton typechecks.
- Guarded navigation tests for loop prevention are passing.

## Phase 2 - Home Dashboard (Core Baseline)

Goal: deliver production-ready home dashboard.

Tasks:

1. Implement KPI overview (3-5 core metrics).
2. Implement recent insights and connector health.
3. Implement date range, comparison, and persistence behavior.
4. Implement loading/empty/error/partial/refresh states.
5. Implement drill-down interactions and breadcrumbs.

Exit criteria:

- Home dashboard meets documented behavior.
- Async state matrix complete and tested.
- Accessibility and i18n checks pass for home surface.

## Phase 3 - Domain Dashboards

Goal: deliver domain-specific experiences with shared architecture.

Tasks:

1. Implement domain routes and template composition model.
2. Implement domain KPI/chart/table sections.
3. Enforce shared filter and refresh behavior parity.
4. Validate route transitions and deep-link stability.

Exit criteria:

- All target domain routes functional.
- Shared interaction parity achieved.
- Tenant scoping verified for domain data flows.

## Phase 4 - Agency and Client Context Dashboards

Goal: deliver agency aggregate and client-specific dashboards safely.

Tasks:

1. Implement agency overview.
2. Implement client switcher and client mode route behavior.
3. Implement agency-specific comparison interactions (if in release scope).
4. Verify strict client/tenant isolation in data views.

Exit criteria:

- Agency overview and client mode fully functional.
- No cross-tenant/client data leakage paths in tests.

## Phase 5 - Customization and Layout Persistence

Goal: support controlled personalization with role-based permissions.

Tasks:

1. Implement view/edit mode transitions.
2. Implement add/remove/reorder widget interactions.
3. Implement save/reset and restore behavior.
4. Implement role-based customization permissions.

Exit criteria:

- Customization lifecycle deterministic across sessions.
- Permission restrictions enforced and tested.

## Phase 6 - Hardening and Release Readiness

Goal: complete quality, compliance, and operational evidence gates.

Tasks:

1. Complete WCAG 2.1 AA and keyboard audits.
2. Complete RTL/LTR and locale validation.
3. Complete tenant-safety verification and negative-path tests.
4. Execute mandatory type/test/i18n/e2e checks.
5. Produce release evidence packet and obtain sign-off.

Exit criteria:

- All mandatory checks pass.
- No critical/high unresolved defects.
- Engineering + Product + QA sign-off completed.

## 8) Validation, Test Strategy, and Evidence Pack

### Mandatory commands

- `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/frontend run i18n:validate` (required when locale strings/keys are touched)
- `pnpm --filter @agenticverdict/frontend test -- <targeted-spec-pattern>`
- Dashboard critical-path E2E flows (protected route behavior, navigation safety, key user journeys)
- If `.pen` files are changed: `pnpm run validate:pen-files`

### Required evidence categories

1. Architecture compliance evidence.
2. Design-system and token compliance evidence.
3. Accessibility evidence (including keyboard/focus/contrast checks).
4. LTR/RTL and locale validation evidence.
5. Tenant-safety evidence (including mismatch/missing-context negative tests).
6. Route safety evidence (loop prevention and redirect sanitization).
7. Resilience evidence for loading/empty/error/partial/refetch behavior.

## 9) Requirements Traceability Matrix (Execution Control)

1. **Req: Replace prototype route**
   - Implementation: Phase 1 decommission + skeleton.
   - Verification: route tree and regression tests.
2. **Req: Home/domain/agency/customization surfaces**
   - Implementation: Phases 2-5.
   - Verification: surface-level functional tests + E2E.
3. **Req: Accessibility (WCAG 2.1 AA)**
   - Implementation: all phases with a11y checks built in.
   - Verification: automated/manual accessibility checks.
4. **Req: RTL/LTR and localization**
   - Implementation: all UI modules direction-safe and string externalized.
   - Verification: i18n validation + dual-direction UI validation.
5. **Req: Multi-tenant safety**
   - Implementation: tenant-scoped data, cache, and context propagation.
   - Verification: negative-path tests + scoping assertions.
6. **Req: Route safety**
   - Implementation: canonical guard flow with redirect sanitization.
   - Verification: guard unit/integration/E2E tests.

## 10) Risk Register and Mitigation Plan

1. **Scope growth across variants**
   - Mitigation: hard phase gates and release-scope lock in Phase 0.
2. **Cross-tenant leakage through aggregation paths**
   - Mitigation: tenant-scope assertions and negative-path tests on every query path.
3. **Inconsistent async-state UX**
   - Mitigation: shared async-state components and required per-surface state matrix.
4. **Localization/RTL regression**
   - Mitigation: required LTR/RTL checks in acceptance and CI.
5. **Guard/redirect regressions**
   - Mitigation: canonical guard factories and deterministic fallback tests.
6. **Operational readiness gaps**
   - Mitigation: release evidence packet required for go/no-go.

## 11) Deliverables

1. Rebuilt dashboard implementation across route/page/component/hook/service layers.
2. Updated localization resources for all new/changed strings.
3. Test coverage updates for critical logic and user journeys.
4. Compliance packet with accessibility, RTL/LTR, tenant-safety, and route-safety evidence.
5. Release readiness report with known limitations and deferred items.

## 12) Open Decisions (Must Be Resolved Early)

1. First-release scope: all dashboard surfaces vs phased feature flag rollout.
2. Default refresh interval policy (global vs role/tenant configurable).
3. Real-time update scope and fallback behavior.
4. Layout persistence precedence (tenant defaults vs user overrides).
5. Export/share permission and link security policy.
