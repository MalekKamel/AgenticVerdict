# Implementation Plan 01 — Insight Templates System

**Phase:** P0 (Core Feature Completion)
**Original Reference:** Comprehensive Plan §2.1 (Tasks 2.1.1 – 2.1.7)
**Priority:** P0 — Critical path for product-led growth
**Estimated Effort:** 10 tasks, ~4-5 days

---

## 0. Greenfield Development Policy

This is a **pre-production greenfield** codebase. All database changes use **destructive approaches**:

- No migration files with up/down — use `make db:push` (Drizzle) or `make db:migrate` (Knex) to apply schema directly
- No backward compatibility concerns — break freely, rename freely, drop freely
- Seed scripts use `TRUNCATE ... CASCADE` then fresh `INSERT` — no upsert/idempotent patterns needed
- If a schema change is needed mid-development, drop the table and recreate it
- After any schema change, run `make db:reset` to rebuild from scratch

---

## 1. Overview

Build the Insight Templates system that enables users to create insights from pre-configured domain-specific templates. Per the business architecture, **70%+ of insights should be created from templates**, and every template property must remain fully editable after creation (Section 2.4: "Full Customization").

### Business Value

- Reduces insight creation time to <5 minutes (success criterion, Section 9.2)
- Pre-selects multiple connectors per template (drives 50%+ tenants using 2+ connectors)
- Template usage analytics enable product-led growth tracking

### Key Design Decision

Insight templates are **separate** from AI templates (`ai_templates` table). Insight templates define connector-to-metric mappings per domain; AI templates define LLM prompt/workflow configs. They are linked via `templateId` on insights.

---

## 2. Prerequisites

### Already Implemented (Leverage These)

| Component                      | Location                                                        | Notes                                               |
| ------------------------------ | --------------------------------------------------------------- | --------------------------------------------------- |
| AI Templates schema            | `packages/database/src/schema/ai-templates.ts`                  | 3 tables, full tRPC router with 9 procedures        |
| AI Templates service           | `apps/api/src/services/ai-templates.service.ts`                 | Service layer with repository pattern               |
| AI Templates repository        | `packages/database/src/repositories/ai-templates.repository.ts` | Data access layer                                   |
| AI Templates types             | `packages/types/src/ai-templates.ts`                            | Zod schemas + TypeScript types                      |
| Template customization store   | `apps/api/src/services/template-customization-store.ts`         | Tracks customizations                               |
| Insight seed with `templateId` | `packages/database/src/seeds/insights-seed.ts`                  | Field already present                               |
| Report templates schema        | `packages/database/src/schema/report-templates.ts`              | Minimal table for report defs                       |
| Create Wizard (6 steps)        | `apps/frontend/src/features/insights/wizard/`                   | Step 1 (BasicInfoStep) is target for integration    |
| Connector Registry             | `packages/core/src/connectors/`                                 | Source of truth for available connectors            |
| Frontend tRPC client           | `apps/frontend/src/lib/api/trpc-client.ts`                      | `createTRPCReact<AppRouter>` with React Query hooks |
| Insight API hooks              | `apps/frontend/src/features/insights/api/insight-api.ts`        | Pattern for tRPC hooks with cache invalidation      |

### No External Dependencies

This plan has **no dependencies** on other implementation plans. It can be executed first.

---

## 3. Tasks

### Task 1.1: Define Insight Template Types and Zod Schemas

**Original:** 2.1.1
**File:** `packages/types/src/insight-templates.ts` (NEW)

**Implementation:**

1. Define Zod schemas for insight templates following the `packages/types/src/ai-templates.ts` pattern:

   ```typescript
   // Insight template DTO (returned by API)
   export const insightTemplateSchema = z.object({
     id: z.string().uuid(),
     tenantId: z.string().uuid().nullable(), // null = platform-shared
     name: z.string().min(1).max(128),
     description: z.string(),
     domains: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
     connectors: z.array(
       z.object({
         connectorId: z.string(),
         connectorName: z.string(),
         metrics: z.array(z.string()),
       }),
     ),
     aiTemplateId: z.string().uuid().nullable(),
     schedule: z.object({
       frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
       time: z.number().min(0).max(23),
     }),
     delivery: z.object({
       format: z.enum(["pdf", "excel", "both"]),
       emailRecipients: z.array(z.string().email()),
       enableWebhook: z.boolean(),
       webhookUrl: z.string().url().nullable(),
     }),
     icon: z.string(),
     isActive: z.boolean(),
     version: z.number(),
     createdAt: z.coerce.date(),
     updatedAt: z.coerce.date(),
   });

   // Input schemas for tRPC procedures
   export const listInsightTemplatesInput = z.object({ domain: z.string().optional() });
   export const getInsightTemplateInput = z.object({ id: z.string().uuid() });
   export const applyInsightTemplateInput = z.object({ id: z.string().uuid() });
   export const validateInsightTemplateInput = z.object({ id: z.string().uuid() });
   ```

2. Export inferred TypeScript types:

   ```typescript
   export type InsightTemplate = z.infer<typeof insightTemplateSchema>;
   export type InsightTemplateSummary = z.infer<typeof insightTemplateSummarySchema>;
   ```

3. **NO hardcoded template definitions** — types only define the shape; all data comes from DB.

**Validation:** Schemas compile; types are exported from `packages/types/src/index.ts`.

---

### Task 1.2: Add `insight_templates` Database Table

**Original:** 2.1.2
**File:** `packages/database/src/schema/insight-templates.ts` (NEW)

**Implementation:**

1. Define schema with columns:
   - `id` (UUID, PK)
   - `tenant_id` (UUID, nullable FK to tenants — null = platform-shared template)
   - `name` (text, not null)
   - `description` (text)
   - `icon` (text)
   - `ai_template_id` (UUID, nullable FK to ai_templates.id)
   - `schedule` (JSONB — frequency + time)
   - `delivery` (JSONB — format + channels)
   - `is_active` (boolean, default true)
   - `version` (integer, default 1)
   - `created_at`, `updated_at` (timestamptz)

2. Define `insight_template_domains` junction table (many-to-many):
   - `template_id` (FK to insight_templates.id)
   - `domain_id` (FK to business_domains.id)
   - Composite PK on (template_id, domain_id)

3. Define `insight_template_connectors` junction table (many-to-many):
   - `template_id` (FK to insight_templates.id)
   - `connector_id` (varchar FK to core.data_connectors.id)
   - `metrics` (JSONB — array of metric keys available from this connector)
   - Composite PK on (template_id, connector_id)

4. Push schema directly to database:
   - Run `make db:push` (Drizzle) to apply schema changes destructively
   - No migration file needed — schema definition is the source of truth

5. Add RLS policies:
   - `SELECT`: All authenticated tenants (platform-shared templates visible to all; tenant-scoped templates visible only to owning tenant)
   - `INSERT/UPDATE/DELETE`: Platform operators only (`role = 'platform_admin'`) or owning tenant

6. Coexists with existing `ai_templates` and `report_templates` — no conflicts.

**Testing:** Unit test for schema validation; verify all 3 tables created correctly after `make db:push`; verify FK constraints enforce referential integrity.

---

### Task 1.3: Create Insight Templates Repository

**Original:** New (missing from original plan)
**File:** `packages/database/src/repositories/insight-templates.repository.ts` (NEW)

**Implementation:**

1. Follow the `AiTemplatesRepository` pattern — all data access with tenant isolation:

   ```typescript
   export class InsightTemplatesRepository {
     async findAll(tenantId: string, domain?: string): Promise<InsightTemplateDb[]>;
     async findById(tenantId: string, id: string): Promise<InsightTemplateDb | null>;
     async findByIdWithRelations(
       tenantId: string,
       id: string,
     ): Promise<InsightTemplateWithRelations | null>;
     async validateConnectors(templateId: string): Promise<ValidationResult>;
   }
   ```

2. Key query patterns:
   - `findAll`: JOIN `insight_template_domains` + `business_domains` for domain names; filter by domain if provided; return platform-shared (`tenant_id IS NULL`) + tenant-owned
   - `findByIdWithRelations`: JOIN `insight_template_connectors` + `data_connectors` for connector details; JOIN `ai_templates` for AI config
   - `validateConnectors`: Cross-reference template's connector IDs with `data_connectors` table; validate metrics against connector metadata

3. Tenant isolation: Every query includes `tenant_id` scoping — platform-shared templates (`tenant_id IS NULL`) are always included in read results.

4. Use `createDatabaseClient()` from `packages/database/src/client.ts` — same pattern as `AiTemplatesRepository`.

**Testing:** Integration tests for all repository methods; verify tenant isolation; verify JOIN queries return correct related data.

---

### Task 1.4: Create Insight Templates Service Layer

**Original:** 2.1.1 (moved from core to api services)
**File:** `apps/api/src/services/insight-templates.service.ts` (NEW)

**Implementation:**

1. Follow the `AiTemplatesService` pattern — business logic delegating to repository:

   ```typescript
   export class InsightTemplatesService {
     private repository: InsightTemplatesRepository;

     constructor(repository?: InsightTemplatesRepository) {
       this.repository = repository || new InsightTemplatesRepository();
     }

     static forTest(repository: InsightTemplatesRepository): InsightTemplatesService {
       return new InsightTemplatesService(repository);
     }

     async listTemplates(tenantId: string, domain?: string): Promise<InsightTemplateSummary[]>;
     async getTemplateDetail(tenantId: string, id: string): Promise<InsightTemplate>;
     async applyTemplate(tenantId: string, id: string): Promise<AppliedTemplateConfig>;
     async validateTemplate(tenantId: string, id: string): Promise<ValidationResult>;
   }
   ```

2. **NO hardcoded templates in code.** The service is a thin layer that:
   - Delegates to `InsightTemplatesRepository` for all data access
   - Transforms DB results into API-ready DTOs
   - Records usage in `template_usage_analytics` on `applyTemplate`
   - Validates connector/metric mappings against live connector registry at apply time

3. Template-to-connector metric validation:
   - At apply time, cross-reference template's connector IDs with `data_connectors` table
   - Cross-reference template's metrics with connector's available metrics from DB
   - Return validation errors for any mismatched connector/metric pairs

4. Dependency injection via `forTest()` static method for unit testing.

**Validation:** All template data comes from DB; service performs runtime validation against live connector registry, not hardcoded values.

---

### Task 1.5: Seed Template Data

**Original:** 2.1.3
**File:** `packages/database/src/seeds/templates.seed.ts` (NEW)

**Implementation:**

1. Create seed script that truncates `insight_templates`, `insight_template_domains`, and `insight_template_connectors` then inserts platform-shared templates.

2. **Seed data must be dynamically validated at runtime:**
   - Before inserting each template's connector mappings, query `data_connectors` to verify connector IDs exist
   - Query each connector's available metrics from DB (not hardcoded) and validate template metrics against them
   - Query `business_domains` to verify domain references exist before inserting junction rows
   - Query `ai_templates` to verify `ai_template_id` references exist (if provided)

3. Seed script should read connector metadata from `data_connectors.credential_schema` or a dedicated `available_metrics` JSONB column — NOT from hardcoded maps in `connector-factory.ts` or `insights-seed.ts`.

4. Use `TRUNCATE insight_templates CASCADE` before inserting — no upsert needed in greenfield.

5. Follow existing seed patterns:
   - Wrap in `createTenantContext()` + `runWithTenantContext()` for platform-level operations
   - Use `dbScoped(db, async (tx) => { ... })` for transactional operations

6. Seed should be idempotent-safe: if re-run, produces the same result without duplicates.

**Testing:** Run seed against test DB; verify templates created with correct FK relationships; verify connector/metric validation passes against live connector registry data.

---

### Task 1.6: Template API Endpoints (tRPC)

**Original:** 2.1.4
**File:** `apps/api/src/trpc/routers/insight-templates.ts` (NEW)

**Implementation:**

1. Create new tRPC router with 4 procedures, delegating to `InsightTemplatesService`:
   - `insightTemplates.list` — Service call to `listTemplates()`, optionally filter by `domain`. Returns array of template summaries.
   - `insightTemplates.detail` — Service call to `getTemplateDetail()`. Returns full template with connector/metric preview, AI config, schedule, delivery.
   - `insightTemplates.apply` — Service call to `applyTemplate()`. Returns pre-filled insight configuration. Records usage analytics.
   - `insightTemplates.validate` — Service call to `validateTemplate()`. Returns validation errors for mismatched connector/metric pairs.

2. Input validation with Zod schemas from `packages/types/src/insight-templates.ts`.

3. Tenant scoping:
   - Read queries: return platform-shared templates (`tenant_id IS NULL`) + tenant-owned templates (`tenant_id = currentTenantId`)
   - Write operations: restricted to platform operators or owning tenant

4. Reuse existing `ai-templates.ts` router pattern for procedure structure (authedProcedure, input validation, service delegation).

5. All queries use parameterized inputs — NO hardcoded template IDs or metric values in router code.

**Testing:** Integration tests for all 4 procedures; verify RLS enforcement; verify FK resolution works correctly; verify validation catches invalid connector/metric pairs.

---

### Task 1.7: Create Frontend Template Service Layer

**Original:** New (missing from original plan)
**Files:**

- `apps/frontend/src/features/insights/services/template-service.ts` (NEW)
- `apps/frontend/src/features/insights/api/template-api.ts` (NEW)

**Implementation:**

1. **Create a frontend service class** that encapsulates all template logic, decoupling components from direct tRPC calls:

   ```typescript
   // apps/frontend/src/features/insights/services/template-service.ts
   export class TemplateService {
     private trpc: ReturnType<typeof createTRPCReact<AppRouter>>;

     constructor(trpcClient: ReturnType<typeof createTRPCReact<AppRouter>>) {
       this.trpc = trpcClient;
     }

     async listTemplates(domain?: string): Promise<InsightTemplateSummary[]>;
     async getTemplateDetail(id: string): Promise<InsightTemplate>;
     async applyTemplate(id: string): Promise<AppliedTemplateConfig>;
     async validateTemplate(id: string): Promise<ValidationResult>;
     getAvailableDomains(): Promise<string[]>; // Derived from template list
     getTemplatesByDomain(domain: string): Promise<InsightTemplateSummary[]>;
     isTemplateApplied(templateId: string, insights: Insight[]): boolean;
   }

   // Singleton export
   export const templateService = new TemplateService(trpc);
   ```

2. **Service responsibilities** (encapsulated logic, NOT in components):
   - All tRPC query/mutation calls for template operations
   - Data transformation (e.g., extracting unique domains from template list, grouping templates by domain)
   - Derived computations (e.g., connector count per template, domain badge lists)
   - Template application state tracking (checking if a template is already applied to existing insights)
   - Cache invalidation coordination after mutations

3. **Create thin React Query hooks** that delegate to the service, following the established `insight-api.ts` pattern with cache invalidation and notifications:

   ```typescript
   // apps/frontend/src/features/insights/api/template-api.ts
   export function useTemplateList(domain?: string) {
     return trpc.insightTemplates.list.useQuery({ domain });
   }

   export function useTemplateDetail(id: string) {
     return trpc.insightTemplates.detail.useQuery({ id });
   }

   export function useApplyTemplate() {
     const utils = trpc.useUtils();
     return trpc.insightTemplates.apply.useMutation({
       onSuccess: (data) => {
         utils.insightTemplates.list.invalidate();
         utils.insightTemplates.detail.invalidate();
         showSuccessNotification({
           title: "Template Applied",
           message: `Applied "${data.templateName}"`,
         });
       },
       onError: (error) => {
         showErrorNotification({ title: "Apply Failed", message: error.message });
       },
     });
   }

   export function useValidateTemplate() {
     return trpc.insightTemplates.validate.useMutation();
   }
   ```

4. **Service-method integration** — the service uses the hooks internally for React components, and exposes imperative methods for non-React contexts:

   ```typescript
   // Service methods call tRPC directly via trpcClient (imperative API)
   async listTemplates(domain?: string) {
     return await this.trpc.insightTemplates.list.fetch({ domain });
   }
   ```

5. **Export from `apps/frontend/src/features/insights/api/index.ts`** for centralized imports.

6. **NO direct tRPC calls in UI components** — `TemplateBrowser.tsx`, `TemplatePreviewModal.tsx`, and `BasicInfoStep.tsx` must import from `template-service.ts` or `template-api.ts`, never from `trpc-client.ts` directly.

**Testing:** Verify service methods return correct transformed data; verify hooks compile with proper cache invalidation; verify components cannot import tRPC directly (enforced by code review or ESLint rule).

---

### Task 1.8: Template Browser UI

**Original:** 2.1.5
**File:** `apps/frontend/src/features/insights/ui/TemplateBrowser.tsx` (NEW)

**Implementation:**

1. Grid layout of template cards (responsive: 1-3 columns).
2. Each card displays: icon, name, description, domain badges (loaded via `templateService.listTemplates()`), connector count (computed by service from template data).
3. "Use Template" button → calls `templateService.applyTemplate()` and pre-fills wizard with database-resolved configuration.
4. "Start from scratch" button → bypasses template selection.
5. Domain filter bar at top: populated via `templateService.getAvailableDomains()`, NOT hardcoded.
6. Loading states, empty states, error handling.
7. NO hardcoded template data, domain names, or connector names in the component — all data flows through the service layer.

**Testing:** Component unit tests with mocked service; verify domain filtering logic; verify empty state renders when no templates exist; verify all data is service-driven.

---

### Task 1.9: Integrate Template Browser into Wizard Step 1

**Original:** 2.1.6
**Files:**

- `apps/frontend/src/features/insights/wizard/steps/BasicInfoStep.tsx` (MODIFY)
- `apps/frontend/src/features/insights/pages/InsightCreateWizard.tsx` (MODIFY)

**Implementation:**

1. Add template selection as the first screen of `BasicInfoStep`.
2. When a template is selected:
   - Call `templateService.applyTemplate()` to fetch pre-filled configuration from database
   - Auto-populate connectors, metrics, AI config, schedule, delivery from the resolved template data
   - Show a confirmation banner: "Applied template: [name]. All fields are editable."
3. **Critical:** All fields remain editable after template apply (Section 2.4 requirement).
4. Replace hardcoded `templateId: undefined` in `InsightCreateWizard.tsx` (line ~171) with the selected template's ID from the service response.
5. Template selection is optional — "Start from scratch" path unchanged.
6. NO direct tRPC imports in wizard components — all template operations go through `template-service.ts`.

**Testing:** E2E test: select template → verify all fields pre-filled from DB → edit a field → save → verify customizations persisted. Verify that changing seed data produces different pre-filled values (proving data is DB-driven, not hardcoded).

---

### Task 1.10: Template Preview Modal

**Original:** 2.1.7
**File:** `apps/frontend/src/features/insights/ui/TemplatePreviewModal.tsx` (NEW)

**Implementation:**

1. Modal triggered by "Preview" button on template card.
2. Fetches full template detail via `templateService.getTemplateDetail()` — displays:
   - Connectors list with health indicators (resolved via service from `data_connectors` + `tenant_connectors`)
   - Metrics per connector (from service-resolved template data)
   - AI settings (resolved via service through `ai_template_id` FK to `ai_templates`)
   - Schedule and delivery config (from template's JSONB columns)
   - Domain badges (from service-resolved domain data)
3. Two action buttons:
   - "Apply & Customize" → calls `templateService.applyTemplate()` and opens wizard for editing
   - "Apply & Activate" → calls `templateService.applyTemplate()` and creates insight directly (if all connectors are configured)
4. NO hardcoded data in the modal — all content flows through the service layer.

**Testing:** Component tests with mocked service for modal open/close, action button handlers; verify all displayed data comes from service; verify connector health indicators reflect live connector status.

---

## 4. File Change Summary

| File                                                                 | Action     | Type                                                                                |
| -------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| `packages/types/src/insight-templates.ts`                            | **Create** | Zod schemas + TypeScript types                                                      |
| `packages/types/src/index.ts`                                        | **Modify** | Export new insight template types                                                   |
| `packages/database/src/schema/insight-templates.ts`                  | **Create** | DB schema (3 tables: templates, template_domains, template_connectors)              |
| `packages/database/src/schema/index.ts`                              | **Modify** | Export new schema                                                                   |
| `packages/database/src/repositories/insight-templates.repository.ts` | **Create** | Repository (data access with tenant isolation)                                      |
| `packages/database/src/seeds/templates.seed.ts`                      | **Create** | Seed data (validated against live connector registry)                               |
| `apps/api/src/services/insight-templates.service.ts`                 | **Create** | Service layer (business logic, delegates to repository)                             |
| `apps/api/src/trpc/routers/insight-templates.ts`                     | **Create** | tRPC router (4 procedures, delegates to service)                                    |
| `apps/api/src/trpc/routers/index.ts`                                 | **Modify** | Register new router                                                                 |
| `apps/frontend/src/features/insights/services/template-service.ts`   | **Create** | Frontend service (encapsulates all template logic, tRPC calls, data transformation) |
| `apps/frontend/src/features/insights/api/template-api.ts`            | **Create** | Thin React Query hooks with cache invalidation + notifications                      |
| `apps/frontend/src/features/insights/api/index.ts`                   | **Modify** | Export new template hooks                                                           |
| `apps/frontend/src/features/insights/ui/TemplateBrowser.tsx`         | **Create** | UI component (service-driven, no hardcoded domains)                                 |
| `apps/frontend/src/features/insights/ui/TemplatePreviewModal.tsx`    | **Create** | UI component (service-driven)                                                       |
| `apps/frontend/src/features/insights/wizard/steps/BasicInfoStep.tsx` | **Modify** | Integrate browser via service                                                       |
| `apps/frontend/src/features/insights/pages/InsightCreateWizard.tsx`  | **Modify** | Replace `templateId: undefined` via service                                         |

---

## 5. Testing Requirements

| Test Type   | Scope                                                    | Coverage Target |
| ----------- | -------------------------------------------------------- | --------------- |
| Unit        | Insight template types (Zod schema validation)           | 90%+            |
| Unit        | Insight templates service (validation, filtering, apply) | 90%+            |
| Integration | Repository methods (tenant isolation, JOINs)             | 90%+            |
| Integration | tRPC procedures (list, detail, apply, validate)          | 90%+            |
| Integration | RLS policy enforcement                                   | 100%            |
| Component   | TemplateBrowser, TemplatePreviewModal                    | 80%+            |
| E2E         | Template → wizard pre-fill → edit → save                 | Full flow       |

---

## 6. Success Criteria

- [ ] `insight_templates` table + 2 junction tables created with proper FK constraints
- [ ] Templates seeded and queryable via API with full FK resolution
- [ ] Frontend `TemplateService` encapsulates all tRPC calls and data transformations
- [ ] `template-api.ts` provides thin hooks with cache invalidation and notifications
- [ ] NO direct tRPC imports in UI components (enforced by code review)
- [ ] Template browser renders in wizard step 1 with dynamically populated domain filter
- [ ] Applying a template pre-fills all wizard fields from database (not hardcoded)
- [ ] All pre-filled fields remain editable
- [ ] `templateId` is persisted on created insights
- [ ] Template usage is recorded in analytics table
- [ ] Connector/metric validation works against live `data_connectors` registry
- [ ] NO hardcoded template data, domain names, connector IDs, or metric values in any source file
- [ ] All tests pass (unit + integration + E2E)

---

## 7. Dependencies on Other Plans

| Plan                       | Relationship | Notes                                                                                          |
| -------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| plan-00-dependency-map     | Referenced   | This plan is the first executable plan                                                         |
| plan-02-scheduler          | None         | Templates define `schedule` but scheduler implementation is independent                        |
| plan-04-domain-mapping     | None         | Templates reference `business_domains` via FK; domain-mapper service is a separate enhancement |
| plan-06-detail-page-polish | Provides     | Detail plan 2.5.4 (domain badges) uses template domain data                                    |

### Existing Codebase Dependencies (Anti-Pattern Cleanup)

| File                                                   | Issue                                         | Resolution                                                                            |
| ------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| `packages/database/src/factories/connector-factory.ts` | `PLATFORM_METRICS` hardcoded map              | Do NOT use; template metrics come from `insight_template_connectors`                  |
| `packages/database/src/seeds/insights-seed.ts`         | `platformMetricsMap` duplicated hardcoded map | Do NOT use; validate against `data_connectors` at seed time                           |
| `packages/database/src/factories/insight-factory.ts`   | `INSIGHT_DEFAULTS` hardcoded insight configs  | Future plan should migrate to `insight_templates`; this plan creates the target table |

---

## 8. Risk Mitigation

| Risk                                        | Mitigation                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Template metrics don't match connector API  | Validate at seed time AND at apply time against live `data_connectors` registry                                    |
| Template-AI config coupling                 | Keep `insight_templates` separate from `ai_templates`; link via `ai_template_id` FK only                           |
| Domain mapper drift from connector registry | Template registry reads from `business_domains` and `data_connectors` as source of truth                           |
| Hardcoded data creeping into codebase       | Code review checklist: verify NO hardcoded template IDs, domain names, connector slugs, or metric keys in any file |
| Schema changes mid-development              | Use `make db:reset` to drop and recreate — no migration rollback needed                                            |
| Orphaned FK references                      | Seed script validates all FK targets before insert; apply-time validation catches runtime drift                    |

---

## 9. Anti-Patterns to Avoid

**NEVER do these:**

1. **Hardcode template definitions in code** — All template data (name, description, domains, connectors, metrics, schedule, delivery) must live in the `insight_templates` tables.

2. **Duplicate connector-to-metric mappings** — The `PLATFORM_METRICS` map in `connector-factory.ts` and `platformMetricsMap` in `insights-seed.ts` are existing anti-patterns. Do NOT replicate this. Template connector mappings belong only in `insight_template_connectors`.

3. **Hardcode domain names in UI** — The domain filter bar must be populated from `business_domains` via API, not from a hardcoded array like `["Marketing", "Finance", "SEO", ...]`.

4. **Hardcode connector slugs** — References to `ga4`, `meta`, `tiktok`, etc. must come from `data_connectors.id`, not string literals in application code.

5. **Hardcode metric keys** — Metric names like `ga4.sessions`, `meta.conversions` must come from connector metadata or template connector mappings, not from code constants.

6. **Bypass FK resolution** — Always resolve `ai_template_id`, `domain_id`, and `connector_id` through proper JOINs or separate queries. Never assume FK targets exist.

7. **Import tRPC directly in UI components** — Components must import from `template-service.ts` or `template-api.ts`, never from `trpc-client.ts`. All tRPC calls are encapsulated in the service layer.

---
