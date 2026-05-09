# R-C02: AI Insights Auto-Generation After Report Delivery — Implementation Plan

**Date:** 2026-05-09
**Source:** `apps/worker/src/queues/report-queues.ts:626-631`
**Dependency:** R-H01 (wire `platformDeps` in workflow) — already implemented in current codebase

---

## 1. Problem Statement

The `defaultReportDeliveryProcessor` function in `apps/worker/src/queues/report-queues.ts` contains a removed call to `triggerAIInsightsGeneration` (lines 626-631). The original intent was to automatically generate AI insights from a delivered report by invoking the agent-runtime intelligence pipeline, then persisting the results. This feature was deferred pending full agent-runtime pipeline integration.

The dependency R-H01 (wiring `platformDeps` in `runPipelineWorkflow`) is now satisfied — `platformDeps` and `tenantContextDeps` are properly passed to `runIntelligencePipeline` at lines 309-329.

---

## 2. Current State Analysis

### 2.1 What Exists

| Component                          | Location                                                           | Status                                                                             |
| ---------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `runIntelligencePipeline`          | `packages/agent-runtime/src/intelligence-pipeline.ts`              | Fully implemented; produces `PipelineState` with `structuredResults.insights`      |
| `toGeneratedInsights()`            | `apps/worker/src/queues/report-queues.ts:154-211`                  | Parses pipeline output into `GeneratedInsight[]` with structured + fallback paths  |
| `defaultInsightExecutionProcessor` | `apps/worker/src/queues/report-queues.ts:650-849`                  | Runs pipeline, persists report to DB + object storage, sends email                 |
| `mergePhase2IntoReportModel`       | `packages/report-generator/src/integration/phase2-report-model.ts` | Merges `MarketingVerdict` + `GeneratedInsight[]` into report view model            |
| `reports` table                    | `packages/database/src/schema/reports.ts`                          | Stores report metadata (id, tenantId, title, status, metadata JSONB)               |
| Object storage (S3)                | `packages/core/src/storage/s3-storage.ts`                          | Stores generated report files (PDF, DOCX, etc.)                                    |
| `ReportDeliveryJobData`            | `apps/worker/src/queues/job-types.ts:270-291`                      | Queue payload: tenantId, reportId, recipientEmail, format, attachments, webhookUrl |

### 2.2 What Is Missing

| Gap                                             | Detail                                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `generated_insights` table                      | No database table exists for persisting generated insights                                   |
| `triggerAIInsightsGeneration` function          | Removed; no implementation exists                                                            |
| Report content retrieval for insight generation | No mechanism to fetch delivered report content from object storage to feed into the pipeline |
| Post-delivery insight generation hook           | The call site in `defaultReportDeliveryProcessor` is a comment placeholder                   |

### 2.3 Existing Patterns to Follow

The `defaultInsightExecutionProcessor` (lines 650-849) demonstrates the complete pattern:

1. Build tenant context via `loadTenantConfigForJob` + `buildTenantContextForJob`
2. Run `runIntelligencePipeline` with `AgentFactory`, `platformDeps`, `tenantContextDeps`
3. Extract insights from `pipelineState.structuredResults?.insights`
4. Generate report content via `DefaultReportGenerator`
5. Upload to object storage via `getObjectStorage().uploadObject()`
6. Persist metadata to DB via `dbScoped()`
7. Send email via `sendReportEmail()`

---

## 3. Design Decision: Implement vs. Remove

### Option A: Implement `triggerAIInsightsGeneration`

**Pros:**

- Completes the original feature intent: auto-generate insights after every report delivery
- Provides downstream value: insights become available for dashboard consumption
- Aligns with the product vision of AI-driven marketing intelligence

**Cons:**

- Requires new database table (`generated_insights`)
- Adds latency to report delivery job (pipeline runs can take 30-120 seconds)
- Requires LLM credentials to be configured (no-op in dev/test without keys)

### Option B: Remove the Call Entirely

**Pros:**

- Simpler; no new infrastructure needed
- Insight generation remains available via explicit `insight.run` trigger (already implemented)
- Keeps delivery job fast and focused on email sending

**Cons:**

- Loses the auto-generation capability
- Users must manually trigger insight generation after receiving reports

### Recommendation: **Option A — Implement**

The original design intent was for reports to automatically produce AI insights as a downstream artifact. The infrastructure is now in place (R-H01 resolved, pipeline fully wired). The implementation should be done, but with safeguards:

- Run asynchronously (enqueue a separate job, not inline in delivery)
- Gracefully skip when LLM credentials are unavailable
- Persist insights to a new `generated_insights` table

---

## 4. Implementation Plan

### Phase 1: Database Schema — `generated_insights` Table

**File:** `packages/database/src/schema/generated-insights.ts` (new)

```
Table: generated_insights
  id: uuid (PK, default random)
  tenant_id: uuid (FK → tenants.id, cascade delete)
  report_id: uuid (FK → reports.id, cascade delete)
  analysis_id: uuid (FK reference to workflow analysis)
  insight_type: varchar (anomaly | trend | opportunity | warning)
  title: varchar(512)
  description: text
  confidence: numeric (0.0 - 1.0)
  relevance_score: numeric (0.0 - 1.0)
  platforms: jsonb (array of ConnectorType strings)
  related_metric_keys: jsonb (array of metric key strings)
  metadata: jsonb (optional: pipeline stage, model used, duration)
  created_at: timestamp (default now)
  Indexes:
    - (tenant_id, created_at)
    - (report_id)
    - (analysis_id)
```

**File:** `packages/database/src/schema/index.ts` — add export for new table.

### Phase 2: `triggerAIInsightsGeneration` Function

**File:** `apps/worker/src/queues/report-queues.ts`

**Signature:**

```typescript
async function triggerAIInsightsGeneration(
  tenantId: string,
  reportId: string,
  reportFormat: ReportFormat,
): Promise<void>;
```

**Implementation Steps:**

1. **Load tenant context** — same pattern as `defaultInsightExecutionProcessor`:
   - `loadTenantConfigForJob(tenantId)`
   - `buildTenantContextForJob({ tenantId, tenantType: "direct_business", tenantStatus: "active", requestId })`

2. **Check LLM availability** — early return if no keys configured:

   ```typescript
   const llmEnv = loadLlmEnvFromProcess();
   if (!llmEnv.anthropicApiKey && !llmEnv.openAiApiKey && !llmEnv.glmApiKey) {
     logger.info({ event: "insights_generation_skipped", reason: "no_llm_keys" });
     return;
   }
   ```

3. **Run intelligence pipeline** — reuse `runIntelligencePipeline` with same specialization pattern as `runPipelineWorkflow`:
   - Create `AgentFactory({ llmEnv })`
   - Build `platformDeps` via `createWorkerPlatformFetchToolDeps`
   - Run pipeline with `tolerateVerdictParseFailure: true`

4. **Extract insights** — use existing `toGeneratedInsights()` helper:
   - Construct a minimal `WorkflowTriggerJobData` for the helper
   - Extract from `pipelineState.structuredResults?.insights` with text fallback

5. **Persist insights to database** — new `generated_insights` table:

   ```typescript
   await dbScoped(db, async (tx) => {
     await tx.insert(generatedInsights).values(
       insights.map((insight) => ({
         tenantId,
         reportId,
         analysisId: pipelineState.workflowId,
         insightType: insight.type,
         title: insight.title,
         description: insight.description,
         confidence: insight.confidence,
         relevanceScore: insight.relevanceScore,
         platforms: insight.platforms,
         relatedMetricKeys: insight.relatedMetricKeys,
       })),
     );
   });
   ```

6. **Structured logging** — emit events for observability:
   - `insights_generation_started` — tenantId, reportId
   - `insights_generation_completed` — tenantId, reportId, insightsCount, durationMs
   - `insights_generation_failed` — tenantId, reportId, error

### Phase 3: Wire Into Report Delivery

**File:** `apps/worker/src/queues/report-queues.ts` — `defaultReportDeliveryProcessor`

Replace the comment block at lines 626-631 with:

```typescript
if (result.success) {
  // Fire-and-forget: enqueue AI insights generation as a separate job
  // so it does not block the delivery job completion.
  const insightQueue =
    createInsightExecutionQueue();
    // Redis connection available in worker context
  await insightQueue
    .add("ai-insights-from-delivery", {
      tenantId: data.tenantId,
      insightId: randomUUID(),
      requestId: `insights-from-${data.reportId}`,
      goal: `Generate AI insights from delivered report ${data.reportId} (format: ${data.format})`,
    })
    .catch((err) => {
      getWorkerRootLogger().warn({
        event: "insights_enqueue_failed",
        reportId: data.reportId,
        error: err instanceof Error ? err.message : "unknown",
      });
    });
}
```

**Alternative (simpler):** Call `triggerAIInsightsGeneration` directly inline if the delivery job timeout allows it. The job already has 5 retry attempts with exponential backoff, so a transient pipeline failure will be retried.

**Recommended approach:** Direct inline call with timeout guard. This avoids introducing a new queue dependency into the delivery processor and keeps the coupling minimal.

```typescript
if (result.success) {
  await triggerAIInsightsGeneration(data.tenantId, data.reportId, data.format).catch((err) => {
    getWorkerRootLogger().warn({
      event: "insights_generation_failed",
      reportId: data.reportId,
      error: err instanceof Error ? err.message : "unknown",
    });
  });
}
```

### Phase 4: Testing

**Unit Tests:**

- `triggerAIInsightsGeneration` with mocked pipeline (success path)
- `triggerAIInsightsGeneration` with no LLM keys (skip path)
- `triggerAIInsightsGeneration` with pipeline failure (error handling)
- Database persistence: verify rows inserted into `generated_insights`

**Integration Tests:**

- End-to-end: trigger report delivery → verify insights generated and persisted
- Verify `generated_insights` table contains correct rows after delivery

**Test File:** `apps/worker/src/queues/report-queues.test.ts` — extend existing test suite.

### Phase 5: Observability

**Metrics to emit:**

- `insights_generation_duration_seconds` — histogram
- `insights_generation_total` — counter (labels: status=success|failed|skipped)
- `insights_count_per_report` — histogram

**Logging:**

- All log entries include `tenantId`, `reportId`, `requestId`
- Error logs include stack trace for debugging

---

## 5. File Change Summary

| File                                                    | Change Type | Description                                                                            |
| ------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `packages/database/src/schema/generated-insights.ts`    | **New**     | Drizzle schema for `generated_insights` table                                          |
| `packages/database/src/schema/index.ts`                 | Modify      | Export new `generatedInsights` table                                                   |
| `apps/worker/src/queues/report-queues.ts`               | Modify      | Add `triggerAIInsightsGeneration` function; wire into `defaultReportDeliveryProcessor` |
| `apps/worker/src/queues/report-queues.test.ts`          | Modify      | Add unit tests for new function                                                        |
| `packages/observability/src/metrics.ts` (or equivalent) | Modify      | Add insight generation metrics (if not already available)                              |

---

## 6. Dependency Order

```
Phase 1: Database schema (generated_insights table)
  ↓
Phase 2: triggerAIInsightsGeneration function
  ↓
Phase 3: Wire into report delivery processor
  ↓
Phase 4: Unit + integration tests
  ↓
Phase 5: Observability (metrics + logging)
```

---

## 7. Acceptance Criteria

- [ ] `generated_insights` table exists with correct schema, indexes, and foreign key constraints
- [ ] `triggerAIInsightsGeneration` function runs the intelligence pipeline and persists insights
- [ ] Function gracefully skips when LLM credentials are unavailable (no error, info-level log)
- [ ] Function handles pipeline failures without crashing the delivery job (catch + warn log)
- [ ] Report delivery job completion triggers insight generation (inline or enqueued)
- [ ] Unit tests cover success, skip, and failure paths
- [ ] Structured logging includes `tenantId`, `reportId`, and event type
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] `pnpm run lint` passes with zero violations
- [ ] `pnpm run test:unit` passes for affected test files

---

## 8. Risk Assessment

| Risk                                               | Likelihood | Impact | Mitigation                                                  |
| -------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------- |
| Pipeline run exceeds job timeout                   | Medium     | High   | Add explicit timeout guard; catch and log                   |
| LLM credentials not configured in all environments | High       | Low    | Early-return skip path with info log                        |
| Database migration conflict with existing schema   | Low        | Medium | Use Drizzle migrations; test migration in staging first     |
| Insight generation slows down delivery throughput  | Medium     | Medium | Consider async enqueue if delivery latency becomes an issue |
