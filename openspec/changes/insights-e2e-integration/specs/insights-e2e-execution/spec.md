## ADDED Requirements

### Requirement: Insight Execution Pipeline with Metrics Store
The system MUST wire the `metricsStore` into the intelligence pipeline during insight execution so that database query tools (`fetch_*_metrics`, `calculate_metrics`, `compute_b2b_kpis_from_snapshots`) are available to the analysis, insights, and verdict stages.

#### Scenario: Insight execution has access to metrics tools
- **WHEN** an insight execution job is processed by `defaultInsightExecutionProcessor`
- **THEN** the `metricsStore` is passed through the `specialization` field to `runIntelligencePipeline`
- **AND** `createPipelineAgentTools()` registers database query tools for the pipeline agent

#### Scenario: Pipeline agent can query metrics during analysis
- **WHEN** the analysis stage of the intelligence pipeline executes
- **THEN** the agent can invoke `fetch_*_metrics` tools to retrieve platform metrics
- **AND** the agent can invoke `calculate_metrics` and `compute_b2b_kpis_from_snapshots` tools

### Requirement: Connector Metrics and Filters Consumption
The system MUST consume `selectedMetrics` and `filters` from `insight_connectors` during execution, filtering fetched metrics and applying filters to data queries.

#### Scenario: Execution applies connector-level metric selection
- **WHEN** an insight execution job runs with configured `selectedMetrics` on its connectors
- **THEN** only the selected metrics are fetched from each connector adapter
- **AND** unselected metrics are excluded from the analysis input

#### Scenario: Execution applies connector-level filters
- **WHEN** an insight execution job runs with configured `filters` on its connectors
- **THEN** the filters are applied to data fetching queries
- **AND** filtered results are used in the pipeline analysis

### Requirement: Insight-Specific AI Configuration
The system MUST use the insight's `aiConfig` (model, provider, prompt) during execution instead of always defaulting to tenant-level provider settings.

#### Scenario: Execution uses insight-specific model
- **WHEN** an insight has a custom `aiConfig.model` and `aiConfig.provider`
- **THEN** the pipeline uses the specified model and provider for that execution
- **AND** the model is validated against supported models for the selected provider before execution

### Requirement: Scheduled Insight Execution
The system MUST process `InsightSchedule` configurations (frequency, time) and enqueue insight execution jobs at scheduled times using a dedicated schedule queue.

#### Scenario: Scheduled insight enqueues execution job
- **WHEN** an insight has a schedule with `frequency: "daily"` and `time: 9`
- **THEN** an execution job is enqueued daily at 09:00 in the insight execution queue
- **AND** the job contains the insight ID, tenant ID, and execution configuration

#### Scenario: Weekly scheduled insight respects day and time
- **WHEN** an insight has `frequency: "weekly"` with a configured day and time
- **THEN** execution jobs are enqueued only on the configured day at the configured time

### Requirement: Idempotent Insight Execution
The system MUST prevent duplicate job enqueue for the same insight within a time window by checking for existing running jobs before enqueueing.

#### Scenario: Duplicate run attempt returns existing job
- **WHEN** `insight.run` is called while a job for the same insight is already in progress
- **THEN** the system returns the existing `jobId` instead of enqueueing a new job
- **AND** no duplicate execution occurs

#### Scenario: Sequential runs are allowed after completion
- **WHEN** `insight.run` is called after the previous job has reached a terminal status
- **THEN** a new job is enqueued normally

### Requirement: Disabled Insight Execution Prevention
The system MUST prevent execution of disabled insights and return a user-friendly error.

#### Scenario: Running a disabled insight fails
- **WHEN** `insight.run` is called on an insight with `enabled: false`
- **THEN** the system rejects the request with a clear error message
- **AND** no job is enqueued

### Requirement: Connector Health Pre-Check
The system MUST verify all associated connectors are healthy/connected before executing an insight, returning early with an error if any connector is disconnected.

#### Scenario: Execution proceeds with healthy connectors
- **WHEN** an insight execution job starts and all associated connectors report healthy status
- **THEN** execution proceeds normally

#### Scenario: Execution fails with disconnected connectors
- **WHEN** an insight execution job starts and one or more connectors are disconnected
- **THEN** the job fails immediately with a descriptive error listing the disconnected connectors
- **AND** no pipeline execution occurs

### Requirement: Insight Type Enum Consistency
The system MUST use a canonical insight type enum (`"opportunity" | "risk" | "observation" | "recommendation"`) across the pipeline, database schema, and API layer with explicit mapping functions instead of blind type casts.

#### Scenario: Pipeline output maps to canonical types
- **WHEN** the intelligence pipeline produces insight items
- **THEN** each item's type is mapped to the canonical enum via an explicit mapping function
- **AND** the mapped type is stored in `generated_insights.insight_type`

### Requirement: Insight Execution Queue Observability
The system MUST include the `INSIGHT_EXECUTION_QUEUE` in BullMQ queue depth metrics refresh so that backlog observability is available.

#### Scenario: Queue depth metrics include insight execution
- **WHEN** `refreshBullmqQueueDepthMetrics` is called
- **THEN** the insight execution queue's waiting, active, and delayed job counts are reported
- **AND** the `agenticverdict_queue_depth` gauge includes the insight execution queue
