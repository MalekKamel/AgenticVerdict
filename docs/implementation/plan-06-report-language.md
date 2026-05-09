# Report Language Implementation Plan

**Created:** 2026-05-11
**Status:** Draft
**Scope:** LLM prompt language + report static strings localization

---

## 1. Current State Analysis

### 1.1 What Exists Today

| Layer                     | Current State                                                                                  | Gap                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Tenant DB**             | `tenants.language` column (varchar(2), default "en")                                           | Not propagated to report generation                             |
| **Tenant Config**         | `localization.language` enum: `["ar", "en", "fr", "es", "zh"]`                                 | Available but unused in reports/LLM                             |
| **i18n Package**          | 5 locale JSON files (en, ar, es, fr, zh), formatters, RTL detection, font stacks               | UI-only; not wired to report generator                          |
| **Report Context**        | `ReportGenerationContext.locale` (string)                                                      | Passed through but only used for font selection + `<html lang>` |
| **LLM Prompts**           | `buildTenantPromptContext` emits `Locale: language=en, region=US...` as context text           | LLM is never told what language to respond in                   |
| **Agent System Messages** | Hardcoded English in `agent-kinds.ts` ("You are a cross-platform analysis agent...")           | No language parameter                                           |
| **Report Templates**      | All section headings hardcoded in English ("Key findings", "Summary", "Recommendations", etc.) | ~40+ hardcoded English strings across 6 files                   |
| **XLSX Generator**        | Hardcoded English sheet names and headers ("Summary", "AI Insights", "Title", "Type", etc.)    | ~15 hardcoded strings                                           |
| **Job Data**              | `ReportGenerationJobData.locale` and `InsightExecutionJobData.locale`                          | Defaults to "en", never derived from tenant config              |

### 1.2 Hardcoded English Strings Inventory

**Report Templates (PDF/HTML):**

- `cover-and-header.ts`: "Marketing intelligence"
- `table-of-contents.ts`: "Contents"
- `executive-summary-template.ts`: "Verdict", "Data quality", "Summary", "Key findings", "Finding N", "Recommendations", "Insights", "Statistics", "Key metrics"
- `detailed-analysis-template.ts`: "Verdict", "Insights", "Metrics", "Charts", "Analysis body", "Visuals"
- `technical-appendix-template.ts`: "Reference tables", "Reference metrics"
- `phase2-html-blocks.ts`: "Phase 2 integration", "Verdict score", "Verdict overview", "Type", "Sentiment", "Model confidence", "Recommendations", "Insight context", "Statistical summaries", "Measure", "Value", "Note", "Data quality indicators"

**XLSX Generator:**

- `xlsx-format-generator.ts`: "Report", "Report Summary", "Insight", "Date Range", "Tenant ID", "Report ID", "Template", "Key Metrics", "Tenant Info", "AI Insights", "Title", "Type", "Confidence", "Description", "Timestamp", "No metrics data available", "No table rows found in rendered template"

**LLM Agent System Messages:**

- `agent-kinds.ts`: "You are a cross-platform analysis agent analyzing marketing data for {tenantName}.", "You are an insights generation agent creating actionable insights for {tenantName}.", "You are a verdict generation agent evaluating performance for {tenantName}."

### 1.3 Data Flow (Current)

```
Tenant DB (language="en")
  → TenantConfig (localization.language="en")
    → Job Data (locale="en" hardcoded default)
      → ReportGenerationContext.locale="en"
        → document-shell.ts: font stack + <html lang>
        → LLM prompt: locale string in context block (informational only)
```

---

## 2. Design Principles

1. **Single source of truth**: `TenantConfig.localization.language` drives all language decisions
2. **Fallback chain**: Requested locale → "en" → first available
3. **LLM responds in target language**: System prompt must explicitly instruct output language
4. **Static strings via i18n keys**: All hardcoded English strings must be replaced with i18n lookups
5. **No runtime file I/O**: Report generator must not load JSON files; strings are injected at call site
6. **Backward compatible**: Default behavior remains English when locale is unspecified

---

## 3. Implementation Plan

### Phase 1: LLM Output Language (Highest Impact)

**Goal:** LLM generates insights, verdicts, and analysis in the tenant's configured language.

#### Task 1.1: Add language instruction to tenant prompt context

**File:** `packages/agent-runtime/src/prompts/tenant-injection.ts`

- In `buildTenantPromptContextSections`, enhance the `localization` section to include an explicit output language directive:

```
Locale: language=en, region=US, timezone=UTC, currency=USD
IMPORTANT: All analysis, insights, recommendations, and JSON field values must be written in English.
```

- The language name should be resolved from a mapping (e.g., `en` → "English", `ar` → "العربية", `fr` → "Français", `es` → "Español", `zh` → "中文")

#### Task 1.2: Add language parameter to agent system messages

**File:** `packages/agent-runtime/src/agent-kinds.ts`

- Extend `CreatePipelineAgentOptions` with `outputLanguage: string`
- Append language instruction to system message:
  ```
  You are an insights generation agent creating actionable insights for {tenantName}.
  Respond entirely in {languageName}. All analysis text, titles, descriptions, and recommendations must be in {languageName}.
  ```
- Derive `outputLanguage` from `tenant.config.localization.language` at call site

#### Task 1.3: Propagate language through insight generation pipeline

**File:** `apps/worker/src/queues/report-queues.ts` (`triggerAIInsightsGeneration`)

- Extract `tenant.config.localization.language` from tenant config
- Pass it through `specialization.factoryConfig` or as a new `outputLanguage` field
- Update `runAgentJob` call chain to carry the language parameter

**Files to update:**

- `packages/agent-runtime/src/intelligence-pipeline.ts` — add `outputLanguage` to pipeline options
- `packages/agent-runtime/src/agent-context-integration.ts` — propagate to agent factory

#### Task 1.4: Update JSON output schema instructions

The LLM is instructed to return structured JSON (insights, verdicts). The language instruction must clarify:

- Narrative fields (`title`, `description`, `executiveSummary`, `bodyText`, etc.) must be in the target language
- Structural fields (`id`, `type`, `score`, `confidence`, metric keys) remain in English (code-safe)

---

### Phase 2: Report Static Strings (PDF/HTML Templates)

**Goal:** All section headings, labels, and UI text in generated reports use the tenant's locale.

#### Task 2.1: Create report i18n string module

**New file:** `packages/report-generator/src/i18n/report-strings.ts`

```typescript
export interface ReportStrings {
  // Cover
  marketingIntelligence: string;
  // Table of contents
  contents: string;
  // Sections
  verdict: string;
  dataQuality: string;
  summary: string;
  keyFindings: string;
  finding: (n: number) => string;
  recommendations: string;
  insights: string;
  statistics: string;
  keyMetrics: string;
  metrics: string;
  charts: string;
  analysisBody: string;
  visuals: string;
  referenceTables: string;
  referenceMetrics: string;
  // Phase 2 blocks
  phase2Integration: string;
  verdictScore: string;
  verdictOverview: string;
  type: string;
  sentiment: string;
  modelConfidence: string;
  insightContext: string;
  statisticalSummaries: string;
  measure: string;
  value: string;
  note: string;
  dataQualityIndicators: string;
  // Fallbacks
  noSummaryText: string;
  noChartData: string;
  noMetricsText: string;
  noSectionsText: string;
  noAppendixText: string;
  noInsightsText: string;
}

export function getReportStrings(locale: string): ReportStrings;
```

- Support locales: `en`, `ar`, `fr`, `es`, `zh`
- Fall back to `en` for unknown locales
- Import translations from `packages/i18n/src/locales/*.json` where keys overlap, or define report-specific keys

#### Task 2.2: Add report strings to i18n locale files

**Files:** `packages/i18n/src/locales/{en,ar,fr,es,zh}.json`

Add new keys under `reports.*` namespace:

```json
{
  "reports.cover.marketingIntelligence": "Marketing intelligence",
  "reports.toc.contents": "Contents",
  "reports.sections.verdict": "Verdict",
  "reports.sections.dataQuality": "Data quality",
  "reports.sections.summary": "Summary",
  "reports.sections.keyFindings": "Key findings",
  "reports.sections.finding": "Finding {n}",
  "reports.sections.recommendations": "Recommendations",
  "reports.sections.insights": "Insights",
  "reports.sections.statistics": "Statistics",
  "reports.sections.keyMetrics": "Key metrics",
  "reports.sections.metrics": "Metrics",
  "reports.sections.charts": "Charts",
  "reports.sections.analysisBody": "Analysis body",
  "reports.sections.visuals": "Visuals",
  "reports.sections.referenceTables": "Reference tables",
  "reports.sections.referenceMetrics": "Reference metrics",
  "reports.blocks.phase2Integration": "Phase 2 integration",
  "reports.blocks.verdictScore": "Verdict score",
  "reports.blocks.verdictOverview": "Verdict overview",
  "reports.blocks.type": "Type",
  "reports.blocks.sentiment": "Sentiment",
  "reports.blocks.modelConfidence": "Model confidence",
  "reports.blocks.insightContext": "Insight context",
  "reports.blocks.statisticalSummaries": "Statistical summaries",
  "reports.blocks.measure": "Measure",
  "reports.blocks.value": "Value",
  "reports.blocks.note": "Note",
  "reports.blocks.dataQualityIndicators": "Data quality indicators",
  "reports.fallback.noSummaryText": "No executive summary text provided.",
  "reports.fallback.noChartData": "Chart placeholder — supply charts[0] in the view model.",
  "reports.fallback.noMetricsText": "No metrics data available",
  "reports.fallback.noSectionsText": "Add narrativeSections to populate this template.",
  "reports.fallback.noAppendixText": "No appendix sections provided.",
  "reports.fallback.noInsightsText": "No chart specifications were included in this payload."
}
```

- Translate all keys for `ar`, `fr`, `es`, `zh`
- Run `pnpm run lint` to verify translation parity

#### Task 2.3: Wire strings into report templates

**Files to update:**

- `packages/report-generator/src/templates/built-in/executive-summary-template.ts`
- `packages/report-generator/src/templates/built-in/detailed-analysis-template.ts`
- `packages/report-generator/src/templates/built-in/technical-appendix-template.ts`
- `packages/report-generator/src/templates/cover-and-header.ts`
- `packages/report-generator/src/templates/table-of-contents.ts`
- `packages/report-generator/src/integration/phase2-html-blocks.ts`

Pattern for each file:

```typescript
// Before:
<h2 style="font-size:18px;">Key findings</h2>

// After:
import { getReportStrings } from "../../i18n/report-strings";
const t = getReportStrings(context.locale);
<h2 style="font-size:18px;">${escapeHtml(t.keyFindings)}</h2>
```

- Pass `context.locale` from template render methods
- For `phase2-html-blocks.ts`, add `locale: string` parameter to each render function
- For `cover-and-header.ts`, add `locale: string` to `CoverHeaderInput`

#### Task 2.4: Update phase2-html-blocks function signatures

All functions in `phase2-html-blocks.ts` need a `locale` parameter:

```typescript
export function renderPhase2IntegrationBanner(vm: ReportTemplateViewModel, locale: string): string;
export function renderVerdictScorecardBlock(vm: ReportTemplateViewModel, locale: string): string;
export function renderRecommendationEngineBlock(
  vm: ReportTemplateViewModel,
  locale: string,
): string;
export function renderInsightContextBlock(vm: ReportTemplateViewModel, locale: string): string;
export function renderStatisticalSummariesBlock(
  vm: ReportTemplateViewModel,
  locale: string,
): string;
export function renderDataQualityIndicatorsBlock(
  vm: ReportTemplateViewModel,
  locale: string,
): string;
```

Update all call sites in the three built-in templates.

---

### Phase 3: XLSX Localization

**Goal:** Excel workbook sheet names and headers are localized.

#### Task 3.1: Extend report strings with XLSX-specific keys

**File:** `packages/report-generator/src/i18n/report-strings.ts`

Add to `ReportStrings` interface:

```typescript
// XLSX
xlsxReport: string;
xlsxReportSummary: string;
xlsxInsight: string;
xlsxDateRange: string;
xlsxTenantId: string;
xlsxReportId: string;
xlsxTemplate: string;
xlsxKeyMetrics: string;
xlsxTenantInfo: string;
xlsxAiInsights: string;
xlsxTitle: string;
xlsxType: string;
xlsxConfidence: string;
xlsxDescription: string;
xlsxTimestamp: string;
xlsxNoData: string;
xlsxNoTableRows: string;
```

#### Task 3.2: Localize XLSX generator

**File:** `packages/report-generator/src/xlsx-format-generator.ts`

- Accept locale through `FormatGeneratorInput.context.locale` (already available)
- Replace all hardcoded strings with `getReportStrings(locale)` calls
- Sheet names: "Summary" → localized, "AI Insights" → localized
- Headers: "Title", "Type", "Confidence", etc. → localized

---

### Phase 4: Locale Propagation End-to-End

**Goal:** Tenant language flows through the entire pipeline without hardcoded defaults.

#### Task 4.1: Derive locale from tenant config in job processors

**File:** `apps/worker/src/queues/report-queues.ts`

- `defaultReportGenerationProcessor`: derive `locale` from `data.locale ?? tenantConfig.localization.language ?? "en"`
- `defaultInsightExecutionProcessor`: same pattern
- `defaultReportDeliveryProcessor`: same pattern

#### Task 4.2: Update queue job type schemas

**File:** `packages/types/src/queue-job-types.ts`

- Ensure `locale` field is present on all relevant job data schemas
- Add validation: `locale: z.enum(["ar", "en", "fr", "es", "zh"]).optional()`

#### Task 4.3: Update schedule enqueue

**File:** `apps/worker/src/queues/report-schedule-enqueue.ts`

- Pass `locale` from tenant config when enqueuing jobs

#### Task 4.4: Update production flow scenarios

**Files:**

- `apps/worker/src/queues/production-flow-scenarios-extended.ts`
- `apps/worker/src/queues/workflow-trigger-production-flow.ts`

- Replace hardcoded `"en"` / `"ar"` with config-driven locale

---

### Phase 5: RTL Support in Reports

**Goal:** RTL languages (Arabic) render correctly in PDF/HTML reports.

#### Task 5.1: Verify RTL text direction propagation

**File:** `packages/report-generator/src/context-direction.ts`

- Ensure `resolveContextTextDirection` correctly derives RTL from locale
- Already uses `isRtlLocale` from i18n package — verify Arabic triggers `dir="rtl"`

#### Task 5.2: Add RTL-specific CSS adjustments

**Files:** All report templates

- For RTL locales, adjust:
  - `padding-left` → `padding-right` for lists
  - `text-align` defaults
  - Table column order (optional, phase 2+)
- Use `dir` attribute on `<html>` (already done in `document-shell.ts`)

#### Task 5.3: Verify Arabic font rendering

**File:** `packages/i18n/src/typography.ts`

- Confirm `reportBodyFontStack("ar")` returns Arabic-capable fonts
- Test PDF generation with Arabic text via Playwright

---

### Phase 6: Testing & Validation

#### Task 6.1: Unit tests for report strings

**New file:** `packages/report-generator/src/i18n/report-strings.test.ts`

- Test all 5 locales return non-empty strings
- Test fallback for unknown locale returns English
- Test plural functions (e.g., `finding(1)` → "Finding 1", `finding(3)` → "Finding 3")

#### Task 6.2: Unit tests for localized templates

- Update existing template tests to verify locale parameter
- Test Arabic template renders with `dir="rtl"`
- Test French/Spanish/Chinese templates render with correct strings

#### Task 6.3: Integration test for LLM language

- Mock LLM response to verify system prompt contains language instruction
- Test that `buildTenantPromptContext` includes language directive for each locale

#### Task 6.4: XLSX localization tests

- Update `xlsx-format-generator.test.ts` to verify localized sheet names and headers

#### Task 6.5: Translation parity check

- Run `pnpm run lint` in `packages/i18n` to verify all locales have matching keys
- Fix any missing translations

---

## 4. File Change Summary

| File                                                                              | Action                                    | Phase |
| --------------------------------------------------------------------------------- | ----------------------------------------- | ----- |
| `packages/agent-runtime/src/prompts/tenant-injection.ts`                          | Modify — add language directive           | 1     |
| `packages/agent-runtime/src/agent-kinds.ts`                                       | Modify — add outputLanguage param         | 1     |
| `packages/agent-runtime/src/intelligence-pipeline.ts`                             | Modify — propagate language               | 1     |
| `packages/agent-runtime/src/agent-context-integration.ts`                         | Modify — propagate language               | 1     |
| `apps/worker/src/queues/report-queues.ts`                                         | Modify — derive locale from tenant config | 1, 4  |
| `packages/report-generator/src/i18n/report-strings.ts`                            | **New** — report string registry          | 2     |
| `packages/i18n/src/locales/en.json`                                               | Modify — add reports.\* keys              | 2     |
| `packages/i18n/src/locales/ar.json`                                               | Modify — add reports.\* keys              | 2     |
| `packages/i18n/src/locales/fr.json`                                               | Modify — add reports.\* keys              | 2     |
| `packages/i18n/src/locales/es.json`                                               | Modify — add reports.\* keys              | 2     |
| `packages/i18n/src/locales/zh.json`                                               | Modify — add reports.\* keys              | 2     |
| `packages/report-generator/src/templates/built-in/executive-summary-template.ts`  | Modify — use report strings               | 2     |
| `packages/report-generator/src/templates/built-in/detailed-analysis-template.ts`  | Modify — use report strings               | 2     |
| `packages/report-generator/src/templates/built-in/technical-appendix-template.ts` | Modify — use report strings               | 2     |
| `packages/report-generator/src/templates/cover-and-header.ts`                     | Modify — add locale param                 | 2     |
| `packages/report-generator/src/templates/table-of-contents.ts`                    | Modify — add locale param                 | 2     |
| `packages/report-generator/src/integration/phase2-html-blocks.ts`                 | Modify — add locale param                 | 2     |
| `packages/report-generator/src/xlsx-format-generator.ts`                          | Modify — localize strings                 | 3     |
| `packages/types/src/queue-job-types.ts`                                           | Modify — validate locale enum             | 4     |
| `apps/worker/src/queues/report-schedule-enqueue.ts`                               | Modify — pass locale                      | 4     |
| `apps/worker/src/queues/production-flow-scenarios-extended.ts`                    | Modify — config-driven locale             | 4     |
| `apps/worker/src/queues/workflow-trigger-production-flow.ts`                      | Modify — config-driven locale             | 4     |
| `packages/report-generator/src/i18n/report-strings.test.ts`                       | **New** — unit tests                      | 6     |
| `packages/report-generator/src/xlsx-format-generator.test.ts`                     | Modify — test localization                | 6     |

---

## 5. Risks & Mitigations

| Risk                                             | Impact | Mitigation                                                                               |
| ------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------- |
| LLM ignores language instruction                 | High   | Include language directive in BOTH system message AND user task; test with each provider |
| Arabic RTL layout breaks in PDF                  | Medium | Test Playwright PDF rendering with Arabic text early; use `dir="rtl"` on root            |
| Translation parity drift                         | Low    | CI gate: `pnpm run lint` in i18n package enforces key parity                             |
| Breaking change to phase2-html-blocks API        | Medium | All call sites are internal (3 templates); update atomically                             |
| XLSX sheet name truncation for long translations | Low    | Excel max 31 chars; sanitize function already truncates                                  |

---

## 6. Execution Order

```
Phase 1 (LLM Language) → Phase 2 (Report Strings) → Phase 3 (XLSX) → Phase 4 (Propagation) → Phase 5 (RTL) → Phase 6 (Testing)
```

Phases 2 and 3 can be parallelized (different files, no dependencies).
Phase 4 depends on Phase 1 being complete.
Phase 5 depends on Phase 2 being complete.
Phase 6 runs throughout but finalizes after all phases.

---

## 7. Acceptance Criteria

1. **LLM Output:** When tenant language is `ar`, all LLM-generated insight titles, descriptions, and recommendations are in Arabic
2. **PDF/HTML Reports:** Section headings match the tenant's locale (verified for all 5 locales)
3. **XLSX Reports:** Sheet names and column headers are localized
4. **RTL Support:** Arabic reports render with `dir="rtl"` and correct text alignment
5. **Fallback:** Unknown or missing locale defaults to English without errors
6. **Tests:** All new code has unit tests; translation parity passes lint
7. **No Regressions:** Existing English reports render identically to current behavior
