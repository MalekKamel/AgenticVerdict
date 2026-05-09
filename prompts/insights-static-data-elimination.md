# Replace Static Data with Dynamic Implementation — Insights Feature

## Context

The `dashboard/insights` feature contains hardcoded/static data that should be sourced dynamically from the backend. Example: `apps/frontend/src/features/insights/pages/InsightListPage.tsx` includes static domain filter options (line 365–371) and other mock values that should be driven by live API responses and tenant-scoped configuration.

## Objective

Eliminate all hardcoded and static data across the insights feature. Every piece of displayed data must be fetched dynamically from the API, respecting multi-tenant isolation as defined in the business architecture.

## Requirements

Per `/docs/architecture/business/business-architecture.md`, the platform supports:

- **Tenant-scoped data**: All queries must respect row-level security and tenant context
- **Configurable connectors**: GA4, Meta, GSC, GBP, TikTok, QuickBooks, Stripe — each with domain tags and embedded metrics
- **Insight templates**: Marketing, Finance, SEO, Social Media, Executive Summary
- **Business metrics framework**: Marketing, Finance, SEO, Social Media, Local Business domains

## Scope

Audit all files under `apps/frontend/src/features/insights/` including:

- **Pages**: `InsightListPage`, `InsightDetailPage`, `InsightEditPage`, `InsightCreateWizard`
- **Wizard steps**: `BasicInfoStep`, `ConnectorSelectionStep`, `MetricConfigurationStep`, `AISettingsStep`, `ScheduleDeliveryStep`, `ReviewStep`
- **UI components**: `StepIndicator`, `WizardLayout`, `AuditTrailTimeline`, `JobStatusBadge`
- **API layer**: `insight-api.ts` — verify all hooks consume live endpoints
- **Schemas**: `schemas.ts` — ensure types align with backend response shapes

## Deliverable

Produce a file at `docs/implementation/insights-static-data-elimination.md` containing:

1. **Audit inventory**: A table listing every file, the static/hardcoded values found, line numbers, and the required dynamic data source
2. **Implementation plan**: For each finding, specify the API endpoint or data source that should replace the static value, including request/response shapes
3. **Multi-tenancy notes**: Confirm each dynamic data source propagates tenant context correctly
4. **Dependency order**: A sequenced list of changes, noting which backend endpoints must exist before frontend changes can be made
5. **Verification steps**: How to confirm each replacement works correctly (e.g., API contract tests, E2E scenarios)

## Constraints

- Do not modify backend code — identify missing endpoints as prerequisites
- Preserve existing UI/UX behavior; only replace data sources
- All dynamic data must be tenant-scoped per the multi-tenancy model
- Follow the existing `insight-api.ts` hook patterns for consistency
