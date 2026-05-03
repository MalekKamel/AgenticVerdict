# Production API Migration: Implementation Plan

**Document ID:** `docs/migration/production-api-plan.md`  
**Created:** 2026-05-03  
**Status:** Draft  
**Owner:** Engineering Team  
**Timeline:** 3 weeks (15 business days)

---

## Overview

This document provides a phased implementation plan for migrating all mock data implementations to production-ready integrations. The migration follows a dependency-ordered approach to minimize risk and enable incremental validation.

### Migration Goals

1. **Zero Mock Data in Production:** All user-facing APIs must return real data from production sources
2. **Tenant Isolation:** Every API call must enforce tenant-scoped data access
3. **Type Safety:** End-to-end TypeScript types from database to UI
4. **Observability:** Structured logging with tenant context on all endpoints
5. **Test Coverage:** ≥85% business logic coverage, ≥90% critical path coverage

### Non-Goals

- Database migration scripts (destructive approach permitted per AGENTS.md)
- Backward compatibility with mock endpoints
- Migration of test-only utilities (mock-chat-model, test setup files, etc.)

---

## Phase 1: Foundation (Days 1-3)

### Objective

Establish tRPC infrastructure and database connectivity required for all subsequent migrations.

### Tasks

#### 1.1 tRPC Router Setup

**Owner:** Backend Engineer  
**Duration:** 1 day  
**Dependencies:** None

**Tasks:**

- [ ] Create `apps/api/src/trpc/routers/dashboard.ts` with procedures:
  - `homeSummary` - Returns aggregated KPIs, insights, connector status
  - `domainSummary` - Returns domain-specific metrics
  - `agencyOverview` - Returns agency-level client overview
- [ ] Implement proper tenant context extraction via `ctx.tenant.tenantId`
- [ ] Add RBAC guards for agency-level access
- [ ] Write integration tests with real database

**Technical Specification:**

```typescript
// apps/api/src/trpc/routers/dashboard.ts
export const dashboardRouter = t.router({
  homeSummary: authedProcedure.output(dashboardHomeSummarySchema).query(async ({ ctx }) => {
    const db = requireTrpcDatabase();
    const tenantId = ctx.tenant.tenantId;

    return dbScoped(db, async (tx) => {
      // Query tenant_connectors, insights, reports
      // Aggregate KPIs per tenant
      // Return typed response
    });
  }),

  domainSummary: authedProcedure
    .input(z.object({ domain: z.string() }))
    .output(dashboardDomainSummarySchema)
    .query(async ({ ctx, input }) => {
      // Domain-specific metrics
    }),

  agencyOverview: authedProcedure.output(dashboardAgencyOverviewSchema).query(async ({ ctx }) => {
    // Agency-level client data with RBAC filtering
  }),
});
```

**Acceptance Criteria:**

- tRPC procedures compile without errors
- Integration tests pass with test database
- Tenant context properly extracted from JWT
- RBAC guards prevent unauthorized agency access

---

#### 1.2 Database Schema Validation

**Owner:** Backend Engineer  
**Duration:** 0.5 days  
**Dependencies:** 1.1

**Tasks:**

- [ ] Verify `tenant_connectors` table has required columns
- [ ] Verify `insights` table exists with tenant FK
- [ ] Verify `reports` table exists with tenant FK
- [ ] Verify `tenants` table has `type` and `status` columns
- [ ] Run RLS policy validation tests
- [ ] Document schema assumptions in migration notes

**SQL Validation Queries:**

```sql
-- Verify tenant_connectors structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tenant_connectors'
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('tenant_connectors', 'insights', 'reports', 'tenants');

-- Test tenant isolation
SET LOCAL app.current_tenant_id = 'test-tenant-uuid';
SELECT * FROM tenant_connectors WHERE tenant_id = current_setting('app.current_tenant_id')::uuid;
```

**Acceptance Criteria:**

- All required tables exist
- RLS policies enforce tenant isolation
- Schema documentation updated

---

#### 1.3 Frontend tRPC Client Integration

**Owner:** Frontend Engineer  
**Duration:** 1 day  
**Dependencies:** 1.1

**Tasks:**

- [ ] Update `apps/frontend/src/lib/api/trpc-client.ts` to include dashboard router
- [ ] Create React Query hooks for dashboard procedures
- [ ] Add error handling with `DashboardTypedError` mapping
- [ ] Implement loading states and suspense boundaries

**Code Structure:**

```typescript
// apps/frontend/src/features/dashboard/api/dashboard-api.ts (NEW)
import { trpc } from "@/lib/api/trpc-client";

export function useDashboardHomeSummary(tenantId: string | undefined) {
  return trpc.dashboard.homeSummary.useQuery(undefined, {
    enabled: !!tenantId,
    retry: false,
  });
}

export function useDashboardDomainSummary(domain: string) {
  return trpc.dashboard.domainSummary.useQuery({ domain });
}

export function useDashboardAgencyOverview() {
  return trpc.dashboard.agencyOverview.useQuery();
}
```

**Acceptance Criteria:**

- tRPC client types include dashboard router
- React Query hooks compile without errors
- Error mapping handles all tRPC error codes
- Loading states display correctly

---

#### 1.4 Observability Setup

**Owner:** Backend Engineer  
**Duration:** 0.5 days  
**Dependencies:** 1.1

**Tasks:**

- [ ] Add Pino logging to all dashboard tRPC procedures
- [ ] Include tenant context in all log entries
- [ ] Add request tracing with `requestId`
- [ ] Configure log levels (info for success, warn for errors)

**Logging Pattern:**

```typescript
import { logger } from "@agenticverdict/observability";

const log = logger.child({ module: "dashboard-router" });

export const dashboardRouter = t.router({
  homeSummary: authedProcedure.query(async ({ ctx }) => {
    const start = Date.now();
    log.info(
      {
        tenantId: ctx.tenant.tenantId,
        procedure: "homeSummary",
      },
      "dashboard.homeSummary.start",
    );

    try {
      const result = await fetchDashboardData(ctx.tenant.tenantId);
      log.info(
        {
          tenantId: ctx.tenant.tenantId,
          procedure: "homeSummary",
          duration: Date.now() - start,
        },
        "dashboard.homeSummary.success",
      );
      return result;
    } catch (error) {
      log.error(
        {
          tenantId: ctx.tenant.tenantId,
          procedure: "homeSummary",
          error: error.message,
        },
        "dashboard.homeSummary.error",
      );
      throw error;
    }
  }),
});
```

**Acceptance Criteria:**

- All procedures log start/success/error events
- Logs include tenantId, requestId, procedure name
- Structured JSON format verified in development

---

### Phase 1 Deliverables

- [ ] tRPC dashboard router with 3 procedures
- [ ] Database schema validated
- [ ] Frontend tRPC hooks implemented
- [ ] Observability logging in place
- [ ] Integration tests passing

---

## Phase 2: Dashboard API Migration (Days 4-6)

### Objective

Replace hardcoded mock data in `dashboard-api.ts` with real tRPC calls.

### Tasks

#### 2.1 Dashboard API Refactor

**Owner:** Frontend Engineer  
**Duration:** 2 days  
**Dependencies:** Phase 1 complete

**Tasks:**

- [ ] Replace `fetchDashboardHomeSummary` implementation
- [ ] Replace `fetchDashboardDomainSummary` implementation
- [ ] Replace `fetchDashboardAgencyOverview` implementation
- [ ] Remove all hardcoded mock data constants
- [ ] Update error handling to use tRPC error translator
- [ ] Add comprehensive unit tests

**Migration Pattern:**

```typescript
// BEFORE (mock)
export async function fetchDashboardHomeSummary(tenantId: string | undefined) {
  const raw = {
    kpis: [
      { id: "insights", labelKey: "home.kpi.totalInsights", value: 12, ... }
    ],
    // ... hardcoded data
  };
  // ...
}

// AFTER (production)
export async function fetchDashboardHomeSummary(tenantId: string | undefined) {
  if (!tenantId) {
    return err(tenantContextDashboardError("TENANT_CONTEXT_MISSING"));
  }

  try {
    const result = await trpcClient.dashboard.homeSummary.query();
    return ok(result);
  } catch (error) {
    return err(mapTrpcClientErrorToDashboardError(error as TRPCClientError<AppRouter>));
  }
}
```

**Acceptance Criteria:**

- Zero hardcoded data in file
- All functions call tRPC procedures
- Error handling covers all failure modes
- Unit tests achieve ≥85% coverage

---

#### 2.2 Dashboard Component Integration

**Owner:** Frontend Engineer  
**Duration:** 1 day  
**Dependencies:** 2.1

**Tasks:**

- [ ] Update dashboard components to use new API hooks
- [ ] Handle loading states with skeletons
- [ ] Handle error states with user-friendly messages
- [ ] Verify RTL (Arabic) layout compatibility
- [ ] Test with real tenant data

**Acceptance Criteria:**

- Dashboard displays real data from API
- Loading states show during fetch
- Error states display helpful messages
- RTL layout renders correctly

---

#### 2.3 Dashboard API Cleanup

**Owner:** Frontend Engineer  
**Duration:** 0.5 days  
**Dependencies:** 2.2

**Tasks:**

- [ ] Remove `MOCK_AGENCY_CLIENTS` constant
- [ ] Remove inline mock data objects
- [ ] Update JSDoc comments to reflect production behavior
- [ ] Remove unused type definitions

**Acceptance Criteria:**

- No mock data remains in file
- Documentation accurate
- TypeScript compilation succeeds

---

### Phase 2 Deliverables

- [ ] Dashboard API fully migrated to tRPC
- [ ] Dashboard components display real data
- [ ] Mock data completely removed
- [ ] Unit tests passing with ≥85% coverage

---

## Phase 3: Auth API Migration (Days 7-9)

### Objective

Eliminate in-memory auth mock and enforce real authentication flows.

### Tasks

#### 3.1 Auth API Mock Removal

**Owner:** Backend + Frontend Engineer  
**Duration:** 2 days  
**Dependencies:** Phase 1 complete

**Tasks:**

- [ ] Remove `isFrontendAuthApiMockEnabled()` checks from all auth methods
- [ ] Delete `mockBrowserSession` variable
- [ ] Delete `mockVerificationStateByKey` Map
- [ ] Remove all `MOCK_*` constants
- [ ] Remove `Promise.resolve()` mock paths
- [ ] Ensure all methods call real tRPC procedures

**Code Changes:**

```typescript
// BEFORE
export const authApi = {
  login: async (input) => {
    if (isFrontendAuthApiMockEnabled()) {
      // 40 lines of mock logic
      return wrapMutation(Promise.resolve({ data: mockUser }));
    }
    return wrapMutation(trpcClient.auth.login.mutate(input));
  },
};

// AFTER
export const authApi = {
  login: async (input) => {
    return wrapMutation(trpcClient.auth.login.mutate(mergePreSessionTenantInput(input)));
  },
};
```

**Acceptance Criteria:**

- Zero mock code paths in auth-api.ts
- All methods call real tRPC procedures
- File reduced by ~400 lines

---

#### 3.2 Auth Flow Validation

**Owner:** QA Engineer  
**Duration:** 1 day  
**Dependencies:** 3.1

**Tasks:**

- [ ] Test login flow with real credentials
- [ ] Test registration + email verification
- [ ] Test logout flow
- [ ] Test password reset flow
- [ ] Test session persistence
- [ ] Verify tenant context propagation

**Test Scenarios:**

1. User registers → receives verification code → verifies email → logs in
2. User logs in → session persists across refresh → logout clears session
3. User requests password reset → receives link → resets password → logs in
4. Multi-tenant: User from tenant A cannot access tenant B data

**Acceptance Criteria:**

- All auth flows work end-to-end
- Tenant isolation enforced
- Session management secure
- Email verification functional

---

#### 3.3 Auth Configuration Cleanup

**Owner:** DevOps Engineer  
**Duration:** 0.5 days  
**Dependencies:** 3.2

**Tasks:**

- [ ] Remove `VITE_PUBLIC_AUTH_API_MODE` environment variable
- [ ] Remove `isFrontendAuthApiMockEnabled()` function from codebase
- [ ] Update `.env.example` to remove mock auth vars
- [ ] Update deployment documentation

**Acceptance Criteria:**

- No auth mock configuration remains
- Documentation reflects production-only mode
- Environment validation updated

---

### Phase 3 Deliverables

- [ ] Auth API mock completely removed
- [ ] All auth flows validated with real backend
- [ ] Configuration cleaned up
- [ ] Security audit passed

---

## Phase 4: Connector Adapter Migration (Days 10-14)

### Objective

Migrate all 5 platform connector adapters from mock to production implementations.

### Tasks

#### 4.1 Platform API Credentials Setup

**Owner:** DevOps Engineer  
**Duration:** 1 day  
**Dependencies:** None (parallel track)

**Tasks:**

- [ ] Obtain Meta Graph API credentials (App ID, App Secret)
- [ ] Obtain GA4 service account credentials
- [ ] Obtain GSC API credentials (OAuth2)
- [ ] Obtain GBP API credentials (OAuth2)
- [ ] Obtain TikTok Marketing API credentials
- [ ] Store credentials in secure secret manager (AWS Secrets Manager / Doppler)
- [ ] Document credential rotation procedures

**Acceptance Criteria:**

- All 5 platform credentials obtained
- Credentials stored securely
- Rotation procedures documented

---

#### 4.2 Meta Adapter Production Implementation

**Owner:** Backend Engineer  
**Duration:** 1 day  
**Dependencies:** 4.1

**Tasks:**

- [ ] Review `packages/data-connectors/src/meta/meta-adapter.ts`
- [ ] Verify OAuth2 flow implemented
- [ ] Verify rate limiting configured
- [ ] Test with real Meta account
- [ ] Validate metrics normalization

**Acceptance Criteria:**

- Meta adapter authenticates successfully
- Metrics fetched from real API
- Rate limiting prevents throttling
- Error handling covers API failures

---

#### 4.3 GA4 Adapter Production Implementation

**Owner:** Backend Engineer  
**Duration:** 1 day  
**Dependencies:** 4.1

**Tasks:**

- [ ] Review `packages/data-connectors/src/ga4/ga4-adapter.ts`
- [ ] Verify service account authentication
- [ ] Test with real GA4 property
- [ ] Validate metrics normalization

**Acceptance Criteria:**

- GA4 adapter authenticates with service account
- Analytics data fetched successfully
- Metrics match GA4 UI

---

#### 4.4 GSC Adapter Production Implementation

**Owner:** Backend Engineer  
**Duration:** 1 day  
**Dependencies:** 4.1

**Tasks:**

- [ ] Review `packages/data-connectors/src/gsc/gsc-adapter.ts`
- [ ] Verify OAuth2 flow
- [ ] Test with real GSC property
- [ ] Validate search query metrics

**Acceptance Criteria:**

- GSC adapter authenticates
- Search Console data fetched
- Query performance metrics accurate

---

#### 4.5 GBP Adapter Production Implementation

**Owner:** Backend Engineer  
**Duration:** 1 day  
**Dependencies:** 4.1

**Tasks:**

- [ ] Review `packages/data-connectors/src/gbp/gbp-adapter.ts`
- [ ] Verify OAuth2 flow
- [ ] Test with real GBP account
- [ ] Validate business profile metrics

**Acceptance Criteria:**

- GBP adapter authenticates
- Business Profile data fetched
- Insights metrics accurate

---

#### 4.6 TikTok Adapter Production Implementation

**Owner:** Backend Engineer  
**Duration:** 1 day  
**Dependencies:** 4.1

**Tasks:**

- [ ] Review `packages/data-connectors/src/tiktok/tiktok-adapter.ts`
- [ ] Verify OAuth2 flow
- [ ] Test with real TikTok ad account
- [ ] Validate ad performance metrics

**Acceptance Criteria:**

- TikTok adapter authenticates
- Ad metrics fetched successfully
- Campaign data accurate

---

#### 4.7 Adapter Factory Mock Removal

**Owner:** Backend Engineer  
**Duration:** 0.5 days  
**Dependencies:** 4.2-4.6 complete

**Tasks:**

- [ ] Remove `MockAdapterFactory` usage from `adapter-factory.ts`
- [ ] Remove `shouldUseMockAdapter()` function
- [ ] Remove mock scenario configuration
- [ ] Ensure factory always returns production adapters

**Code Changes:**

```typescript
// BEFORE
export function createConnectorAdapter(config) {
  if (shouldUseMockAdapter(config.connector, config.useMock)) {
    return MockAdapterFactory.create(config);
  }
  return createProductionAdapter(config.connector, baseOptions(config));
}

// AFTER
export function createConnectorAdapter(config) {
  return createProductionAdapter(config.connector, baseOptions(config));
}
```

**Acceptance Criteria:**

- Factory always returns production adapters
- Mock factory imports removed
- No conditional mock logic

---

#### 4.8 Mock Adapter Deletion

**Owner:** Backend Engineer  
**Duration:** 0.5 days  
**Dependencies:** 4.7

**Tasks:**

- [ ] Delete `packages/data-connectors/src/mock-adapter.ts`
- [ ] Delete `packages/data-connectors/src/mock-adapter-factory.ts`
- [ ] Delete `packages/data-connectors/src/mock-static-data.ts`
- [ ] Update `packages/data-connectors/src/index.ts` exports
- [ ] Remove mock adapter tests (keep integration tests)

**Acceptance Criteria:**

- Mock adapter files deleted
- Exports updated
- Build succeeds

---

### Phase 4 Deliverables

- [ ] All 5 platform adapters production-ready
- [ ] Platform API credentials configured
- [ ] Mock adapter infrastructure deleted
- [ ] Integration tests passing with real APIs

---

## Phase 5: Worker & Configuration Cleanup (Days 15-16)

### Objective

Remove remaining mock configurations and validate worker processes.

### Tasks

#### 5.1 Worker Mock Configuration Removal

**Owner:** Backend Engineer  
**Duration:** 0.5 days  
**Dependencies:** Phase 4 complete

**Tasks:**

- [ ] Remove `mockScenario` and `mockSeed` from report queue jobs
- [ ] Remove `tenantSyntheticFallback` from worker tenant ALS
- [ ] Update job payloads to exclude mock config
- [ ] Test report generation with real connector data

**Acceptance Criteria:**

- Worker jobs use real data only
- No mock config in job payloads
- Report generation successful

---

#### 5.2 Runtime Policy Cleanup

**Owner:** DevOps Engineer  
**Duration:** 0.5 days  
**Dependencies:** All phases complete

**Tasks:**

- [ ] Remove `mockMode` from `RuntimePolicy` type
- [ ] Remove `mockConnectors` from policy
- [ ] Remove `AGENTICVERDICT_MOCK_MODE` env var parsing
- [ ] Remove `AGENTICVERDICT_MOCK_CONNECTORS` env var parsing
- [ ] Remove `AGENTICVERDICT_MOCK_SCENARIO` env var parsing
- [ ] Remove `AGENTICVERDICT_MOCK_SEED` env var parsing
- [ ] Simplify `assertProductionSafeRuntimePolicy()` to always enforce production mode
- [ ] Update `isFeatureMockEnabled()` to always return `false`

**Code Changes:**

```typescript
// BEFORE
export type RuntimePolicy = {
  runtimeEnv: RuntimeEnv;
  mockMode: RuntimeMockMode;
  mockConnectors: ConnectorType[];
  // ...
};

// AFTER
export type RuntimePolicy = {
  runtimeEnv: RuntimeEnv;
  stubs: {
    reportFormats: boolean;
    emailDelivery: boolean;
  };
  tenant: {
    allowSyntheticFallback: boolean;
  };
};
```

**Acceptance Criteria:**

- Runtime policy simplified
- Mock configuration removed
- Environment variables validated

---

#### 5.3 Environment Variable Cleanup

**Owner:** DevOps Engineer  
**Duration:** 0.5 days  
**Dependencies:** 5.2

**Tasks:**

- [ ] Update `.env.example` to remove mock vars
- [ ] Update `.env.docker.example` to remove mock vars
- [ ] Update deployment documentation
- [ ] Update CI/CD pipeline configurations
- [ ] Remove mock vars from staging/production environments

**Removed Variables:**

```bash
# REMOVED - No longer needed
AGENTICVERDICT_MOCK_MODE=off
AGENTICVERDICT_MOCK_CONNECTORS=
AGENTICVERDICT_MOCK_SCENARIO=normal
AGENTICVERDICT_MOCK_SEED=42001
VITE_PUBLIC_AUTH_API_MODE=real
AGENTICVERDICT_STUB_REPORT_FORMATS=0
AGENTICVERDICT_STUB_EMAIL_DELIVERY=0
```

**Acceptance Criteria:**

- Documentation updated
- Example files cleaned
- CI/CD pipelines updated

---

#### 5.4 Testing Package Cleanup

**Owner:** Backend Engineer  
**Duration:** 0.5 days  
**Dependencies:** All phases complete

**Tasks:**

- [ ] Review `packages/testing/src/mock-chat-model.ts` (keep for agent tests)
- [ ] Review `packages/testing/src/mock-llm-library.ts` (keep for agent tests)
- [ ] Ensure mock testing utilities are not imported in production code
- [ ] Add lint rule to prevent mock imports in production paths

**Acceptance Criteria:**

- Test mocks isolated to test files
- Lint rule prevents accidental imports
- Production code clean

---

### Phase 5 Deliverables

- [ ] Worker mock configuration removed
- [ ] Runtime policy simplified
- [ ] Environment variables cleaned up
- [ ] Testing utilities properly isolated

---

## Phase 6: Validation & Sign-off (Days 17-18)

### Objective

Comprehensive validation of all migrations and production readiness sign-off.

### Tasks

#### 6.1 End-to-End Testing

**Owner:** QA Engineer  
**Duration:** 1 day  
**Dependencies:** All phases complete

**Test Scenarios:**

**R01: Tenant Onboarding**

- [ ] Create new tenant
- [ ] Register user
- [ ] Verify email
- [ ] Login successfully
- [ ] Dashboard displays real data

**R02: Connector Integration**

- [ ] Connect Meta account
- [ ] Connect GA4 property
- [ ] Connect GSC property
- [ ] Connect GBP account
- [ ] Connect TikTok ad account
- [ ] All connectors show "healthy" status

**R03: Dashboard Validation**

- [ ] Home summary shows real KPIs
- [ ] Domain summary shows real metrics
- [ ] Agency overview shows real clients
- [ ] Data updates on refresh

**R04: Report Generation**

- [ ] Generate PDF report
- [ ] Generate Excel report
- [ ] Report includes real connector data
- [ ] Email delivery successful

**R05: Multi-Tenant Isolation**

- [ ] Tenant A user cannot see Tenant B data
- [ ] API calls include tenant context
- [ ] Database queries respect RLS policies

**Acceptance Criteria:**

- All scenarios pass
- Zero critical bugs
- Performance within SLA

---

#### 6.2 Security Audit

**Owner:** Security Engineer  
**Duration:** 0.5 days  
**Dependencies:** 6.1

**Audit Checklist:**

- [ ] No mock data in production code paths
- [ ] All API endpoints enforce tenant isolation
- [ ] JWT tokens properly validated
- [ ] Passwords hashed with bcrypt/argon2
- [ ] No credentials logged
- [ ] Rate limiting configured
- [ ] CORS policies restrictive
- [ ] SQL injection prevented (parameterized queries)

**Acceptance Criteria:**

- Zero critical security findings
- All high findings remediated
- Security sign-off obtained

---

#### 6.3 Performance Validation

**Owner:** Backend Engineer  
**Duration:** 0.5 days  
**Dependencies:** 6.1

**Load Tests:**

- [ ] Dashboard API: < 500ms p95 latency at 100 RPS
- [ ] Auth API: < 200ms p95 latency at 500 RPS
- [ ] Connector sync: < 5s per connector at 10 concurrent
- [ ] Report generation: < 30s for 100-page report

**Acceptance Criteria:**

- All latency targets met
- No memory leaks
- CPU utilization < 70% under load

---

#### 6.4 Documentation Update

**Owner:** Tech Writer  
**Duration:** 0.5 days  
**Dependencies:** All phases complete

**Documents to Update:**

- [ ] `README.md` - Remove mock mode references
- [ ] `docs/docker/quick-start.md` - Update environment variables
- [ ] `docs/05-reference/backend-patterns.md` - Add production patterns
- [ ] API documentation - Update with real endpoints
- [ ] Deployment guide - Remove mock configuration steps

**Acceptance Criteria:**

- All documentation accurate
- No references to mock mode
- Deployment guide tested

---

### Phase 6 Deliverables

- [ ] E2E tests all passing
- [ ] Security audit complete
- [ ] Performance validated
- [ ] Documentation updated
- [ ] Production sign-off obtained

---

## Rollback Plan

While this migration is designed to be low-risk (no database migrations, no backward compatibility), a rollback plan is provided for critical issues.

### Rollback Triggers

- Critical security vulnerability discovered
- Data corruption detected
- > 50% of users unable to access dashboard
- Auth system failure preventing logins

### Rollback Procedure

1. **Immediate Action:** Revert to previous Git tag

   ```bash
   git checkout <previous-tag>
   git push origin <branch> --force
   ```

2. **Deploy Rollback:**

   ```bash
   make deploy-rollback TAG=<previous-tag>
   ```

3. **Validate Rollback:**
   - Confirm mock data restored
   - Verify all services healthy
   - Monitor error rates

4. **Post-Rollback:**
   - Conduct incident review
   - Document root cause
   - Plan remediation

### Rollback Time Estimate

- **Detection:** 15 minutes
- **Decision:** 15 minutes
- **Execution:** 30 minutes
- **Validation:** 30 minutes
- **Total:** ~1.5 hours

---

## Success Metrics

| Metric                                        | Target  | Measurement            |
| --------------------------------------------- | ------- | ---------------------- |
| Mock data in production                       | 0 files | Code scan              |
| Test coverage (business logic)                | ≥85%    | Vitest coverage report |
| Test coverage (critical paths)                | ≥90%    | Vitest coverage report |
| API latency (p95)                             | <500ms  | Prometheus metrics     |
| Auth failure rate                             | <0.1%   | Error tracking         |
| Tenant isolation violations                   | 0       | Security audit         |
| Production incidents (30 days post-migration) | 0       | Incident tracking      |

---

## Resource Requirements

| Role              | Allocation | Duration |
| ----------------- | ---------- | -------- |
| Backend Engineer  | 1.0 FTE    | 3 weeks  |
| Frontend Engineer | 0.5 FTE    | 2 weeks  |
| DevOps Engineer   | 0.3 FTE    | 1 week   |
| QA Engineer       | 0.5 FTE    | 1 week   |
| Security Engineer | 0.2 FTE    | 2 days   |
| Tech Writer       | 0.2 FTE    | 2 days   |

**Total Effort:** ~6 person-weeks

---

## Risks & Mitigations

| Risk                     | Probability | Impact   | Mitigation                          |
| ------------------------ | ----------- | -------- | ----------------------------------- |
| Platform API rate limits | Medium      | High     | Implement circuit breakers, caching |
| Tenant data leakage      | Low         | Critical | RLS policies, integration tests     |
| Auth system failure      | Low         | Critical | Staged rollout, feature flags       |
| Performance degradation  | Medium      | Medium   | Load testing, monitoring            |
| Credential management    | Medium      | High     | Secret manager, rotation procedures |

---

## Appendix A: File Change Summary

### Files to Create

```
apps/api/src/trpc/routers/dashboard.ts
apps/frontend/src/features/dashboard/hooks/use-dashboard-home-summary.ts
apps/frontend/src/features/dashboard/hooks/use-dashboard-domain-summary.ts
apps/frontend/src/features/dashboard/hooks/use-dashboard-agency-overview.ts
```

### Files to Modify

```
apps/frontend/src/features/dashboard/api/dashboard-api.ts (rewrite)
apps/frontend/src/lib/api/auth-api.ts (remove mock paths)
apps/frontend/src/lib/api/trpc-client.ts (add dashboard router)
packages/data-connectors/src/adapter-factory.ts (remove mock logic)
packages/config/src/runtime-policy.ts (simplify)
apps/worker/src/queues/report-queues.ts (remove mock config)
apps/worker/src/tenant/worker-tenant-als.ts (remove synthetic fallback)
```

### Files to Delete

```
packages/data-connectors/src/mock-adapter.ts
packages/data-connectors/src/mock-adapter-factory.ts
packages/data-connectors/src/mock-static-data.ts
```

---

## Appendix B: Environment Variable Changes

### Before Migration

```bash
# Mock Configuration
AGENTICVERDICT_MOCK_MODE=selective
AGENTICVERDICT_MOCK_CONNECTORS=meta,ga4
AGENTICVERDICT_MOCK_SCENARIO=normal
AGENTICVERDICT_MOCK_SEED=42001
VITE_PUBLIC_AUTH_API_MODE=mock
AGENTICVERDICT_STUB_REPORT_FORMATS=0
AGENTICVERDICT_STUB_EMAIL_DELIVERY=0
```

### After Migration

```bash
# No mock configuration needed
# All features run in production mode by default
```

---

**Approval Signatures:**

| Role              | Name | Date | Signature |
| ----------------- | ---- | ---- | --------- |
| Engineering Lead  |      |      |           |
| Product Owner     |      |      |           |
| Security Engineer |      |      |           |
| DevOps Lead       |      |      |           |

---

**Next Steps:**

1. Review this plan with the team
2. Assign task owners
3. Create GitHub issues for each task
4. Begin Phase 1 execution
5. Track progress in project management tool
