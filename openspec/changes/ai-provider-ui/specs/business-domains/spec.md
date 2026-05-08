## ADDED Requirements

### Requirement: Business Domain Definition
The system SHALL allow tenants to define custom business domains for organizing connectors and AI providers.

#### Scenario: Tenant creates a business domain
- **WHEN** a tenant administrator creates a new business domain with a name and description
- **THEN** the system SHALL create the domain scoped to the tenant with a unique identifier

#### Scenario: Business domain naming constraints
- **WHEN** a tenant attempts to create a domain with a duplicate name
- **THEN** the system SHALL reject the request with a validation error indicating the name is already in use

#### Scenario: Business domain update
- **WHEN** a tenant administrator updates a business domain's name or description
- **THEN** the system SHALL update the domain and propagate changes to all dependent configurations

### Requirement: Domain-Connector Assignment
The system SHALL allow tenants to assign connectors to business domains for organizational grouping.

#### Scenario: Assign connector to domain
- **WHEN** a tenant administrator assigns a connector (Meta, GA4, GSC, GBP, TikTok) to a business domain
- **THEN** the system SHALL create the assignment and update the connector's domain reference

#### Scenario: Connector belongs to one domain
- **WHEN** a connector is already assigned to a domain and user attempts to assign it to another domain
- **THEN** the system SHALL reassign the connector to the new domain (one-to-many: one domain has many connectors, one connector belongs to one domain)

#### Scenario: Remove connector from domain
- **WHEN** a tenant administrator removes a connector from a domain
- **THEN** the system SHALL set the connector's domain reference to null (unassigned)

### Requirement: Domain Hierarchy Visualization
The system SHALL provide a visual representation of the domain hierarchy and connector assignments.

#### Scenario: View domain tree
- **WHEN** a user navigates to the domains management page
- **THEN** the system SHALL display a hierarchical tree showing domains and their assigned connectors

#### Scenario: Domain expansion/collapse
- **WHEN** a user clicks on a domain in the tree
- **THEN** the system SHALL expand or collapse the domain to show or hide its assigned connectors

#### Scenario: Connector count display
- **WHEN** viewing the domain list
- **THEN** the system SHALL display the count of connectors assigned to each domain

### Requirement: Domain Deletion Safety
The system SHALL enforce safety checks when deleting business domains with existing assignments.

#### Scenario: Delete empty domain
- **WHEN** a tenant administrator deletes a domain with no assigned connectors
- **THEN** the system SHALL immediately delete the domain

#### Scenario: Delete domain with connectors
- **WHEN** a tenant administrator attempts to delete a domain with assigned connectors
- **THEN** the system SHALL show a warning and require the user to reassign or remove connectors before deletion

#### Scenario: Cascade delete option
- **WHEN** a tenant administrator chooses to delete a domain with connectors and selects "reassign connectors"
- **THEN** the system SHALL allow selecting a target domain for reassignment before deleting the source domain
