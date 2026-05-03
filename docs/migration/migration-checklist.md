# Production API Migration Checklist

**Document ID:** `docs/migration/migration-checklist.md`  
**Created:** 2026-05-03  
**Status:** Active  
**Owner:** Engineering Team

---

## How to Use This Checklist

- **Pre-Migration:** Complete all items before starting code changes
- **Per-Phase:** Complete items for each phase before proceeding to next
- **Post-Migration:** Complete all cleanup and validation items
- **Sign-off:** All stakeholders must approve before production deployment

Mark items as:

- [ ] Not started
- [x] Complete
- [~] In progress
- [!] Blocked

---

## Pre-Migration Verification

Complete these items **before** starting Phase 1.

### Infrastructure Readiness

- [ ] Docker Compose environment running (`make dev`)
- [ ] PostgreSQL database accessible
- [ ] Redis cache accessible
- [ ] tRPC server compiling without errors
- [ ] Frontend build succeeding (`pnpm --filter @agenticverdict/frontend build`)
- [ ] Worker process starting successfully

### Database Validation

- [ ] Database schema pushed (`pnpm --filter @agenticverdict/database db:push`)
- [ ] RLS policies enabled on all tenant-scoped tables
- [ ] Test tenant created with UUID
- [ ] Test user created and linked to tenant
- [ ] RBAC roles configured (viewer, editor, admin)

### Environment Configuration

- [ ] `.env.local` configured with required variables
- [ ] `AGENTICVERDICT_RUNTIME_ENV=development` set
- [ ] `AGENTICVERDICT_MOCK_MODE=off` set (prepare for removal)
- [ ] JWT secret configured (`AGENTICVERDICT_JWT_SECRET`)
- [ ] Database URL configured (`DATABASE_URL`)
- [ ] Redis URL configured (`REDIS_URL`)

### Credential Setup (Platform APIs)

- [ ] Meta Graph API: App ID and App Secret obtained
- [ ] GA4: Service account JSON downloaded
- [ ] GSC: OAuth2 credentials configured
- [ ] GBP: OAuth2 credentials configured
- [ ] TikTok: API credentials obtained
- [ ] All credentials stored in secret manager

### Testing Infrastructure

- [ ] Vitest test suite passing (`pnpm run test:unit`)
- [ ] Integration tests passing (`pnpm run test:integration`)
- [ ] E2E tests configured (Playwright)
- [ ] Test coverage reporting enabled
- [ ] CI/CD pipeline green

### Documentation Review

- [ ] `docs/migration/mock-data-inventory.md` reviewed
- [ ] `docs/migration/production-api-plan.md` reviewed
- [ ] Team briefed on migration scope
- [ ] Stakeholders identified and available

---

## Phase 1: Foundation Checklist

### 1.1 tRPC Router Setup

- [ ] `apps/api/src/trpc/routers/dashboard.ts` created
- [ ] `homeSummary` procedure implemented
- [ ] `domainSummary` procedure implemented
- [ ] `agencyOverview` procedure implemented
- [ ] Tenant context extraction working (`ctx.tenant.tenantId`)
- [ ] RBAC guards implemented for agency procedures
- [ ] Procedures registered in root router
- [ ] TypeScript compilation successful
- [ ] Integration tests written and passing

**Validation Commands:**

```bash
# Compile API
pnpm --filter @agenticverdict/api build

# Run integration tests
pnpm --filter @agenticverdict/api test:integration

# Verify tRPC types
pnpm run typecheck
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**
- [ ] Code Reviewer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 1.2 Database Schema Validation

- [ ] `tenant_connectors` table structure verified
- [ ] `insights` table exists with correct schema
- [ ] `reports` table exists with correct schema
- [ ] `tenants` table has `type` and `status` columns
- [ ] RLS policies tested with `SET LOCAL app.current_tenant_id`
- [ ] Tenant isolation validated (Tenant A cannot query Tenant B)
- [ ] Schema documentation updated

**Validation Commands:**

```bash
# Push schema (verify no errors)
pnpm --filter @agenticverdict/database db:push

# Test RLS
psql $DATABASE_URL -c "SET LOCAL app.current_tenant_id = 'test-uuid'; SELECT * FROM tenant_connectors;"
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**
- [ ] DBA (if applicable): ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 1.3 Frontend tRPC Client Integration

- [ ] Dashboard router added to tRPC client
- [ ] `useDashboardHomeSummary` hook created
- [ ] `useDashboardDomainSummary` hook created
- [ ] `useDashboardAgencyOverview` hook created
- [ ] Error handling with `DashboardTypedError` mapping
- [ ] Loading states implemented
- [ ] Suspense boundaries configured
- [ ] TypeScript types inferred correctly

**Validation Commands:**

```bash
# Compile frontend
pnpm --filter @agenticverdict/frontend build

# Type check
pnpm run typecheck
```

**Sign-off:**

- [ ] Frontend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**
- [ ] Code Reviewer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 1.4 Observability Setup

- [ ] Pino logger imported in dashboard router
- [ ] Start event logged for each procedure
- [ ] Success event logged with duration
- [ ] Error event logged with error details
- [ ] Tenant ID included in all log entries
- [ ] Request ID included in all log entries
- [ ] Log format validated (structured JSON)
- [ ] Log levels appropriate (info/warn/error)

**Validation Commands:**

```bash
# Start API with logging
pnpm --filter @agenticverdict/api dev

# Call dashboard endpoint and verify logs
curl http://localhost:3000/api/trpc/dashboard.homeSummary \
  -H "Authorization: Bearer <test-jwt>"
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**
- [ ] DevOps Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### Phase 1 Gate Review

**All items complete?** [ ] Yes [ ] No

**Blockers identified:** ******************\_\_\_******************

**Proceed to Phase 2?** [ ] Approved [ ] Not approved

**Approval:**

- [ ] Engineering Lead: ******\_\_\_\_****** Date: **\_\_\_\_**

---

## Phase 2: Dashboard API Migration Checklist

### 2.1 Dashboard API Refactor

- [ ] `fetchDashboardHomeSummary` calls tRPC procedure
- [ ] `fetchDashboardDomainSummary` calls tRPC procedure
- [ ] `fetchDashboardAgencyOverview` calls tRPC procedure
- [ ] All hardcoded mock data removed
- [ ] `MOCK_AGENCY_CLIENTS` constant deleted
- [ ] Inline mock objects removed
- [ ] Error handling uses tRPC error translator
- [ ] Unit tests updated (≥85% coverage)

**Validation Commands:**

```bash
# Verify no mock data remains
grep -n "value: 12" apps/frontend/src/features/dashboard/api/dashboard-api.ts
grep -n "MOCK_AGENCY_CLIENTS" apps/frontend/src/features/dashboard/api/dashboard-api.ts

# Run tests with coverage
pnpm --filter @agenticverdict/frontend test --coverage
```

**Sign-off:**

- [ ] Frontend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**
- [ ] Code Reviewer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 2.2 Dashboard Component Integration

- [ ] Dashboard home page uses new hooks
- [ ] Domain pages use domain summary hook
- [ ] Agency page uses agency overview hook
- [ ] Loading skeletons display during fetch
- [ ] Error states show user-friendly messages
- [ ] RTL (Arabic) layout tested
- [ ] Real tenant data displays correctly
- [ ] No console errors in browser

**Validation Commands:**

```bash
# Start frontend
pnpm --filter @agenticverdict/frontend dev

# Manual testing
# 1. Login with test user
# 2. Navigate to /dashboard
# 3. Verify real data displays
# 4. Check loading states
# 5. Test error scenarios
```

**Sign-off:**

- [ ] Frontend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**
- [ ] QA Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 2.3 Dashboard API Cleanup

- [ ] JSDoc comments updated to reflect production behavior
- [ ] Unused type definitions removed
- [ ] File imports cleaned up
- [ ] No TypeScript warnings
- [ ] Prettier formatting applied

**Validation Commands:**

```bash
# Lint and format
pnpm --filter @agenticverdict/frontend lint
pnpm --filter @agenticverdict/frontend format
```

**Sign-off:**

- [ ] Frontend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### Phase 2 Gate Review

**All items complete?** [ ] Yes [ ] No

**Blockers identified:** ******************\_\_\_******************

**Proceed to Phase 3?** [ ] Approved [ ] Not approved

**Approval:**

- [ ] Engineering Lead: ******\_\_\_\_****** Date: **\_\_\_\_**

---

## Phase 3: Auth API Migration Checklist

### 3.1 Auth API Mock Removal

- [ ] `isFrontendAuthApiMockEnabled()` checks removed from `login`
- [ ] `isFrontendAuthApiMockEnabled()` checks removed from `register`
- [ ] `isFrontendAuthApiMockEnabled()` checks removed from `logout`
- [ ] `isFrontendAuthApiMockEnabled()` checks removed from `getSession`
- [ ] `isFrontendAuthApiMockEnabled()` checks removed from `verifyEmail`
- [ ] `isFrontendAuthApiMockEnabled()` checks removed from `resendEmailVerification`
- [ ] `isFrontendAuthApiMockEnabled()` checks removed from `requestPasswordReset`
- [ ] `isFrontendAuthApiMockEnabled()` checks removed from `confirmPasswordReset`
- [ ] `mockBrowserSession` variable deleted
- [ ] `mockVerificationStateByKey` Map deleted
- [ ] All `MOCK_*` constants removed
- [ ] All `Promise.resolve()` mock paths removed
- [ ] File size reduced by ~400 lines

**Validation Commands:**

```bash
# Verify no mock code remains
grep -n "isFrontendAuthApiMockEnabled" apps/frontend/src/lib/api/auth-api.ts
grep -n "mockBrowserSession" apps/frontend/src/lib/api/auth-api.ts
grep -n "MOCK_" apps/frontend/src/lib/api/auth-api.ts

# Count lines (should be ~450, down from ~870)
wc -l apps/frontend/src/lib/api/auth-api.ts
```

**Sign-off:**

- [ ] Frontend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**
- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 3.2 Auth Flow Validation

- [ ] Login flow works with real credentials
- [ ] Registration creates user in database
- [ ] Email verification code sent (or stubbed in dev)
- [ ] Email verification validates against database
- [ ] Logout clears session cookie and JWT
- [ ] Session persists across page refresh
- [ ] Password reset flow functional
- [ ] Tenant context propagates correctly
- [ ] Multi-tenant isolation verified

**Validation Commands:**

```bash
# Manual testing checklist
# 1. Register new user
# 2. Verify email (use code from logs or DB)
# 3. Login
# 4. Verify session in browser storage
# 5. Refresh page (session persists)
# 6. Logout
# 7. Verify session cleared
# 8. Try accessing protected route (redirects to login)
```

**Sign-off:**

- [ ] QA Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**
- [ ] Security Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 3.3 Auth Configuration Cleanup

- [ ] `isFrontendAuthApiMockEnabled()` function deleted from codebase
- [ ] `VITE_PUBLIC_AUTH_API_MODE` removed from `.env.example`
- [ ] `VITE_PUBLIC_AUTH_API_MODE` removed from `.env.docker.example`
- [ ] Deployment documentation updated
- [ ] Frontend runtime policy simplified

**Validation Commands:**

```bash
# Verify function removed
grep -r "isFrontendAuthApiMockEnabled" apps/ packages/

# Verify env var removed
grep "VITE_PUBLIC_AUTH_API_MODE" .env.example
```

**Sign-off:**

- [ ] DevOps Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### Phase 3 Gate Review

**All items complete?** [ ] Yes [ ] No

**Blockers identified:** ******************\_\_\_******************

**Proceed to Phase 4?** [ ] Approved [ ] Not approved

**Approval:**

- [ ] Engineering Lead: ******\_\_\_\_****** Date: **\_\_\_\_**
- [ ] Security Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

## Phase 4: Connector Adapter Migration Checklist

### 4.1 Platform API Credentials Setup

- [ ] Meta Graph API credentials stored in secret manager
- [ ] GA4 service account JSON stored in secret manager
- [ ] GSC OAuth2 credentials stored in secret manager
- [ ] GBP OAuth2 credentials stored in secret manager
- [ ] TikTok API credentials stored in secret manager
- [ ] Credential rotation procedure documented
- [ ] Credentials accessible from API and worker

**Validation Commands:**

```bash
# Verify credentials accessible (example for Meta)
make secrets-get META_APP_ID
make secrets-get META_APP_SECRET
```

**Sign-off:**

- [ ] DevOps Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**
- [ ] Security Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 4.2 Meta Adapter Production

- [ ] Meta adapter authenticates with real credentials
- [ ] OAuth2 token refresh working
- [ ] Metrics fetched from Graph API
- [ ] Rate limiting prevents throttling
- [ ] Error handling covers API failures
- [ ] Integration test passing

**Validation Commands:**

```bash
# Run Meta adapter tests
pnpm --filter @agenticverdict/data-connectors test meta-adapter

# Manual test: Connect Meta account in UI
# Verify metrics display
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 4.3 GA4 Adapter Production

- [ ] GA4 adapter authenticates with service account
- [ ] Analytics data fetched successfully
- [ ] Metrics match GA4 UI
- [ ] Date range filtering working
- [ ] Integration test passing

**Validation Commands:**

```bash
# Run GA4 adapter tests
pnpm --filter @agenticverdict/data-connectors test ga4-adapter
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 4.4 GSC Adapter Production

- [ ] GSC adapter authenticates with OAuth2
- [ ] Search Console data fetched
- [ ] Query performance metrics accurate
- [ ] Site verification working
- [ ] Integration test passing

**Validation Commands:**

```bash
# Run GSC adapter tests
pnpm --filter @agenticverdict/data-connectors test gsc-adapter
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 4.5 GBP Adapter Production

- [ ] GBP adapter authenticates with OAuth2
- [ ] Business Profile data fetched
- [ ] Insights metrics accurate
- [ ] Location data validated
- [ ] Integration test passing

**Validation Commands:**

```bash
# Run GBP adapter tests
pnpm --filter @agenticverdict/data-connectors test gbp-adapter
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 4.6 TikTok Adapter Production

- [ ] TikTok adapter authenticates with OAuth2
- [ ] Ad metrics fetched successfully
- [ ] Campaign data accurate
- [ ] Date range filtering working
- [ ] Integration test passing

**Validation Commands:**

```bash
# Run TikTok adapter tests
pnpm --filter @agenticverdict/data-connectors test tiktok-adapter
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 4.7 Adapter Factory Mock Removal

- [ ] `MockAdapterFactory` import removed
- [ ] `shouldUseMockAdapter()` function removed
- [ ] Mock scenario configuration removed
- [ ] Factory always returns production adapters
- [ ] TypeScript compilation successful
- [ ] All adapter tests passing

**Validation Commands:**

```bash
# Verify mock factory removed
grep -n "MockAdapterFactory" packages/data-connectors/src/adapter-factory.ts
grep -n "shouldUseMockAdapter" packages/data-connectors/src/adapter-factory.ts

# Compile and test
pnpm --filter @agenticverdict/data-connectors build
pnpm --filter @agenticverdict/data-connectors test
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 4.8 Mock Adapter Deletion

- [ ] `packages/data-connectors/src/mock-adapter.ts` deleted
- [ ] `packages/data-connectors/src/mock-adapter-factory.ts` deleted
- [ ] `packages/data-connectors/src/mock-static-data.ts` deleted
- [ ] `packages/data-connectors/src/index.ts` exports updated
- [ ] No broken imports in codebase
- [ ] Build successful

**Validation Commands:**

```bash
# Verify files deleted
ls packages/data-connectors/src/mock-*.ts

# Verify no broken imports
pnpm run typecheck

# Full build
pnpm run build
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### Phase 4 Gate Review

**All items complete?** [ ] Yes [ ] No

**Blockers identified:** ******************\_\_\_******************

**Proceed to Phase 5?** [ ] Approved [ ] Not approved

**Approval:**

- [ ] Engineering Lead: ******\_\_\_\_****** Date: **\_\_\_\_**

---

## Phase 5: Worker & Configuration Cleanup Checklist

### 5.1 Worker Mock Configuration Removal

- [ ] `mockScenario` removed from report queue job payload
- [ ] `mockSeed` removed from report queue job payload
- [ ] `tenantSyntheticFallback` removed from worker ALS
- [ ] Job payloads validated (no mock config)
- [ ] Report generation tested with real data
- [ ] Worker tests passing

**Validation Commands:**

```bash
# Verify mock config removed
grep -n "mockScenario\|mockSeed" apps/worker/src/queues/report-queues.ts
grep -n "tenantSyntheticFallback" apps/worker/src/tenant/worker-tenant-als.ts

# Test worker
pnpm --filter @agenticverdict/worker test
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 5.2 Runtime Policy Cleanup

- [ ] `mockMode` removed from `RuntimePolicy` type
- [ ] `mockConnectors` removed from policy
- [ ] `AGENTICVERDICT_MOCK_MODE` parsing removed
- [ ] `AGENTICVERDICT_MOCK_CONNECTORS` parsing removed
- [ ] `AGENTICVERDICT_MOCK_SCENARIO` parsing removed
- [ ] `AGENTICVERDICT_MOCK_SEED` parsing removed
- [ ] `assertProductionSafeRuntimePolicy()` simplified
- [ ] `isFeatureMockEnabled()` returns `false` always
- [ ] All tests passing

**Validation Commands:**

```bash
# Verify mock config removed
grep -n "mockMode\|mockConnectors" packages/config/src/runtime-policy.ts

# Test config package
pnpm --filter @agenticverdict/config test
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 5.3 Environment Variable Cleanup

- [ ] `.env.example` updated (mock vars removed)
- [ ] `.env.docker.example` updated (mock vars removed)
- [ ] Deployment guide updated
- [ ] CI/CD pipeline configs updated
- [ ] Staging environment vars cleaned
- [ ] Production environment vars cleaned

**Validation Commands:**

```bash
# Verify env files clean
grep "MOCK" .env.example
grep "MOCK" .env.docker.example

# Review CI/CD changes
cat .github/workflows/ci.yml | grep -i mock
```

**Sign-off:**

- [ ] DevOps Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 5.4 Testing Package Cleanup

- [ ] `mock-chat-model.ts` verified as test-only
- [ ] `mock-llm-library.ts` verified as test-only
- [ ] Lint rule added to prevent mock imports in production
- [ ] No production code imports mock utilities

**Validation Commands:**

```bash
# Verify no production imports
grep -r "from.*mock-chat-model" apps/api/src apps/worker/src apps/frontend/src
grep -r "from.*mock-llm-library" apps/api/src apps/worker/src apps/frontend/src
```

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### Phase 5 Gate Review

**All items complete?** [ ] Yes [ ] No

**Blockers identified:** ******************\_\_\_******************

**Proceed to Phase 6?** [ ] Approved [ ] Not approved

**Approval:**

- [ ] Engineering Lead: ******\_\_\_\_****** Date: **\_\_\_\_**

---

## Phase 6: Validation & Sign-off Checklist

### 6.1 End-to-End Testing

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

**Sign-off:**

- [ ] QA Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**
- [ ] Product Owner: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 6.2 Security Audit

- [ ] No mock data in production code paths
- [ ] All API endpoints enforce tenant isolation
- [ ] JWT tokens properly validated
- [ ] Passwords hashed with bcrypt
- [ ] No credentials logged
- [ ] Rate limiting configured
- [ ] CORS policies restrictive
- [ ] SQL injection prevented

**Sign-off:**

- [ ] Security Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 6.3 Performance Validation

- [ ] Dashboard API: < 500ms p95 latency at 100 RPS
- [ ] Auth API: < 200ms p95 latency at 500 RPS
- [ ] Connector sync: < 5s per connector at 10 concurrent
- [ ] Report generation: < 30s for 100-page report
- [ ] No memory leaks detected
- [ ] CPU utilization < 70% under load

**Sign-off:**

- [ ] Backend Engineer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

### 6.4 Documentation Update

- [ ] `README.md` updated (no mock references)
- [ ] `docs/docker/quick-start.md` updated
- [ ] `docs/05-reference/backend-patterns.md` updated
- [ ] API documentation updated
- [ ] Deployment guide updated
- [ ] Mock data inventory marked as historical
- [ ] Implementation plan marked as complete

**Sign-off:**

- [ ] Tech Writer: ******\_\_\_\_****** Date: **\_\_\_\_**

---

## Final Production Sign-off

**All phases complete?** [ ] Yes [ ] No

**All checklists signed off?** [ ] Yes [ ] No

**Zero critical bugs?** [ ] Yes [ ] No

**Security audit passed?** [ ] Yes [ ] No

**Performance targets met?** [ ] Yes [ ] No

**Documentation complete?** [ ] Yes [ ] No

### Final Approval

| Role              | Name | Signature | Date |
| ----------------- | ---- | --------- | ---- |
| Engineering Lead  |      |           |      |
| Product Owner     |      |           |      |
| Security Engineer |      |           |      |
| DevOps Lead       |      |           |      |
| QA Lead           |      |           |      |

---

## Post-Deployment Monitoring

Monitor for 30 days post-deployment:

- [ ] Error rates < 0.1%
- [ ] API latency within SLA
- [ ] No tenant isolation violations
- [ ] Authentication success rate > 99.9%
- [ ] Connector sync success rate > 95%
- [ ] Zero security incidents

**30-Day Review Date:** ******\_\_\_\_******

**Review Attendees:** ******************\_\_\_******************

**Issues Identified:** ******************\_\_\_******************

**Action Items:** ******************\_\_\_******************

---

## Appendix: Quick Reference Commands

### Build & Test

```bash
# Full build
pnpm run build

# Type check
pnpm run typecheck

# Lint
pnpm run lint

# Unit tests
pnpm run test:unit

# Integration tests
pnpm run test:integration

# E2E tests
pnpm run test:e2e
```

### Code Search

```bash
# Find remaining mock references
grep -r "MOCK\|mockData\|fakeData" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v ".test.ts" | grep -v "node_modules"

# Find mock imports
grep -r "from.*mock" apps/api/src apps/worker/src apps/frontend/src
```

### Deployment

```bash
# Deploy to staging
make deploy-staging

# Deploy to production
make deploy-production

# Rollback
make deploy-rollback TAG=<previous-tag>
```

---

**Document History:**

| Version | Date       | Author           | Changes         |
| ------- | ---------- | ---------------- | --------------- |
| 1.0     | 2026-05-03 | Engineering Team | Initial version |
