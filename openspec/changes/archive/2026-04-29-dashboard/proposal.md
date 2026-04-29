## Why

The current dashboard route is prototype-grade and does not meet the product's architecture, accessibility, localization, and tenant-safety requirements for production use. Rebuilding now is required to unblock reliable release readiness for home, domain, agency, and customization dashboard experiences.

## What Changes

- Replace the current prototype dashboard route implementation with a production architecture that enforces strict route -> page -> component -> hook/service layering.
- Implement a unified dashboard experience across home, domain, agency/client context, and customization surfaces with shared async-state handling.
- Standardize route guard safety, redirect sanitization, and deterministic fallback behavior for protected dashboard navigation.
- Add WCAG 2.1 AA-compliant interaction patterns, keyboard operability, and direction-safe (LTR/RTL) localized UI behavior.
- Enforce tenant-scoped data contracts, caching, and context propagation to prevent cross-tenant leakage.
- Add release-quality validation evidence across architecture compliance, accessibility, localization, route safety, and tenant safety.

## Capabilities

### New Capabilities

- `dashboard-foundation`: Production dashboard route foundation with canonical guard flow, typed contracts, and standardized async states.
- `dashboard-surfaces`: Home, domain, agency/client, and customization dashboard surfaces with shared interaction and refresh behavior.
- `dashboard-compliance-and-safety`: Accessibility, localization/RTL, route safety, and tenant-safety requirements and verification gates for dashboard delivery.

### Modified Capabilities

- None.

## Impact

- Affected frontend dashboard route modules under `apps/frontend/src/routes/$locale/dashboard` and related page/component/hook/service layers.
- New OpenSpec capability specs under `openspec/changes/dashboard/specs/` to define dashboard behavior contracts.
- Additional frontend test coverage for guarded navigation, async-state resilience, accessibility interactions, and tenant-scoped data flows.
- Coordination impact across frontend, API contract consumers, QA validation, and release evidence workflows.
