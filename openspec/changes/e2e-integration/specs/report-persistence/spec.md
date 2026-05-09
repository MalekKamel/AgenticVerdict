## ADDED Requirements

### Requirement: Pipeline result persistence
The worker SHALL persist pipeline execution results to the database upon job completion. Results SHALL include the verdict, structured insights, analysis output, and metadata (timestamps, execution duration, connector statuses). Results SHALL be stored in tenant-scoped tables accessible via `dbScoped()`.

#### Scenario: Results persisted on success
- **WHEN** a pipeline execution completes successfully
- **THEN** the verdict, insights, and analysis output are written to the database with the insight ID

#### Scenario: Results not persisted on failure
- **WHEN** a pipeline execution fails
- **THEN** the error details are recorded but no partial results are stored

### Requirement: Generated report persistence
The worker SHALL persist generated reports to the database after report generation completes. Report content SHALL be stored as base64-encoded data in the `reports` table. The report record SHALL include the insight ID, format, template, generation timestamp, and file size.

#### Scenario: Report persisted after generation
- **WHEN** a report is generated in the pipeline workflow
- **THEN** the report is stored in the database with its content and metadata

#### Scenario: Report linked to insight
- **WHEN** a report is generated for an insight
- **THEN** the report record includes the insight ID for scoping

### Requirement: Report retrieval endpoint
The API SHALL provide a tRPC procedure to retrieve report content by report ID. The procedure SHALL return the base64-encoded content, content type, and metadata. Access SHALL be restricted to the report's tenant.

#### Scenario: Report retrieved by ID
- **WHEN** a user requests a report by its ID
- **THEN** the base64 content and metadata are returned

#### Scenario: Report access denied
- **WHEN** a user requests a report from a different tenant
- **THEN** a `FORBIDDEN` error is returned

### Requirement: Shared report content
The `getSharedReportContent` tRPC procedure SHALL return actual base64-encoded report content from the database instead of a placeholder string. Share token validation SHALL be performed before returning content.

#### Scenario: Shared report download
- **WHEN** a valid share token is provided
- **THEN** the actual report content is returned as base64

#### Scenario: Invalid share token
- **WHEN** an invalid or expired share token is provided
- **THEN** an error is returned

### Requirement: toGeneratedInsights structured parsing
The `toGeneratedInsights()` function SHALL parse structured pipeline output into multiple insight entries. Each insight SHALL have individual confidence scores, relevance scores, type, domain, and actionable text. The function SHALL generate a minimum of 3 insights when the pipeline succeeds.

#### Scenario: Multiple insights generated
- **WHEN** the pipeline produces structured analysis output
- **THEN** `toGeneratedInsights()` parses it into multiple insight entries with individual scores

#### Scenario: Minimum insights threshold
- **WHEN** the pipeline succeeds but produces limited output
- **THEN** at least 3 insight entries are generated
