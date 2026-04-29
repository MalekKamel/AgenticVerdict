## 1. Discovery and Migration Planning

- [x] 1.1 Inventory all exports in `packages/ui` and map each component to current implementation pattern, consumer usage, and migration complexity.
- [x] 1.2 Define migration batches (high-usage first) and identify components requiring compatibility adapters or deprecation handling.
- [x] 1.3 Confirm Mantine-backed implementation baseline and token/theming constraints against frontend governance docs.

## 2. Mantine-backed Component Refactors

- [x] 2.1 Migrate batch 1 shared primitives to Mantine-backed internals while preserving existing behavior where possible.
- [x] 2.2 Migrate remaining component batches to Mantine-backed internals and standardize state handling (default/disabled/loading/error/focus).
- [x] 2.3 Replace one-off styling with token-driven Mantine theme usage across migrated components.

## 3. API Consistency and Consumer Migration

- [x] 3.1 Normalize component API patterns for variants, sizing, slots, and event handling across related components.
- [x] 3.2 Add explicit deprecation markers and compatibility adapters for incompatible prop or behavior transitions.
- [x] 3.3 Update component documentation and migration notes for consumers of `@agenticverdict/ui`.

## 4. Quality, Accessibility, and Localization Validation

- [x] 4.1 Add or update automated tests for keyboard interaction, focus visibility, and semantic accessibility expectations.
- [x] 4.2 Add or update RTL/LTR rendering coverage to validate direction-aware layout behavior in shared components.
- [x] 4.3 Run typecheck, targeted component tests, and design-system/frontend validation checks for each migration batch.

## 5. Rollout and Follow-up

- [x] 5.1 Validate migrated components in `apps/frontend` integration surfaces and fix consumer regressions.
- [x] 5.2 Publish rollout guidance including deprecation timelines and upgrade steps for feature teams.
- [x] 5.3 Create follow-up cleanup scope for deprecated API removal after the agreed migration window.
