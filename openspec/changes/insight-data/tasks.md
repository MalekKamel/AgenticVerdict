## 1. Backend Endpoints (Prerequisites)

- [x] 1.1 Add `trpc.ai.models` query endpoint in `apps/api/src/trpc/routers/insights.ts` returning models grouped by provider from `SUPPORTED_MODELS` and `ProviderFactory.listProviders()`, using `authedProcedure`
- [x] 1.2 Add `trpc.ai.defaults` query endpoint returning tenant-level AI config from `TenantConfig` with schema fallbacks, using `authedProcedureWithPermission` and `dbScoped()`
- [x] 1.3 Add `trpc.connector.domains` query endpoint aggregating `domainTags` from tenant's active connectors with connector counts, using `authedProcedureWithPermission` and `dbScoped()`, with fallback to full domain list when no connectors
- [x] 1.4 Add `trpc.tenant.config` query endpoint returning whitelisted tenant config fields (`shareLinkExpiryHours`, `defaultAiModel`, etc.) with 30-day cap on share expiry, using `authedProcedureWithPermission` and `dbScoped()`
- [ ] 1.5 Write unit tests for `ai.models` endpoint against `ProviderFactory`
- [ ] 1.6 Write integration tests for `ai.defaults`, `connector.domains`, and `tenant.config` with test tenant

## 2. Frontend API Hooks

- [x] 2.1 Add `useAiModels()` hook to `apps/frontend/src/features/insights/api/insight-api.ts` with `staleTime: 30 * 60 * 1000`
- [x] 2.2 Add `useAiDefaults()` hook with `staleTime: 5 * 60 * 1000`
- [x] 2.3 Add `useConnectorDomains()` hook with `staleTime: 5 * 60 * 1000`
- [x] 2.4 Add `useTenantConfig()` hook with `staleTime: 5 * 60 * 1000`

## 3. Core Data Replacement — Pages

- [x] 3.1 Update `InsightCreateWizard.tsx`: remove `AVAILABLE_MODELS` and `AVAILABLE_DOMAINS` constants, replace with `useAiModels()` and `useConnectorDomains()` hooks
- [x] 3.2 Update `InsightCreateWizard.tsx`: replace hardcoded form defaults with `useAiDefaults()` hook, falling back to current values
- [x] 3.3 Update `InsightCreateWizard.tsx`: pass `models` and `domains` as props to `BasicInfoStep` and `AISettingsStep`
- [x] 3.4 Update `InsightEditPage.tsx`: same replacements as InsightCreateWizard (#3.1–#3.2)
- [x] 3.5 Update `InsightEditPage.tsx`: wire `onManageConnectors` to `navigate.push(ROUTE_PATHS.DASHBOARD_CONNECTORS)`
- [x] 3.6 Update `InsightListPage.tsx`: replace hardcoded domain filter data with `useConnectorDomains()` hook
- [x] 3.7 Update `InsightListPage.tsx`: hoist `useInsightRun()` from render loop to component top level, pass `mutate` via callback
- [x] 3.8 Update `InsightDetailPage.tsx`: scope `useReportList` calls to current `insightId` parameter
- [x] 3.9 Update `InsightDetailPage.tsx`: make share link expiry configurable via `useTenantConfig()` instead of hardcoded 7 days

## 4. i18n Migration — Wizard Steps

- [x] 4.1 Add all i18n keys for wizard steps to localization files under `insights` namespace (basicInfo, ai, schedule, connectors, metrics, review sections)
- [x] 4.2 Update `BasicInfoStep.tsx`: replace hardcoded labels/placeholders with `useTranslations("insights")`
- [x] 4.3 Update `AISettingsStep.tsx`: accept `detailLevelOptions` as prop, replace all hardcoded labels/descriptions/slider marks with i18n
- [x] 4.4 Update `ScheduleDeliveryStep.tsx`: accept `frequencyOptions` and `formatOptions` as props, replace all hardcoded labels with i18n
- [x] 4.5 Update `ConnectorSelectionStep.tsx`: replace hardcoded text with i18n
- [x] 4.6 Update `MetricConfigurationStep.tsx`: replace hardcoded text with i18n
- [x] 4.7 Update `ReviewStep.tsx`: replace all section titles and field labels with i18n

## 5. i18n Migration — Pages and Validation

- [x] 5.1 Update `InsightDetailPage.tsx`: move all hardcoded strings (table headers, button labels, modal title, notification) to i18n
- [x] 5.2 Update `InsightListPage.tsx`: move all hardcoded page-level strings to i18n
- [x] 5.3 Refactor `validation.ts`: replace hardcoded English messages with error code constants (e.g., `NAME_REQUIRED`, `DOMAIN_REQUIRED`)
- [x] 5.4 Update form components to map validation error codes to i18n keys at display time via `t()`

## 6. Schema Fixes and Cleanup

- [x] 6.1 Tighten `schemas.ts`: change `selectedMetrics` from `z.array(z.unknown())` to `z.array(z.string())`
- [x] 6.2 Remove duplicate `AVAILABLE_MODELS` and `AVAILABLE_DOMAINS` constants from all files
- [x] 6.3 Verify no remaining hardcoded strings in insights feature (audit against implementation plan inventory)

## 7. Verification

- [x] 7.1 Run `pnpm run typecheck` — zero type errors
- [x] 7.2 Run `pnpm run lint` — zero lint errors
- [x] 7.3 Run existing insight tests (`insight-api.test.tsx`, `insight-api.mutation.test.tsx`, `wizard-validation.test.ts`)
- [x] 7.4 Verify `ai.models` endpoint returns models grouped by registered providers
- [x] 7.5 Verify `connector.domains` returns only domains with active connectors for test tenant
- [x] 7.6 Verify report list on insight detail page shows only reports for current insight
- [x] 7.7 Verify share link expiry respects tenant config
- [x] 7.8 Verify all UI strings render in current locale (switch locale and check)
- [x] 7.9 Verify "Manage Connectors" button navigates to `/dashboard/connectors`
- [x] 7.10 Verify run button on insight cards works without re-render bugs
