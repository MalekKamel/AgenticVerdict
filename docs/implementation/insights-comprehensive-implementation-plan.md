# Comprehensive Implementation Plan — AgenticVerdict Insights Feature

**Created:** 2026-05-10
**Based on:** `/docs/architecture/business/business-architecture.md`
**Status:** Draft

---

## Executive Summary

This plan outlines all remaining work to deliver the complete AgenticVerdict Insights platform as defined in the business architecture. The platform is ~75% complete — core infrastructure (connectors, API, worker, frontend wizard, types, DB schema) is implemented. The gaps center on **templates**, **scheduled execution**, **webhook delivery**, **detail page polish**, and **agency multi-tenant features**.

---

## 1. Current State Assessment

### ✅ Fully Implemented

| Component                                                      | Status                                                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Data Connectors (GA4, GSC, Meta, TikTok, Mock)                 | ✅ Complete                                                                                                              |
| Connector Registry & Factory                                   | ✅ Complete                                                                                                              |
| Insight CRUD API (tRPC)                                        | ✅ Complete                                                                                                              |
| Insight REST API (`GET /insights`)                             | ✅ Complete                                                                                                              |
| Frontend Create Wizard (6 steps)                               | ✅ Complete                                                                                                              |
| Frontend List Page (filters, pagination, actions)              | ✅ Complete                                                                                                              |
| Frontend Edit Page                                             | ✅ Complete                                                                                                              |
| Frontend Detail Page                                           | ✅ Complete (798-line component: Overview, Reports, AI Insights, History tabs, share modal, Run Now/Edit/Delete actions) |
| Worker Queue (BullMQ)                                          | ✅ Complete                                                                                                              |
| Intelligence Pipeline (collect → analyze → generate → deliver) | ✅ Complete                                                                                                              |
| PDF Report Generation                                          | ✅ Complete                                                                                                              |
| AI Model Configuration (providers, quality, detail level)      | ✅ Complete                                                                                                              |
| Audit Trail                                                    | ✅ Complete                                                                                                              |
| Multi-tenant DB (RLS, tenant-scoped queries)                   | ✅ Complete                                                                                                              |
| i18n (en, zh, fr, es, ar)                                      | ✅ Complete                                                                                                              |
| Type Definitions & Runtime Guards                              | ✅ Complete                                                                                                              |
| AI Templates Infrastructure                                    | ✅ Complete (`ai-templates.ts` schema, full tRPC router with 9 procedures, service layer, seed scripts)                  |
| Report Schedule Infrastructure                                 | ✅ Complete (`/api/v1/report-schedules` REST CRUD, BullMQ repeatable jobs, `report-schedule-enqueue.ts`)                 |
| XLSX Report Generator                                          | ✅ Complete (`packages/report-generator/src/xlsx-format-generator.ts` with tests)                                        |
| Agency Dashboard Page                                          | ✅ Partial (`features/dashboard/pages/agency/AgencyDashboardPage.tsx` exists but not wired as top-level feature)         |
| Insight Execution Queue                                        | ✅ Complete (`INSIGHT_EXECUTION_QUEUE` with BullMQ worker, manual trigger via `insight-schedule-enqueue.ts`)             |

### ⚠️ Partially Implemented

| Feature                             | Status                                                           | Priority | Notes                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Insight Templates (domain-specific) | ⚠️ Infrastructure exists for AI templates, not Insight templates | P0       | `templateId` field on insights always `undefined`; no template browser/selection UI                                              |
| Scheduled Cron Execution (Insights) | ⚠️ Report scheduling works; insight scheduling does not          | P0       | `insight-schedule-enqueue.ts` exists but never wired to cron/repeatable jobs; schedule store is in-memory only (lost on restart) |
| Domain Assignment Logic             | ⚠️ Partially wired                                               | P2       | `useConnectorDomains` hook exists but no domain-mapper service                                                                   |

### ❌ Missing

| Feature                       | Status                       | Priority | Notes                                                                                                                                           |
| ----------------------------- | ---------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Webhook Delivery              | ❌ Not implemented           | P1       | No `delivery/` directory in worker; only `delivery-suppression-redis.ts` exists                                                                 |
| Insight Detail Page Polish    | ❌ Not needed                | —        | Already complete; no further work required                                                                                                      |
| Agency Multi-Tenant Dashboard | ⚠️ Partial                   | P2       | `AgencyDashboardPage.tsx` exists under `features/dashboard/pages/agency/` but lacks tenant switcher, onboarding wizard, cross-tenant management |
| White-Label Reporting         | ❌ Not implemented (Phase 2) | P3       | Per business architecture Section 6.2                                                                                                           |
| Cross-Client Benchmarking     | ❌ Not implemented (Phase 2) | P3       | Per business architecture Section 4.2                                                                                                           |

---

## 2. Implementation Phases

### Phase 1: Core Feature Completion (P0)

#### 2.1 Insight Templates System

**Business Value:** "70%+ of Insights created from templates" (success criterion, Section 9.2). Templates accelerate Insight creation for Marketing, Finance, SEO, Social Media, and Executive Summary use cases (Appendix A). Per Section 2.4: "All properties can be initialized from templates, with **full customization** preserved."

**Existing Infrastructure to Leverage:**

- `ai-templates.ts` schema with 3 tables (`ai_templates`, `template_deployments`, `template_usage_analytics`) — full tRPC router with 9 procedures already exists
- `report-templates.ts` schema — minimal table for report definitions
- `insights-seed.ts` — already has `templateId` field on insights
- `template-customization-store.ts` — service for tracking template customizations

**Design Decision:** Create a separate `insight_templates` table (distinct from `ai_templates` which stores AI prompt/workflow configs). Insight templates define connector-to-metric mappings per domain, while AI templates define LLM configurations. The two are linked via `templateId` on insights.

**Tasks:**

- [ ] **2.1.1** Create template registry data structure
  - File: `packages/core/src/templates/template-registry.ts`
  - Define `InsightTemplate` interface with: id, name, description, domain[], defaultConnectors[], defaultMetrics (per connector), defaultAiConfig, defaultSchedule, defaultDelivery, icon
  - Register 5 templates from Appendix A with connector-to-domain mappings per Section 2.3:
    - **Marketing Insight:** GA4 (Marketing, Analytics, Web), Meta (Marketing, Social), TikTok (Marketing, Social, Video) → Sessions, Conversions, Spend, ROI
    - **Finance Insight:** GA4, QuickBooks (Finance, Accounting), Stripe (Finance, Payments) → Revenue, Expenses, Profit Margin
    - **SEO Performance Insight:** GA4, GSC (Analytics, SEO, Web) → Organic Traffic, Clicks, CTR, Position
    - **Social Media Insight:** Meta, TikTok → Reach, Engagement, Followers
    - **Executive Summary:** All enabled connectors → Strategic KPIs across domains
  - Map metrics to Business Metrics Framework (Section 5): Marketing (Sessions, Conversions, ROAS, CPA, CTR), Finance (Revenue, Expenses, Profit, CAC, LTV:CAC), SEO (Organic Traffic, Rankings, Impressions, CTR), Social (Followers, Reach, Engagement Rate, Shares), Local (Calls, Directions, Reviews, Rating)

- [ ] **2.1.2** Add `insight_templates` database table
  - File: `packages/database/src/schema/insight-templates.ts`
  - Columns: id, name, description, domain (text[]), connectors (JSONB with connectorId → metric[] mapping), aiConfig (JSONB, references ai_templates), schedule (JSONB), delivery (JSONB), isActive (boolean), createdAt, updatedAt
  - Add migration; ensure RLS policies allow read for all tenants, write for platform operators only
  - Coexists with existing `ai_templates` and `report_templates` tables

- [ ] **2.1.3** Seed template data
  - File: `packages/database/src/seeds/templates.seed.ts`
  - Create seed script that populates `insight_templates` table with 5 domain templates
  - Validate template metrics against connector registry at seed time (per Risk Assessment)
  - Include connector-to-metric mappings per template aligned with Section 2.3 connector table

- [ ] **2.1.4** Template API endpoints (tRPC)
  - File: `apps/api/src/trpc/routers/insights.ts` (extend) or new `apps/api/src/trpc/routers/insight-templates.ts`
  - `insight.templates.list` — list all available templates, filterable by domain
  - `insight.templates.detail` — get template by ID including connector/metric preview
  - `insight.templates.apply` — create insight from template (returns pre-filled form data)
  - Reuse existing `ai-templates.ts` infrastructure for AI config portion of templates

- [ ] **2.1.5** Template browser UI in Create Wizard
  - File: `apps/frontend/src/features/insights/ui/TemplateBrowser.tsx`
  - Grid of template cards with icon, name, description, domain badges (per Section 2.3 domain tags), connector count
  - "Use Template" button → pre-fills wizard step 1
  - "Start from scratch" alternative
  - Filter by domain (Marketing, Finance, SEO, Social, Local, Executive)

- [ ] **2.1.6** Integrate template browser into wizard step 1
  - File: `apps/frontend/src/features/insights/wizard/steps/BasicInfoStep.tsx`
  - Add template selection as first screen of BasicInfoStep
  - When template selected, auto-populate connectors, metrics, AI config, schedule, delivery
  - **All fields remain editable** — per Section 2.4: "Full Customization: Every template property remains editable after creation"
  - Replace hardcoded `templateId: undefined` in `InsightCreateWizard.tsx` (line 171)

- [ ] **2.1.7** Template preview modal
  - File: `apps/frontend/src/features/insights/ui/TemplatePreviewModal.tsx`
  - Shows template details: connectors, metrics, AI settings, schedule before applying
  - "Apply & Customize" vs "Apply & Activate" options
  - Display domain badges and connector health indicators

#### 2.2 Scheduled Cron Execution

**Business Value:** "Automated delivery on schedule" (success criterion, Section 9.1). Per Section 3.1 Intelligence Pipeline: every report follows COLLECT → ANALYZE → GENERATE → DELIVER lifecycle on schedule.

**Existing Infrastructure to Leverage:**

- Report scheduling is fully implemented: `/api/v1/report-schedules` REST CRUD, `createReportScheduleQueue()`, `createDefaultReportScheduleProcessor()`, `registerReportWorkers()`
- `report-bullmq.ts` has `registerScheduleRepeatableJob()` for reports — pattern can be replicated for insights
- `insight-schedule-enqueue.ts` exists with `enqueueScheduledInsightExecution()` but is never wired to a cron trigger
- `InsightSchedule` type exists in `packages/types/src/insight.ts` (frequency: daily/weekly/monthly/quarterly, time: 0-23)
- `ScheduleDeliveryStep.tsx` wizard step already collects schedule config
- **Critical limitation:** `schedule-store.ts` uses in-memory `Map` — schedules are lost on server restart. Must persist to DB.

**Tasks:**

- [ ] **2.2.1** Persist schedule store to database
  - File: `apps/api/src/services/schedule-store.ts` (modify) or new schema
  - Replace in-memory `Map` with DB-backed storage
  - Add `insight_schedules` table: id, insightId, tenantId, cronExpression, frequency, time, isActive, lastRun, nextRun, createdAt, updatedAt
  - Add RLS policies for tenant isolation (Section 6.1)

- [ ] **2.2.2** Implement insight schedule repeatable job registration
  - File: `apps/api/src/services/report-bullmq.ts` (extend) or new `apps/api/src/services/insight-schedule-bullmq.ts`
  - Create `registerInsightScheduleRepeatableJob()` mirroring `registerScheduleRepeatableJob()` pattern
  - Convert `InsightSchedule` (frequency + time) to cron expression
  - Wire into insight create/update flows: when schedule is set, register repeatable job; when deleted/disabled, remove job

- [ ] **2.2.3** Wire insight scheduler to worker
  - File: `apps/worker/src/queues/report-queues.ts` (extend)
  - Register `INSIGHT_SCHEDULE_QUEUE` processor (analogous to `REPORT_SCHEDULE_QUEUE`)
  - Use existing `enqueueScheduledInsightExecution()` as the enqueue mechanism
  - Ensure worker processes insight schedule ticks and enqueues execution jobs

- [ ] **2.2.4** Schedule management API
  - File: `apps/api/src/trpc/routers/insights.ts` (extend) or new `insight-schedules.ts`
  - `insight.schedule.list` — list schedules for tenant
  - `insight.schedule.nextRun` — calculate next scheduled run time
  - `insight.schedule.history` — list past scheduled executions
  - `insight.schedule.toggle` — enable/disable schedule without deleting

- [ ] **2.2.5** Schedule status UI
  - File: `apps/frontend/src/features/insights/ui/ScheduleStatusBadge.tsx`
  - Show next run time on insight card
  - Show "Scheduled" vs "Manual only" indicator
  - Integrate into `InsightListPage.tsx` filter bar and `InsightDetailPage.tsx` Overview tab

---

### Phase 2: Delivery & Reporting Enhancements (P1)

#### 2.3 Webhook Delivery

**Business Value:** Supports automated delivery channel per Section 2.4 (Delivery: Format, recipients, channels). Per Section 3.1, "Deliver to Stakeholders" is the final stage of the intelligence pipeline.

**Existing Infrastructure:** No `delivery/` directory exists in worker. Only `delivery-suppression-redis.ts` for deduplication. The `ScheduleDeliveryStep.tsx` wizard step already collects a `webhookUrl` field.

**Tasks:**

- [ ] **2.3.1** Implement webhook dispatcher
  - File: `apps/worker/src/services/webhook-delivery.ts`
  - POST report payload to configured `webhookUrl`
  - Include retry logic with exponential backoff (3 attempts, 1s/5s/30s intervals)
  - Log delivery status to audit trail
  - Integrate with existing `delivery-suppression-redis.ts` to prevent duplicate deliveries

- [ ] **2.3.2** Webhook payload format
  - Define standard payload: insight metadata, metrics summary, AI insights, PDF/XLSX URL
  - Support configurable payload depth (summary vs full)
  - Align with Section 2.4 Delivery Configuration schema

- [ ] **2.3.3** Webhook delivery status tracking
  - Add `webhook_deliveries` table: id, insightId, tenantId, url, status, responseCode, responseBody, attempts, createdAt
  - Add RLS policies for tenant isolation
  - Show delivery status in detail page Reports tab

#### 2.4 Excel Report Generation

**Existing Infrastructure:** `packages/report-generator/src/xlsx-format-generator.ts` already exists with tests. The generator lives directly in `src/`, not in a `src/generators/` subdirectory.

**Tasks:**

- [ ] **2.4.1** Verify and extend XLSX generator
  - File: `packages/report-generator/src/xlsx-format-generator.ts` (verify/extend)
  - Confirm multi-sheet workbook support: Summary sheet, Metrics sheet, AI Insights sheet
  - Apply branding/styling per tenant config
  - If not yet integrated into the pipeline, wire it to the report generation flow

- [ ] **2.4.2** Integrate into worker pipeline
  - File: `apps/worker/src/queues/report-queues.ts` (extend)
  - When `delivery.format === "excel"` or `"xlsx"`, use XLSX generator
  - Store generated file in same storage location as PDF reports

- [ ] **2.4.3** Excel delivery via email/webhook
  - Attach XLSX file to email delivery
  - Include download link in webhook payload

#### 2.5 Insight Detail Page Completion

**Current State:** `InsightDetailPage.tsx` (798 lines) is already complete with: PageHeader, ConfigurationSummary, RecentReports, AIInsightsCard, ReportsTab, HistoryTab, and Share Modal. The following tasks are refinements and enhancements rather than core implementation.

**Tasks:**

- [ ] **2.5.1** Add Settings tab
  - File: `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` (extend)
  - Full insight configuration editor inline (connectors, metrics, AI config, schedule, delivery)
  - Save/Cancel workflow
  - Per Section 2.4: all properties editable post-creation

- [ ] **2.5.2** Add schedule status to Overview tab
  - Show next run time, schedule frequency, enable/disable toggle
  - Integrate with ScheduleStatusBadge component from 2.2.5

- [ ] **2.5.3** Add webhook delivery status to Reports tab
  - Show delivery status per report (email sent, webhook delivered, failed)
  - Integrate with webhook_deliveries table from 2.3.3

- [ ] **2.5.4** Add domain badges to ConfigurationSummary
  - Display connected domain badges based on connector-to-domain mapping (Section 2.3)
  - Wire up domain-mapper service from 2.7.1

---

### Phase 3: Multi-Tenant & Agency Features (P2)

#### 2.6 Agency Multi-Tenant Dashboard

**Business Value:** Per Section 3.3 Agency Partner Workflow: Multi-Tenant Dashboard, Client Onboarding, White-Label Reporting, Aggregate Oversight. Per Section 4.2 Agency Partner Users: Agency Owners (multi-client management), Account Managers (client reporting efficiency), Analysts (cross-client benchmarking). Per Section 6.2: Agency capabilities include access client tenants, create client Insights, view client reports.

**Existing Infrastructure:** `AgencyDashboardPage.tsx` exists at `apps/frontend/src/features/dashboard/pages/agency/AgencyDashboardPage.tsx` but is not wired as a top-level feature. No tenant switcher component exists.

**Tasks:**

- [ ] **2.6.1** Tenant switcher component
  - File: `apps/frontend/src/features/shell/ui/tenant-switcher.tsx`
  - Dropdown of accessible tenants (per Section 6.1: "Agencies can switch between clients without data mixing")
  - Search/filter tenants
  - Visual indicator of current tenant
  - Integrate into shell header/navigation

- [ ] **2.6.2** Promote Agency Dashboard to top-level feature
  - File: `apps/frontend/src/features/agency/` (new directory, migrate from `features/dashboard/pages/agency/`)
  - Aggregate stats: total tenants, active insights, recent executions
  - Tenant health summary
  - Quick actions: onboard new tenant, view tenant reports
  - Align with Section 4.2 role requirements

- [ ] **2.6.3** Tenant onboarding wizard
  - File: `apps/frontend/src/features/agency/ui/TenantOnboardingWizard.tsx`
  - Create tenant with template (per Section 3.3: "Rapid provisioning with templates")
  - Assign connectors
  - Set initial users/permissions (per Section 2.2: RBAC)
  - Per Section 6.2: Agency can create client Insights

- [ ] **2.6.4** Cross-tenant insight management
  - API: `agency.tenants.list`, `agency.tenants.insights`, `agency.tenants.create`
  - Agency can view/manage all client insights from single interface (per Section 3.3: "Monitor all client Insights from one interface")
  - Ensure tenant isolation: agency users can only access their own client tenants (Section 6.1)

- [ ] **2.6.5** Implement tenant isolation enforcement
  - Per Section 6.1: Data Isolation (RLS), Configuration Isolation (TenantConfig), Resource Isolation (rate limiting/quotas), Visual Isolation (no data mixing)
  - Add integration tests for tenant isolation boundaries
  - Verify all agency API endpoints enforce tenant-scoped queries

#### 2.7 Domain Assignment Enhancement

**Business Value:** Per Section 2.3, connectors have domain tags (e.g., GA4 → Marketing, Analytics, Web). Per Section 5, the Business Metrics Framework organizes metrics by domain (Marketing, Finance, SEO, Social Media, Local Business). Domain assignment enables filtering, template selection, and cross-domain intelligence (Section 1.2: "Unified Intelligence").

**Tasks:**

- [ ] **2.7.1** Domain-to-connector mapping service
  - File: `packages/core/src/domains/domain-mapper.ts`
  - Map connectors to their primary/secondary domains per Section 2.3:
    - GA4 → Marketing, Analytics, Web
    - Meta → Marketing, Social
    - GSC → Analytics, SEO, Web
    - GBP → Analytics, Local, Marketing
    - TikTok → Marketing, Social, Video
    - QuickBooks (planned) → Finance, Accounting
    - Stripe (planned) → Finance, Payments
  - Support multi-domain connectors
  - Provide domain filtering API for template browser and insight list

- [ ] **2.7.2** Domain filtering in list page
  - Already partially implemented via `useConnectorDomains`
  - Wire up domain filter to use domain-mapper service
  - Show domain badges on insight cards
  - Enable filtering insights by domain (Marketing, Finance, SEO, Social, Local)

---

### Phase 4: Advanced Features (P3)

#### 2.8 White-Label Reporting

**Business Value:** Per Section 6.2: White-label reporting is an Agency Partner capability (Phase 2). Per Section 3.3: "Agency branding on client reports." Per Section 4.2: Account Managers need "White-label reports, bulk delivery."

**Tasks:**

- [ ] **2.8.1** Tenant branding configuration
  - File: `packages/database/src/schema/tenant-branding.ts`
  - Logo, colors, custom domain, footer text
  - Add RLS policies for tenant isolation
  - Link to existing `TenantConfig` pattern (Section 6.1)

- [ ] **2.8.2** Branded report generation
  - Apply tenant branding to PDF/XLSX reports
  - Custom header/footer with agency logo
  - Integrate with `report-generator` package

- [ ] **2.8.3** Branded email delivery
  - Custom email templates with agency branding
  - Custom sender name/address
  - Integrate with existing email delivery service

#### 2.9 Cross-Client Benchmarking

**Business Value:** Per Section 4.2: Analysts need "Cross-client benchmarking (aggregated)." Per Section 3.3: "Aggregate Oversight: Monitor all client Insights from one interface."

**Tasks:**

- [ ] **2.9.1** Aggregated metrics service
  - File: `packages/core/src/benchmarking/aggregator.ts`
  - Compute anonymized aggregate metrics across tenants
  - Percentile rankings, industry benchmarks
  - **Critical:** Ensure tenant data isolation — never expose raw tenant data, only anonymized aggregates (Section 6.1)

- [ ] **2.9.2** Benchmarking UI
  - File: `apps/frontend/src/features/agency/ui/BenchmarkDashboard.tsx`
  - Charts comparing client performance vs aggregate
  - Domain-specific benchmarks (marketing, finance, etc.) per Section 5
  - Accessible only to Agency Partner users with Analyst role

---

## 3. Sorting Feature (Immediate Fix)

The `_handleSort` and `SortIcon` functions exist but are not wired to any UI. This is a quick win:

- [ ] **3.1** Add sortable column headers to a table view variant of the list page
  - Option A: Add a "Table View" toggle alongside the current card grid
  - Option B: Add sort controls to the filter bar (dropdown for sort field, icon for direction)
  - Recommended: **Option B** — simpler, fits existing UI
  - Wire `handleSort` to clickable sort field selector
  - Display `SortIcon` next to active sort field

- [ ] **3.2** Replace `_InsightCard` usage
  - The inline card rendering in `InsightListContent` duplicates `_InsightCard` logic
  - Option A: Use `_InsightCard` component directly in the `.map()`
  - Option B: Keep inline rendering (more control, already done)
  - Recommended: **Option B** — inline rendering is already complete and has the toggle switch that `_InsightCard` doesn't have. Remove `_InsightCard` entirely or mark as `// Reserved for future table view variant`

---

## 4. Testing Strategy

| Area             | Test Type          | Coverage Target |
| ---------------- | ------------------ | --------------- |
| Templates        | Unit + Integration | 90%+            |
| Scheduler        | Integration + E2E  | 80%+            |
| Webhook Delivery | Integration        | 85%+            |
| Excel Generator  | Unit               | 90%+            |
| Detail Page      | Component + E2E    | 80%+            |
| Agency Dashboard | Component + E2E    | 80%+            |

---

## 5. Dependency Order

```
Phase 1 (P0):
  2.1 Templates (2.1.1 → 2.1.2 → 2.1.3 → 2.1.4 → 2.1.5 → 2.1.6 → 2.1.7)
  2.2 Scheduler (2.2.1 → 2.2.2 → 2.2.3 → 2.2.4 → 2.2.5)
  3.1 Sorting (independent, can be done in parallel)

Phase 2 (P1):
  2.5 Detail Page refinements (can be done in parallel with 2.3, 2.4)
  2.3 Webhooks (2.3.1 → 2.3.2 → 2.3.3)
  2.4 Excel/XLSX (2.4.1 → 2.4.2 → 2.4.3)

Phase 3 (P2):
  2.7 Domain Mapping (2.7.1 → 2.7.2) — prerequisite for 2.5.4
  2.6 Agency Dashboard (2.6.1 → 2.6.2 → 2.6.3 → 2.6.4 → 2.6.5)

Phase 4 (P3):
  2.8 White-Label (2.8.1 → 2.8.2 → 2.8.3)
  2.9 Benchmarking (2.9.1 → 2.9.2) — depends on 2.6 Agency Dashboard
```

---

## 6. Success Metrics Alignment

### 6.1 Product Metrics (Section 9.2)

| Business Metric                    | Implementation Target                             | Tracking Mechanism                                                       |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| 70%+ Insights from templates       | Phase 1: Template system with browser + preview   | `template_usage_analytics` table (already exists in ai-templates schema) |
| 50%+ tenants using 2+ connectors   | Phase 1: Template pre-selects multiple connectors | Connector count per insight in DB                                        |
| 90%+ customize template properties | Phase 1: All fields editable after template apply | `template-customization-store.ts` (already exists)                       |
| <5 min Insight creation            | Phase 1: Template reduces creation to 2-3 clicks  | Time-to-create tracking in audit trail                                   |

### 6.2 Business Capabilities (Section 9.1)

| Capability                                                 | Implementation Phase                          | Status                                               |
| ---------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| Multi-domain intelligence (Marketing, Finance, Operations) | Phase 1 (templates) + Phase 3 (domain mapper) | Templates define multi-domain connectors             |
| Self-service configuration without developer assistance    | Phase 1 (wizard + templates)                  | Wizard already complete; templates add acceleration  |
| Template-based customization with full property override   | Phase 1                                       | All template properties editable (Section 2.4)       |
| Connector reuse across multiple Insight types              | Already implemented                           | Connector registry supports reuse                    |
| Flexible metrics selection per connector                   | Already implemented                           | MetricConfigurationStep in wizard                    |
| Automated delivery on schedule                             | Phase 1 (scheduler)                           | BullMQ repeatable jobs                               |
| Agency Partner support with tenant isolation               | Phase 3                                       | Tenant switcher + agency dashboard + RLS enforcement |

### 6.3 Business Metrics (Section 9.3)

| Metric                                  | Implementation Support                        | Notes                             |
| --------------------------------------- | --------------------------------------------- | --------------------------------- |
| 10 paying customers within 3 months     | Self-service onboarding via templates         | Product-led growth                |
| 2+ agency partners with 5+ clients each | Phase 3: Agency dashboard + tenant onboarding | Multi-tenant management           |
| <$1 CAC through product-led growth      | Template acceleration + self-service          | Reduces support overhead          |
| > $500 MRR within 6 months              | All phases contribute                         | Value delivery through automation |

---

## 7. Risk Assessment

| Risk                                                 | Impact       | Mitigation                                                                                                  |
| ---------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| Template-metric mismatch with connector API          | High         | Validate template metrics against connector registry at seed time (2.1.3)                                   |
| Cron scheduler drift/missed runs                     | Medium       | Use BullMQ repeatable jobs (server-side scheduling, not in-memory)                                          |
| Schedule store data loss on restart                  | **Critical** | Replace in-memory `Map` with DB-backed storage (2.2.1)                                                      |
| Webhook delivery failures                            | Medium       | Retry with backoff, dead-letter queue, audit trail logging                                                  |
| Excel/XLSX generator performance with large datasets | Low          | Stream-based generation, size limits, async processing                                                      |
| Multi-tenant data leakage                            | **Critical** | RLS already implemented; add integration tests for tenant isolation (2.6.5)                                 |
| Agency cross-tenant data exposure                    | **Critical** | Enforce tenant-scoped queries on all agency endpoints; never expose raw tenant data in benchmarking (2.9.1) |
| Template-AI config coupling                          | Medium       | Keep insight templates separate from AI templates; link via `templateId` reference                          |
| Domain mapper drift from connector registry          | Medium       | Domain-mapper should read from connector registry as source of truth, not duplicate                         |

---

## 8. File Change Summary

| File/Directory                                                       | Action            | Phase  | Notes                                                                     |
| -------------------------------------------------------------------- | ----------------- | ------ | ------------------------------------------------------------------------- |
| `packages/core/src/templates/`                                       | **New**           | P0     | Template registry with domain mappings                                    |
| `packages/database/src/schema/insight-templates.ts`                  | **New**           | P0     | Coexists with existing `ai-templates.ts` and `report-templates.ts`        |
| `packages/database/src/seeds/templates.seed.ts`                      | **New**           | P0     | 5 domain templates per Appendix A                                         |
| `apps/api/src/services/schedule-store.ts`                            | **Modify**        | P0     | Replace in-memory Map with DB-backed storage                              |
| `apps/api/src/services/insight-schedule-bullmq.ts`                   | **New**           | P0     | Repeatable job registration for insights                                  |
| `apps/worker/src/services/webhook-delivery.ts`                       | **New**           | P1     | Webhook dispatcher with retry logic                                       |
| `packages/report-generator/src/xlsx-format-generator.ts`             | **Verify/Extend** | P1     | Already exists; verify pipeline integration                               |
| `apps/frontend/src/features/insights/ui/TemplateBrowser.tsx`         | **New**           | P0     | Template card grid with domain filtering                                  |
| `apps/frontend/src/features/insights/ui/TemplatePreviewModal.tsx`    | **New**           | P0     | Template details preview                                                  |
| `apps/frontend/src/features/insights/ui/ScheduleStatusBadge.tsx`     | **New**           | P0     | Schedule status indicator                                                 |
| `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx`    | **Modify**        | P1     | Add Settings tab, schedule status, webhook delivery status, domain badges |
| `apps/frontend/src/features/insights/wizard/steps/BasicInfoStep.tsx` | **Modify**        | P0     | Integrate template browser                                                |
| `apps/frontend/src/features/insights/pages/InsightCreateWizard.tsx`  | **Modify**        | P0     | Replace hardcoded `templateId: undefined`                                 |
| `apps/frontend/src/features/insights/pages/InsightListPage.tsx`      | **Modify**        | P0     | Sorting + schedule status                                                 |
| `apps/api/src/trpc/routers/insights.ts`                              | **Modify**        | P0, P1 | Add template and schedule endpoints                                       |
| `apps/worker/src/queues/report-queues.ts`                            | **Modify**        | P0, P1 | Add insight schedule queue processor                                      |
| `apps/frontend/src/features/shell/ui/tenant-switcher.tsx`            | **New**           | P2     | Tenant dropdown for agency users                                          |
| `apps/frontend/src/features/agency/`                                 | **New**           | P2     | Migrate from `features/dashboard/pages/agency/`                           |
| `packages/core/src/domains/domain-mapper.ts`                         | **New**           | P2     | Connector-to-domain mapping service                                       |
| `packages/database/src/schema/tenant-branding.ts`                    | **New**           | P3     | White-label configuration                                                 |
| `packages/core/src/benchmarking/aggregator.ts`                       | **New**           | P3     | Anonymized cross-tenant aggregates                                        |

---

## 9. Stakeholder Role Requirements Mapping

Per Section 4 of the business architecture, implementation must support the following role-based access patterns:

### 9.1 Direct Business Users (Section 4.1)

| Role                  | Required Features                                                  | Implementation Phase                                |
| --------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| Business Owners       | Executive Summary template, strategic insights, automated delivery | Phase 1 (templates + scheduler)                     |
| Marketing Managers    | Marketing Insight template, cross-platform metrics, ROI analysis   | Phase 1 (templates + domain mapper)                 |
| Financial Controllers | Finance Insight template, revenue/expense tracking, alerts         | Phase 1 (templates) + Phase 2 (webhooks for alerts) |
| Operations Leads      | KPI tracking, performance monitoring, trend analysis               | Phase 1 (detail page + scheduler)                   |

### 9.2 Agency Partner Users (Section 4.2)

| Role             | Required Features                                              | Implementation Phase                    |
| ---------------- | -------------------------------------------------------------- | --------------------------------------- |
| Agency Owners    | Multi-tenant dashboard, tenant onboarding, aggregate oversight | Phase 3 (agency dashboard)              |
| Account Managers | White-label reports, bulk delivery, client switching           | Phase 3 (tenant switcher + white-label) |
| Analysts         | Cross-client benchmarking, anonymized aggregates               | Phase 4 (benchmarking)                  |

### 9.3 Platform Operators (Section 4.3)

| Role           | Required Features                           | Implementation Phase                                        |
| -------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Administrators | User management, RBAC, audit logs           | Already implemented                                         |
| Support Staff  | Connector health dashboards, error tracking | Partially implemented; enhance with webhook delivery status |
| Developers     | Plugin architecture, API access             | Phase 3+ (not in current scope)                             |

---

## 10. Deployment Flexibility Considerations

Per Section 8 of the business architecture, AgenticVerdict supports four deployment options. The implementation plan must account for:

| Deployment           | Considerations                            | Impact on Plan                                                                           |
| -------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Desktop (Electron)   | Local data storage, no cloud dependencies | Scheduler must work without cloud BullMQ; consider local cron alternative                |
| Web                  | Browser-based, requires backend services  | Current implementation targets this; no changes needed                                   |
| Cloud (Hosted)       | Fully managed, multi-tenant               | BullMQ + Redis infrastructure assumed; plan aligns                                       |
| Self-Hosted (Docker) | Enterprise compliance, own infrastructure | All Docker compose services must be included; scheduler and worker must be containerized |

**Action Item:** Add deployment-specific configuration notes to each phase's tasks, particularly for the scheduler (2.2) and worker queue components.

---

## 11. Intelligence Pipeline Alignment

Per Section 3.1, every insight follows this lifecycle. The implementation maps as follows:

| Pipeline Stage        | Business Output          | Implementation                                                                        |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| COLLECT DATA          | Raw business data        | Existing connector framework (GA4, GSC, Meta, TikTok, Mock)                           |
| ANALYZE METRICS       | Calculated metrics       | Existing pipeline normalization; extend with domain-specific calculations (Section 5) |
| GENERATE INTELLIGENCE | Business recommendations | Existing AI integration; extend with template-specific AI configs                     |
| DELIVER INSIGHT       | Decision-ready reports   | Phase 1 (scheduler) + Phase 2 (webhooks + XLSX)                                       |

---

## Appendix: Summary of Changes

### Added Sections

- **Section 9:** Stakeholder Role Requirements Mapping — maps implementation phases to business architecture Section 4 role requirements
- **Section 10:** Deployment Flexibility Considerations — addresses Section 8 deployment options and their impact on implementation
- **Section 11:** Intelligence Pipeline Alignment — maps implementation to Section 3.1 pipeline stages
- **Section 6:** Expanded from simple table to three subsections (Product Metrics, Business Capabilities, Business Metrics) aligned with Section 9 of business architecture

### Corrected Content

- **Current State Assessment:** Updated based on codebase verification — Detail Page is complete (not stub), XLSX generator exists, Agency Dashboard page exists under different path, AI templates infrastructure exists
- **Section 2.1 (Templates):** Added existing infrastructure references, aligned template definitions with Appendix A and Section 2.3 connector domain mappings, added Business Metrics Framework (Section 5) alignment
- **Section 2.2 (Scheduler):** Corrected to leverage existing report scheduling infrastructure; added critical risk about in-memory schedule store; added DB persistence task
- **Section 2.3 (Webhooks):** Corrected file path from `delivery/` to `services/`; added integration with existing delivery-suppression-redis
- **Section 2.4 (Excel):** Corrected file path to existing `xlsx-format-generator.ts`; changed from "implement" to "verify/extend"
- **Section 2.5 (Detail Page):** Reduced from 6 tasks to 4 refinement tasks since page is already complete
- **Section 2.6 (Agency):** Added tenant isolation enforcement task (2.6.5); corrected agency page location; added business architecture Section 3.3 workflow alignment
- **Section 2.7 (Domain Mapping):** Added explicit connector-to-domain mappings per Section 2.3
- **Section 2.8-2.9 (White-Label/Benchmarking):** Added business architecture references and tenant isolation constraints
- **Section 5 (Dependencies):** Updated task numbering and added new dependencies
- **Section 7 (Risks):** Added 4 new risks: schedule store data loss, agency cross-tenant exposure, template-AI config coupling, domain mapper drift
- **Section 8 (File Summary):** Updated all file paths to match actual codebase structure; added notes column

### Removed Content

- Removed "Insight Detail Page Content" from Missing table (it's complete)
- Removed "Excel Report Generation" from Missing table (XLSX generator exists)
- Removed audit/overview/reports/AI insights/history tab tasks from 2.5 (already implemented)
