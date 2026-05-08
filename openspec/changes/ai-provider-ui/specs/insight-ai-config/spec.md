## ADDED Requirements

### Requirement: Insight AI Configuration Section
The system SHALL provide a configuration section within the insights feature for customizing AI-generated insights.

#### Scenario: Access insight AI configuration
- **WHEN** a user navigates to the insights settings page
- **THEN** the system SHALL display the AI configuration section with current settings

#### Scenario: Configure insight generation provider
- **WHEN** a user selects an AI provider for insight generation
- **THEN** the system SHALL save the selection and use it for generating insights

#### Scenario: Insight prompt customization
- **WHEN** a user customizes the insight generation prompt
- **THEN** the system SHALL save the custom prompt and use it for subsequent insight generation

### Requirement: Insight Template Selection
The system SHALL allow users to select AI templates for insight generation.

#### Scenario: Browse available templates
- **WHEN** a user opens the insight template selector
- **THEN** the system SHALL display all templates compatible with insight generation

#### Scenario: Preview template before applying
- **WHEN** a user selects a template to preview
- **THEN** the system SHALL show a sample insight generated with that template

#### Scenario: Apply template to insights
- **WHEN** a user applies a template to insight generation
- **THEN** the system SHALL save the template selection and use it for generating insights

### Requirement: Insight Quality Controls
The system SHALL provide controls for managing AI insight quality and verbosity.

#### Scenario: Set insight verbosity level
- **WHEN** a user selects a verbosity level (concise, balanced, detailed)
- **THEN** the system SHALL configure the AI to generate insights at that verbosity level

#### Scenario: Configure insight frequency
- **WHEN** a user configures how often insights are generated (real-time, hourly, daily)
- **THEN** the system SHALL schedule insight generation accordingly

#### Scenario: Disable AI insights
- **WHEN** a user disables AI-generated insights
- **THEN** the system SHALL stop generating AI insights and fall back to rule-based insights (if available)

### Requirement: Insight Provider Inheritance
The system SHALL support hierarchical configuration for insight AI settings.

#### Scenario: Inherit tenant insight settings
- **WHEN** a domain has no explicit insight AI configuration
- **THEN** the system SHALL use the tenant-level insight AI settings

#### Scenario: Override insight settings at domain level
- **WHEN** a domain administrator configures domain-specific insight AI settings
- **THEN** the system SHALL override the tenant settings for connectors in that domain

#### Scenario: Connector-level insight override
- **WHEN** a user configures insight AI settings for a specific connector
- **THEN** the system SHALL use those settings only for that connector's insights

### Requirement: Insight Generation Testing
The system SHALL allow users to test insight generation with current configuration.

#### Scenario: Test insight generation
- **WHEN** a user clicks "Test Insight Generation"
- **THEN** the system SHALL generate a sample insight using the current configuration and display it

#### Scenario: Show insight generation metadata
- **WHEN** a test insight is generated
- **THEN** the system SHALL display metadata (model used, tokens consumed, generation time)

#### Scenario: Regenerate insight
- **WHEN** a user is unsatisfied with a generated insight and clicks "Regenerate"
- **THEN** the system SHALL generate a new insight with varied parameters (if supported by the model)
