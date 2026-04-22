# App Shell Modern UI/UX Implementation Plan

**Status:** Implementation-ready planning document  
**Date:** 2026-04-22  
**Scope:** `apps/frontend/src/components/layout/AppShellLayout.tsx` and adjacent shell primitives

---

## 1) Current State Assessment

### 1.1 Strengths in the current shell

- A valid baseline shell exists with Mantine `AppShell`, header, navbar, and main content composition.
- Foundational localization and direction readiness is present through `useTranslations("Layout")` and locale-aware language switching.
- Theme control is already wired through Mantine color scheme APIs and translatable accessibility labels.
- Mobile-first affordance exists via burger-controlled navbar collapse behavior.

### 1.2 Weaknesses and UX/UI gaps

- The navigation experience is placeholder-level: the navbar only renders helper text and does not expose real information architecture.
- Desktop and tablet shell behavior is incomplete: `AppShell.Navbar` is hidden at `sm+` while the burger is also hidden at `sm+`, leaving no clear navigation affordance at larger breakpoints.
- No active-route indication, route grouping, or section hierarchy exists, which weakens orientation and discoverability.
- Global action controls are functional but minimal: language switcher uses raw locale codes (`EN`/`AR`) and theme toggle uses glyph-only icons without explicit state text or tooltip support.
- Shell-level feedback patterns are missing (loading, error, empty-state handling for navigation/session bootstrap).
- No shell-specific observability for navigation interactions and route-transition outcomes is defined.

### 1.3 Technical and design constraints

- Frontend governance requires design-system-first implementation with `@agenticverdict/ui`, Mantine v9 patterns, and tokenized styling.
- Changes must preserve locale-first routing (`/$locale/*`) and support robust RTL/LTR behavior with logical properties.
- Accessibility is a release constraint (WCAG 2.1 AA), including keyboard reachability, semantic landmarks, and visible focus states.
- Tenant and feature behavior must remain configuration-driven and guard-safe (no hardcoded tenant-specific nav logic).
- Shell changes are subject to existing quality gates: type safety, route/auth stability tests, locale parity checks, and a11y validation.

---

## 2) Target Experience Definition

### 2.1 Product vision (web, desktop, mobile)

- Deliver a single, consistent shell mental model that adapts across breakpoints:
  - **Desktop:** persistent sidebar/rail with clear section hierarchy.
  - **Tablet:** adaptive rail + expandable context navigation.
  - **Mobile:** drawer-first navigation with fast global controls.
- Preserve user context on shell-level actions (language/theme/navigation) and reduce disruption during route transitions.
- Make orientation explicit: users should always understand where they are, what they can access, and what changed.

### 2.2 Core experience principles

1. **Usability:** predictable navigation structure, active-state clarity, and frictionless global actions.
2. **Accessibility:** semantic shell landmarks, keyboard-complete interactions, and ARIA-compliant state communication.
3. **Responsiveness:** parity of core tasks across mobile/tablet/desktop, with breakpoint-specific ergonomics.
4. **Consistency:** tokenized visuals and shared shell primitives rather than route-specific custom shells.
5. **Resilience:** graceful loading/error/empty behavior at shell level.
6. **Internationalization parity:** equal UX quality in LTR and RTL with locale-safe route behavior.

---

## 3) Architecture and Design Strategy

### 3.1 Component structure recommendations

Refactor the monolithic shell into composable units with clear responsibilities:

- `AppShellLayout` (orchestrator)
- `AppHeader` (brand, breadcrumbs/context, global actions)
- `AppNavigation` (primary nav container, responsive behavior)
- `AppNavList` (typed nav rendering with active states)
- `AppGlobalActions` (language/theme/profile/support actions)
- `AppShellStatusRegion` (loading/error/announcement live region)

### 3.2 Layout system approach

- Define one canonical navigation model and render adaptively:
  - desktop persistent sidebar/rail
  - mobile drawer
- Avoid divergent markup paths that drift between breakpoints.
- Add skip link and deterministic focus management between header/nav/main.
- Reserve shell slots for page-level context actions and section metadata.

### 3.3 Navigation architecture

- Introduce a typed navigation schema (id, route key, i18n key, icon, feature-flag guard, role/tenant visibility).
- Use guard-safe destination resolution to prevent invalid targets and redirect loops.
- Implement fallback destinations for inaccessible or stale links.
- Preserve route query/search/hash where valid when switching locale.

### 3.4 Styling, theming, and token strategy

- Use design tokens/CSS variables for shell surfaces, border hierarchy, hover/focus states, and density.
- Standardize interaction-state visuals (loading/error/success/info) across shell and route content areas.
- Promote reusable shell atoms/molecules into `@agenticverdict/ui` to prevent duplicate local variants.
- Ensure dark/light mode and RTL/LTR behavior are validated as first-class concerns.

### 3.5 Scalability considerations

- Keep route modules declarative; place shell behavior in hooks/services.
- Support tenant/feature-flag evolution without restructuring shell components.
- Add shell event instrumentation hooks early so usage and regressions are measurable.

---

## 4) UX Improvement Plan

### 4.1 Navigation and information hierarchy

- Replace placeholder navbar with primary sections and section-level grouping.
- Add active item and expanded-group indicators for strong orientation.
- Add breadcrumb integration for deeper route contexts.
- Define section ordering and naming from product IA and route inventory.

### 4.2 Interaction patterns

- Standardize header and nav interactions:
  - nav open/close
  - collapse/expand rail
  - keyboard navigation and escape handling
  - focus return after drawer close
- Persist shell UI preferences (for example collapsed nav) in tenant/user-scoped storage.
- Keep all interactions predictable across breakpoints.

### 4.3 Feedback states and resilience

- Add shell bootstrap states:
  - loading skeleton
  - empty state for no permitted modules
  - inline recoverable error with retry action
- Use user-safe error messaging with no internal leakage.
- Add non-blocking status announcements for async shell transitions.

### 4.4 Accessibility expectations (WCAG 2.1 AA)

- Semantic landmarks: `header`, `nav`, `main`, and skip-to-content pattern.
- Keyboard-complete traversal for all shell controls and nav items.
- ARIA semantics for toggles and disclosure state (`aria-expanded`, `aria-controls`, labels).
- Visible focus state conformity with token system and color-contrast requirements.

### 4.5 Internationalization and RTL/LTR readiness

- Externalize all shell text across supported locales.
- Use logical spacing/alignment properties rather than left/right assumptions.
- Validate mirrored behavior in Arabic for drawer direction, icon placement, and alignment.
- Ensure locale switch preserves equivalent destination context whenever route is valid.

---

## 5) Implementation Roadmap

### 5.1 Phase 1 (short-term, 0-2 sprints): Stabilize and establish shell foundations

**Goals**

- Replace prototype navbar with functional navigation.
- Close critical responsive and accessibility gaps.
- Establish typed shell contracts.

**Prioritized tasks**

1. Define shell information architecture and route grouping.
2. Implement typed navigation model + guard-safe route resolver.
3. Replace navbar placeholder with `AppNavigation` and active-state rendering.
4. Fix breakpoint behavior to ensure nav affordance on desktop/tablet/mobile.
5. Add semantic landmarks, skip link, and base keyboard support.

**Dependencies**

- Product-approved route inventory and guard/feature-flag mapping.

### 5.2 Phase 2 (mid-term, 2-5 sprints): Harden behavior and consistency

**Goals**

- Improve resilience, tenant-aware behavior, and shell UX consistency.

**Prioritized tasks**

1. Add shell loading/error/empty states and retry affordances.
2. Implement tenant/role/feature-flag navigation filtering.
3. Add breadcrumb and context-slot framework.
4. Persist shell preferences in user+tenant scoped state.
5. Instrument shell interactions and route-transition outcomes.

**Dependencies**

- Stable typed nav model from Phase 1.
- Auth/session and feature-flag contracts available via existing typed API patterns.

### 5.3 Phase 3 (long-term, 5+ sprints): Optimize and operationalize

**Goals**

- Improve performance and scale shell patterns across product surfaces.

**Prioritized tasks**

1. Optimize rendering and route prefetch behavior for high-frequency nav paths.
2. Expand advanced interaction affordances (command palette, quick switchers as needed).
3. Publish reusable shell primitives to `@agenticverdict/ui`.
4. Mature telemetry dashboards and alerting for shell UX quality signals.

**Dependencies**

- Stable shell behavior and event taxonomy from earlier phases.

### 5.4 Risks and mitigation strategy

- **Risk:** navigation regressions and redirect loops  
  **Mitigation:** targeted unit tests for safe target resolution and E2E route-loop scenarios.
- **Risk:** role/tenant visibility leakage in nav items  
  **Mitigation:** contract-driven filtering, tenant-scoped state keys, and guard validation tests.
- **Risk:** accessibility regressions during refactor  
  **Mitigation:** automated a11y checks plus manual keyboard audits in DoD.
- **Risk:** RTL visual regressions  
  **Mitigation:** dedicated RTL test pass per shell PR and logical property review checklist.
- **Risk:** visual drift from design system  
  **Mitigation:** token-only styling and reviewer enforcement of `@agenticverdict/ui` reuse.

---

## 6) Validation and Quality Gates

### 6.1 Testing strategy

- **Unit tests**
  - nav schema and filtering logic
  - safe destination resolver and fallback behavior
  - shell state hooks (drawer/collapse/preference persistence)
- **Integration tests**
  - shell composition with router/session/feature flags
  - locale switch continuity and state preservation
- **E2E tests (critical journeys)**
  - auth to dashboard navigation
  - protected-route fallbacks without loops
  - mobile drawer + keyboard flow
  - locale switch in LTR and RTL
- **Accessibility validation**
  - automated checks for changed shell routes
  - manual keyboard/focus traversal on key shell paths
- **Responsive validation**
  - mobile (`<sm`), tablet, desktop
  - collapsed and expanded nav variants
  - dark/light and LTR/RTL combinations

### 6.2 Command-level quality gates

- `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/frontend lint`
- `pnpm --filter @agenticverdict/frontend test`
- `pnpm --filter @agenticverdict/frontend test:e2e`
- `pnpm --filter @agenticverdict/frontend i18n:validate`
- `pnpm --filter @agenticverdict/frontend build`
- `pnpm run validate:pen-files` (only when `.pen` assets are changed)

### 6.3 Definition of Done (per modernization slice)

- Shell componentization and behavior align with architecture boundaries and shared UI patterns.
- No hardcoded tenant behavior; all shell copy localized across supported locales.
- WCAG 2.1 AA checks pass for changed shell surfaces.
- LTR/RTL parity validated for affected interactions and layouts.
- Critical route/auth/navigation tests pass in CI.
- New shell interactions emit required structured observability events.
- Any deviation from mandatory guidelines is documented with owner, rationale, and follow-up date.

### 6.4 Measurable acceptance criteria

- `0` critical/serious accessibility violations on changed shell routes.
- `0` redirect-loop incidents in staging for modified protected flows.
- `>= 98%` pass rate for critical shell/auth E2E scenarios in CI.
- `>= 80%` coverage on touched critical shell logic modules.
- `>= 95%` completeness for defined shell interaction telemetry events.
- Verified functional parity on mobile, tablet, and desktop in both LTR and RTL.

---

## Execution Notes

- Start with Phase 1 foundations before advanced interactions to prevent rework.
- Keep route modules thin and place shell behavior in typed hooks/services.
- Use this plan as the implementation and review checklist baseline for shell modernization PRs.
