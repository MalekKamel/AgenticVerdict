# Implementation Plan: UI Insights

**Branch**: `004-ui-insights` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Priority**: ⭐ HIGHEST PRIORITY - Primary Value Feature
**Input**: Feature specification from `/specs/01-ui/04-insights/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement the primary value feature of the AgenticVerdict platform: the Insight creation, management, and consumption interface. This phase delivers a multi-step wizard for configuring insights (template/connector/metric selection, AI configuration, scheduling), an insight list page with comprehensive search/filter capabilities, an insight detail view with interactive data visualizations, insight clone and edit functionality, and an insight feed for consuming generated intelligence. Built on TanStack Start with Mantine v9 components, Recharts for data visualization, and TanStack Store for wizard state management, with full RTL/LTR internationalization support and WCAG 2.1 AA accessibility compliance.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), React 18+
**Primary Dependencies**:
- TanStack Start (framework with file-based routing)
- Mantine v9 (component library: Stepper, Select, MultiSelect, DatePicker, Cards, Tables)
- Recharts (data visualization: LineChart, AreaChart, BarChart, Line, Area, Bar, Tooltip, Legend)
- @tanstack/react-router with i18n (routing and internationalization)
- @tanstack/react-store (wizard state management)
- tRPC v11 (type-safe API for insight CRUD operations)
- @mantine/core (CSS-in-JS styling with RTL support)
- Zod (form validation schemas)
**Storage**: N/A (frontend UI; insight data from backend tRPC API)
**Testing**: Vitest (unit tests), Playwright (E2E tests for critical user journeys), @axe-core/react (accessibility)
**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge) with CSS custom properties support
**Project Type**: Web application (monorepo package: apps/web with routes in src/routes/)
**Performance Goals**:
- Insight list load time: <2s (3G connection)
- Wizard step transition: <500ms
- Chart render time: <1.5s (10+ metrics, 30+ days)
- Feed initial render: <2s (10 insights)
- Chart interaction latency: <100ms (hover, toggle)
**Constraints**:
- WCAG 2.1 AA compliance (non-negotiable)
- Zero `any` types (strict TypeScript)
- RTL support from day one (Arabic primary)
- Route-based code splitting for components >50KB
- Form validation via Zod schemas
- State management via TanStack Store for wizard
**Scale/Scope**:
- 6-step wizard with ~10 form fields per step
- 20+ insight list columns and filters
- 15+ chart types with multi-metric support
- 5+ connector types with 50+ metrics
- 10+ templates for common use cases
- Support for 100+ insights per tenant
- Feed with 1000+ insight items

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Multi-Tenancy First ✅ PASS

**Requirement**: Tenant context propagation and isolation
**Implementation**:
- All insight CRUD operations scoped to current tenant from backend tRPC API
- Insight list and feed automatically filter by authenticated tenant
- Tenant-specific connectors and metrics populate wizard options
- No cross-tenant data leakage in insights or visualizations

**Status**: Compliant - Tenant isolation enforced via backend API

### II. Configuration-Driven Architecture ✅ PASS

**Requirement**: Company-specific behavior through CompanyConfig schema
**Implementation**:
- Template availability based on tenant's business domains from CompanyConfig
- AI model options filtered by tenant's AI provider configuration
- Connector options filtered by tenant's connected connectors
- Schedule and delivery defaults from tenant settings

**Status**: Compliant - All insight configuration flows through tenant context

### III. Plugin Architecture ✅ PASS

**Requirement**: ConnectorAdapter interface for data connectors
**Implementation**:
- Connector selection step displays all available ConnectorAdapter implementations
- Metric discovery uses ConnectorAdapter.normalizeData() schema
- Connector health status from ConnectorAdapter.isHealthy()
- Insight generation uses unified NormalizedConnectorSnapshot format

**Status**: Compliant - Wizard integrates with existing connector plugin system

### IV. Type Safety & Quality Standards ✅ PASS

**Requirement**: Zero `any` types, strict TypeScript, Zod validation
**Implementation**:
- All insight entities typed with TypeScript interfaces
- Form validation via Zod schemas for all wizard steps
- tRPC provides end-to-end type safety for insight CRUD operations
- Chart data types enforced with Recharts TypeScript definitions

**Status**: Compliant - Full type safety throughout

### V. Battle-Tested Technology Only ✅ PASS

**Requirement**: Use production-proven tools from technology research
**Implementation**:
- TanStack Start: Documented in architecture (approved framework)
- Mantine v9: Documented in architecture (approved component library)
- Recharts: Documented in UI architecture for data visualization
- TanStack Store: Documented in architecture for client state
- tRPC v11: Documented in architecture for API layer

**Status**: Compliant - All technologies from approved architecture

### Technology Standards Compliance

**Database Layer**: N/A (frontend UI - data from backend tRPC API)

**Testing Requirements**:
- Unit tests: Vitest with 70%+ coverage target
- E2E tests: Playwright for critical user journeys (insight creation, editing, feed viewing)
- Accessibility: @axe-core/react for WCAG 2.1 AA validation

**Docker & Infrastructure**: N/A (frontend web application)

### Development Standards Compliance

**Code Organization**:
- Feature-based routing: `apps/web/src/routes/insights/`
- Component organization: atoms (DataTable, ChartCard), molecules (FilterBar, MetricSelector), organisms (InsightWizard, InsightFeed)
- Reusable components extracted to `packages/ui/` where appropriate

**Error Handling**:
- tRPC error handling with user-friendly messages
- Form validation errors displayed inline
- Loading states for all async operations
- Retry functionality for failed insight generations

**Security Requirements**:
- All insight operations require authentication
- Tenant isolation enforced via backend API
- No credential storage in frontend
- Input validation via Zod schemas

**Language & Internationalization**:
- All UI strings externalized to i18n files
- DirectionProvider for RTL/LTR switching
- Logical properties for layout mirroring
- Locale-aware date/currency formatting

**Overall Status**: ✅ PASS - All applicable principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/04-insights/
├── spec.md              # Feature specification (user stories, requirements)
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (research findings - optional)
├── data-model.md        # Phase 1 output (entities and relationships)
├── quickstart.md        # Phase 1 output (developer quick start)
├── contracts/           # Phase 1 output (tRPC contract definitions)
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
apps/web/
├── src/
│   ├── routes/
│   │   ├── insights/
│   │   │   ├── index.tsx                    # Insight list page
│   │   │   ├── create.tsx                   # Insight creation wizard
│   │   │   ├── $insightId.tsx               # Insight detail page
│   │   │   ├── $insightId/edit.tsx          # Insight edit interface
│   │   │   ├── feed.tsx                     # Insight feed page
│   │   │   └── components/
│   │   │       ├── InsightList.tsx          # Insight list table/card
│   │   │       ├── InsightWizard.tsx        # Multi-step creation wizard
│   │   │       ├── TemplateSelector.tsx     # Template selection step
│   │   │       ├── ConnectorSelector.tsx    # Connector selection step
│   │   │       ├── MetricSelector.tsx       # Metric selection step
│   │   │       ├── AIConfigPanel.tsx        # AI configuration step
│   │   │       ├── ScheduleConfig.tsx       # Schedule & delivery step
│   │   │       ├── InsightDetail.tsx        # Detail view with charts
│   │   │       ├── InsightFeed.tsx          # Feed with infinite scroll
│   │   │       ├── MetricChart.tsx          # Recharts wrapper component
│   │   │       └── InsightActions.tsx       # Quick action buttons
│   │   └── __root.tsx                       # Root layout with providers
│   ├── stores/
│   │   └── insight-wizard-store.ts          # TanStack Store for wizard state
│   ├── components/
│   │   ├── molecules/
│   │   │   ├── FilterBar.tsx                # Reusable filter bar
│   │   │   ├── SearchInput.tsx              # Reusable search input
│   │   │   └── StatusBadge.tsx              # Status indicator badge
│   │   └── organisms/
│   │       ├── DataTable.tsx                # Reusable data table
│   │       └── ChartCard.tsx                # Reusable chart card
│   └── i18n/
│       ├── locales/
│       │   ├── ar.json                      # Arabic translations
│       │   └── en.json                      # English translations
│       └── i18n.ts
│
packages/api/src/router/
└── insights/
    ├── router.ts                             # tRPC insight router
    ├── queries.ts                            # Insight list, detail queries
    ├── mutations.ts                          # Create, update, delete, clone mutations
    └── schemas.ts                            # Zod validation schemas

packages/ui/src/                               # Shared UI components
├── atoms/
│   └── ...                                   # Buttons, inputs, badges from Phase 00
├── molecules/
│   ├── DataTable/                            # Extract from app if reusable
│   ├── FilterBar/                            # Extract from app if reusable
│   └── MultiSelect/                          # Custom multi-select if needed
└── organisms/
    └── Chart/                                # Reusable chart wrapper
```

**Structure Decision**: Feature-based routing in `apps/web/src/routes/insights/` with co-located components for tight coupling. Shared components extracted to `packages/ui/` when reused across features. TanStack Store for wizard state management. tRPC router in `packages/api/` following monorepo conventions. This structure balances discoverability with code organization and aligns with TanStack Start best practices.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A | No violations | All applicable constitution principles satisfied |

---

## Phase Completion Status

### Phase 0: Research 🔄 IN PROGRESS

**Deliverables**:
- [x] spec.md with user stories and requirements
- [x] plan.md with technical approach and structure
- [ ] research.md (optional - if additional prototyping needed)
- [ ] data-model.md with insight entities and relationships
- [ ] contracts/ with tRPC API contracts
- [ ] quickstart.md for developer onboarding

**Research Questions**:
- Recharts component architecture for multi-metric, multi-connector visualization
- TanStack Store patterns for complex wizard state management
- Mantine v9 Stepper component with custom step content
- Infinite scroll implementation patterns for insight feed
- tRPC router organization for insight CRUD operations

**Status**: In progress - research.md optional unless prototyping reveals unknowns

### Phase 1: Design & Contracts ⏸️ PENDING

**Deliverables**:
- [ ] data-model.md with Insight, Template, Connector, Metric entities
- [ ] contracts/insights-api.md with tRPC procedure signatures
- [ ] contracts/wizard-state.md with TanStack Store schema
- [ ] quickstart.md for developers

**Entities to Define**:
- Insight (configuration, status, schedule, delivery)
- InsightFeedItem (generated instance with timestamp and metrics)
- Template (pre-built configurations)
- AIConfiguration (model, quality, detail level, custom prompts)
- ScheduleConfiguration (frequency, time, timezone, cron)
- DeliveryConfiguration (channels, recipients, formats)

**tRPC Procedures**:
- Queries: insights.list, insights.detail, insights.feed, insights.templates
- Mutations: insights.create, insights.update, insights.delete, insights.clone, insights.activate, insights.deactivate

**Status**: Pending Phase 0 completion

### Constitution Re-Check ✅ PASS (Pre-Design)

**Pre-Design Evaluation**:

| Principle | Status | Notes |
|-----------|--------|-------|
| Multi-Tenancy First | ✅ PASS | Tenant isolation via backend API |
| Configuration-Driven Architecture | ✅ PASS | Tenant context informs all options |
| Plugin Architecture | ✅ PASS | Connector integration via adapters |
| Type Safety & Quality Standards | ✅ PASS | TypeScript + Zod throughout |
| Battle-Tested Technology Only | ✅ PASS | All from approved architecture |

**Overall Status**: ✅ PASS - No violations or complexity justifications required

---

## Architecture Highlights

### Multi-Step Wizard with TanStack Store

```typescript
// apps/web/src/stores/insight-wizard-store.ts
import { createStore } from '@tanstack/react-store'

interface InsightWizardState {
  currentStep: number
  templateId: string | null
  connectorIds: string[]
  metricIds: string[]
  aiConfig: AIConfiguration
  scheduleConfig: ScheduleConfiguration
  deliveryConfig: DeliveryConfiguration
  isDirty: boolean
}

export const insightWizardStore = createStore<InsightWizardState>({
  currentStep: 0,
  templateId: null,
  connectorIds: [],
  metricIds: [],
  aiConfig: defaultAIConfig,
  scheduleConfig: defaultScheduleConfig,
  deliveryConfig: defaultDeliveryConfig,
  isDirty: false,
})
```

**Benefits**: Type-safe state management, dev tools integration, automatic persistence, optimized re-renders

### Recharts Data Visualization

```typescript
// apps/web/src/routes/insights/components/MetricChart.tsx
import { LineChart, Line, AreaChart, Area, BarChart, Bar, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MetricChartProps {
  data: MetricDataPoint[]
  metrics: Metric[]
  chartType: 'line' | 'area' | 'bar'
  dateRange: DateRange
}

export function MetricChart({ data, metrics, chartType, dateRange }: MetricChartProps) {
  const ChartComponent = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : BarChart

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ChartComponent data={data}>
        {metrics.map((metric) => (
          <Line
            key={metric.id}
            type="monotone"
            dataKey={metric.id}
            stroke={metric.color}
            name={metric.name}
          />
        ))}
        <Tooltip />
        <Legend />
      </ChartComponent>
    </ResponsiveContainer>
  )
}
```

**Benefits**: Declarative chart API, SSR-compatible, TypeScript support, responsive by default, RTL-compatible

### tRPC Insight Router

```typescript
// packages/api/src/router/insights/router.ts
import { t } from '../trpc'
import { insightsQueries } from './queries'
import { insightsMutations } from './mutations'

export const insightsRouter = t.router({
  // Queries
  list: t.procedure
    .input(insightListInputSchema)
    .query(({ ctx, input }) => insightsQueries.list(ctx, input)),

  detail: t.procedure
    .input(z.object({ insightId: z.string() }))
    .query(({ ctx, input }) => insightsQueries.detail(ctx, input.insightId)),

  feed: t.procedure
    .input(insightFeedInputSchema)
    .query(({ ctx, input }) => insightsQueries.feed(ctx, input)),

  // Mutations
  create: t.procedure
    .input(insightCreateInputSchema)
    .mutation(({ ctx, input }) => insightsMutations.create(ctx, input)),

  update: t.procedure
    .input(insightUpdateInputSchema)
    .mutation(({ ctx, input }) => insightsMutations.update(ctx, input)),

  delete: t.procedure
    .input(z.object({ insightId: z.string() }))
    .mutation(({ ctx, input }) => insightsMutations.delete(ctx, input.insightId)),

  clone: t.procedure
    .input(z.object({ insightId: z.string() }))
    .mutation(({ ctx, input }) => insightsMutations.clone(ctx, input.insightId)),
})
```

**Benefits**: End-to-end type safety, automatic input validation, unified API for web/mobile/CLI

### Mantine v9 Stepper for Wizard

```typescript
// apps/web/src/routes/insights/components/InsightWizard.tsx
import { Stepper, Button, Group } from '@mantine/core'

const steps = [
  { title: 'Template', description: 'Choose a starting point' },
  { title: 'Connectors', description: 'Select data sources' },
  { title: 'Metrics', description: 'Choose what to track' },
  { title: 'AI Config', description: 'Configure analysis' },
  { title: 'Schedule', description: 'Set delivery' },
  { title: 'Review', description: 'Confirm and activate' },
]

export function InsightWizard() {
  const [active, setActive] = useState(0)
  const wizardState = useInsightWizardStore()

  const nextStep = () => setActive((current) => (current < 5 ? current + 1 : current))
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current))

  return (
    <Stack>
      <Stepper active={active} onStepClick={setActive}>
        {steps.map((step, index) => (
          <Stepper.Step key={index} label={step.title} description={step.description}>
            {/* Step content rendered here */}
          </Stepper.Step>
        ))}
      </Stepper>

      <Group justify="flex-end" mt="xl">
        {active > 0 && <Button onClick={prevStep}>Back</Button>}
        {active < 5 && <Button onClick={nextStep}>Next</Button>}
        {active === 5 && <Button onClick={handleActivate}>Activate Insight</Button>}
      </Group>
    </Stack>
  )
}
```

**Benefits**: Built-in progress indicator, keyboard navigation, accessible, RTL support, minimal custom code

---

## Next Steps

### Phase 0: Research (Optional)

**Decision Point**: If prototyping reveals unknowns, create research.md with:
- Recharts multi-metric visualization patterns
- TanStack Store wizard state best practices
- Mantine v9 Stepper customization options
- Infinite scroll implementation patterns
- tRPC router organization for complex CRUD

**Command**: Proceed directly to Phase 1 if research questions have known answers

### Phase 1: Design & Contracts (Ready to Execute)

**Command**: Create design artifacts manually or via documentation tools

**Expected Output**:
- data-model.md with Insight, Template, AIConfiguration, ScheduleConfiguration entities
- contracts/insights-api.md with tRPC procedure signatures
- contracts/wizard-state.md with TanStack Store schema
- quickstart.md with developer setup instructions

**Estimated Effort**: 2-3 days

### Phase 2: Task Generation (After Phase 1)

**Command**: `/speckit-tasks` (or manually create tasks.md)

**Expected Output**:
- Insight list page implementation tasks
- Wizard implementation tasks (6 steps)
- Insight detail view with charts tasks
- Insight feed implementation tasks
- tRPC router implementation tasks
- Testing tasks (unit, E2E, accessibility)

**Estimated Effort**: 3 weeks implementation (based on PHASES.md timeline)

---

## Artifacts Generated

| Artifact | Path | Purpose |
|----------|------|---------|
| Feature Specification | `/specs/01-ui/04-insights/spec.md` | User stories, requirements, success criteria |
| Implementation Plan | `/specs/01-ui/04-insights/plan.md` | This file - technical approach and structure |
| Research Findings | `/specs/01-ui/04-insights/research.md` | Optional - technology decisions and rationale |
| Data Model | `/specs/01-ui/04-insights/data-model.md` | Entity definitions and relationships |
| API Contracts | `/specs/01-ui/04-insights/contracts/` | tRPC procedure signatures and schemas |
| Quick Start Guide | `/specs/01-ui/04-insights/quickstart.md` | Developer onboarding guide |

---

## References

### Architecture Documentation
- **UI Architecture Overview**: `/docs/architecture/ui/00-overview.md`
- **Business Architecture**: `/docs/architecture/business/business-architecture.md`
- **Technical Architecture**: `/docs/architecture/business/technical-architecture.md`
- **Implementation Guide**: `/docs/architecture/business/implementation-guide.md`

### Project Documentation
- **UI Phase Timeline**: `/specs/01-ui/PHASES.md`
- **Core Intelligence Spec**: `/specs/00-core/02-intelligence/README.md`
- **Core Insights Spec**: `/specs/00-core/03-insights/README.md`
- **Testing Strategy**: `/docs/02-planning-and-methodology/testing-strategy.md`
- **Constitution**: `.specify/memory/constitution.md`

### Related Phases
- **Phase 00: Foundation**: `/specs/01-ui/00-foundation/` (base components, design tokens)
- **Phase 02: Scaffold**: `/specs/01-ui/02-scaffold/` (layouts, navigation)
- **Phase 03: Connectors**: `/specs/01-ui/03-connectors/` (connector management UI)
- **Phase 06: Templates**: `/specs/01-ui/06-templates/` (template library and management)

---

**Plan Status**: ✅ COMPLETE - Ready for Phase 1 design artifacts
**Last Updated**: 2026-04-14
**Maintainer**: AgenticVerdict Architecture Team
**Priority**: ⭐ HIGHEST PRIORITY - Primary Value Feature
