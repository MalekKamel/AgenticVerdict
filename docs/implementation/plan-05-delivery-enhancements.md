# Implementation Plan 05 — Delivery Enhancements (Webhooks + Excel)

**Phase:** P1 (Delivery & Reporting Enhancements)
**Original Reference:** Comprehensive Plan §2.3 (Tasks 2.3.1 – 2.3.3) + §2.4 (Tasks 2.4.1 – 2.4.3)
**Priority:** P1 — Delivery channel expansion
**Estimated Effort:** 6 tasks, ~2-3 days
**Status:** VALIDATED & REFINED — Significant portions already implemented; plan updated to reflect current state

---

## 0. Greenfield Development Policy

This is a **pre-production greenfield** codebase. All database changes use **destructive approaches**:

- No migration files with up/down — use `make db:push` to apply schema directly
- No backward compatibility concerns — break freely, rename freely, drop freely
- Seed scripts use `TRUNCATE ... CASCADE` then fresh `INSERT`
- If a schema change is needed mid-development, drop the table and recreate it
- After any schema change, run `make db:reset` to rebuild from scratch

---

## 1. Overview

Implement webhook delivery and Excel (XLSX) report generation to expand the delivery channels beyond email and PDF. Webhooks enable automated integration with external systems (Slack, Zapier, custom dashboards), while XLSX supports stakeholders who prefer spreadsheet analysis.

### Business Value

- Webhooks: Supports automated delivery channel per Section 2.4 (Delivery: Format, recipients, channels)
- Excel: Extends report format options beyond PDF; XLSX generator already exists
- Both complete the delivery pipeline for the COLLECT → ANALYZE → GENERATE → DELIVER lifecycle

---

## 2. Prerequisites

### Already Implemented (Leverage These)

| Component                    | Location                                                                       | Notes                                           |
| ---------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| XLSX generator               | `packages/report-generator/src/xlsx-format-generator.ts`                       | Exists with tests — basic HTML-to-XLSX          |
| Delivery suppression         | `apps/worker/src/services/delivery-suppression-redis.ts`                       | Deduplication exists                            |
| ScheduleDeliveryStep         | `apps/frontend/src/features/insights/ui/wizard/steps/ScheduleDeliveryStep.tsx` | Already collects `webhookUrl` + `enableWebhook` |
| PDF report generation        | `packages/report-generator/`                                                   | Proven pattern                                  |
| Email delivery               | `apps/worker/src/services/email.ts`                                            | Resend + SendGrid with attachments              |
| Report queue                 | `apps/worker/src/queues/report-queues.ts`                                      | Queue infrastructure                            |
| Completion webhook           | `apps/worker/src/queues/report-queues.ts:556-569`                              | `postCompletionWebhook()` exists                |
| Delivery event webhook       | `apps/worker/src/queues/report-queues.ts:571-588`                              | `postDeliveryEventWebhook()` exists             |
| Webhook payload type         | `apps/worker/src/queues/report-queues.ts:519-531`                              | `ReportDeliveryWebhookPayload` exists           |
| `completionWebhookUrl`       | `packages/types/src/queue-job-types.ts:262`                                    | In `ReportDeliveryJobData`                      |
| Insight webhookUrl           | `packages/types/src/insight.ts:68`                                             | In insight schema                               |
| Insight template webhookUrl  | `packages/types/src/insight-templates.ts:28,71`                                | In template schema                              |
| DB schema: insight-templates | `packages/database/src/schema/insight-templates.ts:57`                         | `webhookUrl` column exists                      |

### Dependencies

| Plan                       | Relationship | Notes                                                             |
| -------------------------- | ------------ | ----------------------------------------------------------------- |
| plan-02-scheduler          | Depends on   | Scheduler triggers execution; delivery handles output             |
| plan-06-detail-page-polish | Provides     | Detail plan 2.5.3 (webhook delivery status) uses this plan's data |

---

## 3. Tasks — Webhook Delivery

### Task 5.1: Implement Dedicated Webhook Dispatcher Service

**Original:** 2.3.1
**File:** `apps/worker/src/services/webhook-delivery.ts` (NEW)

**Current State Analysis:**

- `postCompletionWebhook()` exists inline in `report-queues.ts` (lines 556-569) — basic POST with no retry
- `postDeliveryEventWebhook()` exists inline in `report-queues.ts` (lines 571-588) — with token auth
- `ReportDeliveryWebhookPayload` type exists in `report-queues.ts` (lines 519-531)
- `deliveryEventsWebhookUrl` / `deliveryEventsWebhookToken` env vars supported

**What's Missing:**

- No dedicated `WebhookDispatcher` class — logic is inline in `report-queues.ts`
- No retry logic with exponential backoff (current implementation silently swallows errors)
- No integration with delivery suppression for deduplication
- No 30-second timeout configuration
- No dead-letter queue after 3 failures

**Implementation:**

1. Create `WebhookDispatcher` class in `apps/worker/src/services/webhook-delivery.ts`:

   ```typescript
   interface WebhookPayload {
     insightId: string;
     tenantId: string;
     reportId: string;
     timestamp: string;
     metrics: MetricSummary[];
     aiInsights: string[];
     reportUrl: string; // PDF/XLSX download link
     payloadDepth: "summary" | "full";
   }
   ```

2. POST report payload to configured `webhookUrl`.

3. Retry logic with exponential backoff:
   - 3 attempts: 1s, 5s, 30s intervals
   - Log each attempt to audit trail
   - After 3 failures, mark as dead-letter

4. Integrate with `delivery-suppression-redis.ts` to prevent duplicate deliveries:
   - Check suppression key before sending
   - Set suppression key after successful delivery

5. Timeout: 30 seconds per request (use `AbortController`).

6. Refactor: Replace inline `postCompletionWebhook()` and `postDeliveryEventWebhook()` in `report-queues.ts` with calls to the new `WebhookDispatcher`.

**Testing:** Unit tests for dispatcher (retry, timeout, suppression); mock HTTP server for integration tests.

---

### Task 5.2: Define Webhook Payload Format in Shared Types

**Original:** 2.3.2
**File:** `packages/types/src/webhook.ts` (NEW)

**Current State Analysis:**

- `ReportDeliveryWebhookPayload` exists in `report-queues.ts` (worker-local, not shared)
- `DeliveryEventIngestPayload` exists in `report-queues.ts` (worker-local)
- No Zod validation for webhook payloads in `packages/types`

**What's Missing:**

- No shared webhook payload schema in `packages/types/src/`
- No configurable payload depth (summary vs full)
- No Zod validation schema

**Implementation:**

1. Create `packages/types/src/webhook.ts` with standard webhook payload schema:
   - Insight metadata (id, name, tenant, template)
   - Metrics summary (aggregated values, trends)
   - AI insights (generated recommendations)
   - Report URLs (PDF, XLSX download links)
   - Timestamp and version

2. Support configurable payload depth:
   - `summary`: Key metrics + AI insight headlines
   - `full`: All metrics + full AI analysis + report URLs

3. Add Zod validation schemas:
   - `webhookPayloadSchema`
   - `webhookDeliveryEventSchema`

4. Export from `packages/types/src/index.ts`.

5. Update `report-queues.ts` to import from shared types instead of using local definitions.

**Testing:** Unit tests for payload construction at both depths; Zod validation tests.

---

### Task 5.3: Webhook Delivery Status Tracking

**Original:** 2.3.3
**Files:**

- `packages/database/src/schema/webhook-deliveries.ts` (NEW)
- `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` (MODIFY — also covered in plan-06)

**Current State Analysis:**

- No `webhook_deliveries` table exists
- No webhook delivery status tracking in any table
- `InsightDetailPage.tsx` has Reports tab but no delivery status column

**What's Missing:**

- Database schema for tracking webhook delivery attempts
- RLS policies for tenant isolation
- Webhook dispatcher writes to status table
- Frontend display of delivery status

**Implementation:**

1. Create `webhook_deliveries` table:
   - `id` (UUID, PK)
   - `insight_id` (UUID, FK → insights)
   - `tenant_id` (UUID, not null)
   - `report_id` (UUID)
   - `url` (text, not null)
   - `status` (enum: pending, success, failed, dead-letter)
   - `response_code` (integer, nullable)
   - `response_body` (text, nullable — truncated to 1KB)
   - `attempts` (integer, default 0)
   - `created_at`, `updated_at` (timestamptz)

2. Add RLS policies for tenant isolation.

3. Export from `packages/database/src/schema/index.ts`.

4. Webhook dispatcher writes to this table on each attempt.

5. Show delivery status in detail page Reports tab (also covered in plan-06, Task 6.3).

**Testing:** Integration tests for status tracking; RLS policy tests.

---

## 4. Tasks — Excel Report Generation

### Task 5.4: Verify and Extend XLSX Generator

**Original:** 2.4.1
**File:** `packages/report-generator/src/xlsx-format-generator.ts` (MODIFY)

**Current State Analysis:**

- `ExcelXlsxFormatGenerator` exists and works — converts HTML tables to XLSX
- Single worksheet named "Report"
- Basic implementation: parses HTML `<table>` rows into worksheet cells
- Has passing test (`xlsx-format-generator.test.ts`)
- Implements `IFormatGenerator` interface with `format = "xlsx"`
- Uses `ExcelJS` library

**What's Missing:**

- No multi-sheet workbook (plan requires: Summary, Metrics, AI Insights sheets)
- No tenant branding/styling application
- No structured data input support (only HTML parsing)
- No Summary sheet with insight name, date range, key metrics
- No Metrics sheet with per-connector metric tables
- No AI Insights sheet with generated recommendations

**Implementation:**

1. Extend to support multi-sheet workbook:
   - **Summary sheet:** insight name, date range, key metrics, tenant info
   - **Metrics sheet:** per-connector metric tables with headers
   - **AI Insights sheet:** generated recommendations with timestamps

2. Apply tenant branding (colors, logo) if available via `FormatGeneratorInput.context`.

3. Ensure API matches PDF generator interface for pipeline integration (already does via `IFormatGenerator`).

4. Add optional structured data input path (bypass HTML parsing when `model` contains metrics/insights).

**Testing:** Unit tests for multi-sheet generation; verify styling application; verify structured data path.

---

### Task 5.5: Integrate XLSX into Worker Pipeline

**Original:** 2.4.2
**File:** `apps/worker/src/queues/report-queues.ts` (MODIFY)

**Current State Analysis:**

- `defaultReportGenerationProcessor()` exists (lines 498-517) — calls `gen.generate()` with `data.format`
- `createDefaultCompositeTemplateEngine()` and `createDefaultFormatRegistry()` used
- Format registry already supports "xlsx" via `ExcelXlsxFormatGenerator`
- `ReportFormat` type from `@agenticverdict/report-generator` includes "xlsx"
- `defaultReportDeliveryProcessor()` handles email delivery with attachments
- `completionWebhookUrl` already supported in delivery job data
- AI insights generation triggered after successful email delivery

**What's Missing:**

- No explicit handling for `delivery.format === "both"` (generate PDF + XLSX)
- File naming convention not specific to format (`{insightId}_{timestamp}.xlsx`)
- Report record doesn't track multiple format URLs
- `defaultInsightExecutionProcessor()` only generates PDF (line 1012: `"pdf"` hardcoded)

**Implementation:**

1. Extend report generation processor:
   - When `delivery.format === "excel"` or `"xlsx"`, use XLSX generator
   - When `delivery.format === "both"`, generate both PDF and XLSX
   - Store generated files in same storage location as PDF reports

2. File naming: `{insightId}_{timestamp}.xlsx`

3. Storage: Same S3/local storage as PDF, with `.xlsx` extension.

4. Update report record to include both PDF and XLSX URLs (extend `reports` table metadata or add `format_urls` JSONB column).

5. Update `defaultInsightExecutionProcessor()` to support configurable format instead of hardcoded `"pdf"`.

**Testing:** Integration test: trigger XLSX generation → verify file created → verify URL stored.

---

### Task 5.6: Excel Delivery via Email/Webhook

**Original:** 2.4.3
**Files:**

- `apps/worker/src/services/email.ts` (MODIFY)
- `apps/worker/src/services/webhook-delivery.ts` (MODIFY — new file from Task 5.1)

**Current State Analysis:**

- `EmailAttachment` interface exists in `email.ts`
- `ResendEmailDeliveryService` supports attachments (base64 encoded)
- `SendGridEmailDeliveryService` supports attachments (base64 encoded)
- `sendReportEmail()` accepts `attachments: EmailAttachment[]`
- `defaultReportDeliveryProcessor()` maps `data.attachments` to `EmailAttachment[]`
- Webhook payload `ReportDeliveryWebhookPayload` has `attachmentsCount` field

**What's Missing:**

- No explicit XLSX attachment handling in delivery pipeline
- Webhook payload doesn't include XLSX download URL
- Email template doesn't mention available formats dynamically

**Implementation:**

1. Email delivery:
   - Attach XLSX file to email when format includes Excel
   - If both PDF and XLSX, attach both files
   - Email template already shows format via `{{format}}` variable — sufficient

2. Webhook delivery:
   - Include XLSX download URL in webhook payload
   - Include both PDF and XLSX URLs when both are generated
   - Extend `ReportDeliveryWebhookPayload` with `reportUrls: { pdf?: string; xlsx?: string }`

**Testing:** Integration tests for email attachment; webhook payload verification with XLSX URLs.

---

## 5. File Change Summary

| File                                                              | Action               | Type                | Notes                                      |
| ----------------------------------------------------------------- | -------------------- | ------------------- | ------------------------------------------ |
| `apps/worker/src/services/webhook-delivery.ts`                    | **Create**           | Webhook dispatcher  | NEW — extract from inline functions        |
| `packages/types/src/webhook.ts`                                   | **Create**           | Payload schema      | NEW — shared types                         |
| `packages/database/src/schema/webhook-deliveries.ts`              | **Create**           | DB schema           | NEW — status tracking                      |
| `packages/database/src/schema/index.ts`                           | **Modify**           | Export              | Add webhook-deliveries export              |
| `packages/types/src/index.ts`                                     | **Modify**           | Export              | Add webhook types export                   |
| `packages/report-generator/src/xlsx-format-generator.ts`          | **Modify**           | Verify/extend       | Multi-sheet, branding                      |
| `apps/worker/src/queues/report-queues.ts`                         | **Modify**           | Refactor            | Replace inline webhooks, add XLSX pipeline |
| `apps/worker/src/services/email.ts`                               | **Already supports** | Attachments         | No changes needed                          |
| `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` | **Modify**           | Show webhook status | Also covered in plan-06 Task 6.3           |

---

## 6. Testing Requirements

| Test Type   | Scope                                           | Coverage Target |
| ----------- | ----------------------------------------------- | --------------- |
| Unit        | WebhookDispatcher (retry, suppression, timeout) | 90%+            |
| Unit        | Payload construction (summary/full)             | 90%+            |
| Unit        | XLSX generator (multi-sheet, structured data)   | 90%+            |
| Integration | Webhook delivery → status tracking              | 85%+            |
| Integration | XLSX generation → storage                       | 85%+            |
| Integration | Email with XLSX attachment                      | 80%+            |
| Integration | RLS policy enforcement                          | 100%            |

---

## 7. Success Criteria

- [ ] WebhookDispatcher class created with retry logic (3 attempts with backoff)
- [ ] Webhook payloads validated via Zod schemas in shared types
- [ ] Duplicate deliveries suppressed via Redis
- [ ] `webhook_deliveries` table tracks all delivery attempts with status
- [ ] XLSX generator produces multi-sheet workbooks (Summary, Metrics, AI Insights)
- [ ] XLSX generation triggered by `delivery.format === "xlsx"` or `"both"`
- [ ] XLSX files attached to emails and linked in webhook payloads
- [ ] Inline webhook functions in `report-queues.ts` refactored to use `WebhookDispatcher`
- [ ] All tests pass

---

## 8. Dependencies on Other Plans

| Plan                       | Relationship | Notes                                                                   |
| -------------------------- | ------------ | ----------------------------------------------------------------------- |
| plan-02-scheduler          | Depends on   | Scheduler triggers execution; delivery handles output                   |
| plan-06-detail-page-polish | Provides     | Task 6.3 (webhook delivery status in Reports tab) uses this plan's data |

---

## 9. Risk Mitigation

| Risk                                            | Mitigation                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Webhook delivery failures                       | Retry with backoff, dead-letter queue, audit trail logging                                 |
| Excel generator performance with large datasets | Stream-based generation, size limits, async processing                                     |
| Webhook payload size limits                     | Implement `summary` depth for large reports; configurable max payload                      |
| Duplicate webhook deliveries                    | Redis-based suppression keys with TTL                                                      |
| Schema changes mid-development                  | Use `make db:reset` to drop and recreate — no migration rollback needed                    |
| Breaking existing webhook integrations          | Maintain backward compatibility with `postCompletionWebhook` payload shape during refactor |

---

## 10. Implementation Order

1. **Task 5.2** — Define webhook payload types (foundation, no dependencies)
2. **Task 5.3** — Create webhook_deliveries DB schema (foundation, no dependencies)
3. **Task 5.1** — Implement WebhookDispatcher (depends on 5.2 for types)
4. **Task 5.4** — Extend XLSX generator (independent)
5. **Task 5.5** — Integrate XLSX into worker pipeline (depends on 5.4)
6. **Task 5.6** — Excel delivery via email/webhook (depends on 5.1, 5.5)
