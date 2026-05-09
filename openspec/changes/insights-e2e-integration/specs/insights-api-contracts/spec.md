## ADDED Requirements

### Requirement: Connector Existence Validation
The system MUST validate that `connectorId` references an existing connector for the tenant before creating or updating an insight, returning a user-friendly error for invalid connector IDs.

#### Scenario: Valid connector is accepted
- **WHEN** an insight is created with a `connectorId` that exists for the tenant
- **THEN** the operation proceeds normally

#### Scenario: Invalid connector is rejected
- **WHEN** an insight is created with a `connectorId` that does not exist or belongs to another tenant
- **THEN** the operation is rejected with a clear error message indicating the invalid connector

### Requirement: Insights Read Permission Enforcement
The system MUST enforce `INSIGHTS_READ` permission on all insight read procedures (list, detail, getAIInsights, getAuditTrail, getJobStatus) using `authedProcedureWithPermission`.

#### Scenario: Authorized user can read insights
- **WHEN** a user with `INSIGHTS_READ` permission calls an insight read procedure
- **THEN** the operation succeeds and returns the requested data

#### Scenario: Unauthorized user cannot read insights
- **WHEN** a user without `INSIGHTS_READ` permission calls an insight read procedure
- **THEN** the operation is rejected with a permission error

### Requirement: AI Insights Query by Insight ID
The system MUST use the `insightId` input parameter in the `getAIInsights` query to filter results, returning only insights associated with the specified insight.

#### Scenario: Query returns insights for specific insight
- **WHEN** `getAIInsights` is called with a valid `insightId`
- **THEN** only generated insights associated with that insight's reports are returned
- **AND** the query does not return all completed reports

### Requirement: AI Config Model Validation
The system MUST validate `aiConfig.model` against supported models for the selected provider during insight creation and update, returning a user-friendly error for unsupported combinations.

#### Scenario: Supported model is accepted
- **WHEN** an insight is created with a model that is supported by the selected provider
- **THEN** the operation proceeds normally

#### Scenario: Unsupported model is rejected
- **WHEN** an insight is created with a model not supported by the selected provider
- **THEN** the operation is rejected with an error listing supported models

### Requirement: Idempotent Run Procedure
The system MUST check for existing running jobs before enqueueing a new insight execution, returning the existing `jobId` if a job is already in progress.

#### Scenario: Run detects existing job
- **WHEN** `insight.run` is called while a job for the same insight is active
- **THEN** the existing `jobId` and status are returned
- **AND** no new job is enqueued

### Requirement: Normalized Error Handling
The system MUST normalize database errors (constraint violations, foreign key violations, etc.) to canonical error codes and use error translation utilities for user-facing messages instead of re-throwing raw error messages.

#### Scenario: Unique constraint violation is normalized
- **WHEN** a database unique constraint violation occurs during insight creation
- **THEN** the error is translated to a canonical error code
- **AND** a user-friendly message is returned to the client

#### Scenario: Foreign key violation is normalized
- **WHEN** a foreign key violation occurs during insight creation
- **THEN** the error is translated to a canonical error code
- **AND** a user-friendly message referencing the invalid reference is returned

### Requirement: tRPC Mutation Rate Limiting
The system MUST apply rate limiting on tRPC mutation procedures (`run`, `create`, `update`, `delete`) with appropriate limits per procedure, returning 429 with retry-after information when exceeded.

#### Scenario: Rate limit is respected
- **WHEN** mutation calls are made within the configured rate limit
- **THEN** all calls succeed normally

#### Scenario: Rate limit exceeded returns 429
- **WHEN** mutation calls exceed the configured rate limit within the time window
- **THEN** subsequent calls are rejected with a 429-equivalent error
- **AND** retry-after information is included in the response

### Requirement: REST V1 Endpoint Database Integration
The system MUST replace the in-memory `analysis-store.ts` in the REST v1 `/insights` endpoint with direct database access using `dbScoped()` for tenant isolation, returning data from PostgreSQL.

#### Scenario: REST endpoint returns database data
- **WHEN** a GET request is made to `/api/v1/insights`
- **THEN** insights are returned from the PostgreSQL database
- **AND** the in-memory store is no longer used

### Requirement: Duplicate Procedure Removal
The system MUST not contain duplicate tRPC procedures. The `getById` procedure (duplicate of `detail`) must be removed, and all references must use `detail`.

#### Scenario: No duplicate procedures exist
- **WHEN** the insights router is loaded
- **THEN** only one procedure exists for retrieving a single insight by ID (`detail`)
- **AND** `getById` is not defined

### Requirement: Audit Trail Tenant ID Cleanup
The system MUST remove the unused `tenantId` input parameter from `getAuditTrail` since the query always uses `ctx.tenant.tenantId`.

#### Scenario: Audit trail uses context tenant
- **WHEN** `getAuditTrail` is called
- **THEN** the query uses `ctx.tenant.tenantId` for filtering
- **AND** no `tenantId` input parameter is accepted
