## ADDED Requirements

### Requirement: Connector-to-Domain Assignment UI
The system SHALL provide a user interface for assigning connectors to business domains.

#### Scenario: Assign connector to domain via UI
- **WHEN** a user drags a connector onto a domain in the domain mapper
- **THEN** the system SHALL update the connector's domain assignment and display a success message

#### Scenario: Unassign connector from domain
- **WHEN** a user removes a connector from a domain
- **THEN** the system SHALL set the connector's domain to null and move it to the "Unassigned" section

#### Scenario: Bulk domain assignment
- **WHEN** a user selects multiple connectors and assigns them to a domain
- **THEN** the system SHALL update all selected connectors' domain assignments in a single operation

### Requirement: Inheritance Visualization
The system SHALL visually indicate configuration inheritance relationships.

#### Scenario: Show inheritance indicator
- **WHEN** a connector inherits provider configuration from its domain
- **THEN** the system SHALL display a visual indicator (e.g., link icon, color coding) showing the inheritance

#### Scenario: Show override indicator
- **WHEN** a connector has an explicit provider override
- **THEN** the system SHALL display a visual indicator (e.g., "Override" badge) showing the override

#### Scenario: Inheritance chain visualization
- **WHEN** a user hovers over a connector
- **THEN** the system SHALL display a tooltip showing the full inheritance chain (connector → domain → tenant)

### Requirement: Domain Mapper Layout
The system SHALL provide an intuitive layout for managing domain-connector relationships.

#### Scenario: Two-column layout
- **WHEN** a user navigates to the domain mapper page
- **THEN** the system SHALL display domains in the left column and unassigned connectors in the right column

#### Scenario: Expandable domain sections
- **WHEN** a user clicks on a domain
- **THEN** the system SHALL expand the domain to show its assigned connectors

#### Scenario: Search and filter
- **WHEN** a user searches for a connector or domain by name
- **THEN** the system SHALL filter the displayed items to match the search query

### Requirement: Drag-and-Drop Interaction
The system SHALL support drag-and-drop interactions for domain-connector assignment.

#### Scenario: Drag connector to domain
- **WHEN** a user drags a connector from the unassigned section and drops it onto a domain
- **THEN** the system SHALL visually highlight the drop target and update the assignment on drop

#### Scenario: Drag connector between domains
- **WHEN** a user drags a connector from one domain and drops it onto another domain
- **THEN** the system SHALL reassign the connector to the new domain

#### Scenario: Drag cancellation
- **WHEN** a user starts dragging a connector but releases it outside a valid drop target
- **THEN** the system SHALL return the connector to its original position without making changes

### Requirement: Assignment Validation
The system SHALL validate domain-connector assignments before saving.

#### Scenario: Prevent duplicate assignment
- **WHEN** a user attempts to assign a connector to a domain it already belongs to
- **THEN** the system SHALL prevent the action (no-op) without showing an error

#### Scenario: Validate connector compatibility
- **WHEN** a user attempts to assign an incompatible connector to a domain
- **THEN** the system SHALL display a warning explaining the incompatibility (if any business rules apply)

#### Scenario: Confirm bulk changes
- **WHEN** a user makes multiple assignment changes in a single session
- **THEN** the system SHALL prompt for confirmation before saving all changes
