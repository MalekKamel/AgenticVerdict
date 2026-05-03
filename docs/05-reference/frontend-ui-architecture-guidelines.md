# Frontend UI and architecture guidelines

**Status:** Enforced reference (mandatory for frontend implementation work)  
**Date:** 2026-05-03  
**Applies to:** `apps/frontend`, shared UI in `packages/ui`, and coordinated frontend-facing API contract changes in `apps/api`.

---

## 1) Purpose and scope

This document defines enforceable frontend rules for UI and architecture quality. It consolidates standards implemented in the 2026-04-22 UI infrastructure rollout and aligns them with existing repository governance.

Use this as the frontend implementation SSOT for:

- UI system usage (`@agenticverdict/ui`, Mantine v9, tokenized styling)
- route/component/hook/API architecture boundaries
- feature-level UI consistency requirements across all frontend domains (auth, dashboard, reports, connectors, settings, onboarding, admin)
- accessibility, localization, and security constraints
- measurable quality gates and review criteria

If guidance conflicts, precedence is:

1. this document
2. `design-system/README.md`
3. `docs/05-reference/frontend-development-guidelines.md`
4. `CLAUDE.md`

---

## 2) Non-negotiable principles

1. **Single architectural boundary:** frontend domain behavior follows route -> page -> component -> hook/service -> typed API contract.
2. **Design-system first:** UI must reuse `@agenticverdict/ui` and tokenized patterns; one-off visual implementations are exceptions, not defaults.
3. **WCAG 2.1 AA and RTL/LTR parity:** accessibility and localization are release constraints, not polish tasks.
4. **Tenant-safe behavior:** no tenant-specific hardcoding; behavior and branding flow from configuration and tenant context.
5. **Measured quality:** all critical flows must keep test, a11y, and observability gates green.

---

## 3) Architecture contract (required)

### 3.1 Route and feature boundaries

- **MUST** keep route modules thin and declarative.
- **MUST** place mutation/state-transition logic in hooks/services.
- **MUST** preserve typed API boundaries (no ad-hoc domain fetch clients bypassing established contracts).
- **MUST** maintain locale-first route behavior under `/$locale/*`.

**Verification criteria**

- Route files do not contain business branching that belongs in hooks/services.
- New domain calls use established typed API client patterns.

### 3.2 Navigation and flow safety

- **MUST** validate navigation targets derived from query params, external input, or persisted UI state before route transitions.
- **MUST** prevent loop-prone transitions for protected and entry routes.
- **MUST** provide deterministic fallback destinations when targets are unsafe, invalid, or absent.
- **MUST** preserve role/tenant/feature-flag guard behavior for protected feature routes.
- **MUST** avoid **duplicated locale segments** when resolving redirect targets: compose localized URLs with **`withLocalePrefix`** (see [`router-navigation-guide.md`](./router-navigation-guide.md)); store **`redirect`** query values as **locale-relative** paths when matching SSR guard conventions (**`buildProtectedRedirectTarget`**).
- **MUST** align **`beforeLoad`** authentication with **real session probes** (`fetchProtectedRouteSession` on SSR, documented SPA deferral)—**MUST NOT** treat absent/unwired **`context.auth`** (or equivalent) as proof the user is signed out.

**Verification criteria**

- Unit tests cover safe internal navigation, blocked loop targets, and fallback behavior.
- E2E confirms no loop-prone routing for changed protected flows.

### 3.3 Runtime compatibility

- **MUST** guard server-only APIs in shared/browser-imported modules.
- **MUST** fail safely in browser/runtime environments where server primitives are unavailable.

**Verification criteria**

- Browser bundles do not crash from server-only imports.
- Guarded paths are covered by focused unit tests where practical.

---

## 4) UI system usage rules (required)

### 4.1 Component and layout reuse

- **MUST** use shared layout/shell patterns for each feature domain and route group (auth, app shell, settings, reporting, etc.).
- **MUST** prefer existing atoms/molecules from `@agenticverdict/ui` before creating new UI primitives.
- **MUST NOT** introduce parallel layout/component variants when an approved reusable pattern exists.

### 4.2 Styling and tokens

- **MUST** use design tokens/CSS variables for colors, borders, surface, and focus states.
- **MUST NOT** introduce hardcoded one-off color classes where token equivalents exist.
- **SHOULD** keep interaction-state visuals (loading/error/success/info) consistent across all feature forms and async views.

**Verification criteria**

- Changed feature surfaces are tokenized and consistent with design-system patterns.
- Reviewer checklist confirms no unexplained one-off styling drift.

<!-- TODO: force in the future -->
<!-- ### 4.3 `.pen` workflow

- **MUST** read and modify `.pen` files only through Pencil MCP tools.
- **MUST** run `pnpm run validate:pen-files` after `.pen` changes. -->

---

## 5) Accessibility and localization rules (required)

### 5.1 Accessibility (WCAG 2.1 AA)

- **MUST** provide semantic landmarks and appropriate live regions for async status/errors.
- **MUST** support keyboard access for all interactive controls.
- **MUST** provide visible focus states and accurate ARIA semantics.

**Verification criteria**

- No new critical/serious violations in automated a11y checks for changed routes.
- Keyboard traversal is validated for changed controls.

### 5.2 Localization and directionality

- **MUST** externalize user-facing copy and keep locale key structures aligned across shipped locales.
- **MUST** implement RTL/LTR using logical properties and locale-aware behavior.
- **MUST NOT** rely on locale-specific message substring matching for core logic where stable codes are feasible.

**Verification criteria**

- `pnpm --filter @agenticverdict/frontend run i18n:validate` passes for locale parity.
- Changed flows are checked in both LTR and RTL locales when layout/strings are touched.

---

## 6) Security and observability rules (required)

### 6.1 Security and privacy

- **MUST** keep session, navigation, and protected-route flows resistant to redirect abuse and loop states.
- **MUST** avoid logging credentials, tokens, or sensitive user data.
- **MUST** maintain CSP/header-sensitive patterns for frontend runtime changes that touch these concerns.

### 6.2 Observability standards

- **MUST** emit structured feature-level events for critical user journeys (auth, onboarding, reporting, dashboard actions, settings updates, connector operations).
- **MUST** include latency and normalized outcome classification for async operations where available.
- **MUST** keep telemetry tenant-safe and free of raw secrets.

**Verification criteria**

- Unit tests exist for observability helper payload contracts.
- Changed critical flows continue emitting expected structured events.

---

## 7) Quality gates and measurable thresholds

Changes in critical frontend paths are not complete until all relevant gates pass:

1. Type safety: `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
2. Targeted unit tests for changed critical logic (routing guards, hooks/services, observability, state transitions)
3. Relevant E2E scenarios for changed feature journeys
4. Accessibility checks for changed surfaces
5. Locale parity validation when translation keys or localized UX are touched

Target quality thresholds for critical frontend surfaces:

- critical-path E2E pass rate >= 98% in CI
- critical/serious accessibility violations on changed critical routes = 0
- critical-domain logic coverage target >= 80%
- redirect-loop incidents for changed protected flows in staging validation = 0
- critical-flow telemetry completeness target >= 95%

---

## 8) Exception and waiver policy

Any deviation from a **MUST** rule requires:

1. explicit PR note with rationale
2. risk statement and mitigation
3. owner and follow-up due date

Undocumented deviations are considered non-compliant.

---

## 9) Implementation checklist (definition of done)

Use `docs/05-reference/frontend-ui-architecture-guidelines-checklist.md` in implementation and review.

Minimum done criteria:

- architecture boundaries preserved
- design-system and token usage preserved
- accessibility and locale parity validated for changed scope
- critical tests and quality gates passed
- deviations documented with waiver details (if any)

---

## 10) Traceability

This guideline synthesizes and enforces standards from:

- `docs/03-technology-research/frontend/ui-infrastructure-research-and-implementation-plan-2026-04-22.md`
- `changelog/2026-04-22-ui-infrastructure-phase-a-auth-stabilization-implementation.md`
- `changelog/2026-04-22-ui-infrastructure-phase-b-quality-compliance-hardening-implementation.md`
- `docs/05-reference/frontend-development-guidelines.md`
- `design-system/README.md`

Document review cadence: quarterly, or immediately after major frontend architecture shifts.
