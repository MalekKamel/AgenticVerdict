## ADDED Requirements

### Requirement: Pre-populated Form
The system SHALL load and display current insight configuration in the edit wizard.

#### Scenario: Load configuration
- **WHEN** user navigates to edit page
- **THEN** system fetches current insight configuration and pre-populates all form fields

#### Scenario: Loading state
- **WHEN** configuration is being fetched
- **THEN** system displays loading spinner with "Loading insight..." message

### Requirement: Edit Wizard Steps
The system SHALL provide same 6-step wizard as create, with all steps pre-populated.

#### Scenario: Step navigation
- **WHEN** user navigates through wizard steps
- **THEN** system displays current values for each configuration section

#### Scenario: Modify configuration
- **WHEN** user changes any field value
- **THEN** system marks form as dirty and enables save button

### Requirement: Unsaved Changes Indicator
The system SHALL indicate when there are unsaved changes.

#### Scenario: Dirty state
- **WHEN** user modifies any field
- **THEN** system displays "Unsaved changes" indicator and enables "Save Changes" button

#### Scenario: Navigate away warning
- **WHEN** user attempts to navigate away with unsaved changes
- **THEN** system displays confirmation dialog

### Requirement: Save Changes
The system SHALL update insight configuration on save.

#### Scenario: Save initiation
- **WHEN** user clicks "Save Changes"
- **THEN** system submits updated configuration to API and displays spinner

#### Scenario: Save success
- **WHEN** configuration is successfully updated
- **THEN** system displays success toast and navigates to insight detail page

#### Scenario: Save failure
- **WHEN** update fails
- **THEN** system displays error message and keeps user on edit page

### Requirement: Reset to Default
The system SHALL allow resetting individual sections to default values.

#### Scenario: Reset section
- **WHEN** user clicks "Reset to Default" for a section
- **THEN** system reverts that section's fields to original loaded values
