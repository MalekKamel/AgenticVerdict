# Developer Manual Testing Guide: Insights & Reports

**Last Updated:** 2026-05-11  
**Scope:** Local development environment testing for insight generation, report generation, scheduling, delivery, and observability.  
**Audience:** Developers validating insights/reports functionality during development.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Testable Scenarios](#3-testable-scenarios)
   - [3.1 Insight CRUD Operations](#31-insight-crud-operations)
   - [3.2 Manual Insight Execution](#32-manual-insight-execution)
   - [3.3 Insight Scheduled Execution](#33-insight-scheduled-execution)
   - [3.4 Report Generation (Standalone)](#34-report-generation-standalone)
   - [3.5 Report Delivery (Email)](#35-report-delivery-email)
   - [3.6 Report Scheduling](#36-report-scheduling)
   - [3.7 Workflow Trigger (Production Flow Scenarios R01-R12)](#37-workflow-trigger-production-flow-scenarios-r01-r12)
   - [3.8 AI Insights Generation from Reports](#38-ai-insights-generation-from-reports)
   - [3.9 Report Sharing](#39-report-sharing)
   - [3.10 Report Content Retrieval](#310-report-content-retrieval)
4. [Observability Tooling](#4-observability-tooling)
5. [Database Verification Queries](#5-database-verification-queries)
6. [CLI Tools & Scripts](#6-cli-tools--scripts)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Architecture Overview

### Execution Pathways

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        INSIGHTS & REPORTS FLOW                           │
│                                                                          │
│  Path A: Manual Insight Run                                              │
│    Frontend/API → insight.run (tRPC) → INSIGHT_EXECUTION_QUEUE           │
│      → Worker: defaultInsightExecutionProcessor()                        │
│        → Intelligence Pipeline (COLLECT → ANALYZE → GENERATE)            │
│        → Persist report to DB + Object Storage (SeaweedFS)               │
│        → Optional: Email delivery                                        │
│                                                                          │
│  Path B: Scheduled Insight                                               │
│    INSIGHT_SCHEDULE_QUEUE (cron tick) → insight-schedule-enqueue.ts      │
│      → INSIGHT_EXECUTION_QUEUE → (same as Path A)                        │
│                                                                          │
│  Path C: Standalone Report Generation                                    │
│    API → report-schedule-enqueue.ts → REPORT_GENERATION_QUEUE            │
│      → Worker: defaultReportGenerationProcessor()                        │
│        → DefaultReportGenerator.generate() → PDF/Excel                   │
│                                                                          │
│  Path D: Report Delivery                                                 │
│    REPORT_DELIVERY_QUEUE → defaultReportDeliveryProcessor()              │
│      → sendReportEmail() → triggerAIInsightsGeneration()                 │
│        → Intelligence Pipeline → Persist generated_insights              │
│                                                                          │
│  Path E: Workflow Trigger (Production Flow R01-R12)                      │
│    POST /api/v1/workflows/trigger → WORKFLOW_TRIGGER_QUEUE               │
│      → defaultWorkflowTriggerProcessor()                                 │
│        → runIntelligencePipeline() or runProductionFlowScenario()        │
│        → Optional: sendReportEmail()                                     │
│                                                                          │
│  Path F: Report Scheduling                                               │
│    registerScheduleRepeatableJob() → REPORT_SCHEDULE_QUEUE (cron)        │
│      → enqueueScheduledReportGeneration() → REPORT_GENERATION_QUEUE      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Queue Names (BullMQ)

| Queue               | Constant                  | Purpose                                    |
| ------------------- | ------------------------- | ------------------------------------------ |
| `insight-execution` | `INSIGHT_EXECUTION_QUEUE` | Runs insight analysis pipelines            |
| `insight-schedule`  | `INSIGHT_SCHEDULE_QUEUE`  | Cron ticks that enqueue insight executions |
| `report-generation` | `REPORT_GENERATION_QUEUE` | Generates PDF/Excel documents              |
| `report-delivery`   | `REPORT_DELIVERY_QUEUE`   | Sends emails with report attachments       |
| `report-schedule`   | `REPORT_SCHEDULE_QUEUE`   | Cron ticks that enqueue report generation  |
| `workflow-trigger`  | `WORKFLOW_TRIGGER_QUEUE`  | Production flow scenarios (R01-R12)        |

### Key File Paths

| Component                 | Path                                                 |
| ------------------------- | ---------------------------------------------------- |
| Insight tRPC router       | `apps/api/src/trpc/routers/insights.ts`              |
| Report tRPC router        | `apps/api/src/trpc/routers/reports.ts`               |
| Report REST routes        | `apps/api/src/routes/v1/reports.ts`                  |
| Worker queue processors   | `apps/worker/src/queues/report-queues.ts`            |
| Insight schedule enqueue  | `apps/worker/src/queues/insight-schedule-enqueue.ts` |
| Report schedule enqueue   | `apps/worker/src/queues/report-schedule-enqueue.ts`  |
| Queue names               | `apps/worker/src/queues/queue-names.ts`              |
| Job type definitions      | `/packages/types/src/queue-job-types.ts`             |
| BullMQ service (API side) | `apps/api/src/services/report-bullmq.ts`             |
| Insight schema            | `packages/database/src/schema/core/insights.ts`      |
| Report schema             | `packages/database/src/schema/reports.ts`            |
| Generated insights schema | `packages/database/src/schema/generated-insights.ts` |
| Audit trail schema        | `packages/database/src/schema/audit-trail.ts`        |
| Insights metrics          | `packages/observability/src/insights-metrics.ts`     |
| Test scenario scripts     | `tests/scripts/run-scenario.sh`                      |

---

## 2. Prerequisites

### Required Services

```bash
# Start full development stack (PostgreSQL, Redis, SeaweedFS, API, Worker, Frontend)
make dev

# Verify all services are healthy
make health
```

### Required Environment Variables

Ensure these are set in `.env.local`:

| Variable                                | Purpose                        | Example                                                        |
| --------------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| `REDIS_URL`                             | BullMQ queue infrastructure    | `redis://localhost:6379`                                       |
| `DATABASE_URL`                          | PostgreSQL connection          | `postgresql://postgres:password@localhost:5432/agenticverdict` |
| `VITE_PUBLIC_ENABLE_INSIGHTS_UI`        | Frontend feature flag          | `true`                                                         |
| `VITE_PUBLIC_DEFAULT_TENANT_ID`         | Default tenant for dev         | `22222222-2222-4222-8222-222222222222`                         |
| `REPORT_BLOB_STORAGE_DIR`               | Local file storage for reports | `/tmp/agenticverdict-blobs`                                    |
| `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` | LLM for AI insights            | (optional, skips AI if unset)                                  |

### Generate JWT Token for API Testing

```bash
export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
```

### Seed Test Data

```bash
# Apply database migrations
make db-migrate

# Seed development data
make db-seed-dev
```

---

## 3. Testable Scenarios

### 3.1 Insight CRUD Operations

**Trigger:** tRPC procedures via frontend or direct API calls.

**tRPC Endpoints:**

- `insight.list` — List all insights for tenant
- `insight.create` — Create new insight
- `insight.detail` — Get insight details
- `insight.update` — Update insight
- `insight.delete` — Delete insight

**Testing Steps:**

1. **List insights:**

   ```bash
   curl -s http://localhost:4000/api/trpc/insight.list \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" | jq
   ```

2. **Create an insight:**

   ```bash
   curl -s -X POST http://localhost:4000/api/trpc/insight.create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "json": {
         "name": "Test Weekly Marketing Insight",
         "description": "Weekly marketing analysis",
         "enabled": true,
         "delivery": {"format": "pdf"},
         "aiConfig": {"model": "claude-3.5-sonnet", "detailLevel": "standard"},
         "connectors": []
       }
     }' | jq
   ```

3. **Verify in database:**
   ```sql
   -- In psql: make shell-db
   SELECT id, name, enabled, status, last_run_status, created_at
   FROM core.insights
   WHERE tenant_id = '22222222-2222-4222-8222-222222222222'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

**Expected Observable Outputs:**

- API returns insight object with `id`, `tenantId`, `name`, `enabled: true`
- Database row in `core.insights` with `status = 'idle'`
- Audit trail entry with `event_type = 'created'`
- Log message: `"insight.create.success"` in API container logs

**Key Log Messages to Look For:**

```
# API container logs (make dev-logs or docker compose logs -f api)
"insight.create.start"
"insight.create.success"   -- or "insight.create.error"
```

---

### 3.2 Manual Insight Execution

**Trigger:** `insight.run` tRPC procedure or `insight.generateAIInsights`.

**Execution Path:**

```
insight.run (tRPC) → enqueueInsightExecution() → INSIGHT_EXECUTION_QUEUE
  → Worker: defaultInsightExecutionProcessor()
    → Load insight config from DB
    → Run intelligence pipeline (runIntelligencePipeline)
    → Extract insights from pipeline results
    → Generate PDF report → Upload to SeaweedFS
    → Persist report to `reports` table
    → Optional: Send email to configured recipient
```

**Testing Steps:**

1. **Create an insight first** (see 3.1), note the `insightId`.

2. **Trigger manual execution:**

   ```bash
   curl -s -X POST http://localhost:4000/api/trpc/insight.run \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"json": {"id": "<INSIGHT_ID>"}}' | jq
   ```

   Expected response: `{ "success": true, "jobId": "<UUID>" }`

3. **Poll job status:**

   ```bash
   curl -s "http://localhost:4000/api/trpc/insight.getJobStatus?input={\"json\":{\"jobId\":\"<JOB_ID>\"}}" \
     -H "Authorization: Bearer $TOKEN" | jq
   ```

4. **Check worker logs:**

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.dev.yml -f docker-compose.observability.yml logs worker 2>&1 | grep -i "insight"
   ```

5. **Verify database results:**

   ```sql
   -- Check insight status updated
   SELECT id, name, status, last_run_status, last_run_at
   FROM core.insights
   WHERE id = '<INSIGHT_ID>';

   -- Check report was persisted
   SELECT id, title, status, metadata->>'workflowId' as workflow_id,
          metadata->>'insightsCount' as insights_count
   FROM reports
   WHERE tenant_id = '22222222-2222-4222-8222-222222222222'
   ORDER BY created_at DESC LIMIT 1;

   -- Check audit trail
   SELECT event_type, event_data->>'status' as status, created_at
   FROM audit_trail
   WHERE insight_id = '<INSIGHT_ID>'
   ORDER BY created_at DESC;
   ```

6. **Verify object storage (SeaweedFS):**
   ```bash
   # Check blob storage directory
   ls -la /tmp/agenticverdict-blobs/reports/<WORKFLOW_ID>/
   ```

**Key Log Messages:**

```
# API logs
"insight.run.start"
"insight.run.success"

# Worker logs
"Insight configuration loaded"
"job_start" (queue: insight-execution)
"insights_generation_started"
"insights_generation_completed"  -- or "insights_generation_failed"
"insights_generation_skipped"    -- when no LLM keys configured
"report_persistence_failed"      -- if storage/DB write fails
"insight_email_delivery_failed"  -- if email send fails
```

---

### 3.3 Insight Scheduled Execution

**Trigger:** BullMQ repeatable job on `INSIGHT_SCHEDULE_QUEUE` with cron pattern.

**Execution Path:**

```
INSIGHT_SCHEDULE_QUEUE (cron tick) → defaultInsightScheduleProcessor()
  → enqueueScheduledInsightExecution() → INSIGHT_EXECUTION_QUEUE
    → (same as 3.2 manual execution)
```

**Testing Steps:**

1. **Verify schedule is registered in Redis:**

   ```bash
   docker compose exec redis redis-cli KEYS '*insight-schedule*'
   docker compose exec redis redis-cli KEYS 'bull:insight-schedule:*'
   ```

2. **Check repeatable jobs:**

   ```bash
   # Using BullMQ inspector via a quick Node script
   docker compose exec api node -e "
     const { Queue } = require('bullmq');
     const conn = { url: process.env.REDIS_URL };
     const q = new Queue('insight-schedule', { connection: conn });
     q.getRepeatableJobs().then(jobs => {
       console.log(JSON.stringify(jobs, null, 2));
       q.close();
     });
   "
   ```

3. **Force a schedule tick (for testing):**
   - Use a short cron expression like `* * * * *` (every minute) when creating the insight schedule
   - Wait for the tick to fire, or manually enqueue:

   ```bash
   # Manually enqueue a scheduled insight execution
   docker compose exec worker node -e "
     const { enqueueScheduledInsightExecution, createInsightExecutionQueue } = require('./dist/queues');
     const { createBullmqConnectionFromEnv } = require('./dist/queues');
     const conn = createBullmqConnectionFromEnv();
     const q = createInsightExecutionQueue(conn);
     enqueueScheduledInsightExecution(q, {
       tenantId: '22222222-2222-4222-8222-222222222222',
       insightId: '<INSIGHT_ID>',
       scheduleId: '<SCHEDULE_ID>'
     }).then(r => { console.log('Enqueued:', r); process.exit(0); });
   "
   ```

4. **Verify execution in logs:**

   ```bash
   docker compose logs worker 2>&1 | grep "INSIGHT_SCHEDULE_QUEUE"
   docker compose logs worker 2>&1 | grep "scheduled-insight"
   ```

5. **Verify database:**
   ```sql
   -- Check last_run_at was updated
   SELECT id, name, last_run_at, last_run_status
   FROM core.insights
   WHERE id = '<INSIGHT_ID>';
   ```

**Key Log Messages:**

```
# Worker logs
"job_start" (queue: insight-schedule, tenantId, scheduleId, insightId)
"scheduled-insight-<SCHEDULE_ID>"  -- job name in insight-execution queue
```

---

### 3.4 Report Generation (Standalone)

**Trigger:** `REPORT_GENERATION_QUEUE` via schedule tick or direct enqueue.

**Execution Path:**

```
REPORT_GENERATION_QUEUE → defaultReportGenerationProcessor()
  → DefaultReportGenerator.generate()
    → Template rendering → PDF/Excel generation (Chromium)
```

**Testing Steps:**

1. **Enqueue a report generation job:**

   ```bash
   docker compose exec api node -e "
     const { createReportGenerationQueue, createBullmqConnectionFromEnv } = require('@agenticverdict/worker');
     const conn = createBullmqConnectionFromEnv();
     const q = createReportGenerationQueue(conn);
     q.add('manual-gen', {
       tenantId: '22222222-2222-4222-8222-222222222222',
       reportId: 'test-report-' + Date.now(),
       format: 'pdf',
       templateId: 'default',
       locale: 'en',
       model: { title: 'Test Report', generatedAt: new Date().toISOString() }
     }, { removeOnComplete: 100 }).then(job => {
       console.log('Job enqueued:', job.id);
       q.close(); conn.close();
     });
   "
   ```

2. **Monitor queue depth:**

   ```bash
   docker compose exec redis redis-cli LLEN 'bull:report-generation:wait'
   docker compose exec redis redis-cli LLEN 'bull:report-generation:active'
   ```

3. **Check worker logs:**

   ```bash
   docker compose logs worker 2>&1 | grep "report-generation"
   ```

4. **Verify generated report:**
   ```sql
   SELECT id, title, status, metadata
   FROM reports
   WHERE tenant_id = '22222222-2222-4222-8222-222222222222'
   AND title LIKE '%Test Report%'
   ORDER BY created_at DESC LIMIT 1;
   ```

**Key Log Messages:**

```
# Worker logs
"job_start" (queue: report-generation, tenantId, reportId)
```

---

### 3.5 Report Delivery (Email)

**Trigger:** `REPORT_DELIVERY_QUEUE` — enqueued after report generation or insight execution.

**Execution Path:**

```
REPORT_DELIVERY_QUEUE → defaultReportDeliveryProcessor()
  → isRecipientSuppressed() (Redis bounce/complaint check)
  → sendReportEmail() (Resend/SendGrid)
  → Optional: POST completionWebhookUrl
  → Optional: POST deliveryEventsWebhookUrl
  → triggerAIInsightsGeneration() (if email success)
```

**Testing Steps:**

1. **Verify email provider configuration:**

   ```bash
   # Check if Resend or SendGrid is configured
   docker compose exec api env | grep -E 'RESEND|SENDGRID'
   ```

2. **Check delivery suppression state:**

   ```bash
   docker compose exec redis redis-cli KEYS '*suppression*'
   ```

3. **Enqueue a delivery job:**

   ```bash
   docker compose exec api node -e "
     const { createReportDeliveryQueue, createBullmqConnectionFromEnv } = require('@agenticverdict/worker');
     const conn = createBullmqConnectionFromEnv();
     const q = createReportDeliveryQueue(conn);
     q.add('manual-delivery', {
       tenantId: '22222222-2222-4222-8222-222222222222',
       reportId: '<REPORT_ID>',
       recipientEmail: 'test@example.com',
       format: 'pdf'
     }, { removeOnComplete: 100 }).then(job => {
       console.log('Delivery job enqueued:', job.id);
       q.close(); conn.close();
     });
   "
   ```

4. **Monitor delivery logs:**

   ```bash
   docker compose logs worker 2>&1 | grep "report-delivery"
   docker compose logs worker 2>&1 | grep "insights_generation"
   ```

5. **Verify webhook calls (if configured):**
   ```bash
   # Check REPORT_DELIVERY_EVENTS_WEBHOOK_URL is set
   docker compose exec worker env | grep DELIVERY_WEBHOOK
   ```

**Key Log Messages:**

```
# Worker logs
"job_start" (queue: report-delivery)
"insights_generation_started"
"insights_generation_completed"
"insights_generation_failed"
"insights_generation_skipped" (when no LLM keys)
```

---

### 3.6 Report Scheduling

**Trigger:** `registerScheduleRepeatableJob()` → BullMQ repeatable job on `REPORT_SCHEDULE_QUEUE`.

**Execution Path:**

```
registerScheduleRepeatableJob(cron) → REPORT_SCHEDULE_QUEUE (repeatable)
  → createDefaultReportScheduleProcessor()
    → enqueueScheduledReportGeneration() → REPORT_GENERATION_QUEUE
```

**Testing Steps:**

1. **Register a schedule via API:**

   ```bash
   # This is done through the report template/schedule API
   # Check the REST endpoint at apps/api/src/routes/v1/report-templates.ts
   curl -s -X POST http://localhost:4000/api/v1/report-templates \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "name": "Daily Report",
       "schedule": { "cron": "0 9 * * *", "enabled": true },
       "format": "pdf",
       "locale": "en"
     }' | jq
   ```

2. **Verify schedule in Redis:**

   ```bash
   docker compose exec redis redis-cli KEYS 'bull:report-schedule:repeat*'
   ```

3. **Check scheduled jobs:**

   ```bash
   docker compose exec redis redis-cli HGETALL 'bull:report-schedule:repeat'
   ```

4. **Monitor schedule ticks:**

   ```bash
   docker compose logs worker 2>&1 | grep "report-schedule"
   ```

5. **Unregister a schedule:**
   ```bash
   # Via API or direct BullMQ call
   docker compose exec api node -e "
     const { unregisterScheduleRepeatableJob } = require('@agenticverdict/worker');
     unregisterScheduleRepeatableJob('<SCHEDULE_ID>').then(() => {
       console.log('Schedule unregistered');
       process.exit(0);
     });
   "
   ```

**Key Log Messages:**

```
# Worker logs
"job_start" (queue: report-schedule, tenantId)
```

---

### 3.7 Workflow Trigger (Production Flow Scenarios R01-R12)

**Trigger:** `POST /api/v1/workflows/trigger` → `WORKFLOW_TRIGGER_QUEUE`.

**Execution Path:**

```
POST /api/v1/workflows/trigger → enqueueWorkflowTrigger() → WORKFLOW_TRIGGER_QUEUE
  → defaultWorkflowTriggerProcessor()
    → If workflowId=report-generation + testMode + productionFlowScenarioId:
        runProductionFlowScenario() (R01-R12)
    → If workflowId=marketing-analysis or verdict-generation:
        runPipelineWorkflow() → runIntelligencePipeline()
    → Optional: sendReportEmail()
```

**Testing Steps:**

1. **Run a single scenario via script:**

   ```bash
   make test-scripts-scenario SCENARIO=R01
   ```

2. **Run all scenarios:**

   ```bash
   make test-scripts
   # or
   make test-scripts-all
   ```

3. **Run a scenario group:**

   ```bash
   make test-scripts-group GROUP=generation
   # Groups: generation, integration, delivery, scheduling, system
   ```

4. **Validate scenario output:**

   ```bash
   make test-scripts-validate SCENARIO=R01
   ```

5. **Verify artifacts:**

   ```bash
   export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
   ./tests/scripts/verify-artifacts.sh <EXECUTION_ID>
   ```

6. **Capture test artifacts:**

   ```bash
   export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
   ./tests/scripts/capture-test-artifacts.sh
   # Output: tests/test-output/archive/<DATE>/
   ```

7. **Check workflow job status:**

   ```bash
   curl -s "http://localhost:4000/api/v1/workflows/status/<EXECUTION_ID>" \
     -H "Authorization: Bearer $TOKEN" | jq
   ```

8. **Verify database:**

   ```sql
   -- Check generated insights from workflow
   SELECT id, insight_type, title, confidence, platforms, created_at
   FROM core.generated_insights
   WHERE tenant_id = '22222222-2222-4222-8222-222222222222'
   ORDER BY created_at DESC LIMIT 10;

   -- Check reports from workflow
   SELECT id, title, status, metadata->>'workflowId' as workflow_id
   FROM reports
   WHERE tenant_id = '22222222-2222-4222-8222-222222222222'
   AND metadata->>'workflowId' IS NOT NULL
   ORDER BY created_at DESC LIMIT 5;
   ```

**Key Log Messages:**

```
# Worker logs
"job_start" (queue: workflow-trigger, tenantId, workflowId)
"marketing_verdict_unavailable" (if verdict parsing fails)
"insights_generation_started"
"insights_generation_completed"
```

**Scenario Reference (R01-R12):**
| Scenario | Description |
|----------|-------------|
| R01 | Basic PDF generation (LTR) |
| R02 | PDF generation with Arabic/RTL |
| R03-R12 | Extended scenarios (see `apps/worker/src/queues/workflow-trigger-production-flow.ts`) |

---

### 3.8 AI Insights Generation from Reports

**Trigger:** Called automatically after successful report delivery, or manually via `insight.generateAIInsights`.

**Execution Path:**

```
triggerAIInsightsGeneration(tenantId, reportId, format)
  → Check LLM keys (skip if none configured)
  → Run intelligence pipeline (runIntelligencePipeline)
  → Extract insights → Insert into core.generated_insights
  → Record metrics (prom-client)
```

**Testing Steps:**

1. **Manual trigger via tRPC:**

   ```bash
   curl -s -X POST http://localhost:4000/api/trpc/insight.generateAIInsights \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"json": {"insightId": "<INSIGHT_ID>", "reportId": "<REPORT_ID>"}}' | jq
   ```

2. **Verify generated insights:**

   ```sql
   SELECT id, report_id, insight_type, title, description, confidence,
          platforms, related_metric_keys, metadata
   FROM core.generated_insights
   WHERE tenant_id = '22222222-2222-4222-8222-222222222222'
   AND report_id = '<REPORT_ID>'
   ORDER BY created_at DESC;
   ```

3. **Check Prometheus metrics:**

   ```bash
   # Metrics endpoint (when observability is enabled)
   curl -s http://localhost:9465/metrics | grep agenticverdict_insights
   ```

   Expected metrics:
   - `agenticverdict_insights_generation_duration_seconds` — Histogram
   - `agenticverdict_insights_generation_total` — Counter (labels: status=success|failed|skipped)
   - `agenticverdict_insights_count_per_report` — Histogram

4. **Verify skip behavior (no LLM keys):**
   ```bash
   # If no LLM keys are set, insights generation is skipped
   docker compose logs worker 2>&1 | grep "insights_generation_skipped"
   # Expected log: {"event":"insights_generation_skipped","reason":"no_llm_keys"}
   ```

**Key Log Messages:**

```
# Worker logs
"insights_generation_started" (tenantId, reportId, format)
"insights_generation_completed" (tenantId, reportId, insightsCount, durationMs)
"insights_generation_failed" (tenantId, reportId, error, durationMs)
"insights_generation_skipped" (tenantId, reportId, reason: "no_llm_keys")
```

---

### 3.9 Report Sharing

**Trigger:** tRPC procedures for share link management.

**tRPC Endpoints:**

- `report.shares` — List share links for a report
- `report.createShareLink` — Create new share link
- `report.revokeShareLink` — Revoke existing share link
- `report.getSharedReport` — Public access via share token
- `report.getSharedReportContent` — Public content access via share token

**Testing Steps:**

1. **Create a share link:**

   ```bash
   curl -s -X POST http://localhost:4000/api/trpc/report.createShareLink \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"json": {"reportId": "<REPORT_ID>", "expiresAt": "'$(date -v+7d -u +%Y-%m-%dT%H:%M:%SZ)'"}}' | jq
   ```

2. **List share links:**

   ```bash
   curl -s "http://localhost:4000/api/trpc/report.shares?input={\"json\":{\"reportId\":\"<REPORT_ID>\"}}" \
     -H "Authorization: Bearer $TOKEN" | jq
   ```

3. **Access shared report (public — no auth):**

   ```bash
   curl -s "http://localhost:4000/api/trpc/report.getSharedReport?input={\"json\":{\"reportId\":\"<REPORT_ID>\",\"token\":\"<TOKEN>\"}}" | jq
   ```

4. **Revoke share link:**

   ```bash
   curl -s -X POST http://localhost:4000/api/trpc/report.revokeShareLink \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"json": {"shareId": "<SHARE_ID>"}}' | jq
   ```

5. **Verify revoked link returns 403:**

   ```bash
   curl -s "http://localhost:4000/api/trpc/report.getSharedReport?input={\"json\":{\"reportId\":\"<REPORT_ID>\",\"token\":\"<TOKEN>\"}}" | jq
   # Expected: { "error": { "code": "FORBIDDEN", "message": "Share link has been revoked" } }
   ```

6. **Database verification:**

   ```sql
   -- Check share links
   SELECT id, report_id, token, expires_at, revoked_at, created_at
   FROM report_shares
   WHERE report_id = '<REPORT_ID>'
   ORDER BY created_at DESC;

   -- Check audit trail for share events
   SELECT event_type, event_data->>'shareId' as share_id, created_at
   FROM audit_trail
   WHERE insight_id = '<REPORT_ID>'
   AND event_type IN ('shared', 'share_revoked')
   ORDER BY created_at DESC;
   ```

**Key Log Messages:**

```
# API logs
"report.createShareLink.start" / "report.createShareLink.success"
"report.revokeShareLink.start" / "report.revokeShareLink.success"
"report.getSharedReport.start" / "report.getSharedReport.success" / "report.getSharedReport.error"
```

---

### 3.10 Report Content Retrieval

**Trigger:** `report.content` tRPC procedure or `report.getSharedReportContent`.

**Execution Path:**

```
report.content (tRPC) → getObjectStorage().downloadObject()
  → SeaweedFS S3 download → base64 encode → return
```

**Testing Steps:**

1. **Retrieve report content (authenticated):**

   ```bash
   curl -s "http://localhost:4000/api/trpc/report.content?input={\"json\":{\"id\":\"<REPORT_ID>\",\"format\":\"pdf\"}}" \
     -H "Authorization: Bearer $TOKEN" | jq '.result.content' | tr -d '"' | base64 -d > /tmp/report.pdf
   file /tmp/report.pdf  # Should show "PDF document"
   ```

2. **Retrieve via share link (public):**

   ```bash
   curl -s "http://localhost:4000/api/trpc/report.getSharedReportContent?input={\"json\":{\"reportId\":\"<REPORT_ID>\",\"token\":\"<TOKEN>\",\"format\":\"pdf\"}}" \
     | jq '.result.content' | tr -d '"' | base64 -d > /tmp/shared-report.pdf
   file /tmp/shared-report.pdf
   ```

3. **Verify storage key mapping:**

   ```sql
   -- The storage key format is: reports/<REPORT_ID>/<FORMAT>
   SELECT id, title, metadata->>'storageKey' as storage_key
   FROM reports
   WHERE id = '<REPORT_ID>';
   ```

4. **Check SeaweedFS directly:**
   ```bash
   # List objects in SeaweedFS
   curl -s http://localhost:8333/?list=reports/ | jq
   ```

**Key Log Messages:**

```
# API logs
"report.content.start" / "report.content.success" / "report.content.error"
```

---

## 4. Observability Tooling

### Prometheus Metrics

**Endpoint:** `http://localhost:9465/metrics` (worker health/metrics port)

**Insights-specific metrics:**

| Metric                                                | Type      | Labels   | Description                                        |
| ----------------------------------------------------- | --------- | -------- | -------------------------------------------------- |
| `agenticverdict_insights_generation_duration_seconds` | Histogram | `status` | Duration of AI insights generation                 |
| `agenticverdict_insights_generation_total`            | Counter   | `status` | Total generation attempts (success/failed/skipped) |
| `agenticverdict_insights_count_per_report`            | Histogram | —        | Number of insights generated per report            |

**Queue metrics:**

| Metric                                         | Type      | Labels                         | Description                                      |
| ---------------------------------------------- | --------- | ------------------------------ | ------------------------------------------------ |
| `agenticverdict_queue_depth`                   | Gauge     | `queue`                        | Current queue depth (waiting + active + delayed) |
| `agenticverdict_queue_job_duration_seconds`    | Histogram | `queue, status`                | Job processing duration                          |
| `agenticverdict_queue_job_wait_seconds`        | Histogram | `queue`                        | Time jobs spend waiting in queue                 |
| `agenticverdict_workflow_trigger_job_finished` | Histogram | `workflowId, tenantId, status` | Workflow trigger job completion                  |

**Storage metrics:**

| Metric                                              | Type      | Labels                         | Description                |
| --------------------------------------------------- | --------- | ------------------------------ | -------------------------- |
| `agenticverdict_storage_operation_duration_seconds` | Histogram | `tenantId, operation, outcome` | Storage operation duration |
| `agenticverdict_storage_bytes_uploaded`             | Counter   | `tenantId`                     | Total bytes uploaded       |
| `agenticverdict_storage_bytes_downloaded`           | Counter   | `tenantId`                     | Total bytes downloaded     |

**Querying metrics:**

```bash
# All insights metrics
curl -s http://localhost:9465/metrics | grep agenticverdict_insights

# Queue depths
curl -s http://localhost:9465/metrics | grep agenticverdict_queue_depth

# Failed jobs
curl -s http://localhost:9465/metrics | grep 'status="failed"'
```

### Grafana Dashboards

When observability stack is running (`make obs-up`):

- **Grafana:** `http://localhost:3001` (default admin/admin)
- **Prometheus:** `http://localhost:9090`
- **Loki (logs):** `http://localhost:3100`

**Key Grafana queries:**

```promql
# Insights generation rate
rate(agenticverdict_insights_generation_total[5m])

# P95 insights generation duration
histogram_quantile(0.95, rate(agenticverdict_insights_generation_duration_seconds_bucket[5m]))

# Queue depth by queue
agenticverdict_queue_depth

# Failed job rate
rate(agenticverdict_queue_job_duration_seconds_count{status="failed"}[5m])
```

### Structured Logging

All services use Pino structured logging. Key log fields:

| Field        | Description                                                     |
| ------------ | --------------------------------------------------------------- |
| `event`      | Event type (e.g., `job_start`, `insights_generation_completed`) |
| `tenantId`   | Tenant identifier                                               |
| `insightId`  | Insight identifier                                              |
| `reportId`   | Report identifier                                               |
| `workflowId` | Workflow identifier                                             |
| `durationMs` | Operation duration                                              |
| `error`      | Error message (on failures)                                     |

**Log filtering patterns:**

```bash
# All insight-related logs
docker compose logs worker 2>&1 | grep -E '"insight|"insights_generation'

# All report-related logs
docker compose logs worker 2>&1 | grep -E '"report\.|"report_'

# Failed jobs only
docker compose logs worker 2>&1 | grep -E '"failed"|"error"'

# Specific tenant
docker compose logs worker 2>&1 | grep '22222222-2222-4222-8222-222222222222'

# Job start/completion pairs
docker compose logs worker 2>&1 | grep -E '"job_start"|"job_completed"'
```

---

## 5. Database Verification Queries

### Connection

```bash
# Open psql shell
make shell-db

# Or direct connection
psql -h localhost -U postgres -d agenticverdict
```

### Insight Configuration

```sql
-- List all insights for a tenant
SELECT i.id, i.name, i.enabled, i.domain, i.status, i.last_run_status,
       i.last_run_at, i.delivery, i.ai_config, i.created_at
FROM core.insights i
WHERE i.tenant_id = '<TENANT_ID>'
ORDER BY i.created_at DESC;

-- Insight connectors mapping
SELECT ic.insight_id, ic.connector_id, ic.enabled, ic.selected_metrics, ic.filters
FROM core.insight_connectors ic
WHERE ic.insight_id = '<INSIGHT_ID>';

-- Insights by status
SELECT status, count(*) FROM core.insights
WHERE tenant_id = '<TENANT_ID>'
GROUP BY status;
```

### Generated Insights (AI Results)

```sql
-- Latest generated insights
SELECT gi.id, gi.report_id, gi.analysis_id, gi.insight_type, gi.title,
       gi.description, gi.confidence, gi.relevance_score,
       gi.platforms, gi.related_metric_keys, gi.metadata, gi.created_at
FROM core.generated_insights gi
WHERE gi.tenant_id = '<TENANT_ID>'
ORDER BY gi.created_at DESC
LIMIT 20;

-- Insights by type
SELECT insight_type, count(*) FROM core.generated_insights
WHERE tenant_id = '<TENANT_ID>'
GROUP BY insight_type;

-- Insights by platform
SELECT jsonb_array_elements_text(platforms) as platform, count(*)
FROM core.generated_insights
WHERE tenant_id = '<TENANT_ID>'
GROUP BY platform;

-- Insights for a specific report
SELECT * FROM core.generated_insights
WHERE report_id = '<REPORT_ID>';
```

### Reports

```sql
-- All reports for tenant
SELECT r.id, r.title, r.status, r.metadata, r.created_at, r.updated_at
FROM reports r
WHERE r.tenant_id = '<TENANT_ID>'
ORDER BY r.created_at DESC;

-- Reports linked to insights
SELECT r.id, r.title, r.status, r.metadata->>'insightId' as insight_id,
       r.metadata->>'workflowId' as workflow_id,
       r.metadata->>'insightsCount' as insights_count
FROM reports r
WHERE r.tenant_id = '<TENANT_ID>'
AND r.metadata->>'insightId' IS NOT NULL
ORDER BY r.created_at DESC;

-- Reports by status
SELECT status, count(*) FROM reports
WHERE tenant_id = '<TENANT_ID>'
GROUP BY status;
```

### Report Shares

```sql
-- Active share links
SELECT rs.id, rs.report_id, rs.token, rs.expires_at, rs.revoked_at, rs.created_at
FROM report_shares rs
WHERE rs.tenant_id = '<TENANT_ID>'
AND rs.revoked_at IS NULL
AND rs.expires_at > NOW()
ORDER BY rs.created_at DESC;

-- Expired/revoked shares
SELECT rs.id, rs.report_id,
       CASE WHEN rs.revoked_at IS NOT NULL THEN 'revoked' ELSE 'expired' END as status
FROM report_shares rs
WHERE rs.tenant_id = '<TENANT_ID>'
AND (rs.revoked_at IS NOT NULL OR rs.expires_at <= NOW());
```

### Audit Trail

```sql
-- All audit events for an insight
SELECT at.id, at.event_type, at.event_data, at.created_at
FROM audit_trail at
WHERE at.insight_id = '<INSIGHT_ID>'
ORDER BY at.created_at DESC;

-- Audit events by type
SELECT event_type, count(*) FROM audit_trail
WHERE tenant_id = '<TENANT_ID>'
GROUP BY event_type
ORDER BY count(*) DESC;

-- Recent failed operations
SELECT at.insight_id, at.event_type, at.event_data->>'status' as status,
       at.event_data->>'error' as error, at.created_at
FROM audit_trail at
WHERE at.tenant_id = '<TENANT_ID>'
AND at.event_data->>'status' = 'failed'
ORDER BY at.created_at DESC
LIMIT 20;

-- Audit events in time range
SELECT event_type, count(*) FROM audit_trail
WHERE tenant_id = '<TENANT_ID>'
AND created_at BETWEEN '2026-05-10' AND '2026-05-12'
GROUP BY event_type;
```

### Queue State (via Redis, not PostgreSQL)

```bash
# Queue depths
docker compose exec redis redis-cli LLEN 'bull:insight-execution:wait'
docker compose exec redis redis-cli LLEN 'bull:insight-execution:active'
docker compose exec redis redis-cli LLEN 'bull:report-generation:wait'
docker compose exec redis redis-cli LLEN 'bull:report-delivery:wait'
docker compose exec redis redis-cli LLEN 'bull:workflow-trigger:wait'
docker compose exec redis redis-cli LLEN 'bull:insight-schedule:wait'
docker compose exec redis redis-cli LLEN 'bull:report-schedule:wait'

# Repeatable jobs (schedules)
docker compose exec redis redis-cli HGETALL 'bull:insight-schedule:repeat'
docker compose exec redis redis-cli HGETALL 'bull:report-schedule:repeat'

# Failed jobs
docker compose exec redis redis-cli LLEN 'bull:insight-execution:failed'
docker compose exec redis redis-cli LLEN 'bull:report-generation:failed'
docker compose exec redis redis-cli LLEN 'bull:report-delivery:failed'
docker compose exec redis redis-cli LLEN 'bull:workflow-trigger:failed'

# Inspect a specific job
docker compose exec redis redis-cli HGETALL 'bull:insight-execution:<JOB_ID>'
```

---

## 6. CLI Tools & Scripts

### Makefile Targets

```bash
# Start/stop development stack
make dev              # Start full stack
make dev-stop         # Stop full stack
make dev-logs         # Follow all logs

# Health checks
make health           # Check all services
make health-api       # Check API only
make health-worker    # Check worker only

# Database operations
make db-migrate       # Apply migrations
make db-seed-dev      # Seed development data
make db-reset         # Full reset + seed (destructive)
make shell-db         # Open psql shell

# Test scripts (production flow scenarios)
make test-scripts-scenario SCENARIO=R01    # Run single scenario
make test-scripts-group GROUP=generation   # Run scenario group
make test-scripts-all                      # Run all scenarios
make test-scripts-validate SCENARIO=R01    # Validate scenario output

# Observability
make obs-up           # Start Prometheus, Grafana, Loki
```

### Test Scenario Scripts

| Script                                    | Purpose                     | Usage                                                     |
| ----------------------------------------- | --------------------------- | --------------------------------------------------------- |
| `tests/scripts/run-scenario.sh`           | Run single R01-R12 scenario | `./tests/scripts/run-scenario.sh R01`                     |
| `tests/scripts/run-scenario-group.sh`     | Run scenario group          | `./tests/scripts/run-scenario-group.sh generation`        |
| `tests/scripts/run-all-scenarios.sh`      | Run all scenarios           | `./tests/scripts/run-all-scenarios.sh`                    |
| `tests/scripts/validate-scenario.sh`      | Validate scenario output    | `./tests/scripts/validate-scenario.sh R01`                |
| `tests/scripts/verify-artifacts.sh`       | Verify workflow artifacts   | `TOKEN=... ./tests/scripts/verify-artifacts.sh [exec_id]` |
| `tests/scripts/capture-test-artifacts.sh` | Capture test artifacts      | `TOKEN=... ./tests/scripts/capture-test-artifacts.sh`     |

**Scenario groups:** `generation`, `integration`, `delivery`, `scheduling`, `system`

### JWT Generation

```bash
# Generate tenant-scoped JWT
export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant <TENANT_ID>)"

# Default dev tenant
export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
```

### Direct Queue Inspection (Node.js)

```bash
# Inspect BullMQ queues from API container
docker compose exec api node -e "
const { Queue } = require('bullmq');
const queues = ['insight-execution', 'insight-schedule', 'report-generation',
                'report-delivery', 'report-schedule', 'workflow-trigger'];

async function inspect() {
  const conn = { url: process.env.REDIS_URL };
  for (const name of queues) {
    const q = new Queue(name, { connection: conn });
    const counts = await q.getJobCounts();
    console.log(name + ':', JSON.stringify(counts));
    const repeatable = await q.getRepeatableJobs();
    if (repeatable.length > 0) {
      console.log('  repeatable:', JSON.stringify(repeatable));
    }
    await q.close();
  }
}
inspect().then(() => process.exit(0));
"
```

---

## 7. Troubleshooting

### Common Failure Modes

#### 7.1 Insight Execution Stuck in "running" Status

**Symptoms:** `insight.run` returns success but insight never completes. `last_run_status = 'running'` persists.

**Diagnosis:**

```bash
# 1. Check if job is in queue
docker compose exec redis redis-cli LLEN 'bull:insight-execution:wait'
docker compose exec redis redis-cli LLEN 'bull:insight-execution:active'

# 2. Check worker is running
docker compose ps worker

# 3. Check worker logs for the job
docker compose logs worker 2>&1 | grep '<INSIGHT_ID>'

# 4. Check for failed jobs
docker compose exec redis redis-cli LLEN 'bull:insight-execution:failed'
docker compose exec redis redis-cli LRANGE 'bull:insight-execution:failed' 0 -1
```

**Resolution:**

```sql
-- Reset stuck insight status
UPDATE core.insights
SET last_run_status = 'failed', status = 'idle'
WHERE id = '<INSIGHT_ID>' AND last_run_status = 'running'
AND last_run_at < NOW() - INTERVAL '30 minutes';
```

#### 7.2 No LLM Keys — Insights Generation Skipped

**Symptoms:** Log shows `"insights_generation_skipped"` with `"reason":"no_llm_keys"`.

**Diagnosis:**

```bash
docker compose exec worker env | grep -E 'ANTHROPIC|OPENAI|GLM'
```

**Resolution:**

- Add at least one LLM API key to `.env.local`:
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  # or
  OPENAI_API_KEY=sk-...
  ```
- Restart worker: `docker compose restart worker`

#### 7.3 Report Generation Fails (PDF)

**Symptoms:** Job in `report-generation` queue fails. No PDF produced.

**Diagnosis:**

```bash
# 1. Check failed jobs
docker compose exec redis redis-cli LRANGE 'bull:report-generation:failed' 0 -1

# 2. Check worker logs for errors
docker compose logs worker 2>&1 | grep -A5 "report-generation"

# 3. Verify Chromium is available (required for PDF)
docker compose exec worker which chromium || echo "Chromium not found"

# 4. Check blob storage
ls -la /tmp/agenticverdict-blobs/reports/
```

**Resolution:**

- Ensure base images are built with Chromium: `make build-base`
- Check `REPORT_BLOB_STORAGE_DIR` is writable
- Verify template exists and is valid

#### 7.4 Email Delivery Fails

**Symptoms:** Log shows `"insight_email_delivery_failed"` or `"delivery_failed"`.

**Diagnosis:**

```bash
# 1. Check email provider configuration
docker compose exec worker env | grep -E 'RESEND|SENDGRID'

# 2. Check if recipient is suppressed
docker compose exec redis redis-cli KEYS '*suppression*'

# 3. Check delivery logs
docker compose logs worker 2>&1 | grep "sendReportEmail"
```

**Resolution:**

- Configure email provider in `.env.local`:
  ```
  RESEND_API_KEY=re_...
  # or
  SENDGRID_API_KEY=SG....
  ```
- If recipient is suppressed, check bounce events in Redis
- Restart worker after config changes

#### 7.5 Queue Infrastructure Unavailable

**Symptoms:** API returns `QUEUE_UNAVAILABLE` error. `isBullmqConfigured()` returns false.

**Diagnosis:**

```bash
# Check REDIS_URL is set
docker compose exec api env | grep REDIS_URL

# Check Redis is running
docker compose ps redis
docker compose exec redis redis-cli ping
```

**Resolution:**

```bash
# Ensure Redis is running
docker compose up -d redis

# Verify REDIS_URL in .env.local
echo "REDIS_URL=redis://redis:6379" >> .env.local

# Restart API
docker compose restart api
```

#### 7.6 SeaweedFS Storage Errors

**Symptoms:** Report upload/download fails with storage errors.

**Diagnosis:**

```bash
# Check SeaweedFS is running
docker compose ps seaweedfs

# Check storage directory
ls -la /tmp/agenticverdict-blobs/

# Check SeaweedFS logs
docker compose logs seaweedfs
```

**Resolution:**

```bash
# Start SeaweedFS
make seaweedfs-up

# Verify storage configuration
docker compose exec api env | grep -E 'STORAGE|BLOB|S3'
```

#### 7.7 Scheduled Jobs Not Firing

**Symptoms:** Insight or report schedules are registered but never execute.

**Diagnosis:**

```bash
# 1. Check repeatable jobs exist
docker compose exec redis redis-cli HGETALL 'bull:insight-schedule:repeat'
docker compose exec redis redis-cli HGETALL 'bull:report-schedule:repeat'

# 2. Check schedule queue workers
docker compose exec redis redis-cli LLEN 'bull:insight-schedule:wait'
docker compose exec redis redis-cli LLEN 'bull:report-schedule:wait'

# 3. Check worker logs for schedule processing
docker compose logs worker 2>&1 | grep -E 'insight-schedule|report-schedule'

# 4. Verify cron expression is valid
# Test with a simple expression: * * * * * (every minute)
```

**Resolution:**

- Verify cron expression syntax (use https://crontab.guru)
- Ensure worker is running and connected to Redis
- Check that the insight/report is `enabled`

#### 7.8 Tenant Isolation Violations

**Symptoms:** Data from one tenant appears in another tenant's queries.

**Diagnosis:**

```sql
-- Verify all rows are tenant-scoped
SELECT DISTINCT tenant_id FROM core.insights;
SELECT DISTINCT tenant_id FROM reports;
SELECT DISTINCT tenant_id FROM core.generated_insights;

-- Check for orphaned records (no matching tenant)
SELECT i.* FROM core.insights i
LEFT JOIN tenants t ON i.tenant_id = t.id
WHERE t.id IS NULL;
```

**Resolution:**

- Ensure all API calls use `dbScoped()` wrapper
- Verify tenant ID is extracted from JWT token
- Check RLS policies are enabled in PostgreSQL

#### 7.9 Audit Trail Missing Events

**Symptoms:** Expected audit events not found in `audit_trail` table.

**Diagnosis:**

```sql
-- Check recent audit events
SELECT event_type, count(*) FROM audit_trail
WHERE tenant_id = '<TENANT_ID>'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type;

-- Check for null insight_id (orphaned events)
SELECT count(*) FROM audit_trail WHERE insight_id IS NULL;
```

**Resolution:**

- Verify `auditTrail` insert is within the same transaction as the main operation
- Check that `randomUUID()` is generating valid UUIDs
- Ensure `eventType` matches expected values from `AuditEventType` enum

#### 7.10 Workflow Trigger Returns Empty Results

**Symptoms:** `POST /api/v1/workflows/trigger` returns success but no insights/reports generated.

**Diagnosis:**

```bash
# 1. Check workflow job status
curl -s "http://localhost:4000/api/v1/workflows/status/<EXECUTION_ID>" \
  -H "Authorization: Bearer $TOKEN" | jq

# 2. Check worker logs
docker compose logs worker 2>&1 | grep "workflow-trigger"

# 3. Check if production flow scenario is valid
# Valid scenarios: R01-R12
```

**Resolution:**

- Verify `workflowId` is one of: `report-generation`, `marketing-analysis`, `verdict-generation`
- For production flow testing, ensure `testMode: true` and `productionFlowScenarioId` is set
- Check that tenant has connectors configured (or mock data is provided)

---

### Quick Diagnostic Checklist

When something isn't working, run through this checklist in order:

```bash
# 1. Infrastructure health
make health

# 2. Service status
docker compose ps

# 3. Redis connectivity
docker compose exec redis redis-cli ping

# 4. PostgreSQL connectivity
make shell-db -c "SELECT 1;"

# 5. Queue depths
docker compose exec redis redis-cli KEYS 'bull:*:wait' | while read key; do
  echo "$key: $(docker compose exec redis redis-cli LLEN $key)"
done

# 6. Recent errors in logs
docker compose logs --tail=100 worker 2>&1 | grep -i error
docker compose logs --tail=100 api 2>&1 | grep -i error

# 7. LLM key availability (for AI insights)
docker compose exec worker env | grep -E 'ANTHROPIC|OPENAI|GLM' || echo "NO LLM KEYS"

# 8. Storage availability
ls -la /tmp/agenticverdict-blobs/ 2>/dev/null || echo "BLOB DIR MISSING"
docker compose ps seaweedfs
```

---

## Appendix: Scenario-to-Test Mapping

| Scenario                 | Primary Queue                            | Key Tables                                                | Key Log Pattern                            | Test Script                        |
| ------------------------ | ---------------------------------------- | --------------------------------------------------------- | ------------------------------------------ | ---------------------------------- |
| Create insight           | —                                        | `core.insights`, `core.insight_connectors`, `audit_trail` | `insight.create.*`                         | —                                  |
| Run insight manually     | `insight-execution`                      | `core.insights`, `reports`, `audit_trail`                 | `insight.run.*`, `insights_generation_*`   | —                                  |
| Scheduled insight run    | `insight-schedule` → `insight-execution` | `core.insights`, `reports`                                | `insight-schedule`, `scheduled-insight`    | —                                  |
| Generate report          | `report-generation`                      | `reports`                                                 | `report-generation`                        | `run-scenario.sh R01`              |
| Deliver report email     | `report-delivery`                        | `reports`, `core.generated_insights`                      | `report-delivery`, `insights_generation_*` | `run-scenario-group.sh delivery`   |
| Schedule report          | `report-schedule` → `report-generation`  | `reports`                                                 | `report-schedule`                          | `run-scenario-group.sh scheduling` |
| Workflow trigger R01-R12 | `workflow-trigger`                       | `reports`, `core.generated_insights`                      | `workflow-trigger`                         | `run-scenario.sh R01`              |
| AI insights from report  | (inline in delivery)                     | `core.generated_insights`                                 | `insights_generation_*`                    | —                                  |
| Share report             | —                                        | `report_shares`, `audit_trail`                            | `report.createShareLink.*`                 | —                                  |
