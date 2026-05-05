## Context

The Insights feature UI is functionally complete but lacks production-ready integration with backend services. Current issues:

1. **Static metrics**: Connector metrics are hardcoded instead of fetched from API
2. **Missing execution state**: No visual feedback during report generation
3. **Type safety gaps**: Unsafe `as` assertions on JSONB fields create runtime risks
4. **No user feedback**: Mutations complete silently without toast notifications
5. **Broken report actions**: View/Download/Share buttons non-functional
6. **Poor error handling**: Raw errors exposed to users without translation

**Stakeholders:** Frontend team, Backend team, QA, End users (marketing analysts)

**Constraints:**

- Must work behind existing `ENABLE_INSIGHTS_UI` feature flag
- Backend API endpoints must be available (mock data for development)
- Multi-tenant isolation required (tenant-scoped queries)
- Arabic/English localization support

## Goals / Non-Goals

**Goals:**

- Complete connector metrics API integration with loading/error states
- Implement real-time execution status tracking (idle/running/completed/failed)
- Achieve 100% type safety with zero `as` assertions
- Add toast notifications for all user actions
- Wire all report action buttons (View, Download, Share, Bulk Download)
- Implement canonical error handling with user-friendly messages
- Enable automatic AI insights generation after report completion
- Display last run timestamp and domain from backend

**Non-Goals:**

- New connector platform integrations (use existing adapters)
- Custom report template designer (future enhancement)
- Advanced filtering/sorting beyond current scope
- Mobile-responsive redesign (already responsive)
- Performance optimization beyond critical path (Phase 4)

## Decisions

### 1. Connector Metrics Fetching Strategy

**Decision:** Fetch metrics on-demand when connectors are selected, not upfront.

**Rationale:**

- Reduces initial page load time (fewer API calls)
- Metrics only needed during insight creation/editing
- Aligns with existing React Query patterns in codebase

**Alternatives considered:**

- Pre-fetch all metrics on page load → Wastes bandwidth, slows initial render
- Cache metrics globally → Complexity not justified (metrics rarely change)

### 2. Execution State Management

**Decision:** Derive running state from backend status field, not local state.

**Rationale:**

- Single source of truth (backend job queue)
- Survives page refreshes
- Consistent across multiple tabs/windows

**Implementation:**

- Backend populates `status` and `lastRunAt` from recent job execution
- Frontend polls every 5 seconds when status is `running`
- Optimistic UI updates for immediate feedback

**Alternatives considered:**

- WebSocket real-time updates → Overkill for 5-second polling interval
- Local state only → Lost on refresh, inconsistent across tabs

### 3. Type Safety Approach

**Decision:** Use Zod schemas for runtime validation + TypeScript interfaces for compile-time safety.

**Rationale:**

- Catches errors at API boundary
- Provides clear error messages for malformed data
- Aligns with existing `packages/core/` patterns

**Implementation:**

```typescript
// Runtime validation
const InsightAIConfigSchema = z.object({
  model: z.string(),
  provider: z.enum(["anthropic", "openai"]).optional(),
  qualityLevel: z.enum(["standard", "premium"]),
  // ...
});

// TypeScript interface
export interface InsightAIConfig {
  model: string;
  provider?: "anthropic" | "openai";
  qualityLevel: "standard" | "premium";
  // ...
}
```

### 4. Toast Notification Strategy

**Decision:** Use existing `showSuccessNotification` / `showErrorNotification` utilities.

**Rationale:**

- Consistent UX across application
- Already integrated with Mantine
- Handles RTL (Arabic) layout automatically

**Implementation:**

- All mutations include `onSuccess` and `onError` handlers
- Error messages translated via canonical error system
- Auto-dismiss after 5 seconds

### 5. Bulk Download Implementation

**Decision:** Client-side ZIP generation with JSZip library.

**Rationale:**

- Reduces server load (no server-side ZIP creation)
- Faster for users (parallel downloads)
- Simpler backend (no new endpoint needed)

**Alternatives considered:**

- Server-side ZIP generation → Additional endpoint, increased server load
- Sequential downloads → Poor UX, browser may block multiple downloads

**Trade-off:** Larger client-side memory usage for many reports (mitigated by limiting to 10 reports max)

### 6. AI Insights Auto-Generation Trigger

**Decision:** Backend worker triggers AI generation after report completion event.

**Rationale:**

- Decoupled from frontend (works even if user navigates away)
- Retry logic handled by BullMQ job system
- Consistent with existing worker patterns

**Implementation:**

- Worker listens for `report.completed` event
- Triggers `insight.generateAI` job with report data
- Frontend auto-refreshes AI insights card via React Query invalidation

## Risks / Trade-offs

### [Risk] Backend API Delays

**Mitigation:** Use mock adapter mode (`AGENTICVERDICT_MOCK_MODE=all`) for frontend development. Backend and frontend can work in parallel.

### [Risk] Type Validation Performance

**Mitigation:** Zod validation only at API boundaries (tRPC router responses). Internal code uses validated TypeScript types.

### [Risk] Client-Side ZIP Memory Usage

**Mitigation:** Limit bulk download to 10 reports max. Show warning if user selects more. Future enhancement: server-side ZIP for large batches.

### [Risk] Polling Overhead

**Mitigation:** Only poll when insight status is `running`. Stop polling after status changes to `completed` or `failed`. 5-second interval balances freshness vs. load.

### [Trade-off] Phase 4 Features Deferred

Accessibility audit, performance optimization, manage connectors modal, and version selector are deferred to post-launch. **Acceptable** because critical path (Phases 1-3) delivers production-ready core functionality.

## Migration Plan

### Phase 1: Critical Fixes (Day 1)

1. Backend deploys metrics endpoint and execution status tracking
2. Frontend implements connector metrics hook and running state
3. Type safety interfaces added, type assertions removed
4. **Gate:** All TypeScript errors resolved, metrics loading correctly

### Phase 2: High Priority (Day 2)

1. Toast notifications added to all mutations
2. Report actions wired (View, Download, Share)
3. Error handling with canonical error system
4. Bulk download with JSZip implemented
5. **Gate:** E2E tests passing for all user actions

### Phase 3: Medium Priority (Day 3)

1. Domain extraction from backend
2. AI insights auto-generation trigger
3. Last run timestamp display
4. Remaining type assertion cleanup
5. **Gate:** Manual QA pass, accessibility check

### Phase 4: Polish (Post-Launch)

1. Manage connectors modal
2. Version selector
3. Accessibility audit fixes
4. Performance optimization
5. **Gate:** Feature flag removed, full rollout

### Rollback Strategy

1. **Immediate:** Disable `ENABLE_INSIGHTS_UI` feature flag
2. **Short-term:** Revert to previous deployment via CI/CD
3. **Long-term:** Fix issues in staging, re-test, re-deploy

**Database Changes:** Backward-compatible (new nullable fields). No migration rollback needed.

## Open Questions

1. **Backend API Timeline:** When will metrics endpoint and execution status tracking be available in staging?
2. **AI Insights Cost:** Should premium quality level be limited to certain tenant tiers?
3. **Bulk Download Limit:** Is 10 reports the right limit, or should it be configurable per tenant?
4. **Polling Interval:** Is 5 seconds appropriate, or should it be tenant-configurable?
