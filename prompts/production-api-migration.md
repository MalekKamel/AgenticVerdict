# Production API Migration: Mock Data Replacement

## Context

The codebase currently contains multiple API implementations using mock data for development purposes. Example: `/apps/frontend/src/features/dashboard/api/dashboard-api.ts`. These mock implementations must be replaced with production-ready integrations before deployment.

## Objective

Achieve 100% production readiness across all API endpoints by eliminating mock data implementations and replacing them with fully functional, tenant-scoped, production-grade integrations.

## Scope

### In Scope

- All frontend API layers using mock/stub data
- All hardcoded response handlers
- All simulated async operations without real backend integration
- All platform connector adapters in mock mode

### Out of Scope

- Database migration scripts (destructive approach permitted)
- Backward compatibility layers for mock endpoints
- Legacy mock data utilities used only for unit testing

## Requirements

### Analysis Phase

1. **Discovery**: Identify all files containing mock data patterns:
   - Hardcoded response objects
   - `setTimeout` simulating network latency
   - Commented-out real API calls
   - Mock adapter implementations
   - Test data generators in production paths

2. **Documentation**: Create an inventory with:
   - File path and line numbers
   - Mock data type (static, generated, simulated)
   - Dependent features/components
   - Required real data source (API endpoint, connector, database query)

### Implementation Plan

The plan must include:

1. **Priority Matrix**: Rank by business criticality and dependency chain
2. **Data Source Mapping**: Mock → Production source for each endpoint
3. **Tenant Isolation**: Ensure all replacements enforce multi-tenant boundaries
4. **Error Handling**: Replace mock success paths with real error scenarios
5. **Type Safety**: End-to-end type definitions from API response to UI
6. **Testing Strategy**: Unit, integration, and E2E tests for each migration
7. **Rollback Plan**: Feature flags or environment-based switching (optional)

## Constraints

- **Greenfield Approach**: Destructive changes permitted; no migration scripts required
- **No Backward Compatibility**: Mock endpoints can be removed entirely
- **Multi-Tenancy Mandatory**: All production APIs must enforce tenant scoping via `AsyncLocalStorage` context
- **TypeScript Strict Mode**: Zero `any` types; full end-to-end type inference
- **Observability**: All production APIs must include structured logging (Pino) with tenant context

## Deliverables

1. **Mock Data Inventory** (`docs/migration/mock-data-inventory.md`):
   - Complete list of all mock implementations
   - Risk assessment and priority ranking

2. **Implementation Plan** (`docs/migration/production-api-plan.md`):
   - Phased migration timeline
   - Per-endpoint technical specifications
   - Testing requirements per phase
   - Success criteria and validation checks

3. **Execution Checklist** (`docs/migration/migration-checklist.md`):
   - Pre-migration verification steps
   - Per-endpoint migration tasks
   - Post-migration validation
   - Rollback procedures (if applicable)

## Success Criteria

- [ ] Zero mock data in production code paths
- [ ] All APIs enforce tenant isolation
- [ ] Full TypeScript type coverage (no `any` or `unknown` escapes)
- [ ] Structured logging with tenant context on all endpoints
- [ ] Test coverage ≥ 85% for migrated business logic
- [ ] All integration tests pass with real data sources
- [ ] E2E scenarios validate production flows

## Notes

- Use `packages/data-connectors/` adapter factory for platform integrations
- Leverage `packages/core/` for domain validation and business logic
- Follow `docs/05-reference/backend-patterns.md` for API design standards
- Enforce multi-tenant guardrails per `docs/05-reference/multi-tenant-guardrails.md`
