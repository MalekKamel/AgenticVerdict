# Insights Feature — Static Data Elimination Audit & Implementation Plan

**Date:** 2026-05-10
**Scope:** `apps/frontend/src/features/insights/`
**Reference:** `docs/architecture/business/business-architecture.md`

---

## 1. Audit Inventory

### 1.1 Hardcoded Data Arrays (Must Be Dynamic)

| #   | File                                       | Line(s) | Static Value                                                                                       | Required Dynamic Source                                                                                                                                                        |
| --- | ------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `pages/InsightCreateWizard.tsx`            | 32–36   | `AVAILABLE_MODELS` — 3 hardcoded models (Claude 3.5 Sonnet, Claude 3 Opus, GPT-4o)                 | `trpc.ai.models` endpoint querying `ProviderFactory` registered providers + `SUPPORTED_MODELS` map (backend already has this at `apps/api/src/trpc/routers/insights.ts:53–57`) |
| 2   | `pages/InsightCreateWizard.tsx`            | 38–44   | `AVAILABLE_DOMAINS` — 5 hardcoded domains (Marketing, Sales, Finance, Operations, Analytics)       | `trpc.connector.domains` or derived from connector `domainTags` field; per business-architecture §2.3, domains are: Marketing, Finance, Analytics, SEO, Social, Local          |
| 3   | `pages/InsightEditPage.tsx`                | 34–38   | Same `AVAILABLE_MODELS` duplicate                                                                  | Same as #1                                                                                                                                                                     |
| 4   | `pages/InsightEditPage.tsx`                | 40–46   | Same `AVAILABLE_DOMAINS` duplicate                                                                 | Same as #2                                                                                                                                                                     |
| 5   | `pages/InsightListPage.tsx`                | 365–371 | Domain filter dropdown — 6 hardcoded values (Google Ads, Meta Ads, TikTok Ads, LinkedIn, Shopify)  | Should use the same domain source as #2; current values are platform names, not business domains                                                                               |
| 6   | `ui/wizard/steps/AISettingsStep.tsx`       | 81–87   | Detail level options hardcoded inline (Executive Summary, Standard Analysis, Comprehensive Report) | Accept as prop from parent; parent derives from schema `InsightAIConfigSchema.detailLevel` enum                                                                                |
| 7   | `ui/wizard/steps/ScheduleDeliveryStep.tsx` | 74–79   | Frequency options hardcoded inline (Daily, Weekly, Monthly, Quarterly)                             | Accept as prop from parent; parent derives from schema `InsightScheduleSchema.frequency` enum                                                                                  |
| 8   | `ui/wizard/steps/ScheduleDeliveryStep.tsx` | 119–123 | Format options hardcoded inline (PDF, Excel, Both PDF & Excel)                                     | Accept as prop from parent; parent derives from schema `InsightDeliverySchema.format` enum                                                                                     |

### 1.2 Hardcoded Default Values (Should Be Configurable or API-Driven)

| #   | File                            | Line(s) | Static Default                                                                                                             | Recommended Source                                                                                                |
| --- | ------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 9   | `pages/InsightCreateWizard.tsx` | 77–93   | Form defaults: model=`claude-3-5-sonnet`, quality=`50`, detailLevel=`standard`, frequency=`weekly`, time=`9`, format=`pdf` | Fetch tenant-level AI config defaults via `trpc.tenant.config` or `trpc.ai.defaults`; fallback to schema defaults |
| 10  | `pages/InsightEditPage.tsx`     | 132–148 | Same form defaults duplicated                                                                                              | Same as #9                                                                                                        |
| 11  | `pages/InsightDetailPage.tsx`   | 757     | Share link expiry hardcoded to 7 days (`Date.now() + 7 * 24 * 60 * 60 * 1000`)                                             | Should be configurable via tenant settings or API parameter                                                       |

### 1.3 Hardcoded UI Strings (Should Use i18n)

| #   | File                                          | Line(s)                       | Hardcoded String                                                                                  | i18n Key Suggestion                                                        |
| --- | --------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 12  | `pages/InsightDetailPage.tsx`                 | 513–516                       | Table headers: "Title", "Status", "Created", "Actions"                                            | `detail.reports.table.*`                                                   |
| 13  | `pages/InsightDetailPage.tsx`                 | 537, 545, 553                 | Button labels: "View", "Download", "Share"                                                        | `detail.reports.actions.*`                                                 |
| 14  | `pages/InsightDetailPage.tsx`                 | 745                           | Modal title: "Share Report"                                                                       | `detail.share.modalTitle`                                                  |
| 15  | `pages/InsightDetailPage.tsx`                 | 763                           | Button: "Generate Share Link"                                                                     | `detail.share.generateLink`                                                |
| 16  | `pages/InsightDetailPage.tsx`                 | 771–774                       | Notification: "Link copied" / "Share link copied to clipboard"                                    | `detail.share.linkCopied`                                                  |
| 17  | `ui/wizard/steps/BasicInfoStep.tsx`           | 26–27                         | Label: "Insight Name", placeholder text                                                           | `create.steps.basicInfo.nameLabel`, `...namePlaceholder`                   |
| 18  | `ui/wizard/steps/BasicInfoStep.tsx`           | 47–48                         | Label: "Domain", placeholder: "Select domain"                                                     | `create.steps.basicInfo.domainLabel`, `...domainPlaceholder`               |
| 19  | `ui/wizard/steps/BasicInfoStep.tsx`           | 57–58                         | Label: "Description", placeholder text                                                            | `create.steps.basicInfo.descriptionLabel`, `...descriptionPlaceholder`     |
| 20  | `ui/wizard/steps/ConnectorSelectionStep.tsx`  | 87                            | Text: "Select Connectors"                                                                         | `create.steps.connectors.title`                                            |
| 21  | `ui/wizard/steps/ConnectorSelectionStep.tsx`  | 89                            | Button: "Manage Connectors"                                                                       | `create.steps.connectors.manageConnectors`                                 |
| 22  | `ui/wizard/steps/ConnectorSelectionStep.tsx`  | 121                           | Badge text: "Connected" / "Disconnected"                                                          | `connector.status.connected`, `connector.status.disconnected`              |
| 23  | `ui/wizard/steps/MetricConfigurationStep.tsx` | 94                            | Text: "Select Metrics for Each Connector"                                                         | `create.steps.metrics.title`                                               |
| 24  | `ui/wizard/steps/AISettingsStep.tsx`          | 32                            | Label: "AI Model"                                                                                 | `create.steps.ai.modelLabel`                                               |
| 25  | `ui/wizard/steps/AISettingsStep.tsx`          | 37                            | Description: "Claude 3.5 Sonnet recommended..."                                                   | `create.steps.ai.modelDescription`                                         |
| 26  | `ui/wizard/steps/AISettingsStep.tsx`          | 44                            | Label: "Analysis Quality"                                                                         | `create.steps.ai.qualityLabel`                                             |
| 27  | `ui/wizard/steps/AISettingsStep.tsx`          | 58–63                         | Slider marks: "Fast", "Balanced", "Detailed", "Comprehensive"                                     | `create.steps.ai.qualityMarks.*`                                           |
| 28  | `ui/wizard/steps/AISettingsStep.tsx`          | 81                            | Label: "Detail Level"                                                                             | `create.steps.ai.detailLevelLabel`                                         |
| 29  | `ui/wizard/steps/AISettingsStep.tsx`          | 96                            | Label: "Custom Instructions (Optional)"                                                           | `create.steps.ai.customPromptLabel`                                        |
| 30  | `ui/wizard/steps/AISettingsStep.tsx`          | 100                           | Description text                                                                                  | `create.steps.ai.customPromptDescription`                                  |
| 31  | `ui/wizard/steps/ScheduleDeliveryStep.tsx`    | 72                            | Label: "Frequency"                                                                                | `create.steps.schedule.frequencyLabel`                                     |
| 32  | `ui/wizard/steps/ScheduleDeliveryStep.tsx`    | 99                            | Label: "Hour of Day (24-hour format)"                                                             | `create.steps.schedule.timeLabel`                                          |
| 33  | `ui/wizard/steps/ScheduleDeliveryStep.tsx`    | 117                           | Label: "Report Format"                                                                            | `create.steps.schedule.formatLabel`                                        |
| 34  | `ui/wizard/steps/ScheduleDeliveryStep.tsx`    | 134                           | Text: "Email Recipients"                                                                          | `create.steps.schedule.emailRecipientsLabel`                               |
| 35  | `ui/wizard/steps/ScheduleDeliveryStep.tsx`    | 175                           | Label: "Enable Webhook Delivery"                                                                  | `create.steps.schedule.webhookLabel`                                       |
| 36  | `ui/wizard/steps/ScheduleDeliveryStep.tsx`    | 188                           | Label: "Webhook URL"                                                                              | `create.steps.schedule.webhookUrlLabel`                                    |
| 37  | `ui/wizard/steps/ReviewStep.tsx`              | 43, 67, 87, 115               | Section titles: "Basic Information", "Connectors & Metrics", "AI Settings", "Schedule & Delivery" | `create.steps.review.sections.*`                                           |
| 38  | `ui/wizard/steps/ReviewStep.tsx`              | 48–59, 72–79, 92–101, 119–144 | Field labels throughout review                                                                    | `create.steps.review.fields.*`                                             |
| 39  | `ui/wizard/validation.ts`                     | 4–34                          | Validation error messages in English                                                              | Should use i18n-aware validation or map codes to i18n keys at display time |

### 1.4 Structural / Logic Issues

| #   | File                          | Line(s) | Issue                                                                                                           | Fix                                                          |
| --- | ----------------------------- | ------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 40  | `pages/InsightListPage.tsx`   | 468–469 | `useInsightRun()` hook called inside render loop — creates new mutation instance per card                       | Move hook to component top level, pass `mutate` via callback |
| 41  | `pages/InsightDetailPage.tsx` | 249–252 | `useReportList` called without `insightId` filter — fetches all tenant reports, not scoped to current insight   | Add `insightId` parameter                                    |
| 42  | `pages/InsightDetailPage.tsx` | 337–340 | Same issue — `useReportList` for latest report not scoped to insight                                            | Add `insightId` parameter                                    |
| 43  | `pages/InsightEditPage.tsx`   | 329     | `onManageConnectors={() => {}}` — no-op callback                                                                | Wire to `navigate.push(ROUTE_PATHS.DASHBOARD_CONNECTORS)`    |
| 44  | `schemas.ts`                  | 41      | `selectedMetrics: z.array(z.unknown())` — overly permissive, should be `z.array(z.string())` per backend schema | Tighten to `z.array(z.string())`                             |

---

## 2. Implementation Plan

### 2.1 Backend Prerequisites (New tRPC Endpoints Required)

| Endpoint                 | Purpose                                                     | Request Shape | Response Shape                                                                                                    |
| ------------------------ | ----------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `trpc.ai.models`         | List available AI models grouped by provider                | `{}`          | `{ providers: [{ id: string, name: string, models: [{ value: string, label: string, recommended: boolean }] }] }` |
| `trpc.ai.defaults`       | Fetch tenant-level AI configuration defaults                | `{}`          | `{ model: string, quality: number, detailLevel: string }`                                                         |
| `trpc.connector.domains` | List available business domains derived from connector tags | `{}`          | `{ domains: [{ value: string, label: string, connectorCount: number }] }`                                         |
| `trpc.tenant.config`     | Fetch tenant configuration including share link defaults    | `{}`          | `{ shareLinkExpiryHours: number, defaultAiModel: string, ... }`                                                   |

**Note:** The backend already has `SUPPORTED_MODELS` at `insights.ts:53–57` and `ProviderFactory.listProviders()`. The `ai.models` endpoint can reuse these directly.

### 2.2 Frontend Changes by File

#### `pages/InsightCreateWizard.tsx`

- Remove `AVAILABLE_MODELS` constant; replace with `useAiModels()` hook
- Remove `AVAILABLE_DOMAINS` constant; replace with `useConnectorDomains()` hook
- Replace hardcoded form defaults with `useAiDefaults()` hook, falling back to current values
- Pass `models` and `domains` as props to `BasicInfoStep` and `AISettingsStep`

#### `pages/InsightEditPage.tsx`

- Same changes as InsightCreateWizard (#1–#4 above)
- Fix `onManageConnectors` no-op (Issue #43)

#### `pages/InsightListPage.tsx`

- Replace hardcoded domain filter data (line 365–371) with `useConnectorDomains()` hook
- Fix hook-in-loop anti-pattern (Issue #40): hoist `useInsightRun()` to top level

#### `pages/InsightDetailPage.tsx`

- Scope `useReportList` calls to current `insightId` (Issues #41, #42)
- Move all hardcoded strings (Issues #12–#16) to i18n keys
- Make share link expiry configurable via `useTenantConfig()` (Issue #11)

#### `ui/wizard/steps/BasicInfoStep.tsx`

- Move all hardcoded labels/placeholders to i18n via `useTranslations("insights")`

#### `ui/wizard/steps/AISettingsStep.tsx`

- Accept `detailLevelOptions` as prop instead of hardcoding inline
- Move all hardcoded labels/descriptions to i18n
- Slider marks should accept as prop or derive from i18n

#### `ui/wizard/steps/ScheduleDeliveryStep.tsx`

- Accept `frequencyOptions` and `formatOptions` as props
- Move all hardcoded labels to i18n

#### `ui/wizard/steps/ConnectorSelectionStep.tsx`

- Move hardcoded text to i18n (Issues #20–#22)

#### `ui/wizard/steps/MetricConfigurationStep.tsx`

- Move hardcoded text to i18n (Issue #23)

#### `ui/wizard/steps/ReviewStep.tsx`

- Move all section titles and field labels to i18n (Issues #37–#38)

#### `ui/wizard/validation.ts`

- Replace hardcoded English messages with error codes
- Map codes to i18n keys at display time in form components

#### `schemas.ts`

- Tighten `selectedMetrics` from `z.array(z.unknown())` to `z.array(z.string())` (Issue #44)

### 2.3 New API Hooks (Frontend)

```typescript
// features/insights/api/insight-api.ts — additions

export function useAiModels() {
  return trpc.ai.models.useQuery({}, { staleTime: 30 * 60 * 1000 });
}

export function useAiDefaults() {
  return trpc.ai.defaults.useQuery({}, { staleTime: 5 * 60 * 1000 });
}

export function useConnectorDomains() {
  return trpc.connector.domains.useQuery({}, { staleTime: 5 * 60 * 1000 });
}

export function useTenantConfig() {
  return trpc.tenant.config.useQuery({}, { staleTime: 5 * 60 * 1000 });
}
```

---

## 3. Multi-Tenancy Notes

| Data Source                    | Tenant Scoping Mechanism                                 | Verification                                                                        |
| ------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `trpc.ai.models`               | No tenant scoping needed — models are platform-wide      | Confirm endpoint uses `authedProcedure`                                             |
| `trpc.ai.defaults`             | Tenant-scoped via `ctx.tenant.tenantId`                  | Defaults may vary per tenant's subscription tier                                    |
| `trpc.connector.domains`       | Derived from tenant's active connectors via `dbScoped()` | Domains should only include those with at least one active connector for the tenant |
| `trpc.tenant.config`           | Tenant-scoped via `ctx.tenant.tenantId`                  | Config is per-tenant in `TenantConfig` table                                        |
| `useReportList({ insightId })` | Already tenant-scoped via `dbScoped()` in backend        | Adding `insightId` filter ensures data isolation per insight                        |
| Connector list                 | Already tenant-scoped via `useConnectorList`             | Existing `trpc.connector.list` uses `authedProcedureWithPermission`                 |

**Critical:** All new endpoints must use `authedProcedureWithPermission` and `dbScoped()` to enforce row-level security. No endpoint should accept a `tenantId` as input — it must come from `ctx.tenant`.

---

## 4. Dependency Order

### Phase 1: Backend Endpoints (Prerequisites)

1. **`trpc.ai.models`** — Expose `SUPPORTED_MODELS` + `ProviderFactory.listProviders()` as query
2. **`trpc.ai.defaults`** — Return tenant-level AI defaults from `TenantConfig` or hardcoded fallback
3. **`trpc.connector.domains`** — Aggregate domain tags from tenant's active connectors
4. **`trpc.tenant.config`** — Expose tenant configuration including `shareLinkExpiryHours`

### Phase 2: Core Data Replacement

5. Create new API hooks (`useAiModels`, `useAiDefaults`, `useConnectorDomains`, `useTenantConfig`)
6. Update `InsightCreateWizard.tsx` — replace `AVAILABLE_MODELS`, `AVAILABLE_DOMAINS`, defaults
7. Update `InsightEditPage.tsx` — same replacements + fix no-op callback
8. Update `InsightListPage.tsx` — replace domain filter + fix hook-in-loop
9. Update `InsightDetailPage.tsx` — scope reports to insightId + configurable share expiry

### Phase 3: i18n Migration

10. Add all i18n keys to localization files for wizard steps
11. Update `BasicInfoStep.tsx`, `AISettingsStep.tsx`, `ScheduleDeliveryStep.tsx`
12. Update `ConnectorSelectionStep.tsx`, `MetricConfigurationStep.tsx`, `ReviewStep.tsx`
13. Update `InsightDetailPage.tsx` hardcoded strings
14. Refactor `validation.ts` to use error codes

### Phase 4: Schema & Cleanup

15. Tighten `schemas.ts` `selectedMetrics` type
16. Remove duplicate `AVAILABLE_*` constants
17. Run typecheck, lint, and tests

---

## 5. Verification Steps

### 5.1 API Contract Tests

| Test                                                            | Method                                  |
| --------------------------------------------------------------- | --------------------------------------- |
| `ai.models` returns models grouped by registered providers      | Unit test against `ProviderFactory`     |
| `ai.defaults` returns tenant-scoped defaults                    | Integration test with test tenant       |
| `connector.domains` returns only domains with active connectors | Integration test with seeded connectors |
| `tenant.config` returns correct share expiry                    | Integration test with test tenant       |

### 5.2 Frontend Verification

| Scenario                                                 | Verification                                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| Create insight wizard loads models from API              | Network tab shows `ai.models` request; UI reflects registered providers |
| Domain filter on list page matches connector domains     | Add/remove connectors; filter options update accordingly                |
| Reports tab shows only reports for current insight       | Create 2 insights with reports; verify no cross-contamination           |
| Share link expiry respects tenant config                 | Change config; verify new share links use updated expiry                |
| All UI strings render in current locale                  | Switch locale; verify all labels translate                              |
| Edit page "Manage Connectors" button navigates correctly | Click button; verify redirect to `/dashboard/connectors`                |
| Run button on insight cards works without re-render bugs | Click run on multiple cards; verify single mutation instance            |

### 5.3 Multi-Tenancy Verification

| Test                                              | Method                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Tenant A cannot see Tenant B's connectors/domains | Create 2 tenants; verify domain lists are isolated |
| `dbScoped()` is used in all new endpoints         | Code review + lint rule                            |
| No `tenantId` accepted as input parameter         | Code review                                        |
| RLS policies cover new tables accessed            | Database migration review                          |

### 5.4 Regression Tests

| Test                                       | Method                                                         |
| ------------------------------------------ | -------------------------------------------------------------- |
| Existing insight CRUD operations unchanged | Run `insight-api.test.tsx` and `insight-api.mutation.test.tsx` |
| Wizard validation still works              | Run `wizard-validation.test.ts`                                |
| Integration test passes                    | Run `InsightCreateWizard.integration.test.tsx`                 |
| List page test passes                      | Run `InsightListPage.test.tsx`                                 |

---

## 6. Files Modified Summary

| File                                                                              | Change Type                            | Priority      |
| --------------------------------------------------------------------------------- | -------------------------------------- | ------------- |
| `apps/api/src/trpc/routers/insights.ts`                                           | Add 4 new endpoints                    | P0 (blocking) |
| `apps/frontend/src/features/insights/api/insight-api.ts`                          | Add 4 new hooks                        | P0            |
| `apps/frontend/src/features/insights/pages/InsightCreateWizard.tsx`               | Replace static data                    | P1            |
| `apps/frontend/src/features/insights/pages/InsightEditPage.tsx`                   | Replace static data + fix bug          | P1            |
| `apps/frontend/src/features/insights/pages/InsightListPage.tsx`                   | Replace static data + fix anti-pattern | P1            |
| `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx`                 | Scope reports + i18n + config          | P1            |
| `apps/frontend/src/features/insights/ui/wizard/steps/BasicInfoStep.tsx`           | i18n migration                         | P2            |
| `apps/frontend/src/features/insights/ui/wizard/steps/AISettingsStep.tsx`          | i18n + prop-driven options             | P2            |
| `apps/frontend/src/features/insights/ui/wizard/steps/ScheduleDeliveryStep.tsx`    | i18n + prop-driven options             | P2            |
| `apps/frontend/src/features/insights/ui/wizard/steps/ConnectorSelectionStep.tsx`  | i18n migration                         | P2            |
| `apps/frontend/src/features/insights/ui/wizard/steps/MetricConfigurationStep.tsx` | i18n migration                         | P2            |
| `apps/frontend/src/features/insights/ui/wizard/steps/ReviewStep.tsx`              | i18n migration                         | P2            |
| `apps/frontend/src/features/insights/ui/wizard/validation.ts`                     | Error code refactor                    | P2            |
| `apps/frontend/src/features/insights/schemas.ts`                                  | Type tightening                        | P2            |
