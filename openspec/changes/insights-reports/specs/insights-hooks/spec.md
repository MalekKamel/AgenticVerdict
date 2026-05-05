## ADDED Requirements

### Requirement: Insights React Query Hooks
The system SHALL provide React Query hooks for all insights CRUD operations with proper tenant scoping, caching, and error handling.

#### Scenario: Fetch insights list with filters
- **WHEN** user calls `useInsightList({ status: 'enabled', page: 1, pageSize: 20 })`
- **THEN** system fetches insights filtered by status with pagination from tRPC endpoint

#### Scenario: Create new insight
- **WHEN** user calls `useInsightCreate.mutate()` with valid insight data
- **THEN** system creates insight, invalidates insights list cache, and returns created insight

#### Scenario: Update existing insight
- **WHEN** user calls `useInsightUpdate.mutate()` with insight ID and updated data
- **THEN** system updates insight, invalidates related caches, and returns updated insight

#### Scenario: Delete insight
- **WHEN** user calls `useInsightDelete.mutate()` with insight ID
- **THEN** system deletes insight, invalidates insights list cache, and confirms deletion

#### Scenario: Run insight report generation
- **WHEN** user calls `useInsightRun.mutate()` with insight ID
- **THEN** system triggers report generation job and returns job status

#### Scenario: Handle tenant scoping
- **WHEN** any insight hook is called
- **THEN** system automatically includes tenantId from AsyncLocalStorage context in all API calls

#### Scenario: Handle API errors
- **WHEN** insight API call fails
- **THEN** hook exposes error state with translated error message via error-system
