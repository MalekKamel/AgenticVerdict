# Implementation Plan: Agency Partner Dashboard

**Branch**: `10-agency` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/10-agency/spec.md`

## Summary

Phase 10 implements the agency partner dashboard with aggregated metrics across multiple client tenants, per-client performance deep dives, client comparison features, and white-label branding customization. This extends the multi-tenant architecture to support agency partners who manage multiple client accounts while maintaining complete data isolation.

**Primary Requirement**: Agency partners need centralized visibility into all client performance from a single dashboard without switching between tenants.

**Technical Approach**: Build on Phase 9 (Tenant Management) multi-tenant switching infrastructure to create aggregated views using tRPC procedures that query across client tenants with proper authorization. Use Mantine v9 components for responsive grid layouts, Recharts for data visualization, and TanStack Start routing for navigation. Implement white-label branding using the three-tier design token system established in Phase 0.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**:
- TanStack Start (file-based routing, load & action pattern)
- tRPC v11 (type-safe API procedures)
- Mantine UI v9 (component library with RTL support)
- Recharts (data visualization with RTL support)
- @tanstack/react-virtual (virtual scrolling for large client lists)

**Storage**: PostgreSQL 16 with Drizzle ORM (tenant-scoped queries via AsyncLocalStorage)
**Testing**: Vitest (unit tests), Playwright (E2E tests for agency workflows)
**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge) - desktop and mobile responsive
**Project Type**: Web application (multi-tenant SaaS)
**Performance Goals**:
- <3s agency dashboard initial load time (even with 50+ clients)
- <500ms client card hover preview display
- <2s navigation from agency dashboard to client detail view
- <1s multi-client comparison view render time

**Constraints**:
- Must support RTL/LTR layouts for agency partners in Arabic-speaking regions
- Must maintain complete tenant isolation using AsyncLocalStorage context propagation
- Must support virtual scrolling for agencies with 50+ clients
- Must validate logo uploads (size limits, format validation)
- Must apply branding changes in real-time without page reloads

**Scale/Scope**:
- Support agency partners managing 5-100+ client tenants
- Display 3-5 KPIs per client card
- Support 2-4 client simultaneous comparisons
- Support SVG/PNG/JPG logo uploads up to 2MB

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **Architecture Alignment**: Multi-tenant architecture with AsyncLocalStorage context propagation is already specified in CLAUDE.md
✅ **Technology Stack**: TanStack Start + Mantine v9 + tRPC v11 aligns with existing stack
✅ **Accessibility**: WCAG 2.1 AA compliance required for all agency dashboard components
✅ **Performance**: Virtual scrolling required for 50+ client portfolios to meet <3s load target
✅ **Internationalization**: RTL/LTR support required for Arabic-speaking agency partners
✅ **Design System**: Three-tier token system from Phase 0 enables white-label branding without code changes

⚠️ **Complexity Consideration**: Aggregated queries across multiple client tenants add complexity to data layer. Justified by:
- Agency partner use case is core business requirement
- Phase 9 (Tenant Management) already establishes multi-tenant switching patterns
- AsyncLocalStorage context propagation provides tenant isolation without query complexity
- White-label branding uses existing three-tier token system (no new architecture)

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/10-agency/
├── plan.md              # This file
├── spec.md              # Feature specification (user stories, requirements)
├── tasks.md             # Implementation tasks (to be generated)
└── contracts/           # API contracts (tRPC router schemas)
    ├── agency-dashboard.ts      # Aggregated metrics procedures
    ├── client-detail.ts         # Per-client performance procedures
    ├── client-comparison.ts     # Multi-client comparison procedures
    └── branding.ts              # Branding configuration procedures
```

### Source Code (repository root)

```text
apps/web/src/
├── routes/
│   ├── agency/
│   │   ├── index.tsx                    # Agency dashboard overview
│   │   ├── clients.$clientId.tsx        # Client detail performance view
│   │   ├── compare.tsx                  # Multi-client comparison view
│   │   └── settings.branding.tsx        # White-label branding settings
│   └── dashboard.tsx                    # Regular tenant dashboard (existing)
│
├── components/
│   ├── agency/
│   │   ├── AgencyDashboard.tsx          # Main dashboard layout
│   │   ├── ClientCard.tsx               # Individual client card component
│   │   ├── ClientCardGrid.tsx           # Virtualized grid of client cards
│   │   ├── ClientPerformanceView.tsx    # Detailed client metrics view
│   │   ├── ClientComparisonView.tsx     # Side-by-side comparison interface
│   │   ├── AggregatedMetrics.tsx        # Summary metrics across all clients
│   │   ├── BrandingSettings.tsx         # White-label customization form
│   │   └── BrandingPreview.tsx          # Live preview component
│   │
│   └── molecules/                       # Existing shared components
│       ├── MetricCard.tsx               # Reusable metric display card
│       ├── StatusBadge.tsx              # Health status indicator
│       └── ChartContainer.tsx           # Recharts wrapper with RTL support
│
├── hooks/
│   ├── useAgencyMetrics.ts              # Query aggregated agency metrics
│   ├── useClientPerformance.ts          # Query per-client performance data
│   ├── useClientComparison.ts           # Query comparison data for selected clients
│   └── useBrandingConfig.ts             # Query/mutate agency branding settings
│
└── stores/
    └── agency-store.ts                  # Agency dashboard client state (TanStack Store)

packages/api/src/router/
├── agency.ts                            # Agency-specific tRPC router
│   ├── getAggregatedMetrics             # Query: Summary metrics across all clients
│   ├── getClientList                    # Query: Paginated list of client tenants
│   ├── getClientPerformance             # Query: Detailed metrics for single client
│   ├── compareClients                   # Query: Normalized comparison data
│   └── updateBranding                   # Mutation: Update white-label branding
│
└── ... (existing routers)

packages/database/src/schema/
├── tenants.ts                           # Existing tenant schema
├── agency_partners.ts                   # Agency partner relationships (if separate table needed)
└── branding.ts                          # Branding configuration schema (if separate from CompanyConfig)
```

**Structure Decision**: Following established TanStack Start conventions with file-based routing under `routes/agency/`. Agency-specific components organized in `components/agency/` to separate them from general dashboard components. tRPC router follows existing patterns in `packages/api/src/router/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| Aggregated cross-tenant queries | Agency partners need portfolio visibility without switching tenants | Individual tenant switching would require 50+ clicks for large agencies - poor UX |
| Virtual scrolling for client grids | 50+ clients would cause performance issues with simple rendering | Pagination would require users to navigate multiple pages to see overview - violates "single dashboard" requirement |
| White-label branding system | Agencies need to present platform as their own solution | Hardcoded branding would prevent white-label use case - core business requirement |
| Multi-client comparison state management | Comparing 2-4 clients requires complex selection state | Sequential client viewing would not enable benchmarking across portfolio |

---

## Phase 0: Research (Already Complete)

This phase leverages existing research from:

- **UI Architecture**: `/docs/architecture/ui/00-overview.md` - Design system, component organization, RTL support
- **Multi-Tenancy**: `/docs/architecture/business/business-architecture.md` - Tenant isolation, AsyncLocalStorage patterns
- **Agency Use Case**: `/specs/01-ui/PHASES.md` - Phase 10 requirements and dependencies

No additional research required - all technical decisions leverage established architecture.

---

## Phase 1: Design

### Data Model

```typescript
// Agency Partner Dashboard Queries
interface AgencyDashboardMetrics {
  totalClients: number;
  activeConnectors: number;
  overallHealthScore: number;
  clientsNeedingAttention: number;
  recentInsights: InsightSummary[];
}

interface ClientCardData {
  clientId: string;
  clientName: string;
  logoUrl: string;
  metrics: {
    primaryKPI: { value: number; change: number; label: string };
    healthScore: number;
    activeConnectors: number;
    lastInsightDate: string;
  };
  status: "healthy" | "warning" | "critical" | "setup-pending";
}

// Client Detail View
interface ClientPerformanceData {
  clientId: string;
  clientName: string;
  domains: {
    marketing?: DomainMetrics;
    finance?: DomainMetrics;
    operations?: DomainMetrics;
    seo?: DomainMetrics;
    social?: DomainMetrics;
    local?: DomainMetrics;
  };
  connectorHealth: ConnectorHealthStatus[];
  recentInsights: InsightSummary[];
}

// Client Comparison
interface ClientComparisonData {
  clients: Array<{
    clientId: string;
    clientName: string;
    metrics: NormalizedMetrics;
  }>;
  benchmarking: {
    bestPerformingClient: string;
    metricRankings: Record<string, string[]>; // metric -> [clientIds ranked]
  };
}

// Branding Configuration
interface AgencyBranding {
  agencyId: string;
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  appliedTo: "dashboard" | "reports" | "both";
}
```

### API Contracts (tRPC Procedures)

```typescript
// packages/api/src/router/agency.ts
import { z } from "zod";
import { t } from "../trpc";

export const agencyRouter = t.router({
  // Get aggregated metrics for agency dashboard
  getAggregatedMetrics: t.procedure
    .input(z.object({
      agencyTenantId: z.string().uuid(),
      dateRange: DateRangeSchema,
    }))
    .query(async ({ input, ctx }) => {
      // Query across all client tenants managed by agency
      // Return aggregated metrics
    }),

  // Get paginated list of client tenants
  getClientList: t.procedure
    .input(z.object({
      agencyTenantId: z.string().uuid(),
      pagination: z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
      filters: z.object({
        status: z.enum(["healthy", "warning", "critical", "setup-pending"]).optional(),
        search: z.string().optional(),
      }).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Return paginated client list with card data
    }),

  // Get detailed performance for single client
  getClientPerformance: t.procedure
    .input(z.object({
      agencyTenantId: z.string().uuid(),
      clientTenantId: z.string().uuid(),
      dateRange: DateRangeSchema,
    }))
    .query(async ({ input, ctx }) => {
      // Return detailed performance data
    }),

  // Compare multiple clients
  compareClients: t.procedure
    .input(z.object({
      agencyTenantId: z.string().uuid(),
      clientTenantIds: z.array(z.string().uuid()).min(2).max(4),
      dateRange: DateRangeSchema,
    }))
    .query(async ({ input, ctx }) => {
      // Return normalized comparison data
    }),

  // Update agency branding
  updateBranding: t.procedure
    .input(z.object({
      agencyTenantId: z.string().uuid(),
      branding: AgencyBrandingSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      // Update branding configuration
    }),
});
```

### Component Architecture

```typescript
// Agency Dashboard Layout
<AgencyDashboard>
  <DashboardHeader>
    <AgencyBrandingLogo />
    <TenantSwitcher /> // From Phase 9
  </DashboardHeader>

  <AggregatedMetrics /> // Summary cards

  <ClientFilters>
    <SearchInput />
    <StatusFilter />
    <DomainFilter />
  </ClientFilters>

  <ClientCardGrid>
    {/* Virtualized grid of ClientCard components */}
    <ClientCard />
    <ClientCard />
    ...
  </ClientCardGrid>
</AgencyDashboard>

// Client Card Component
<ClientCard>
  <CardHeader>
    <ClientLogo />
    <ClientName />
    <StatusBadge />
  </CardHeader>

  <CardBody>
    <PrimaryKPI />
    <HealthScore />
    <ConnectorCount />
  </CardBody>

  <CardActions>
    <ViewDetailsButton />
    <HoverPreview /> // Shows recent insights on hover
  </CardActions>
</ClientCard>

// Client Comparison View
<ClientComparisonView>
  <ComparisonHeader>
    <ClientSelector /> // Select 2-4 clients
    <DateRangePicker />
  </ComparisonHeader>

  <ComparisonGrid>
    <ComparisonColumn client="Client A">
      <MetricComparison metric="Revenue" rank="1st" />
      <MetricComparison metric="Engagement" rank="3rd" />
      ...
    </ComparisonColumn>

    <ComparisonColumn client="Client B">
      <MetricComparison metric="Revenue" rank="2nd" />
      <MetricComparison metric="Engagement" rank="1st" />
      ...
    </ComparisonColumn>
  </ComparisonGrid>
</ClientComparisonView>
```

### Key Technical Decisions

1. **Virtual Scrolling**: Use `@tanstack/react-virtual` for client card grid to support 50+ clients without performance degradation
2. **State Management**: Use TanStack Store for agency dashboard client state (selected clients, filters, sort order)
3. **Data Fetching**: Use tRPC React Query hooks with optimistic updates for branding changes
4. **Branding Application**: Use CSS custom properties for real-time branding updates without page reloads
5. **RTL Support**: Leverage Mantine v9's automatic RTL handling with logical properties
6. **Navigation**: Use TanStack Router's navigation with state preservation for back/forward navigation
7. **Comparison UI**: Use side-by-side card layout with visual indicators (badges, colors) for rankings

---

## Phase 2: Implementation Strategy

### Development Order

1. **Foundation** (Days 1-2):
   - Set up agency tRPC router and base procedures
   - Create agency route structure in `apps/web/src/routes/agency/`
   - Implement TanStack Store for agency dashboard state

2. **Dashboard Overview** (Days 3-5):
   - Build `AggregatedMetrics` component
   - Implement `ClientCard` component with hover preview
   - Create virtualized `ClientCardGrid` with filters
   - Connect to `getAggregatedMetrics` and `getClientList` procedures

3. **Client Detail View** (Days 6-7):
   - Build `ClientPerformanceView` component
   - Implement domain-specific metric displays
   - Add connector health section
   - Connect to `getClientPerformance` procedure

4. **Client Comparison** (Days 8-9):
   - Build `ClientComparisonView` component
   - Implement client selection UI
   - Create comparison grid with ranking indicators
   - Connect to `compareClients` procedure

5. **White-Label Branding** (Days 10-11):
   - Build `BrandingSettings` form component
   - Implement `BrandingPreview` component
   - Add logo upload validation
   - Implement real-time CSS custom property updates
   - Connect to `updateBranding` mutation

6. **Testing & Polish** (Days 12-14):
   - Write unit tests for components
   - Write E2E tests for agency workflows
   - Accessibility audit and remediation
   - Performance optimization (bundle analysis, lazy loading)
   - RTL layout validation

### Parallel Development Opportunities

- **Days 3-5**: Dashboard overview can be developed in parallel with client detail view (Days 6-7) if team capacity allows
- **Days 8-9**: Client comparison can be developed in parallel with branding settings (Days 10-11)
- **Testing**: Unit tests can be written alongside component development (test-driven approach)

### Risk Mitigation

1. **Cross-Tenant Query Performance**: Use pagination and cursor-based loading to avoid loading all client data at once
2. **Branding Update Latency**: Use CSS custom properties for instant preview; persist changes via background mutation
3. **Virtual Scrolling Complexity**: Start with simple pagination if virtual scrolling proves too complex; add virtualization in follow-up
4. **Comparison State Management**: Keep comparison state simple (max 4 clients); validate on selection to prevent invalid states

---

## Success Metrics

### Performance Targets
- Agency dashboard initial load: <3s (50 clients)
- Client card hover preview: <500ms
- Navigation to client detail: <2s
- Comparison view render: <1s
- Branding preview update: <100ms (instant)

### Accessibility Targets
- WCAG 2.1 AA compliance for all agency dashboard components
- Keyboard navigation for client selection and comparison
- Screen reader compatibility for client cards and comparison view
- High contrast mode support for status indicators

### Quality Targets
- 70%+ unit test coverage for agency components
- E2E test coverage for critical agency workflows
- Zero console errors in production
- RTL layout validation for Arabic agency partners

---

## Dependencies

### Phase Dependencies
- **Phase 0 (Foundation)**: Design system, Mantine v9, RTL support
- **Phase 1 (Authentication)**: User authentication and authorization
- **Phase 2 (Scaffold)**: Dashboard layout, navigation structure
- **Phase 9 (Tenant Management)**: Multi-tenant switching, tenant context

### External Dependencies
- **@tanstack/react-virtual**: Virtual scrolling for large client lists
- **Recharts**: Data visualization for metrics and comparisons
- **@tanstack/react-router**: File-based routing and navigation
- **tRPC**: Type-safe API procedures

---

## Open Questions

1. **Logo Storage**: Should agency logos be stored in the database (as base64) or in object storage (S3)? Recommend object storage for better performance and cost efficiency.

2. **Branding Scope**: Should agency branding apply to all client tenants or only to views accessed through the agency dashboard? Recommend agency-dashboard-only to respect individual client branding preferences.

3. **Client Limit**: Should we enforce a maximum number of clients per agency partner? Recommend 100 client limit for performance; can be increased with additional optimization.

4. **Comparison Metrics**: Which metrics should be included in the comparison view? Recommend normalizing to 5-7 key metrics across business domains to avoid overwhelming users.

---

## Next Steps

1. **Review this plan** with product and engineering teams
2. **Create tasks.md** using `/speckit.tasks` command to generate detailed implementation tasks
3. **Set up agency tRPC router** with base procedures
4. **Begin implementation** with Dashboard Overview (highest priority user story)
