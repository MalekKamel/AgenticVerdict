# Implementation Plan: UI Reports

**Branch**: `005-ui-reports` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Priority**: High - Primary Output Feature
**Input**: Feature specification from `/specs/01-ui/05-reports/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement the primary output feature of the AgenticVerdict platform: the report viewing, export, library, and sharing interface. This phase delivers a multi-page report viewer with PDF/Excel export capabilities, a searchable report library for historical analysis, and secure report sharing with external stakeholders. Built on TanStack Start with Mantine v9 components, PDF.js for PDF rendering, file-saver for downloads, and tRPC for type-safe API access, with full RTL/LTR internationalization support and WCAG 2.1 AA accessibility compliance.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), React 18+
**Primary Dependencies**:
- TanStack Start (framework with file-based routing)
- Mantine v9 (component library: Card, Table, Pagination, Modals, Popovers, PDF viewer)
- PDF.js (PDF rendering and display)
- file-saver (client-side file downloads)
- @tanstack/react-router with i18n (routing and internationalization)
- tRPC v11 (type-safe API for report CRUD operations)
- @mantine/core (CSS-in-JS styling with RTL support)
- Zod (validation schemas)
**Storage**: N/A (frontend UI; report data from backend tRPC API)
**Testing**: Vitest (unit tests), Playwright (E2E tests for critical user journeys), @axe-core/react (accessibility)
**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge) with PDF rendering support
**Project Type**: Web application (monorepo package: apps/frontend with routes in src/routes/)
**Performance Goals**:
- Report viewer initial load: <2s (3G connection)
- Page navigation: <500ms (cached pages)
- PDF export generation: <30s (typical 10-page report)
- Excel export generation: <20s (typical report)
- Report library load: <2s (100+ reports)
- Search/filter response: <500ms
- Export progress updates: <100ms
**Constraints**:
- WCAG 2.1 AA compliance (non-negotiable)
- Zero `any` types (strict TypeScript)
- RTL support from day one (Arabic primary)
- Route-based code splitting for components >50KB
- Form validation via Zod schemas
- Export processing via background jobs (BullMQ)
- Report rendering must support both LTR and RTL layouts
**Scale/Scope**:
- Multi-page reports with 10-20 pages
- 100+ reports in library per tenant
- 50+ concurrent export requests
- Share links with configurable expiration (default 30 days)
- Support for 3 languages (English, Arabic, French)
- Report file sizes: 1MB to 20MB

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Multi-Tenancy First ✅ PASS

**Requirement**: Tenant context propagation and isolation
**Implementation**:
- All report CRUD operations scoped to current tenant from backend tRPC API
- Report library automatically filters by authenticated tenant
- Share links respect tenant boundaries and cannot expose cross-tenant data
- Report metadata includes tenant ID for audit trails

**Status**: Compliant - Tenant isolation enforced via backend API

### II. Configuration-Driven Architecture ✅ PASS

**Requirement**: Company-specific behavior through CompanyConfig schema
**Implementation**:
- Report language and locale from CompanyConfig.localization
- Date/currency formatting respects tenant settings
- Export format options based on tenant preferences
- Share link defaults from tenant security settings

**Status**: Compliant - All report configuration flows through tenant context

### III. Plugin Architecture ✅ PASS

**Requirement**: ConnectorAdapter interface for data connectors
**Implementation**:
- Report content generated from unified NormalizedConnectorSnapshot format
- Connector icons and metadata displayed in report headers
- Multi-connector reports supported without UI changes
- Report templates work across all connector types

**Status**: Compliant - Reports consume data from existing connector plugin system

### IV. Type Safety & Quality Standards ✅ PASS

**Requirement**: Zero `any` types, strict TypeScript, Zod validation
**Implementation**:
- All report entities typed with TypeScript interfaces
- Share link options validated via Zod schemas
- Export options validated via Zod schemas
- tRPC provides end-to-end type safety for report CRUD operations

**Status**: Compliant - Full type safety throughout

### V. Battle-Tested Technology Only ✅ PASS

**Requirement**: Use proven, production-ready libraries
**Implementation**:
- PDF.js: Mozilla-maintained, 15+ years in production
- file-saver: 5+ years, 40M+ weekly downloads
- Mantine v9: Production-ready with enterprise adoption
- TanStack Start: Modern but built on proven React Router v6

**Status**: Compliant - All dependencies are battle-tested

### VI. Accessibility Without Compromise ✅ PASS

**Requirement**: WCAG 2.1 AA compliance non-negotiable
**Implementation**:
- Report viewer keyboard navigable with proper focus management
- All charts have alternative text descriptions
- Data tables have proper ARIA labels and headers
- PDF exports include accessibility tags
- High contrast mode supported throughout

**Status**: Compliant - Accessibility is foundational

### VII. Internationalization From Day One ✅ PASS

**Requirement**: Arabic RTL support is not an afterthought
**Implementation**:
- Report viewer auto-detects language and sets direction
- PDF.js rendering supports RTL text direction
- Export formats preserve RTL layouts
- Table and chart mirroring for RTL languages
- Logical properties for layout (margin-inline-start vs margin-left)

**Status**: Compliant - RTL support is foundational

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/05-reports/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (/speckit.plan command)
└── tasks.md             # Task list (/speckit.tasks command - NOT created by this plan)
```

### Source Code (repository root)

```text
apps/frontend/
├── src/
│   ├── routes/
│   │   ├── reports/
│   │   │   ├── index.tsx              # Report library page
│   │   │   ├── $reportId.tsx          # Report viewer page
│   │   │   └── shared/
│   │   │       └── $shareToken.tsx    # Shared report page
│   ├── components/
│   │   ├── reports/
│   │   │   ├── ReportViewer.tsx       # Multi-page report viewer
│   │   │   ├── ReportTableOfContents.tsx
│   │   │   ├── ReportPage.tsx         # Single page renderer
│   │   │   ├── ReportExportModal.tsx  # Export options modal
│   │   │   ├── ReportLibrary.tsx      # Report library with filters
│   │   │   ├── ReportCard.tsx         # Report preview card
│   │   │   ├── ReportShareModal.tsx   # Share options modal
│   │   │   ├── ShareLinkManager.tsx   # Active share links list
│   │   │   └── ReportPreview.tsx      # Hover preview component
│   │   └── charts/
│   │       └── ChartRenderer.tsx      # Reusable chart renderer for reports
│   ├── stores/
│   │   └── report-store.ts            # Report viewer state management
│   ├── lib/
│   │   ├── pdf-viewer.ts              # PDF.js integration
│   │   ├── file-downloader.ts         # file-saver integration
│   │   └── report-utils.ts            # Report formatting utilities
│   └── hooks/
│       ├── useReportData.ts           # Report data fetching
│       ├── useReportExport.ts         # Export functionality
│       └── useShareLink.ts            # Share link management
└── tests/
    ├── unit/
    │   ├── components/
    │   │   ├── ReportViewer.test.tsx
    │   │   └── ReportLibrary.test.tsx
    │   └── hooks/
    │       └── useReportExport.test.ts
    └── e2e/
        ├── reports-viewing.spec.ts
        ├── reports-export.spec.ts
        └── reports-sharing.spec.ts
```

**Structure Decision**: Web application structure using TanStack Start file-based routing in `apps/frontend/src/routes/`. Report-specific components organized under `components/reports/` with shared chart rendering in `components/charts/`. State management via TanStack Store in `stores/`. Custom hooks for data fetching and functionality in `hooks/`. Utilities for PDF viewing and file downloading in `lib/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| N/A | N/A | No violations - all requirements met |

## Phase 0: Research (Technical Discovery)

### Goals

1. Evaluate PDF rendering libraries (PDF.js vs react-pdf vs alternatives)
2. Research Excel export best practices and libraries
3. Investigate RTL layout handling in PDF/Excel exports
4. Explore share link security patterns and access control
5. Research report performance optimization techniques

### Research Questions

1. **PDF Rendering**: What is the best approach for rendering PDFs in the browser?
   - PDF.js with web worker for performance?
   - react-pdf wrapper for simpler React integration?
   - Server-side rendering vs client-side rendering?

2. **Excel Export**: How to handle Excel export with proper formatting?
   - ExcelJS backend generation vs client-side generation?
   - How to preserve charts and formatting in Excel?
   - Best practices for large data sets (1000+ rows)?

3. **RTL in Exports**: How to ensure RTL layouts work correctly in PDF/Excel?
   - PDF.js RTL rendering capabilities?
   - Excel RTL cell direction and alignment?
   - How to handle mixed LTR/RTL content?

4. **Share Link Security**: What security patterns for share links?
   - Token-based authentication vs password protection?
   - How to implement expiring links securely?
   - Access tracking and analytics without PII?

5. **Performance Optimization**: How to optimize report rendering and export?
   - Lazy loading for report pages?
   - Web workers for PDF generation?
   - Caching strategies for frequently accessed reports?

### Technical Decisions Required

1. **PDF Rendering Library**: Choose between PDF.js, react-pdf, or alternative
2. **Excel Generation Strategy**: Backend vs client-side, library selection
3. **Share Link Implementation**: Token format, security approach, access control
4. **State Management**: TanStack Store vs React Context for report viewer
5. **Export Processing**: Background job queue (BullMQ) vs synchronous processing

### Research Outcomes

Create `research.md` documenting:
- PDF rendering library comparison with recommendation
- Excel export implementation approach with code examples
- RTL layout handling strategies for both PDF and Excel
- Share link security architecture with token design
- Performance optimization recommendations with benchmarks

## Phase 1: Design (API & Data Model)

### Goals

1. Define tRPC router procedures for reports CRUD
2. Design data models for reports, exports, and share links
3. Plan component architecture and data flow
4. Design share link token structure and security
5. Plan error handling and validation schemas

### API Contract Design

Define tRPC procedures in `contracts/`:

```typescript
// Reports router
reportsRouter = t.router({
  // List reports with filters
  list: t.procedure
    .input(ReportListFilterSchema)
    .query(returns: ReportListItem[]),

  // Get report by ID
  getById: t.procedure
    .input(z.object({ reportId: z.string() }))
    .query(returns: ReportDetail),

  // Get report pages
  getPages: t.procedure
    .input(z.object({ reportId: z.string() }))
    .query(returns: ReportPage[]),

  // Export report
  export: t.procedure
    .input(ReportExportOptionsSchema)
    .mutation(returns: { exportId: string, status: 'queued' | 'processing' | 'completed' }),

  // Get export status
  getExportStatus: t.procedure
    .input(z.object({ exportId: z.string() }))
    .query(returns: ExportStatus),

  // Download export
  downloadExport: t.procedure
    .input(z.object({ exportId: z.string() }))
    .query(returns: { url: string, filename: string }),

  // Share report
  share: t.procedure
    .input(ShareLinkOptionsSchema)
    .mutation(returns: { shareToken: string, shareUrl: string }),

  // Get active share links
  getShareLinks: t.procedure
    .input(z.object({ reportId: z.string() }))
    .query(returns: ShareLink[]),

  // Revoke share link
  revokeShare: t.procedure
    .input(z.object({ shareToken: z.string() }))
    .mutation(returns: { success: boolean }),

  // Access shared report
  getSharedReport: t.procedure
    .input(z.object({
      shareToken: z.string(),
      password: z.string().optional()
    }))
    .query(returns: ReportDetail),
})
```

### Data Model Design

Define TypeScript interfaces in `data-model.md`:

```typescript
interface Report {
  id: string;
  tenantId: string;
  insightId: string;
  title: string;
  description?: string;
  status: 'completed' | 'in-progress' | 'failed';
  language: 'en' | 'ar' | 'fr';
  locale: string;
  dateRange: { start: Date; end: Date };
  connectors: string[];
  businessDomains: string[];
  metadata: ReportMetadata;
  sections: ReportSection[];
  createdAt: Date;
  generatedAt: Date;
}

interface ReportSection {
  id: string;
  type: 'executive-summary' | 'key-metrics' | 'data-visualizations' | 'detailed-analysis' | 'recommendations' | 'appendix';
  title: string;
  content: unknown; // Varies by section type
  order: number;
}

interface ReportExport {
  id: string;
  reportId: string;
  format: 'pdf' | 'excel';
  options: ReportExportOptions;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: Date;
  completedAt?: Date;
}

interface ShareLink {
  token: string;
  reportId: string;
  password?: string; // Hashed
  expiresAt?: Date;
  accessCount: number;
  createdAt: Date;
  createdBy: string;
}
```

### Component Architecture

Document component hierarchy and data flow:

```typescript
ReportLibrary (page)
├── ReportFilters (search, date range, filters)
├── ReportGrid (virtualized list)
│   └── ReportCard (preview, actions)
└── ReportPagination

ReportViewer (page)
├── ReportHeader (metadata, actions)
├── ReportContent
│   ├── ReportTableOfContents (sidebar)
│   ├── ReportPages (multi-page viewer)
│   │   └── ReportPage (single page renderer)
│   └── ReportControls (zoom, nav, fullscreen)
└── ReportActions (export, share, print)

ReportExportModal
├── FormatSelector (PDF/Excel)
├── ExportOptions (page numbers, raw data, quality)
├── EstimatedInfo (time, size)
└── ExportProgress (progress bar, status)

ReportShareModal
├── ShareOptions (public, password, expiration)
├── ShareUrl (copyable link, QR code)
└── ShareLinkManager (active links, revoke)
```

### Error Handling Strategy

Document error scenarios and handling:

1. **Report Not Found**: Display friendly error with link to report library
2. **Export Failed**: Show error details with retry option
3. **Share Link Expired**: Display expired message with request access option
4. **Invalid Password**: Show password error with retry
5. **Generation Timeout**: Show progress with cancel option

### Validation Schemas

Define Zod schemas for all inputs:

```typescript
const ReportListFilterSchema = z.object({
  search: z.string().optional(),
  dateRange: DateRangeSchema.optional(),
  insightIds: z.array(z.string()).optional(),
  connectors: z.array(z.string()).optional(),
  status: z.array(z.enum(['completed', 'in-progress', 'failed'])).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const ReportExportOptionsSchema = z.object({
  reportId: z.string(),
  format: z.enum(['pdf', 'excel']),
  includePageNumbers: z.boolean().default(true),
  includeRawData: z.boolean().default(false),
  imageQuality: z.enum(['low', 'medium', 'high']).default('medium'),
});

const ShareLinkOptionsSchema = z.object({
  reportId: z.string(),
  access: z.enum(['public', 'password']),
  password: z.string().optional(),
  expirationDays: z.number().min(1).max(365).default(30),
});
```

## Phase 2: Implementation Tasks

**Note**: This phase is executed by `/speckit.tasks` command based on spec.md user stories and plan.md technical design. See `tasks.md` for complete task breakdown organized by user story.

### Task Organization Overview

```text
Phase 1: Setup (Shared Infrastructure)
├── tRPC router setup
├── Component structure creation
└── Utility libraries (PDF, file download)

Phase 2: Foundational (Blocking Prerequisites)
├── Report data models and types
├── tRPC procedure implementations
├── Report viewer state management
└── Error handling infrastructure

Phase 3: User Story 1 - View Generated Reports (P1) 🎯 MVP
├── Report viewer page
├── Multi-page navigation
├── Table of contents
└── Chart rendering integration

Phase 4: User Story 2 - Export Reports (P1)
├── Export interface
├── PDF export handling
├── Excel export handling
└── Export progress tracking

Phase 5: User Story 3 - Report Library (P2)
├── Library page
├── Search and filtering
├── Report cards
└── Pagination/virtualization

Phase 6: User Story 4 - Share Reports (P2)
├── Share modal
├── Link generation
├── Access controls
└── Shared report page

Phase 7: Cross-Cutting Concerns
├── Accessibility compliance
├── RTL support
├── Performance optimization
└── Testing coverage
```

## Testing Strategy

### Unit Tests (Vitest)

- Report viewer component rendering and navigation
- Export modal state and validation
- Report library search and filter logic
- Share link generation and validation
- PDF viewer integration
- File download utilities

### Integration Tests (Vitest)

- tRPC procedure calls and data flow
- Report export workflow end-to-end
- Share link access and revocation
- Report library pagination and filtering

### E2E Tests (Playwright)

- Critical user journey: View and navigate a report
- Critical user journey: Export a report
- Critical user journey: Search report library
- Critical user journey: Share a report
- Critical user journey: Access shared report
- Accessibility testing with @axe-core/playwright

### Visual Regression Tests

- Report viewer layout across breakpoints
- Export modal appearance and states
- Report library card layouts
- Shared report page branding

## Performance Optimization

### Code Splitting

- Lazy load PDF.js worker
- Dynamic import for export modals
- Route-based splitting for report pages

### Caching Strategy

- Cache report metadata in React Query
- Cache rendered pages in memory
- Preload adjacent pages for smooth navigation

### Bundle Optimization

- Tree-shake unused PDF.js modules
- Lazy load chart rendering libraries
- Optimize image assets in reports

## Deployment Considerations

### Environment Variables

```bash
# Report generation
VITE_REPORT_MAX_FILE_SIZE=50  # MB
VITE_EXPORT_TIMEOUT=300  # seconds

# Share links
VITE_SHARE_LINK_DEFAULT_EXPIRATION=30  # days
VITE_SHARE_LINK_MAX_EXPIRATION=365  # days

# PDF rendering
VITE_PDF_WORKER_URL=/pdf.worker.min.js
```

### Feature Flags

- `enableReportSharing`: Enable/disable share functionality
- `enableExcelExport`: Enable/disable Excel exports
- `enableReportLibrary`: Enable/disable historical reports

## Monitoring and Observability

### Metrics to Track

- Report view count and duration
- Export success rate and processing time
- Share link creation and access rate
- Report library search usage
- PDF rendering performance

### Error Tracking

- Report generation failures
- Export processing errors
- Share link access failures
- PDF rendering errors

## Rollout Plan

### Phase 1: Internal Testing (Week 1)

- Deploy to development environment
- Test with sample reports
- Validate export functionality
- Test share links

### Phase 2: Beta Release (Week 2)

- Deploy to staging environment
- Test with real customer data
- Gather feedback from beta users
- Performance testing

### Phase 3: Production Release (Week 3)

- Deploy to production
- Monitor metrics and errors
- Gather user feedback
- Iterate on issues

## Success Metrics

### Technical Metrics

- Report viewer load time: <2s (3G connection)
- Page navigation time: <500ms
- Export success rate: >98%
- Share link success rate: >99%
- Zero critical accessibility violations

### User Metrics

- 90% of users successfully view reports on first attempt
- 95% of users successfully export reports on first attempt
- <5% support requests related to report viewing/exporting
- Average time to find report in library: <30s

## Risks and Mitigations

### Risk 1: PDF Rendering Performance

**Mitigation**: Use web workers, implement page lazy loading, add loading indicators

### Risk 2: Excel Export Complexity

**Mitigation**: Start with basic Excel export, iterate on formatting, test with large datasets

### Risk 3: RTL Layout Issues

**Mitigation**: Test extensively with Arabic content, use CSS logical properties, validate in both directions

### Risk 4: Share Link Security

**Mitigation**: Implement secure token generation, enforce expiration, track access for audit

## Next Steps

1. Complete Phase 0 research for PDF rendering and export libraries
2. Define detailed API contracts in `contracts/`
3. Create data model documentation in `data-model.md`
4. Execute `/speckit.tasks` to generate detailed task breakdown
5. Begin implementation with foundational infrastructure (Phase 1 & 2)
6. Prioritize User Story 1 (Report Viewing) for MVP delivery
