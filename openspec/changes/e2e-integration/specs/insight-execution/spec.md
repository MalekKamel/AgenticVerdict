## ADDED Requirements

### Requirement: Insight execution queue
The system SHALL provide a dedicated BullMQ queue named `insight-execution` for processing insight run jobs. The queue SHALL accept jobs containing `tenantId`, `insightId`, `connectorIds`, `metrics`, `aiConfig`, and `requestId`. The queue SHALL be processed by the worker service.

#### Scenario: Job enqueued from API
- **WHEN** the API receives a valid `insight.run` tRPC call
- **THEN** a job is enqueued to the `insight-execution` queue with full insight context

#### Scenario: Job processed by worker
- **WHEN** a job is available in the `insight-execution` queue
- **THEN** the worker dequeues it, reads insight config from DB, resolves connectors, and executes the intelligence pipeline

#### Scenario: Job result persisted
- **WHEN** pipeline execution completes
- **THEN** the job result including verdict, insights, and reportId is written to the database

#### Scenario: Job failure handling
- **WHEN** pipeline execution fails
- **THEN** the job is marked as failed with error details, insight status updated to "failed", and audit trail event created

### Requirement: insight.run tRPC procedure
The `insight.run` tRPC procedure SHALL enqueue an insight execution job, update the insight's `lastRunStatus` to "running", set `lastRunAt` to the current timestamp, create an audit trail event with type "run", and return `{ success: true, jobId: string }`.

#### Scenario: Successful run enqueue
- **WHEN** a tenant admin calls `insight.run` with a valid insight ID
- **THEN** the job is enqueued, insight status updated, audit event created, and `{ success: true, jobId }` returned

#### Scenario: Run with non-existent insight
- **WHEN** `insight.run` is called with an insight ID that does not exist
- **THEN** a `NOT_FOUND` error is returned

#### Scenario: Run with unauthorized tenant
- **WHEN** `insight.run` is called with an insight belonging to a different tenant
- **THEN** a `FORBIDDEN` error is returned

#### Scenario: Queue unavailable
- **WHEN** the BullMQ queue is unavailable during `insight.run`
- **THEN** a graceful error is returned indicating the queue is temporarily unavailable

### Requirement: getAIInsights tRPC procedure
The `getAIInsights` tRPC procedure SHALL query the database for persisted pipeline results and return structured AI insights including `performanceSummary`, `keyFindings`, `recommendations`, and `generatedAt` for the specified insight.

#### Scenario: Insights available
- **WHEN** `getAIInsights` is called for an insight with completed pipeline results
- **THEN** structured insights with findings and recommendations are returned

#### Scenario: No insights yet
- **WHEN** `getAIInsights` is called for an insight that has not been run
- **THEN** `{ performanceSummary: null, keyFindings: [], recommendations: [], generatedAt: null }` is returned

### Requirement: generateAIInsights tRPC procedure
The `generateAIInsights` tRPC procedure SHALL enqueue an actual insight execution job and return a real `jobId` that can be used to track generation progress.

#### Scenario: Generation triggered
- **WHEN** `generateAIInsights` is called for an active insight
- **THEN** a job is enqueued to the `insight-execution` queue and a real `jobId` is returned

#### Scenario: Generation for inactive insight
- **WHEN** `generateAIInsights` is called for an inactive insight
- **THEN** an error is returned indicating the insight must be active

### Requirement: Workflow status endpoint
The system SHALL provide a workflow status endpoint at `GET /workflows/status/:jobId` that returns the current status of a pipeline execution job including `status` (idle/running/completed/failed), `progress`, `result`, and `error`.

#### Scenario: Job in progress
- **WHEN** status is requested for a running job
- **THEN** `{ status: "running", progress: number }` is returned

#### Scenario: Job completed
- **WHEN** status is requested for a completed job
- **THEN** `{ status: "completed", result: { verdict, insights, reportId } }` is returned

#### Scenario: Job not found
- **WHEN** status is requested for a non-existent job ID
- **THEN** a `NOT_FOUND` error is returned
