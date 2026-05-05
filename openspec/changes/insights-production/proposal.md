## Why

The Insights feature has critical gaps blocking production launch: missing connector metrics integration, no running state tracking, unsafe type assertions, and incomplete error handling. These issues create a poor user experience and potential runtime failures. This change completes the Insights UI to production-ready quality with proper API integration, type safety, and user feedback.

## What Changes

- **Connector Metrics API Integration**: Dynamic loading of available metrics per connector in the InsightCreateWizard and InsightEditPage
- **Running State Implementation**: Real-time execution status tracking with UI indicators and disabled states during report generation
- **Type Safety for JSONB Fields**: Proper TypeScript interfaces replacing all unsafe type assertions for `aiConfig`, `schedule`, `delivery`, and `connectors`
- **Toast Notifications**: User feedback on all mutations (create, update, delete, run) using canonical notification system
- **Report Actions Wiring**: Functional View, Download, Share, and Bulk Download buttons across insight detail and report list pages
- **Error Handling Improvements**: User-friendly error messages with canonical error codes and error boundaries
- **Domain Extraction**: Backend-populated domain field replacing hardcoded values
- **AI Insights Auto-Generation**: Automatic insight generation after report completion
- **Last Run Timestamp**: Display of most recent execution time in insight cards

## Capabilities

### New Capabilities

- `insights-connector-metrics`: Frontend integration for fetching and displaying available metrics per connector
- `insights-execution-state`: UI tracking and display of insight execution status (idle/running/completed/failed)
- `insights-type-safety`: Strict TypeScript interfaces for all JSONB fields with runtime validation
- `insights-user-feedback`: Toast notifications and error handling for all user actions
- `insights-report-actions`: View, download, share, and bulk download functionality for generated reports
- `insights-auto-generation`: Automatic AI insights generation triggered by report completion events

### Modified Capabilities

- `insights`: Enhanced with production-ready error handling, execution tracking, and connector metrics integration

## Impact

**Frontend:**

- `apps/frontend/src/features/insights/` - All pages, components, and API hooks
- `apps/frontend/src/features/connectors/api/` - New connector metrics hook
- `apps/frontend/src/core/error-system/` - Error translation for insights-specific codes

**Backend:**

- `apps/api/src/trpc/routers/insights.ts` - Enhanced response types with status, lastRunAt, domain
- `apps/worker/src/jobs/insights.ts` - Auto-generation trigger for AI insights
- Database schema - New fields for execution tracking (status, lastRunAt)

**Dependencies:**

- JSZip library for bulk download functionality
- Backend metrics endpoint (`connector.getMetrics`)
- Backend execution status tracking in job system

**Feature Flag:** `ENABLE_INSIGHTS_UI` (existing)
