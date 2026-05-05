## ADDED Requirements

### Requirement: Multi-Step Wizard Navigation
The system SHALL provide a 6-step wizard for insight creation with step indicators and navigation controls.

#### Scenario: Step progression
- **WHEN** user completes step 1 and clicks "Continue"
- **THEN** system advances to step 2 and updates step indicator

#### Scenario: Step navigation
- **WHEN** user clicks "Back" button
- **THEN** system navigates to previous step and preserves form state

#### Scenario: Step validation
- **WHEN** user attempts to continue from a step with invalid data
- **THEN** system displays validation errors and prevents progression

### Requirement: Step 1 - Basic Information
The system SHALL collect insight name, optional domain, and description.

#### Scenario: Name validation
- **WHEN** user enters a name with less than 2 or more than 255 characters
- **THEN** system displays validation error and disables continue button

#### Scenario: Domain auto-detection hint
- **WHEN** user views domain field
- **THEN** system displays hint that domains are auto-detected from connectors

### Requirement: Step 2 - Connector Selection
The system SHALL display available connectors with health status and allow multi-selection.

#### Scenario: Connector list display
- **WHEN** user reaches step 2
- **THEN** system displays all healthy and warning-status connectors with name, health, domain, and last sync time

#### Scenario: Minimum connector requirement
- **WHEN** user attempts to continue without selecting any connector
- **THEN** system displays validation error requiring at least 1 connector

#### Scenario: Manage connectors link
- **WHEN** user clicks "Manage Connectors"
- **THEN** system opens connector add flow in modal

### Requirement: Step 3 - Metric Configuration
The system SHALL display available metrics per selected connector with multi-select capability.

#### Scenario: Metrics per connector
- **WHEN** user reaches step 3
- **THEN** system displays metric checkboxes grouped by selected connector

#### Scenario: Minimum metric requirement
- **WHEN** user attempts to continue without selecting any metric for a connector
- **THEN** system displays validation error requiring at least 1 metric per connector

#### Scenario: Select/Clear all
- **WHEN** user clicks "Select All" or "Clear All"
- **THEN** system checks or unchecks all metrics for that connector

### Requirement: Step 4 - AI Settings
The system SHALL allow configuration of AI model, quality level, detail level, and custom prompt.

#### Scenario: Model selection
- **WHEN** user selects AI model from dropdown
- **THEN** system stores selected model in form state

#### Scenario: Quality level selection
- **WHEN** user selects "Standard" or "Premium" quality
- **THEN** system stores quality level in form state

#### Scenario: Detail level slider
- **WHEN** user adjusts detail level slider
- **THEN** system updates detail level from concise to detailed

#### Scenario: Custom prompt
- **WHEN** user enters custom prompt
- **THEN** system stores prompt (max 1000 characters)

### Requirement: Step 5 - Schedule & Delivery
The system SHALL configure execution schedule and report delivery preferences.

#### Scenario: Manual vs scheduled
- **WHEN** user selects "Run manually only"
- **THEN** system disables schedule frequency and time inputs

#### Scenario: Schedule configuration
- **WHEN** user selects "Run on schedule"
- **THEN** system enables frequency (daily/weekly/monthly) and time inputs

#### Scenario: Delivery format
- **WHEN** user selects PDF, Excel, or Both
- **THEN** system stores delivery format preference

#### Scenario: Email recipients
- **WHEN** user adds email addresses
- **THEN** system validates email format and stores recipients list

### Requirement: Step 6 - Review & Create
The system SHALL display summary of all configuration and create insight on confirmation.

#### Scenario: Summary display
- **WHEN** user reaches step 6
- **THEN** system displays read-only summary of all configuration from previous steps

#### Scenario: Activate after creation
- **WHEN** user checks "Activate insight after creation"
- **THEN** system sets insight status to enabled upon creation

#### Scenario: Create insight
- **WHEN** user clicks "Create Insight"
- **THEN** system submits configuration to API and displays success toast

#### Scenario: Creation success
- **WHEN** insight is successfully created
- **THEN** system navigates to insight detail page

### Requirement: Form State Preservation
The system SHALL preserve form state when navigating between wizard steps.

#### Scenario: Back and forth navigation
- **WHEN** user navigates back to previous step and modifies data
- **THEN** system preserves all changes and updates summary accordingly

#### Scenario: Cancel confirmation
- **WHEN** user clicks "Cancel" with unsaved data
- **THEN** system displays confirmation dialog before discarding progress
