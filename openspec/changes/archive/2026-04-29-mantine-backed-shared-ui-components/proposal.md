## Why

`@agenticverdict/ui` currently mixes implementation patterns across shared components, creating inconsistency in behavior and increasing effort for redesigns and theme evolution. Standardizing all shared UI components on Mantine-backed primitives now establishes a reusable, maintainable foundation that accelerates delivery and reduces long-term UI debt.

## What Changes

- Re-implement all exported components in `@agenticverdict/ui` on Mantine v9 primitives and patterns.
- Normalize component composition patterns and interaction states across the shared library.
- Align shared component styling with design tokens and Mantine theme contracts for consistent theming behavior.
- Add compatibility guidance and deprecation paths where existing APIs cannot remain fully unchanged.
- Add validation coverage for accessibility and RTL/LTR behavior as part of shared component quality gates.

## Capabilities

### New Capabilities

- `mantine-backed-component-foundation`: Every exported shared UI component is implemented using Mantine-backed primitives and token-aligned styling.
- `component-api-consistency-and-migration`: Shared component APIs follow consistent composition patterns with a migration path for current consumers.
- `component-quality-accessibility-and-localization`: Shared components meet accessibility and bidirectional layout requirements across supported states.

### Modified Capabilities

- None.

## Impact

- Affected code: `packages/ui` component implementations, stories/examples, tests, and consumer integrations in `apps/frontend`.
- APIs: Some props and variants may require deprecation notices or adaptation layers to preserve upgrade safety.
- Dependencies: Mantine-backed implementation and related testing utilities become required for shared UI governance.
- Systems: Design system enforcement, accessibility checks, and localization behavior become more consistent across tenants.
