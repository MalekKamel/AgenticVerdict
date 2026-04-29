## 1. Foundation Decommission and Skeleton

- [x] 1.1 Audit existing `apps/frontend/src/routes/$locale/dashboard` implementation and classify prototype-only code vs reusable utilities.
- [x] 1.2 Remove prototype dashboard route behavior from active route flow and verify it is no longer reachable in route navigation.
- [x] 1.3 Create a new dashboard route/page/component/hook/service scaffold that enforces strict layering boundaries.
- [x] 1.4 Implement canonical `beforeLoad` guard flow with redirect sanitization and deterministic non-looping fallback handling.
- [x] 1.5 Add typed dashboard API contract adapters and standardized typed error mapping for dashboard data requests.

## 2. Shared State and Async Behavior

- [x] 2.1 Implement shared dashboard state for date range, comparison, context, and view mode with deterministic transitions.
- [x] 2.2 Implement standardized loading, empty, error, partial-data, and refetch UI states using reusable design-system patterns.
- [x] 2.3 Implement manual refresh and freshness indicator behavior aligned to shared state semantics.
- [x] 2.4 Add retry behavior that isolates section failures without collapsing unaffected rendered content.

## 3. Surface Implementation

- [x] 3.1 Implement home dashboard surface with KPI overview, insights summary, connector health, and permission-aware quick actions.
- [x] 3.2 Implement domain dashboard routes and surface sections with parity for shared filters and refresh controls.
- [x] 3.3 Implement agency overview and client-context switching flow with stable deep-link resolution.
- [x] 3.4 Implement customization lifecycle (view/edit mode, widget add/remove/reorder, save/reset persistence) with role-based gating.

## 4. Tenant Safety and Route Integrity

- [x] 4.1 Enforce tenant context requirements for tenant-owned dashboard queries and reject missing/mismatched context with stable typed errors.
- [x] 4.2 Ensure dashboard cache keys and persisted state are tenant-scoped (and client-scoped where applicable) to prevent cross-tenant leakage.
- [x] 4.3 Add guard and navigation coverage for invalid deep links, unsafe redirect targets, and redirect-loop prevention.
- [x] 4.4 Validate agency/client aggregate rendering paths only use permitted scoped entities.

## 5. Accessibility and Localization

- [x] 5.1 Externalize all dashboard copy to localization resources and update locale bundles for all supported locales.
- [x] 5.2 Implement and verify keyboard-operable interactions with visible focus states for all dashboard controls and widgets.
- [x] 5.3 Implement semantic landmarks and ARIA status/live announcements for async state transitions without redundant announcements.
- [x] 5.4 Validate layout and interaction parity in both LTR and RTL directions using logical properties.

## 6. Validation and Release Evidence

- [x] 6.1 Add targeted unit/integration tests for guard behavior, typed error handling, shared state transitions, and tenant-safety negative paths.
- [x] 6.2 Add dashboard critical-path end-to-end tests covering protected navigation and core user journeys across home/domain/agency/client/customization flows.
- [x] 6.3 Run required validation commands (`tsc`, targeted frontend tests, and `i18n:validate` when strings/keys change) and resolve failures.
- [x] 6.4 Assemble release evidence packet for architecture compliance, design-system compliance, accessibility, localization/RTL, route safety, resilience, and tenant safety.
- [x] 6.5 Complete engineering, QA, and product sign-off checklist and document deferred non-blocking enhancements.
