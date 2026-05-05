# Insights & Reports Implementation Gaps Plan

**Version:** 1.0  
**Date:** 2026-05-04  
**Status:** Critical - Blocking Typecheck  
**Priority:** P0 (Release Blocker)

---

## Executive Summary

The insights-reports feature was marked as complete in `/openspec/changes/insights-reports/tasks.md`, but critical implementation gaps exist that prevent typecheck from passing. The frontend UI components reference tRPC endpoints, routes, and API methods that **do not exist** in the backend.

**Root Cause:** Tasks were marked complete based on UI component creation, but backend tRPC routers and database procedures were never implemented.

**Impact:**

- ❌ Typecheck fails with 42 errors
- ❌ Frontend cannot communicate with backend
- ❌ Feature is non-functional despite "complete" status
- ❌ CI/CD pipeline blocked

---

## Gap Analysis

### 1. Missing tRPC Endpoints (Backend)

#### Insights Router (`apps/api/src/trpc/routers/insights.ts`)

**✅ Implemented:**

- `insight.list` - List insights with pagination
- `insight.detail` - Get insight by ID
- `insight.create` - Create new insight
- `insight.update` - Update insight
- `insight.delete` - Delete insight
- `insight.run` - Trigger insight execution
- `insight.getById` - Alias for detail

**❌ Missing:**

- `insight.getAuditTrail` - Required by `AuditTrailTimeline.tsx` (line 55-57)
- `insight.generateAIInsights` - Required by AI insights feature
- `insight.getAIInsights` - Required by AI insights display

**Files Affected:**

- `apps/frontend/src/features/insights/api/insight-api.ts` (lines 104-113, 125-133)
- `apps/frontend/src/features/insights/ui/audit-trail/AuditTrailTimeline.tsx`

#### Reports Router (`apps/api/src/trpc/routers/reports.ts`)

**✅ Implemented:**

- `report.list` - List reports with pagination
- `report.detail` - Get report by ID
- `report.content` - Get report content (PDF/Excel)
- `report.delete` - Delete report
- `report.deleteMany` - Bulk delete reports

**❌ Missing:**

- `report.getSharedReport` - Required by shared report access
- `report.getSharedReportContent` - Required by shared report viewing
- `report.shares` - List active shares for a report
- `report.createShareLink` - Generate time-limited share token
- `report.revokeShareLink` - Revoke share access

**Files Affected:**

- `apps/frontend/src/features/reports/api/report-api.ts` (lines 66-124)
- `apps/frontend/src/features/reports/pages/SharedReportPage.tsx`
- `apps/frontend/src/features/reports/ui/ShareReportModal.tsx`

---

### 2. Missing Database Schema & Queries

#### Audit Trail Schema

**Required Tables:**

```sql
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  insight_id UUID REFERENCES insights(id),
  report_id UUID REFERENCES reports(id),
  actor_sub TEXT NOT NULL,
  action TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'run', 'config_change', 'delivery', 'error'
  status TEXT NOT NULL, -- 'success', 'failed', 'pending'
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_ms INTEGER,
  metadata JSONB,
  request_id TEXT
);

CREATE INDEX idx_audit_trail_tenant ON audit_trail(tenant_id);
CREATE INDEX idx_audit_trail_insight ON audit_trail(insight_id);
CREATE INDEX idx_audit_trail_timestamp ON audit_trail(timestamp DESC);
```

**Missing Drizzle Schema:**

- No `auditTrail` table in `packages/database/src/schema/`
- No RLS policies for tenant isolation
- No migration files

#### Report Sharing Schema

**Required Tables:**

```sql
CREATE TABLE report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  report_id UUID NOT NULL REFERENCES reports(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL
);

CREATE INDEX idx_report_shares_token ON report_shares(token);
CREATE INDEX idx_report_shares_report ON report_shares(report_id);
```

**Missing Drizzle Schema:**

- No `reportShares` table in `packages/database/src/schema/`
- No token generation utilities
- No expiration checking logic

---

### 3. Missing TanStack Router Routes

**Route Files Exist But Have Type Errors:**

```
apps/frontend/src/routes/$locale/dashboard/insights/$id.tsx
apps/frontend/src/routes/$locale/dashboard/insights/new.tsx
apps/frontend/src/routes/$locale/dashboard/insights/index.tsx
apps/frontend/src/routes/$locale/dashboard/reports/index.tsx
apps/frontend/src/routes/$locale/shared/reports/$reportId.tsx
```

**Issue:** Route paths reference `FileRoutesByPath` keys that don't match the actual file structure.

**Error Example:**

```typescript
// Line 5 in $id.tsx
createFileRoute("/$locale/dashboard/insights/$id");
// Error: Argument of type '"/$locale/dashboard/insights/$id"' is not assignable to parameter of type 'keyof FileRoutesByPath'
```

**Root Cause:** TanStack Router's file-based routing requires route tree generation that hasn't been run, or the route files have incorrect path exports.

---

### 4. Missing API Client Methods

#### Insight API Client

**Current Implementation (Stub):**

```typescript
export const insightApi = {
  keys: {
    list: (tenantId: string) => ["insights", tenantId],
    byId: (tenantId: string, insightId: string) => ["insight", tenantId, insightId],
    auditTrail: (tenantId: string, insightId: string) => ["auditTrail", tenantId, insightId],
  },
  getAuditTrail: async (tenantId: string, insightId: string) => {
    const response = await trpc.insight.getAuditTrail.query({ tenantId, insightId });
    return response;
  },
};
```

**Problem:** Calls `trpc.insight.getAuditTrail.query()` which doesn't exist.

#### Report API Client

**Current Implementation (Stub):**

```typescript
export const reportApi = {
  getById: async (tenantId: string, reportId: string) => {
    const response = await trpc.report.detail.query({ id: reportId });
    return response;
  },
  getSharedReport: async (reportId: string, token: string) => {
    const response = await trpc.report.getSharedReport.query({ reportId, token });
    return response;
  },
  // ... more methods that don't exist
};
```

**Problem:** Multiple methods reference non-existent tRPC procedures.

---

## Implementation Plan

### Phase 1: Database Schema (Priority: CRITICAL)

**Duration:** 2-3 hours  
**Owner:** Backend Team  
**Files to Create/Modify:**

1. **Create Drizzle Schema Files**
   - `packages/database/src/schema/audit-trail.ts`
   - `packages/database/src/schema/report-shares.ts`

2. **Push Schema Changes**

   ```bash
   pnpm --filter @agenticverdict/database db:push
   ```

3. **Add RLS Policies**
   - Tenant isolation for `audit_trail`
   - Token-based access for `report_shares` (public read with valid token)

**Acceptance Criteria:**

- ✅ Schema files exist with proper types
- ✅ Database tables created
- ✅ RLS policies enforced
- ✅ Type generation completes without errors

---

### Phase 2: Backend tRPC Endpoints (Priority: CRITICAL)

**Duration:** 4-6 hours  
**Owner:** Backend Team

#### 2.1 Audit Trail Endpoints

**File:** `apps/api/src/trpc/routers/insights.ts`

**Add:**

```typescript
const auditTrailInputSchema = z.object({
  tenantId: z.string(),
  insightId: z.string(),
  eventType: z.enum(['run', 'config_change', 'delivery', 'error']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const auditTrailOutputSchema = z.object({
  events: z.array(z.object({
    id: z.string(),
    insightId: z.string(),
    eventType: z.string(),
    status: z.string(),
    timestamp: z.string(),
    duration: z.number().optional(),
    metadata: z.record(z.unknown()).optional(),
  })),
});

// In insightRouter:
getAuditTrail: authedProcedure
  .input(auditTrailInputSchema)
  .output(auditTrailOutputSchema)
  .query(async ({ ctx, input }) => {
    const db = requireTrpcDatabase();
    // Query audit_trail table with tenant scoping
  }),
```

#### 2.2 Report Sharing Endpoints

**File:** `apps/api/src/trpc/routers/reports.ts`

**Add:**

```typescript
const createShareLinkInputSchema = z.object({
  reportId: z.string(),
  expiresAt: z.date(),
});

const shareLinkOutputSchema = z.object({
  shareUrl: z.string(),
  expiresAt: z.date(),
  token: z.string(),
});

// In reportRouter:
createShareLink: authedProcedure
  .input(createShareLinkInputSchema)
  .output(shareLinkOutputSchema)
  .mutation(async ({ ctx, input }) => {
    // Generate secure token
    // Insert into report_shares
    // Return share URL
  }),

revokeShareLink: authedProcedure
  .input(z.object({ shareId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Set revoked_at timestamp
  }),

getSharedReport: t.procedure
  .input(z.object({ reportId: z.string(), token: z.string() }))
  .query(async ({ input }) => {
    // Validate token
    // Check expiration
    // Check not revoked
    // Return report metadata
  }),

getSharedReportContent: t.procedure
  .input(z.object({ reportId: z.string(), token: z.string(), format: z.enum(['pdf', 'excel']) }))
  .query(async ({ input }) => {
    // Validate token
    // Return report content
  }),

shares: authedProcedure
  .input(z.object({ reportId: z.string() }))
  .query(async ({ ctx, input }) => {
    // List active shares for report
  }),
```

**Acceptance Criteria:**

- ✅ All tRPC procedures implemented
- ✅ Proper input/output validation with Zod
- ✅ Tenant scoping enforced via `dbScoped()`
- ✅ Error handling with canonical error codes
- ✅ Structured logging with tenant context
- ✅ Typecheck passes for backend

---

### Phase 3: Frontend Route Configuration (Priority: HIGH)

**Duration:** 1-2 hours  
**Owner:** Frontend Team

**Steps:**

1. **Regenerate TanStack Router Types**

   ```bash
   cd apps/frontend
   pnpm generate-routes
   ```

2. **Fix Route File Exports**
   - Ensure each route file exports correct `Route` type
   - Verify `createFileRoute()` paths match file structure

3. **Update Route Tree**
   - Check `apps/frontend/src/routes/__generated__/routeTree.gen.ts`
   - Manually regenerate if auto-generation fails

**Alternative (if route generation broken):**

Comment out route imports temporarily:

```typescript
// Temporarily disable route type checking
// const route = createFileRoute("/$locale/dashboard/insights/$id")
```

**Acceptance Criteria:**

- ✅ Route files compile without type errors
- ✅ Navigation works between insight/report pages
- ✅ Route paths match `ROUTE_PATHS` constants

---

### Phase 4: Frontend API Client Fixes (Priority: HIGH)

**Duration:** 2-3 hours  
**Owner:** Frontend Team

**Files to Fix:**

1. **`apps/frontend/src/features/insights/api/insight-api.ts`**
   - Fix `getAuditTrail` to use correct tRPC call
   - Add proper error handling
   - Add retry logic with exponential backoff

2. **`apps/frontend/src/features/reports/api/report-api.ts`**
   - Fix all share-related methods
   - Add proper type guards for undefined values
   - Add error translation for user-facing messages

3. **Fix Component Type Errors**
   - `AuditTrailTimeline.tsx`: Add `rem` import, fix type casts
   - `ReportViewerPage.tsx`: Fix undefined type issues
   - `ShareReportModal.tsx`: Fix notification error parameters

**Acceptance Criteria:**

- ✅ All API client methods compile
- ✅ No `any` types or unsafe casts
- ✅ Proper loading/error states
- ✅ Typecheck passes for frontend

---

### Phase 5: Integration Testing (Priority: MEDIUM)

**Duration:** 3-4 hours  
**Owner:** QA Team

**Test Scenarios:**

1. **Audit Trail Flow**
   - Create insight
   - Run insight manually
   - View audit trail in History tab
   - Filter by event type
   - Verify timeline displays correctly

2. **Report Sharing Flow**
   - Generate report
   - Create share link (1h, 24h, 7d, 30d)
   - Copy share URL
   - Open in incognito window
   - Verify report displays
   - Revoke share link
   - Verify access denied

3. **Error Scenarios**
   - Expired share token
   - Invalid insight ID
   - Network failures
   - Tenant isolation violations (should be blocked)

**Acceptance Criteria:**

- ✅ All integration tests pass
- ✅ Error states display correctly
- ✅ Loading states work properly
- ✅ RTL layout works in Arabic

---

### Phase 6: Documentation & Cleanup (Priority: LOW)

**Duration:** 1 hour  
**Owner:** Technical Writer

**Tasks:**

1. **Update API Documentation**
   - Add new tRPC endpoints to OpenAPI spec
   - Document audit trail event types
   - Document share link format

2. **Update Changelog**
   - List all new endpoints
   - Note breaking changes (if any)
   - Document migration path

3. **Update Feature Flag**
   - Ensure `ENABLE_INSIGHTS_UI` flag works
   - Test flag on/off states

**Acceptance Criteria:**

- ✅ Documentation updated
- ✅ Changelog entry complete
- ✅ Feature flag tested

---

## Risk Assessment

### High Risk Items

1. **Database Schema Changes**
   - **Risk:** Data loss if destructive migration
   - **Mitigation:** Backup database before schema push
   - **Contingency:** Rollback script ready

2. **Tenant Isolation**
   - **Risk:** Cross-tenant data leakage
   - **Mitigation:** RLS policies + `dbScoped()` wrapper
   - **Testing:** Tenant isolation tests required

3. **Share Token Security**
   - **Risk:** Token prediction/guessing
   - **Mitigation:** Use `crypto.randomBytes(32)` for tokens
   - **Testing:** Token entropy tests

### Medium Risk Items

1. **Route Generation**
   - **Risk:** Broken navigation
   - **Mitigation:** Manual route testing
   - **Contingency:** Hardcode routes temporarily

2. **Performance**
   - **Risk:** Slow audit trail queries
   - **Mitigation:** Add database indexes
   - **Monitoring:** Query performance metrics

---

## Success Criteria

**Phase 1-4 Complete (MVP):**

- ✅ `pnpm run typecheck` passes with 0 errors
- ✅ `pnpm run lint` passes with 0 violations
- ✅ Frontend can list insights
- ✅ Frontend can create insights
- ✅ Frontend can view reports
- ✅ Audit trail displays
- ✅ Report sharing works

**All Phases Complete (Production-Ready):**

- ✅ All unit tests pass (70%+ coverage)
- ✅ All integration tests pass
- ✅ E2E tests for critical paths
- ✅ Documentation complete
- ✅ Feature flag tested
- ✅ Performance metrics acceptable

---

## Estimated Timeline

| Phase                    | Duration        | Dependencies | Status     |
| ------------------------ | --------------- | ------------ | ---------- |
| Phase 1: Database Schema | 2-3 hours       | None         | ⏳ Pending |
| Phase 2: Backend tRPC    | 4-6 hours       | Phase 1      | ⏳ Pending |
| Phase 3: Routes          | 1-2 hours       | None         | ⏳ Pending |
| Phase 4: Frontend API    | 2-3 hours       | Phase 2      | ⏳ Pending |
| Phase 5: Testing         | 3-4 hours       | Phase 1-4    | ⏳ Pending |
| Phase 6: Documentation   | 1 hour          | Phase 1-4    | ⏳ Pending |
| **Total**                | **13-19 hours** |              |            |

**Critical Path:** Phase 1 → Phase 2 → Phase 4 → Phase 3

---

## Immediate Next Steps

1. **Create database schema files** (Priority: NOW)
   - `packages/database/src/schema/audit-trail.ts`
   - `packages/database/src/schema/report-shares.ts`

2. **Run database migration**

   ```bash
   pnpm --filter @agenticverdict/database db:push
   ```

3. **Implement tRPC endpoints**
   - Start with `getAuditTrail` (blocks most typecheck errors)
   - Then implement share link endpoints

4. **Fix frontend type errors**
   - Add missing imports
   - Fix undefined type issues
   - Remove unsafe type casts

5. **Run typecheck**
   ```bash
   pnpm run typecheck
   ```

---

## Appendix: Typecheck Error Summary

**Total Errors:** 42  
**By Category:**

| Category                    | Count | Files Affected                                      |
| --------------------------- | ----- | --------------------------------------------------- |
| Missing tRPC methods        | 12    | `insight-api.ts`, `report-api.ts`                   |
| Missing imports             | 8     | `AuditTrailTimeline.tsx`, `StepIndicator.tsx`, etc. |
| Route path types            | 6     | `routes/**/*.tsx`                                   |
| Undefined type mismatches   | 10    | `ReportViewerPage.tsx`, `SharedReportPage.tsx`      |
| React Node type issues      | 4     | `AuditTrailTimeline.tsx`, `ExcelViewer.tsx`         |
| Notification API mismatches | 2     | `ShareReportModal.tsx`                              |

**Files with Most Errors:**

1. `apps/frontend/src/features/reports/api/report-api.ts` - 8 errors
2. `apps/frontend/src/features/reports/pages/ReportViewerPage.tsx` - 7 errors
3. `apps/frontend/src/features/reports/ui/ShareReportModal.tsx` - 7 errors
4. `apps/frontend/src/features/insights/ui/audit-trail/AuditTrailTimeline.tsx` - 5 errors

---

## References

- [Original Tasks](/openspec/changes/insights-reports/tasks.md)
- [Architecture Spec](/docs/architecture/ui/04-pages/insights-reports.md)
- [System Entities](/docs/architecture/ui/02-system-entities/insights-reports.md)
- [Core Insights Spec](/specs/00-core/03-insights/README.md)
- [Testing Policy](/docs/05-reference/testing-policy.md)
- [Multi-Tenant Guardrails](/docs/05-reference/multi-tenant-guardrails.md)

---

**Document Status:** Draft  
**Reviewers Needed:** Backend Lead, Frontend Lead, QA Lead  
**Approval Required:** CTO (for timeline and resource allocation)
