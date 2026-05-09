## ADDED Requirements

### Requirement: Generated Insights Table in Baseline Schema
The system MUST include the `generated_insights` table and `insight_type` enum definition in `baseline-schema.sql` with proper indexes, foreign key constraints, and column definitions matching the Drizzle schema.

#### Scenario: Database reset includes generated_insights
- **WHEN** `make db-reset && make db-seed` is executed
- **THEN** the `generated_insights` table exists with all columns, indexes, and constraints
- **AND** the `insight_type` enum is registered in PostgreSQL

#### Scenario: Generated insights table has correct indexes
- **WHEN** the `generated_insights` table is created
- **THEN** indexes exist for `(tenant_id, created_at)`, `report_id`, and `analysis_id`
- **AND** foreign key constraints reference `tenants.id` and `reports.id` with `ON DELETE CASCADE`

### Requirement: Row-Level Security on Generated Insights
The system MUST enable RLS on the `generated_insights` table with tenant isolation and agency client access policies matching the pattern used by other core tables.

#### Scenario: Tenant isolation policy is active
- **WHEN** a query accesses `generated_insights` as an authenticated tenant user
- **THEN** only rows matching the user's `tenant_id` are visible
- **AND** cross-tenant data access is prevented by the RLS policy

#### Scenario: Agency client access policy is active
- **WHEN** an agency partner user queries `generated_insights`
- **THEN** rows for their authorized client tenants are visible
- **AND** unauthorized tenant data is excluded

### Requirement: Generated Insights in Core Schema
The system MUST define `generated_insights` using `coreSchema` (not `pgTable`) for consistency with related tables (`insights`, `insight_connectors`, `reports`).

#### Scenario: Drizzle schema uses core schema namespace
- **WHEN** the `generated_insights` Drizzle definition is loaded
- **THEN** it is defined via `coreSchema.table()` not `pgTable()`
- **AND** all references in the codebase use the core-schema-qualified table name

### Requirement: Insights Table Updated At Column
The system MUST add an `updated_at` timestamptz column to the `insights` table with a default of `now()` and an automatic update trigger.

#### Scenario: Updated at is set on insert
- **WHEN** a new insight is inserted
- **THEN** `updated_at` is set to the current timestamp

#### Scenario: Updated at is refreshed on modification
- **WHEN** an insight row is updated
- **THEN** `updated_at` is automatically refreshed to the current timestamp via a database trigger

### Requirement: Insight Connectors Index and RLS Policy
The system MUST add a standalone index on `insight_connectors.insight_id` and define explicit RLS policies for tenant isolation.

#### Scenario: Query by insight_id uses index
- **WHEN** a query filters `insight_connectors` by `insight_id`
- **THEN** the standalone index is used for efficient lookup

#### Scenario: Insight connectors tenant isolation
- **WHEN** a query accesses `insight_connectors` through the insights relationship
- **THEN** RLS policies ensure only the authenticated tenant's data is accessible

### Requirement: Unique Name Constraint Enforcement
The system MUST enforce a unique constraint on `(tenant_id, name)` for the `insights` table and handle violations gracefully at the API layer.

#### Scenario: Duplicate name is rejected
- **WHEN** an insight is created or updated with a name that already exists for the tenant
- **THEN** the database unique constraint prevents the operation
- **AND** the API returns a user-friendly error message
