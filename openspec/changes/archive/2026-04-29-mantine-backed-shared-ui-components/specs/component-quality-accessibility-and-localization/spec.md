## ADDED Requirements

### Requirement: Shared components meet accessibility baseline
All shared UI components in `@agenticverdict/ui` MUST satisfy WCAG 2.1 AA baseline expectations for semantics, focus visibility, and keyboard interaction where applicable.

#### Scenario: Keyboard and focus validation
- **WHEN** a keyboard-only user navigates interactive shared components
- **THEN** focus indicators are visible and all supported actions are operable without pointer input

### Requirement: Shared components support bidirectional layouts
Shared components SHALL support both LTR and RTL directions using logical layout and styling behavior compatible with tenant configuration.

#### Scenario: Direction-aware rendering
- **WHEN** a tenant configuration sets UI direction to RTL
- **THEN** shared components render with correct mirrored layout behavior without requiring tenant-specific hardcoded overrides

### Requirement: Quality gates validate accessibility and localization behavior
Shared component changes MUST include automated or repeatable validation coverage for accessibility-critical behavior and RTL/LTR rendering expectations.

#### Scenario: Regression prevention for quality-critical behavior
- **WHEN** component internals are refactored or migrated to Mantine-backed patterns
- **THEN** quality checks catch regressions in accessibility and directionality before release
