## MODIFIED Requirements

### Requirement: Insight Creation and Configuration
The system SHALL allow users to create insights with connector selection, metric configuration, AI settings, scheduling, and delivery options.

**Changes:**
- Added dynamic connector metrics fetching (replaces static metric list)
- Added execution status tracking (idle/running/completed/failed)
- Added domain field populated from backend
- Enhanced type safety with Zod validation for all JSONB fields

#### Scenario: Create insight with connector metrics
- **WHEN** user creates a new insight
- **THEN** system fetches available metrics dynamically for selected connectors and requires at least one metric per connector

#### Scenario: Insight execution status tracking
- **WHEN** insight is executed
- **THEN** system tracks and displays execution status (idle/running/completed/failed) and last run timestamp

#### Scenario: Domain display
- **WHEN** insight is displayed in list or detail view
- **THEN** system shows the domain field populated from backend (not hardcoded)

### Requirement: Insight Error Handling
The system SHALL handle errors gracefully with user-friendly messages and canonical error codes.

**Changes:**
- Integrated canonical error system with error translation
- Added error boundaries to prevent full page crashes
- Enhanced error messages with actionable guidance

#### Scenario: User-friendly error messages
- **WHEN** an error occurs during insight operations
- **THEN** system displays translated error message with error code for support tickets

#### Scenario: Error boundary protection
- **WHEN** a component throws an error
- **THEN** error boundary catches it and displays fallback UI without crashing entire page

#### Scenario: Error logging with tenant context
- **WHEN** error occurs
- **THEN** system logs error with tenantId, requestId, and userId for debugging
