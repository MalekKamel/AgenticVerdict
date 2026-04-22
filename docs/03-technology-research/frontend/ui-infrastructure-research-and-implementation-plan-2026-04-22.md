# UI infrastructure research and implementation plan (AgenticVerdict)

**Date:** 2026-04-22  
**Status:** Research + execution planning artifact  
**Source prompt:** `/prompts/ui-infrastructure-research-and-implementation-plan.md`

---

## 1) Research report: modern UI and clean frontend architecture

### 1.1 Executive findings

The current `apps/frontend` implementation already contains strong foundations: TanStack Start route structure, locale-first routing, typed API boundaries via tRPC, and implemented authentication flows. The main opportunity is reducing architectural drift and inconsistency so the UI layer remains scalable as additional product surfaces are added.

The highest-value direction is:

1. Keep a single shared feature codebase for web and desktop renderer UI.
2. Strengthen domain boundaries and enforce consistent auth/UI patterns.
3. Treat accessibility, RTL/LTR, and tenant-aware configuration as non-negotiable architecture constraints.
4. Raise quality gates around auth flows before expanding into broader production pages.

### 1.2 Current-state assessment (focused on `apps/frontend`)

#### Strengths

- **Typed API integration:** `authApi` + tRPC clients provide consistent request/response contracts.
- **Auth flow coverage in code:** login/register/forgot/reset/verify pages and components are present.
- **Locale and direction plumbing:** `$locale` routes and RTL support infrastructure are available.
- **Testing baseline exists:** unit/integration and Playwright auth tests are already in place.
- **Provider architecture:** session and tenant-oriented providers are established and extensible.

#### Gaps and risks

- **Auth UX inconsistency:** verify-email flow diverges from shared auth layout patterns.
- **Implementation drift:** docs and code are not fully aligned in several auth/frontend details.
- **A11y edge gaps:** at least one keyboard accessibility anti-pattern exists in auth controls.
- **Design system drift risk:** mixed inline styles/utilities can bypass token-governed styling.
- **Coverage imbalance:** critical auth component-level tests are still thin relative to flow risk.

### 1.3 Principles and patterns recommended for this stack

#### Architecture and modularity

- Organize by domain and feature boundaries (auth, connectors, reports, settings), not only by technical type folders.
- Keep route files thin; push business logic and state transitions into domain hooks/services.
- Enforce explicit API boundaries: domain operations through typed tRPC contracts.

#### UX consistency and design-system governance

- Reuse a single auth shell/layout pattern across all auth routes.
- Use token-driven styles and shared primitives (`@agenticverdict/ui`, Mantine patterns), minimizing one-off CSS.
- Keep home page prototype decisions separate from production auth standards.

#### Accessibility and internationalization

- Make WCAG 2.1 AA part of the definition of done for auth pages.
- Ensure keyboard, focus, error announcements, and semantic status patterns are consistent.
- Enforce logical CSS properties and parity checks across LTR/RTL auth flows.

#### Performance and reliability

- Keep route-based code splitting and controlled preloading.
- Track auth-surface CWV metrics and prevent regressions with CI evidence.
- Standardize client-side error logging and telemetry signals for auth funnels.

#### Testing and quality gates

- Strengthen component tests for each auth form and state path.
- Keep E2E focused on critical user journeys and locale/a11y parity checks.
- Add explicit acceptance gates before expanding from auth to broader pages.

### 1.4 Recommendation matrix

| Recommendation                                   | Why                            | Benefit                              | Tradeoff             | Difficulty |
| ------------------------------------------------ | ------------------------------ | ------------------------------------ | -------------------- | ---------- |
| Standardize auth layout and interaction contract | Removes per-page divergence    | Faster maintenance, consistent UX    | Refactor effort      | M          |
| Enforce tokenized styling on auth pages          | Prevents design drift          | Better theming and branding control  | Cleanup effort       | M          |
| Harden auth hook/API state transitions           | Prevents edge-case regressions | More reliable sessions and redirects | More tests needed    | M/L        |
| Raise auth test depth (components + E2E gaps)    | Auth is highest-risk user path | Safer iteration speed                | CI time increase     | M          |
| Normalize a11y + RTL checks in CI                | Prevents late regressions      | Compliance and usability confidence  | Added pipeline steps | M          |

### 1.5 Source references

- Internal references:
  - `docs/05-reference/frontend-development-guidelines.md`
  - `specs/01-ui/00-foundation/spec.md`
  - `specs/01-ui/01-authentication/spec.md`
  - `docs/03-technology-research/frontend/web-tanstack-start-standards-research-memo-2026-04-16.md`
  - `docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`
  - `docs/architecture/desktop/desktop-frontend-lobechat-parity-implementation-plan.md`
- External references:
  - [TanStack Router code splitting](https://tanstack.com/router/latest/docs/guide/code-splitting)
  - [TanStack Router preloading](https://tanstack.com/router/latest/docs/guide/preloading)
  - [tRPC + TanStack React Query integration](https://trpc.io/docs/client/tanstack-react-query)
  - [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
  - [Mantine RTL](https://mantine.dev/styles/rtl/)
  - [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
  - [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
  - [Feature-Sliced Design reference](https://feature-sliced.design/documentation/docs/reference)

---

## 2) Comprehensive implementation plan (auth pages first)

### 2.1 Scope and rollout intent

Initial production-focused execution target: authentication routes in `apps/frontend`.

In scope:

- `/$locale/auth/login`
- `/$locale/auth/register`
- `/$locale/auth/forgot-password`
- `/$locale/auth/reset-password`
- `/$locale/auth/verify-email`

Out of scope for this rollout:

- Home page prototype and non-auth production surfaces, except required auth-guard touchpoints (for redirects/session handling).

### 2.2 Phased roadmap

## Phase A (Immediate: 0-2 weeks) - Stabilize architecture and UX consistency

| ID  | Task                                                                         | Owner                            | Dependencies | Complexity | Acceptance criteria                                                                       | Test strategy                              |
| --- | ---------------------------------------------------------------------------- | -------------------------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------- | ------------------------------------------ |
| A1  | Publish auth architecture baseline note (route -> component -> hook -> API)  | Frontend architect               | None         | S          | Single agreed auth implementation contract documented and linked in auth PRs              | Architecture checklist in PR template      |
| A2  | Unify all auth pages under shared auth shell/layout (including verify-email) | Frontend engineer                | A1           | M          | Visual and behavioral parity across all auth pages; no undocumented layout variants       | Visual regression + manual locale checks   |
| A3  | Normalize auth form state contract (loading, error, success, focus)          | Frontend engineer                | A2           | M          | Same interaction contract for login/register/forgot/reset/verify                          | Unit tests per state + keyboard flow check |
| A4  | Harden auth hook/API transitions and redirects                               | Frontend engineer + API engineer | A1           | M/L        | Predictable locale-aware redirects; no session loops; mock/live behavior explicitly gated | Hook unit tests + integration tests        |
| A5  | Close immediate E2E gaps for register and verify-email                       | QA automation engineer           | A2-A4        | M          | Dedicated specs for success/failure/edge cases; stable CI runs                            | Playwright with deterministic fixtures     |

## Phase B (Short-term: 2-6 weeks) - Quality and compliance hardening

| ID  | Task                                                               | Owner                                        | Dependencies | Complexity | Acceptance criteria                                                 | Test strategy                             |
| --- | ------------------------------------------------------------------ | -------------------------------------------- | ------------ | ---------- | ------------------------------------------------------------------- | ----------------------------------------- |
| B1  | Enforce token-based styling and design-system usage on auth routes | Frontend engineer + design-system maintainer | Phase A      | M          | Auth pages avoid one-off visual styles except documented exceptions | Token/style audit + visual review         |
| B2  | WCAG 2.1 AA hardening for auth flows                               | Frontend engineer + accessibility QA         | B1           | M          | No critical/serious auth-route accessibility violations             | Axe CI + keyboard + SR smoke checklist    |
| B3  | i18n and RTL/LTR parity pass for auth domain                       | Frontend engineer + localization QA          | Phase A      | M          | Auth locales have complete keys and directional behavior parity     | Locale matrix smoke tests                 |
| B4  | Auth funnel observability instrumentation                          | Frontend engineer + observability engineer   | A4           | M          | Structured, tenant-safe auth events available in staging dashboards | Unit tests + staging telemetry validation |

## Phase C (Medium-term: 6-12 weeks) - Scale and platform consolidation

| ID  | Task                                                                     | Owner                                         | Dependencies | Complexity | Acceptance criteria                                         | Test strategy                               |
| --- | ------------------------------------------------------------------------ | --------------------------------------------- | ------------ | ---------- | ----------------------------------------------------------- | ------------------------------------------- |
| C1  | Extract reusable auth-flow primitives for future domains (MFA/SSO-ready) | Frontend architect + design-system maintainer | Phase B      | L          | Shared primitives documented and adopted by all auth routes | Contract tests + migration smoke            |
| C2  | Ratchet auth quality gates (coverage + CWV budgets)                      | QA automation + frontend engineer             | Phase B      | M          | Auth coverage floor and CWV thresholds enforced in CI       | Vitest thresholds + Lighthouse/CWV evidence |
| C3  | Remove temporary compatibility paths after stable API parity             | API engineer + frontend engineer              | C1           | M/L        | End-to-end typed auth flow without legacy fallback branches | Integration + protected-route E2E           |

### 2.3 Auth-pages-first implementation sequence

1. **Login:** normalize error/success/focus behavior and session redirect guarantees.
2. **Register:** ensure validation and successful handoff toward verification path.
3. **Forgot password:** enforce security-safe messaging and recoverability UX.
4. **Reset password:** validate token-state behavior and error handling consistency.
5. **Verify email:** move to shared auth shell and align resend/expired/invalid UX.

### 2.4 Backlog breakdown (ticket-ready)

- **Epic 1 - Auth UI Architecture Modernization**
  - Auth implementation contract baseline
  - Shared shell parity across all auth routes
  - Form behavior contract normalization
  - Hook/API transition hardening
- **Epic 2 - Auth Quality Gates**
  - Register E2E suite
  - Verify-email E2E suite
  - Accessibility and locale matrix automation
- **Epic 3 - Auth Platform Readiness**
  - Design token compliance cleanup
  - Auth telemetry funnel instrumentation
  - Coverage and performance ratchet

### 2.5 Risk register

| Risk                                           | Impact                             | Mitigation                                                       |
| ---------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| Refactor regressions in critical auth flows    | User login/registration disruption | Lock behavior with tests before refactors; ship page-by-page     |
| RTL/i18n regressions during layout unification | Broken non-English UX              | Locale matrix smoke in CI and manual review checkpoints          |
| Mock vs live API behavior divergence           | Environment-only failures          | Explicit environment gating tests and shared contract validation |
| Accessibility regressions hidden by visual QA  | Compliance and usability risk      | Mandatory axe + keyboard + SR checks in done criteria            |
| Scope creep into home prototype redesign       | Delayed delivery                   | Keep auth-only epic boundaries and defer prototype work          |

### 2.6 Success metrics

- Auth E2E pass rate >= 98% in CI.
- 0 critical/serious accessibility violations on auth routes.
- Auth-domain unit/integration coverage reaches agreed floor (target >= 80% for auth logic).
- Redirect-loop incidents for auth-protected flows = 0 in staging validation.
- Auth funnel telemetry completeness >= 95% of expected events in staging.

---

## 3) Parallel execution guidance

To execute systematically with parallel agents:

1. **Parallel lane 1 (architecture + refactor):** A1-A4.
2. **Parallel lane 2 (quality automation):** A5 setup can begin once A2 branch structure is stable.
3. **Parallel lane 3 (compliance):** B2/B3 preparatory test harness can start while A3/A4 are finishing.
4. **Sequential gates:** do not start C-phase extraction until all A-phase acceptance criteria are met.

---

**Document control**  
**Version:** 1.0  
**Next review:** End of Phase A completion
