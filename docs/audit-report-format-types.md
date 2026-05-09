# Audit Report: Report Delivery Format Types Consolidation

**Date:** 2026-05-12
**Scope:** All occurrences of report delivery format type definitions across the AgenticVerdict monorepo.
**Constraint:** No source files were modified during this audit.

---

## 1. Executive Summary

Report delivery format definitions are scattered across **6 distinct definition sites** spanning 4 packages and 2 apps, with **3 incompatible enum variants** in active use. The fragmentation causes:

- **Type safety gaps** — string literals used where typed enums should be.
- **Semantic mismatch** — "generation formats" (`pdf`, `docx`, `xlsx`, `html`, `json`) conflated with "delivery formats" (`pdf`, `excel`, `both`).
- **Inconsistent naming** — `excel` vs `xlsx` used interchangeably for the same concept.
- **Duplication of validation logic** — at least 4 independent `z.enum(...)` declarations for overlapping format sets.

---

## 2. Inventory of All Format Definitions

### 2.1 Canonical Definition Sites (Sources of Truth)

| #   | Location                                        | Definition                                   | Values                                    | Purpose                          |
| --- | ----------------------------------------------- | -------------------------------------------- | ----------------------------------------- | -------------------------------- |
| A   | `packages/types/src/reports.ts:110-111`         | `REPORT_FORMATS` const + `ReportFormat` type | `["pdf", "docx", "xlsx", "html", "json"]` | Report generator output formats  |
| B   | `packages/report-generator/src/types.ts:1-2`    | `REPORT_FORMATS` const + `ReportFormat` type | `["pdf", "docx", "xlsx", "html", "json"]` | Duplicate of A (same values)     |
| C   | `packages/types/src/insight.ts:64-65`           | `insightDeliverySchema` (zod)                | `z.enum(["pdf", "excel", "both"])`        | Insight delivery format          |
| D   | `packages/types/src/insight-templates.ts:27,70` | delivery format in template schemas (zod)    | `z.enum(["pdf", "excel", "both"])`        | Insight template delivery format |
| E   | `apps/frontend/src/lib/download/types.ts:2`     | `DownloadFormat` type                        | `"pdf" \| "excel"`                        | Frontend download UI formats     |
| F   | `packages/types/src/reports.ts:81`              | `reportListInputSchema.format` (zod)         | `z.enum(["pdf", "excel", "all"])`         | Report list filter formats       |

### 2.2 Derived / Re-exported Definitions

| Location                                       | Source                                              | Notes                                                                      |
| ---------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| `packages/types/src/queue-job-types.ts:2-5`    | Re-exports from `./reports` (A)                     | Re-exports `REPORT_FORMATS` and `ReportFormat` from reports.ts             |
| `packages/report-generator/src/index.ts:81-87` | Re-exports from `./types` (B)                       | Re-exports `REPORT_FORMATS` and `ReportFormat` from report-generator types |
| `apps/api/src/services/report-bullmq.ts:1,72`  | Imports from `@agenticverdict/report-generator` (B) | Uses `ReportFormat` for job data                                           |
| `apps/worker/src/services/email.ts:5,18`       | Imports from `@agenticverdict/report-generator` (B) | Uses `ReportFormat` in email params                                        |
| `apps/worker/src/queues/report-queues.ts:86`   | Imports from `@agenticverdict/report-generator` (B) | Uses `ReportFormat` for generation                                         |

### 2.3 Hardcoded / Inline Definitions (No Central Reference)

| Location                                                                  | Line(s)                                          | Values                                          | Context                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------- |
| `apps/api/src/trpc/routers/reports.ts`                                    | 204, 345, 999                                    | `z.enum(["pdf", "excel"])`                      | tRPC content endpoints (read-only viewer formats) |
| `apps/api/src/routes/v1/reports.ts`                                       | 571                                              | `enum: ["pdf", "docx", "xlsx"]`                 | REST API delivery endpoint OpenAPI schema         |
| `apps/api/src/trpc/routers/insight-templates.ts`                          | 89, 133                                          | `"pdf" \| "excel" \| "both"`                    | Inline TypeScript type casts                      |
| `apps/api/src/services/insight-templates.service.ts`                      | 110                                              | `["pdf", "excel", "both"] as const`             | Local validation constant                         |
| `apps/frontend/src/features/reports/api/report-api.ts`                    | 13, 45, 99                                       | `"pdf" \| "excel" \| "all"`, `"pdf" \| "excel"` | Inline TypeScript types for hooks                 |
| `apps/frontend/src/features/insights/pages/InsightEditPage.tsx`           | 56                                               | `["pdf", "excel", "both"]`                      | `FORMAT_OPTIONS` Set for UI                       |
| `apps/frontend/src/features/insights/utils/option-mapper.ts`              | 34-36                                            | `["pdf", "excel", "both"]`                      | `DEFAULT_FORMAT_OPTIONS` for wizard               |
| `apps/frontend/src/features/reports/pages/ReportListPage.tsx`             | 156-157, 264                                     | `"pdf"`, `"excel"`, `"all"`                     | UI filter dropdown values + cast                  |
| `apps/frontend/src/lib/download/helpers.ts`                               | 36                                               | `"pdf"`, `"excel"`                              | Format detection string comparison                |
| `apps/worker/src/queues/report-queues.ts`                                 | 406, 964-966, 978, 1045                          | `"pdf"`, `"xlsx"`, `"both"`                     | Default format + "both" expansion logic           |
| `apps/worker/src/queues/report-queues.test.ts`                            | 158, 166, 193, 217, 229                          | `"pdf"`                                         | Test fixtures                                     |
| `apps/worker/src/queues/report-delivery-schedule.test.ts`                 | 28, 34, 46, 123, 135, 171, 188, 207, 215         | `"pdf"`                                         | Test fixtures                                     |
| `apps/worker/src/services/email.test.ts`                                  | 41, 74, 114, 144                                 | `"pdf"`                                         | Test fixtures                                     |
| `apps/worker/src/services/webhook-delivery.ts`                            | 73                                               | `"pdf"`                                         | Hardcoded default                                 |
| `apps/worker/src/queues/production-flow-scenarios-extended.ts`            | 359, 386, 396                                    | `"pdf"`                                         | Scenario fixtures                                 |
| `apps/frontend/src/features/reports/pages/SharedReportPage.tsx`           | 43, 142                                          | `"pdf"`                                         | Hardcoded viewer format                           |
| `apps/frontend/src/features/reports/pages/ReportViewerPage.tsx`           | 59, 194                                          | `"pdf"`                                         | Hardcoded viewer format                           |
| `apps/frontend/src/features/reports/ui/ReportViewer.tsx`                  | 16, 34, 81                                       | `string` prop, `"pdf"`, `"xlsx"`                | `reportFormat: string` (untyped!)                 |
| `apps/frontend/src/features/insights/pages/InsightCreateWizard.tsx`       | 98                                               | `"pdf"`                                         | Default format                                    |
| `apps/frontend/src/features/insights/tests/wizard-validation.test.ts`     | 271                                              | `["pdf", "excel", "both"]`                      | Test format array                                 |
| `apps/frontend/src/features/insights/tests/insight-api.mutation.test.tsx` | 88, 104                                          | `"pdf"`                                         | Test fixtures                                     |
| `apps/frontend/src/features/reports/api/report-api.test.tsx`              | 108, 123, 183, 217, 230, 234, 240, 247, 253, 394 | `"pdf"`, `"excel"`                              | Test fixtures                                     |
| `apps/frontend/src/lib/download/service.test.ts`                          | 19, 47, 53, 94, 95                               | `"pdf"`                                         | Mock and fixtures                                 |
| `apps/frontend/src/lib/download/helpers.test.ts`                          | 82-88, 103                                       | `"pdf"`, `"excel"`, `"invalid"`                 | Test cases                                        |
| `packages/database/src/schema/core/insights.ts`                           | 31                                               | `'{"format":"pdf"}'::jsonb`                     | DB default value                                  |
| `packages/database/src/schema/insight-templates.ts`                       | 68                                               | `format: "pdf"`                                 | Seed data                                         |
| `packages/database/src/seeds/templates.seed.ts`                           | 121                                              | `format: "pdf"`                                 | Seed data                                         |
| `packages/database/src/factories/insight-template-factory.ts`             | 37, 54, 69, 85                                   | `"pdf"`, `"excel"`                              | Factory defaults                                  |
| `packages/database/src/factories/insight-factory.ts`                      | 29, 35, 41, 47, 53, 73                           | `"pdf"`, `"excel"`                              | Factory defaults                                  |
| `packages/types/src/reports.ts`                                           | 124                                              | `z.enum(["pdf", "docx", "xlsx"])`               | `reportDeliveryBodySchema`                        |
| `packages/config/src/runtime-policy.ts`                                   | 18, 30, 160, 184, 204-205                        | `"reportFormats"`                               | Feature flag key (not a format value)             |
| `apps/api/src/api.contract.test.ts`                                       | 500                                              | `"pdf"`                                         | Test fixture                                      |
| `apps/api/src/middleware/tenant-isolation-matrix.test.ts`                 | 171                                              | `"pdf"`                                         | Test fixture                                      |
| `apps/frontend/e2e/reports-critical-paths.spec.ts`                        | 81                                               | `"pdf"`                                         | E2E test                                          |
| `apps/frontend/e2e/insights-reports-accessibility.spec.ts`                | 301                                              | `"pdf"`                                         | E2E test                                          |
| `packages/report-generator/src/format-registry.test.ts`                   | 20, 62, 78                                       | `"pdf"`                                         | Test fixture                                      |
| `packages/report-generator/src/base-report-generator.test.ts`             | 24, 43                                           | `"pdf"`                                         | Test fixture                                      |

---

## 3. Identified Inconsistencies and Risks

### 3.1 CRITICAL: Three Incompatible Enum Variants

| Variant                       | Values                                | Used By                                       | Semantic Meaning                                             |
| ----------------------------- | ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| **V1: Generation formats**    | `pdf`, `docx`, `xlsx`, `html`, `json` | `report-generator`, queue jobs, email service | Actual file formats the generator can produce                |
| **V2: Delivery formats**      | `pdf`, `excel`, `both`                | Insight delivery, templates, frontend wizard  | User-facing delivery preference (includes "both" meta-value) |
| **V3: Viewer formats**        | `pdf`, `excel`                        | tRPC content endpoints, frontend API hooks    | Formats the viewer can render                                |
| **V4: List filter formats**   | `pdf`, `excel`, `all`                 | Report list input schema                      | Filtering with "all" meta-value                              |
| **V5: REST delivery formats** | `pdf`, `docx`, `xlsx`                 | REST API `/reports/:id/deliver`               | Subset of V1 (no html, no json)                              |

### 3.2 CRITICAL: `excel` vs `xlsx` Naming Collision

- **`excel`** is used in: insight delivery schemas, frontend types, tRPC routers, UI components
- **`xlsx`** is used in: report generator (`REPORT_FORMATS`), worker queue logic (`report-queues.ts:966`)
- The worker at `report-queues.ts:966` maps `"both"` → `["pdf", "xlsx"]`, but the insight delivery schema only knows `"excel"`
- **Risk:** A user selecting "excel" in the insight wizard could produce a type mismatch when the worker expects "xlsx"

### 3.3 HIGH: Untyped `reportFormat` Prop in ReportViewer

- `apps/frontend/src/features/reports/ui/ReportViewer.tsx:16` declares `reportFormat: string` — completely untyped
- Accepts any string value at runtime with no validation
- **Risk:** Silent failures when an unexpected format string is passed

### 3.4 HIGH: Duplicate `REPORT_FORMATS` Definitions

- `packages/types/src/reports.ts:110` and `packages/report-generator/src/types.ts:1` define identical `REPORT_FORMATS` arrays
- They are independent copies — changes to one will not propagate to the other
- **Risk:** Divergence over time causing runtime type mismatches

### 3.5 MEDIUM: Inline Type Casts Bypassing Validation

- `apps/api/src/trpc/routers/insight-templates.ts:133` casts `result.delivery.format as "pdf" | "excel" | "both"`
- `apps/frontend/src/features/reports/pages/ReportListPage.tsx:264` casts `filters.format as "pdf" | "excel"`
- `apps/frontend/src/features/reports/pages/ReportViewerPage.tsx:59` casts `selectedVersion as "pdf" | "excel"`
- **Risk:** Casts hide type mismatches that would be caught by proper enum usage

### 3.6 MEDIUM: "both" Meta-Value Not Represented in Type System

- `"both"` is a valid user-facing delivery option but is not a real file format
- It is handled ad-hoc in `report-queues.ts:966`: `requestedFormat === "both" ? ["pdf", "xlsx"] : [...]`
- No centralized type distinguishes between "single format" and "multi-format" delivery modes
- **Risk:** New code paths may not handle "both" correctly

### 3.7 MEDIUM: "all" Meta-Value in List Filter

- `reportListInputSchema` at `packages/types/src/reports.ts:81` uses `z.enum(["pdf", "excel", "all"])`
- "all" is a filter sentinel, not a format — conflated with actual format values
- **Risk:** Confusion between filter semantics and format semantics

### 3.8 LOW: Hardcoded Defaults Scattered Across Codebase

- At least **15+ locations** hardcode `"pdf"` as a default value
- While reasonable as a default, the lack of a shared `DEFAULT_REPORT_FORMAT` constant means defaults cannot be changed centrally

---

## 4. Recommended Centralized Type Definition

### 4.1 Proposed Type Architecture

Consolidate into `packages/types/src/reports.ts` as the single source of truth:

```typescript
// ─── Core generation formats (what the generator can produce) ───
export const REPORT_FORMATS = ["pdf", "docx", "xlsx", "html", "json"] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

// ─── User-facing delivery format (what the user requests) ───
export const DELIVERY_FORMATS = ["pdf", "excel", "both"] as const;
export type DeliveryFormat = (typeof DELIVERY_FORMATS)[number];

// ─── Viewer-compatible formats (what the frontend can render) ───
export const VIEWER_FORMATS = ["pdf", "excel"] as const;
export type ViewerFormat = (typeof VIEWER_FORMATS)[number];

// ─── List filter formats (includes "all" sentinel) ───
export const REPORT_LIST_FILTER_FORMATS = ["pdf", "excel", "all"] as const;
export type ReportListFilterFormat = (typeof REPORT_LIST_FILTER_FORMATS)[number];

// ─── Mapping: user-facing "excel" → generator "xlsx" ───
export const DELIVERY_TO_GENERATION_FORMAT: Record<
  Exclude<DeliveryFormat, "both">,
  ReportFormat
> = {
  pdf: "pdf",
  excel: "xlsx",
} as const;

// ─── Default format constant ───
export const DEFAULT_DELIVERY_FORMAT: DeliveryFormat = "pdf";
export const DEFAULT_REPORT_FORMAT: ReportFormat = "pdf";
```

### 4.2 Zod Schema Updates

```typescript
// Replace all inline z.enum([...]) with references to the constants
export const insightDeliverySchema = z.object({
  format: z.enum(DELIVERY_FORMATS),
  // ...
});

export const reportListInputSchema = z.object({
  format: z.enum(REPORT_LIST_FILTER_FORMATS).optional().default("all"),
  // ...
});

export const reportDeliveryBodySchema = z.object({
  format: z.enum(REPORT_FORMATS), // REST API uses actual generation formats
  // ...
});
```

---

## 5. Step-by-Step Migration Plan

### Phase 1: Define Central Types (No Breaking Changes)

**Step 1.1** — Add new type definitions to `packages/types/src/reports.ts`

- Add `DELIVERY_FORMATS`, `DeliveryFormat`, `VIEWER_FORMATS`, `ViewerFormat`, `REPORT_LIST_FILTER_FORMATS`, `ReportListFilterFormat`
- Add `DELIVERY_TO_GENERATION_FORMAT` mapping
- Add `DEFAULT_DELIVERY_FORMAT` and `DEFAULT_REPORT_FORMAT` constants

**Step 1.2** — Export new types from `packages/types/src/index.ts`

- Add exports for all new types and constants

**Step 1.3** — Remove duplicate from `packages/report-generator/src/types.ts`

- Replace local `REPORT_FORMATS` definition with `import { REPORT_FORMATS, type ReportFormat } from "@agenticverdict/types"`
- Update `packages/report-generator/src/index.ts` re-exports accordingly

**Dependency:** None (additive only)

### Phase 2: Update Zod Schemas in `@agenticverdict/types`

**Step 2.1** — Update `packages/types/src/insight.ts:65`

- Change `z.enum(["pdf", "excel", "both"])` → `z.enum(DELIVERY_FORMATS)`

**Step 2.2** — Update `packages/types/src/insight-templates.ts:27,70`

- Change `z.enum(["pdf", "excel", "both"])` → `z.enum(DELIVERY_FORMATS)`

**Step 2.3** — Update `packages/types/src/reports.ts:81`

- Change `z.enum(["pdf", "excel", "all"])` → `z.enum(REPORT_LIST_FILTER_FORMATS)`

**Step 2.4** — Update `packages/types/src/reports.ts:124`

- Change `z.enum(["pdf", "docx", "xlsx"])` → `z.enum(REPORT_FORMATS)`

**Dependency:** Phase 1 complete

### Phase 3: Update API Layer

**Step 3.1** — Update `apps/api/src/trpc/routers/reports.ts:204,345,999`

- Replace `z.enum(["pdf", "excel"])` with `z.enum(VIEWER_FORMATS)` (imported from `@agenticverdict/types`)

**Step 3.2** — Update `apps/api/src/trpc/routers/insight-templates.ts:89,133`

- Replace inline `"pdf" | "excel" | "both"` type casts with `DeliveryFormat` type

**Step 3.3** — Update `apps/api/src/services/insight-templates.service.ts:110`

- Replace local `const validFormats = ["pdf", "excel", "both"] as const` with imported `DELIVERY_FORMATS`

**Step 3.4** — Update `apps/api/src/routes/v1/reports.ts:571`

- Replace inline `enum: ["pdf", "docx", "xlsx"]` with reference to `REPORT_FORMATS`

**Dependency:** Phase 2 complete

### Phase 4: Update Worker Layer

**Step 4.1** — Update `apps/worker/src/queues/report-queues.ts:964-966`

- Replace `"both" ? ["pdf", "xlsx"]` logic with `DELIVERY_TO_GENERATION_FORMAT` mapping
- Use `DEFAULT_DELIVERY_FORMAT` instead of hardcoded `"pdf"` at line 406, 964

**Step 4.2** — Update `apps/worker/src/services/email.ts`

- Already imports `ReportFormat` from `@agenticverdict/report-generator` — no change needed after Phase 1.3

**Step 4.3** — Update `apps/worker/src/services/webhook-delivery.ts:73`

- Replace hardcoded `format: "pdf"` with `format: DEFAULT_DELIVERY_FORMAT`

**Dependency:** Phase 1 complete

### Phase 5: Update Frontend Layer

**Step 5.1** — Update `apps/frontend/src/features/reports/api/report-api.ts:13,45,99`

- Replace inline `"pdf" | "excel" | "all"` and `"pdf" | "excel"` with imported `ReportListFilterFormat` and `ViewerFormat`

**Step 5.2** — Update `apps/frontend/src/features/reports/ui/ReportViewer.tsx:16`

- Change `reportFormat: string` → `reportFormat: ViewerFormat`

**Step 5.3** — Update `apps/frontend/src/lib/download/types.ts:2`

- Replace `type DownloadFormat = "pdf" | "excel"` with `import type { ViewerFormat } from "@agenticverdict/types"` and `export type DownloadFormat = ViewerFormat`

**Step 5.4** — Update `apps/frontend/src/lib/download/helpers.ts:36`

- Use imported constants for format comparison

**Step 5.5** — Update `apps/frontend/src/features/insights/pages/InsightEditPage.tsx:56`

- Replace `FORMAT_OPTIONS` Set with reference to `DELIVERY_FORMATS`

**Step 5.6** — Update `apps/frontend/src/features/insights/utils/option-mapper.ts:34-36`

- Replace hardcoded `DEFAULT_FORMAT_OPTIONS` values with reference to `DELIVERY_FORMATS`

**Step 5.7** — Update `apps/frontend/src/features/reports/pages/ReportListPage.tsx:156-157,264`

- Replace hardcoded format values and type casts with imported types

**Step 5.8** — Update `apps/frontend/src/features/reports/pages/SharedReportPage.tsx:43,142` and `ReportViewerPage.tsx:59,194`

- Replace hardcoded `"pdf"` with `DEFAULT_DELIVERY_FORMAT` or typed constant

**Step 5.9** — Update `apps/frontend/src/features/insights/pages/InsightCreateWizard.tsx:98`

- Replace hardcoded `"pdf"` with `DEFAULT_DELIVERY_FORMAT`

**Dependency:** Phase 2 complete

### Phase 6: Update Database Layer

**Step 6.1** — Update `packages/database/src/schema/core/insights.ts:31`

- The SQL default `'{"format":"pdf"}'::jsonb` is fine as-is (matches `DEFAULT_DELIVERY_FORMAT`)
- Add a comment referencing the constant for maintainability

**Step 6.2** — Update `packages/database/src/factories/insight-factory.ts` and `insight-template-factory.ts`

- Replace hardcoded `"pdf"` / `"excel"` with imported constants

**Step 6.3** — Update `packages/database/src/seeds/templates.seed.ts:121` and `schema/insight-templates.ts:68`

- Replace hardcoded `"pdf"` with imported constant

**Dependency:** Phase 1 complete

### Phase 7: Update Tests

**Step 7.1** — Update all test files to use imported constants instead of hardcoded strings

- Files affected: `report-queues.test.ts`, `report-delivery-schedule.test.ts`, `email.test.ts`, `wizard-validation.test.ts`, `insight-api.mutation.test.tsx`, `report-api.test.tsx`, `service.test.ts`, `helpers.test.ts`, `api.contract.test.ts`, `tenant-isolation-matrix.test.ts`, E2E specs, and report-generator tests

**Step 7.2** — Add a dedicated test for `DELIVERY_TO_GENERATION_FORMAT` mapping correctness

**Dependency:** Phases 1-6 complete

### Phase 8: Cleanup and Verification

**Step 8.1** — Run `pnpm run typecheck` — verify zero type errors
**Step 8.2** — Run `pnpm run lint` — verify zero lint errors
**Step 8.3** — Run `pnpm run test:unit` — verify all tests pass
**Step 8.4** — Search for any remaining hardcoded format strings and migrate them
**Step 8.5** — Remove the `REPORT_FORMATS` duplicate from `packages/report-generator/src/types.ts` if not already done in Phase 1.3

**Dependency:** All previous phases complete

---

## 6. Backward Compatibility Considerations

| Concern                                              | Mitigation                                                                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing DB records with `{"format":"pdf"}`          | No change — `"pdf"` remains valid in all variants                                                                                                                                              |
| Existing DB records with `{"format":"excel"}`        | No change — `"excel"` remains valid in `DeliveryFormat`                                                                                                                                        |
| API consumers sending `"pdf"`, `"docx"`, `"xlsx"`    | No change — `REPORT_FORMATS` unchanged                                                                                                                                                         |
| API consumers sending `"excel"` to delivery endpoint | The REST endpoint at `/reports/:id/deliver` currently accepts `["pdf", "docx", "xlsx"]` — if `"excel"` is sent by clients, a translation layer is needed (see `DELIVERY_TO_GENERATION_FORMAT`) |
| Frontend hooks using `"pdf" \| "excel"` strings      | No change — `ViewerFormat` is identical to the current union                                                                                                                                   |
| Queue jobs with `outputFormat: "both"`               | Handled by `DELIVERY_TO_GENERATION_FORMAT` expansion logic                                                                                                                                     |

---

## 7. Risk Assessment

| Risk                                            | Likelihood | Impact | Mitigation                                                               |
| ----------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------ |
| Type mismatch during migration (partial deploy) | Medium     | High   | Deploy Phase 1 (additive) before any removals                            |
| "excel" vs "xlsx" confusion in production       | Low        | High   | Add runtime validation at queue boundary                                 |
| Breaking external API consumers                 | Low        | Medium | REST API format enum unchanged; document `DELIVERY_TO_GENERATION_FORMAT` |
| Test failures from constant references          | Low        | Low    | Update tests in Phase 7 with full regression                             |

---

## 8. File Count Summary

| Category                   | Files Affected |
| -------------------------- | -------------- |
| Type definitions (source)  | 2              |
| Type definitions (exports) | 1              |
| API layer                  | 4              |
| Worker layer               | 3              |
| Frontend layer             | 9              |
| Database layer             | 4              |
| Test files                 | 12+            |
| **Total**                  | **35+**        |
