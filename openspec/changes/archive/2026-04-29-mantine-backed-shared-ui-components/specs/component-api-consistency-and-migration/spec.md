## ADDED Requirements

### Requirement: Shared component APIs follow consistent composition patterns
`@agenticverdict/ui` component APIs SHALL use consistent composition conventions for slots, variants, sizing, and event handling across comparable components.

#### Scenario: Consumer experience across component families
- **WHEN** a developer uses multiple shared components from the same library
- **THEN** the API patterns are predictable and minimize component-specific behavioral surprises

### Requirement: Breaking API differences include migration support
If a component cannot preserve prior API behavior, the change MUST include a documented migration path and compatibility guidance.

#### Scenario: Incompatible prop transition
- **WHEN** a previously supported prop or behavior is replaced
- **THEN** migration guidance and compatibility handling are provided so consumers can update with controlled risk

### Requirement: Deprecations are explicit and trackable
Deprecated shared component APIs SHALL be clearly marked and accompanied by a defined removal plan.

#### Scenario: Deprecation lifecycle visibility
- **WHEN** a consumer uses a deprecated component API
- **THEN** deprecation status and replacement guidance are discoverable in shared component documentation
