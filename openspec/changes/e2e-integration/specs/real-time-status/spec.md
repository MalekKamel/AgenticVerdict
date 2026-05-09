## ADDED Requirements

### Requirement: Status polling hook
The frontend SHALL provide a `useInsightRunStatus(jobId)` hook that polls the workflow status endpoint at a 3-second interval. The hook SHALL return the current job status (`idle`, `running`, `completed`, `failed`), progress percentage, result data, and error information.

#### Scenario: Polling starts on job submission
- **WHEN** the `insight.run` mutation succeeds and returns a `jobId`
- **THEN** the status polling hook starts polling at 3-second intervals

#### Scenario: Polling stops on terminal status
- **WHEN** the job status becomes `completed` or `failed`
- **THEN** polling stops automatically

#### Scenario: Polling cleanup on unmount
- **WHEN** the component using the hook unmounts
- **THEN** polling is cancelled to prevent memory leaks

### Requirement: Status-aware UI on detail page
The insight detail page SHALL display status-aware UI elements: a running spinner with progress indicator when status is `running`, a completed badge with success toast when status is `completed`, and a failed error display with retry option when status is `failed`.

#### Scenario: Running state display
- **WHEN** the pipeline is executing
- **THEN** the detail page shows a spinner, "Running..." text, and progress indicator

#### Scenario: Completed state display
- **WHEN** the pipeline completes successfully
- **THEN** the detail page shows a completed badge, success toast, and invalidates the detail query

#### Scenario: Failed state display
- **WHEN** the pipeline fails
- **THEN** the detail page shows an error display with the failure reason and a retry button

### Requirement: Cache invalidation on completion
The frontend SHALL invalidate the `insight.getById` query when the pipeline status transitions to `completed`. This ensures the detail page displays the latest insight data including updated `lastRunStatus`, `lastRunAt`, and pipeline results.

#### Scenario: Detail query invalidated
- **WHEN** the job status becomes `completed`
- **THEN** the `insight.getById` query is invalidated and refetched

### Requirement: Run mutation with status tracking
The detail page SHALL use `useInsightRunMutation()` (not `useInsightRun()`) for the "Run Now" action. The mutation SHALL trigger status polling on success and display appropriate success/error toasts.

#### Scenario: Run Now with status tracking
- **WHEN** the user clicks "Run Now"
- **THEN** the mutation is called, status polling starts on success, and a toast confirms the run started
