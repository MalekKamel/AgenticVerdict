## ADDED Requirements

### Requirement: Pipeline Execution Status Data Contract
The system SHALL define a typed data contract for pipeline execution status including `status` (idle | running | completed | failed), `jobId`, `progress` (0-100), `startedAt`, `completedAt`, and `error` fields. This contract SHALL be used by the workflow status endpoint and the frontend status polling hook.

#### Scenario: Status contract for running job
- **WHEN** a pipeline execution is in progress
- **THEN** the status response includes `status: "running"`, `jobId`, `progress`, and `startedAt`

#### Scenario: Status contract for completed job
- **WHEN** a pipeline execution completes
- **THEN** the status response includes `status: "completed"`, `jobId`, `completedAt`, and result data

### Requirement: Structured Analysis Result Data Contract
The system SHALL define typed data contracts for `AnalysisResult` and `InsightsResult` that flow between pipeline stages. `AnalysisResult` SHALL include typed metrics, trends, and correlations. `InsightsResult` SHALL include structured findings with confidence scores, relevance scores, types, domains, and actionable text.

#### Scenario: Analysis result structure
- **WHEN** the analysis stage completes
- **THEN** it produces an `AnalysisResult` with typed metrics, detected trends, and correlations

#### Scenario: Insights result structure
- **WHEN** the insights stage completes
- **THEN** it produces an `InsightsResult` with structured findings, each having confidence and relevance scores

### Requirement: Insight Run Status Fields
The insight data contract SHALL include `lastRunStatus` (idle | running | completed | failed), `lastRunAt` (timestamp), and `lastRunJobId` fields. These fields SHALL be updated when `insight.run` is called and when pipeline execution completes.

#### Scenario: Run status updated on enqueue
- **WHEN** `insight.run` is called successfully
- **THEN** the insight's `lastRunStatus` is set to "running" and `lastRunAt` is set to the current timestamp

#### Scenario: Run status updated on completion
- **WHEN** pipeline execution completes
- **THEN** the insight's `lastRunStatus` is updated to "completed" or "failed"
