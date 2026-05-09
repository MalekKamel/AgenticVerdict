## Why

The insights feature (`apps/frontend/src/features/insights/`) contains extensive hardcoded static data — AI model lists, business domains, form defaults, UI strings, and validation messages — that should be dynamic, tenant-scoped, and internationalized. This creates maintenance burden, prevents per-tenant customization, blocks i18n support, and introduces bugs (hooks called in render loops, unscoped data fetches, no-op callbacks). Eliminating these hardcoded values is a prerequisite for production readiness.

## What Changes

- **Add 4 new tRPC endpoints**: `ai.models`, `ai.defaults`, `connector.domains`, `tenant.config` to serve dynamic, tenant-scoped configuration data
- **Replace all hardcoded data arrays** in insight pages with API-driven hooks (`useAiModels`, `useAiDefaults`, `useConnectorDomains`, `useTenantConfig`)
- **Migrate all hardcoded UI strings** (60+ instances across 10+ files) to i18n keys via `useTranslations("insights")`
- **Refactor validation messages** in `validation.ts` from hardcoded English strings to error codes mapped to i18n keys at display time
- **Fix structural bugs**: hoist `useInsightRun()` from render loop, scope `useReportList` to `insightId`, wire no-op `onManageConnectors` callback
- **Tighten schema types**: change `selectedMetrics` from `z.array(z.unknown())` to `z.array(z.string())`

## Capabilities

### New Capabilities

- `insights-dynamic-data`: AI models, tenant defaults, connector domains, and tenant configuration must be served dynamically via authenticated tRPC endpoints with appropriate tenant scoping
- `insights-i18n`: All insights feature UI strings (labels, placeholders, button text, validation messages, notifications) must be sourced from i18n localization files, not hardcoded in component source

### Modified Capabilities

- `dashboard-surfaces`: Report list data fetching on insight detail pages must be scoped to the specific insight ID, not fetch all tenant reports (tightens data isolation requirement)

## Impact

- **Backend**: `apps/api/src/trpc/routers/insights.ts` — 4 new query endpoints added
- **Frontend API layer**: `apps/frontend/src/features/insights/api/insight-api.ts` — 4 new React Query hooks
- **Frontend pages**: `InsightCreateWizard.tsx`, `InsightEditPage.tsx`, `InsightListPage.tsx`, `InsightDetailPage.tsx` — static data replaced with hooks, bugs fixed
- **Frontend UI components**: All wizard step components (`BasicInfoStep`, `AISettingsStep`, `ScheduleDeliveryStep`, `ConnectorSelectionStep`, `MetricConfigurationStep`, `ReviewStep`) — i18n migration
- **Frontend schemas**: `schemas.ts` — type tightening
- **Localization**: New i18n keys added to insight locale files
- **Multi-tenancy**: All new endpoints use `authedProcedureWithPermission` and `dbScoped()`; no endpoint accepts `tenantId` as input
