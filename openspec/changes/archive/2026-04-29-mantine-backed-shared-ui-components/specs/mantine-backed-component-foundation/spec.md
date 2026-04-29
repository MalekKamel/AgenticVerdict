## ADDED Requirements

### Requirement: All exported shared UI components are Mantine-backed
The `@agenticverdict/ui` package SHALL implement every exported component using Mantine-backed primitives or approved Mantine-backed internal wrappers.

#### Scenario: Exported component implementation validation
- **WHEN** a component is exported from `@agenticverdict/ui`
- **THEN** its implementation uses Mantine-backed building blocks rather than custom standalone UI primitives

### Requirement: Shared component styling is token-driven
Shared UI components MUST derive visual styling from approved design tokens and Mantine theme contracts instead of ad hoc one-off values.

#### Scenario: Theme consistency across shared components
- **WHEN** shared components are rendered under a tenant theme configuration
- **THEN** typography, spacing, colors, and interaction states resolve through tokenized Mantine theme inputs

### Requirement: Component states are standardized
Shared components SHALL expose consistent behavior for default, disabled, loading, error, and focus states where those states are applicable.

#### Scenario: Standard interaction state behavior
- **WHEN** a consumer uses component state props that map to supported states
- **THEN** the component renders and behaves according to standardized state semantics defined for the shared library
