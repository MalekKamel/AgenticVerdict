## Why

The AgenticVerdict platform currently has backend APIs for insights and reports but lacks a complete frontend implementation. Users cannot create, configure, view, or manage insights and reports through the UI, limiting access to the platform's AI-powered business intelligence capabilities. This change delivers the complete frontend implementation to enable users to configure insights, generate reports, and access AI-generated analysis.

**Production Readiness:** This specification includes production hardening requirements: replacing mock implementations with real tRPC API integration, fixing TypeScript errors and ESLint violations, complete Arabic localization, type-safe route paths, and comprehensive unit test coverage (70%+ overall, 85%+ business logic, 90%+ critical paths).

## What Changes

- **New**: Complete insight management UI (list, create, detail, edit pages)
- **New**: Multi-step insight creation wizard with connector selection, metric configuration, AI settings, and scheduling
- **New**: Report viewer with embedded PDF/Excel viewing, printing, and sharing capabilities
- **New**: Report list page with filtering, sorting, and bulk actions
- **New**: Audit trail and version history visualization
- **Integration**: Connect existing backend APIs (`/api/v1/insights`, `/api/v1/reports`) with frontend React Query hooks
- **Integration**: Leverage existing design system components from `packages/ui/` and Mantine

## Capabilities

### New Capabilities

- `insight-list`: Browse and filter insights with status indicators, search, and pagination
- `insight-create`: Multi-step wizard for configuring insights with connectors, metrics, AI settings, schedule, and delivery
- `insight-detail`: Comprehensive insight view with tabs for overview, reports, settings, and history
- `insight-edit`: Edit existing insight configuration with pre-populated forms and validation
- `report-viewer`: Embedded PDF/Excel viewer with zoom, navigation, print, and download
- `report-list`: Browse reports with filtering by date, format, status, and bulk actions
- `report-sharing`: Generate time-limited share tokens for report access
- `audit-trail`: Display immutable audit log for insights and reports
- `insights-hooks`: React Query hooks for insights CRUD operations (list, create, update, delete, run)
- `reports-hooks`: React Query hooks for reports operations (list, byId, generation)
- `connector-hooks`: React Query hooks for connector list and metrics fetching
- `ai-insights-integration`: Integration with agent-runtime for AI-generated insights
- `audit-trail-hooks`: React Query hook for audit trail queries
- `insights-arabic-locale`: Complete Arabic localization for insights/reports/audit-trail namespaces
- `route-paths-insights`: Type-safe route constants for insights and reports navigation
- `insights-unit-tests`: Comprehensive unit tests for hooks, mutations, utilities, and schemas

### Modified Capabilities

- `multi-tenant-safety`: Extend tenant context propagation to insight/report operations (already implemented in backend, needs frontend integration)
- `insights-tsc-router`: Fix TypeScript errors in tRPC router (or conditions, schema alignment)
- `reports-tsc-router`: Fix TypeScript errors in reports tRPC router
- `insights-wizard`: Replace mock data with real API integration in create/edit wizard flows
- `insights-detail-page`: Implement real reports list, AI insights, and settings tabs

## Impact

- **Frontend**: New pages under `apps/frontend/src/features/insights/` and `apps/frontend/src/features/reports/`
- **Frontend**: React Query hooks in `features/insights/api/` and `features/reports/api/`
- **Frontend**: Route paths in `apps/frontend/src/router/utils/route-paths.ts`
- **API**: `apps/api/src/trpc/routers/insights.ts` - Type fixes, unused import removal
- **API**: `apps/api/src/trpc/routers/reports.ts` - Type fixes, unused import removal
- **i18n**: `packages/i18n/src/locales/ar.json` - Arabic translations
- **Testing**: New unit test files for hooks, mutations, and validation schemas
- **State Management**: React Query hooks for caching, invalidation, and optimistic updates
- **Design System**: Reuse existing Mantine components and design tokens from `packages/ui/`
- **Dependencies**:
  - PDF viewer library (e.g., `react-pdf`) for embedded report viewing
  - Excel preview component for spreadsheet reports
  - tRPC, React Query, Mantine notifications, agent-runtime integration
- **Backend**: Type fixes only (APIs already implemented)
- **Database**: No schema changes required (JSONB columns already support flexible configuration)
