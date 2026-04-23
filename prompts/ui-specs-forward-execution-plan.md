# UI Specifications Forward Execution Plan

## Context

The AgenticVerdict platform requires comprehensive UI specifications across 14 implementation phases. This execution plan guides the systematic generation of complete specifications for all UI features using SpecKit's three-command specification workflow.

**Authority**: `/docs/architecture/ui/00-overview.md` is the single source of truth for all UI system specifications. All generated specifications must align with the architecture, principles, and constraints documented therein.

---

## Overview

This execution plan orchestrates the creation of detailed specifications for 14 UI implementation phases, spanning approximately 14 weeks of development work. Each phase follows a standardized three-command sequence using SpecKit to produce:

1. **Functional Specifications** (`/speckit-specify`) — Business requirements, user outcomes, and feature scope
2. **Technical Implementation** (`/speckit-plan`) — Architecture, components, patterns, and integration points
3. **Task Breakdown** (`/speckit.tasks`) — Actionable development tasks with acceptance criteria

---

## Phase Inventory

| Phase | Directory                               | Duration               | Dependencies                                                 | Priority |
| ----- | --------------------------------------- | ---------------------- | ------------------------------------------------------------ | -------- |
| 00    | `/specs/01-ui/00-foundation/`           | Weeks 1-2              | None                                                         | CRITICAL |
| 01    | `/specs/01-ui/01-authentication/`       | 3-5 days               | 00-foundation                                                | CRITICAL |
| 02    | `/specs/01-ui/02-scaffold/`             | 1 week                 | 00-foundation, 01-authentication                             | CRITICAL |
| 03    | `/specs/01-ui/03-connectors/`           | 2 weeks                | 00-foundation, 01-authentication, 02-scaffold                | HIGH     |
| 04    | `/specs/01-ui/04-insights/`             | 3 weeks                | 00-foundation, 01-authentication, 02-scaffold, 03-connectors | HIGHEST  |
| 05    | `/specs/01-ui/05-reports/`              | 1-2 weeks              | 00-foundation, 04-insights                                   | HIGH     |
| 06    | `/specs/01-ui/06-templates/`            | 1-2 weeks              | 00-foundation, 04-insights                                   | MEDIUM   |
| 07    | `/specs/01-ui/07-scheduling/`           | 1-2 weeks              | 00-foundation, 04-insights                                   | MEDIUM   |
| 08    | `/specs/01-ui/08-settings/`             | 1 week                 | 00-foundation, 01-authentication                             | MEDIUM   |
| 09    | `/specs/01-ui/09-tenant-management/`    | 1-2 weeks              | 00-foundation, 01-authentication, 02-scaffold                | HIGH     |
| 10    | `/specs/01-ui/10-agency/`               | 1 week                 | 00-foundation, 09-tenant-management                          | MEDIUM   |
| 11    | `/specs/01-ui/11-administration/`       | 1 week                 | 00-foundation, 01-authentication                             | LOW      |
| 12    | `/specs/01-ui/12-internationalization/` | 1 week + ongoing       | 00-foundation                                                | MEDIUM   |
| 13    | `/specs/01-ui/13-production-hardening/` | 2-4 weeks + continuous | All previous                                                 | LOW      |

**Phase Details Reference**: `/specs/01-ui/PHASES.md`

---

## Command Format

All specifications are generated using the CLI format:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify [PROMPT_TEXT]"
claude --dangerously-skip-permissions -p "/speckit-plan [PROMPT_TEXT]"
claude --dangerously-skip-permissions -p "/speckit.tasks [PROMPT_TEXT]"
```

**Critical Constraint**: Specifications are written directly to the phase directories. Do NOT create new subdirectories within `/specs/01-ui/[PHASE]/`. The three commands will produce:

- `README.md` (from `/speckit-specify`)
- `plan.md` (from `/speckit-plan`)
- `tasks.md` (from `/speckit.tasks`)

---

## Execution Sequence (Per Phase)

### Step 1: `/speckit-specify`

**Purpose**: Define the business requirements, user outcomes, and feature scope.

**Guidance**:

- Focus on WHAT functionality is being delivered and WHY it matters
- Describe user-facing capabilities and interactions
- Explain how the feature solves specific business problems
- Reference `/docs/architecture/ui/00-overview.md` for system-wide context
- Document constraints, assumptions, and scope boundaries
- Include accessibility and internationalization requirements
- Define success metrics and acceptance criteria

**Template Prompt**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for [PHASE_NAME] based on the UI architecture documented at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: business requirements, user outcomes, feature scope, accessibility (WCAG 2.1 AA), internationalization (RTL/LTR), multi-tenant considerations, and acceptance criteria. Output to /specs/01-ui/[PHASE_DIR]/"
```

### Step 2: `/speckit-plan`

**Purpose**: Document the technical architecture, component design, and implementation approach.

**Guidance**:

- Detail the component architecture using atomic design principles
- Specify Mantine v9 components and any custom components required
- Document the RTL implementation strategy
- Describe the integration with TanStack Start routing and tRPC API
- Include state management approach (TanStack Store for client state)
- Address performance considerations (lazy loading, bundle optimization)
- Reference the three-tier design token system
- Document testing strategy (Vitest unit tests, Playwright E2E)
- Include component dependency diagrams where applicable

**Template Prompt**:

```bash
claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for [PHASE_NAME] aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: TanStack Start, Mantine UI v9, tRPC v11, TanStack Store, Vitest, Playwright. Architecture: atomic design (atoms/molecules/organisms/templates), three-tier design tokens, RTL/LTR support, route-based code splitting. Include component hierarchy, state management, performance optimization, and testing strategy. Output to /specs/01-ui/[PHASE_DIR]/"
```

### Step 3: `/speckit.tasks`

**Purpose**: Create an actionable task breakdown for implementation.

**Guidance**:

- Break down into discrete, verifiable tasks organized by functional area
- Include tasks for component development, testing, and documentation
- Specify dependencies between tasks
- Provide clear acceptance criteria for each task
- Include tasks for accessibility validation (keyboard nav, screen readers)
- Include tasks for RTL layout testing
- Reference performance targets from the UI overview
- Estimate complexity or effort where helpful
- Mark tasks that can be developed in parallel

**Template Prompt**:

```bash
claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for [PHASE_NAME] aligned with the specifications at /specs/01-ui/[PHASE_DIR]/. Tasks should: be organized by functional area with clear dependencies, include component development, testing (unit + E2E), accessibility validation, RTL testing, and documentation. Provide acceptance criteria and mark parallel development opportunities. Output to /specs/01-ui/[PHASE_DIR]/"
```

---

## Phase-by-Phase Execution

### Phase 00: Foundation

**Directory**: `/specs/01-ui/00-foundation/`
**Duration**: Weeks 1-2
**Dependencies**: None
**Scope**: Design system, component library infrastructure, TanStack Start + Mantine v9 setup, RTL/LTR support

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Foundation based on the UI architecture documented at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: establishing the design system infrastructure, TanStack Start + Mantine v9 integration, three-tier design token system, RTL/LTR layout foundation, base component library (atoms and molecules), and multi-tenant theming support. Include WCAG 2.1 AA accessibility requirements from day one. Output to /specs/01-ui/00-foundation/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Foundation aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: TanStack Start, Mantine UI v9, @tanstack/react-router i18n, CSS-in-JS. Architecture: atomic design organization (packages/ui/src/atoms/ /molecules/ /organisms/ /templates/ /hooks/), three-tier design tokens (global→brand→component), RTL via DirectionProvider and logical properties, route-based code splitting. Include component hierarchy, theming architecture, and testing strategy. Output to /specs/01-ui/00-foundation/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Foundation aligned with the specifications at /specs/01-ui/00-foundation/. Tasks should: cover project setup, TanStack Start configuration, Mantine v9 integration, design token implementation, base component development (Button, Input, Card, Typography), RTL layout validation, accessibility testing setup, and component documentation. Include acceptance criteria and performance targets (<500KB initial bundle). Output to /specs/01-ui/00-foundation/"
```

**Verification**:

- [ ] Specifications written to `/specs/01-ui/00-foundation/`
- [ ] Three-tier design token system specified
- [ ] RTL/LTR support architecture documented
- [ ] Base component inventory defined
- [ ] Performance targets established

---

### Phase 01: Authentication

**Directory**: `/specs/01-ui/01-authentication/`
**Duration**: 3-5 days
**Dependencies**: 00-foundation
**Scope**: User authentication flows—login, registration, password reset, email verification

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Authentication based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: login page, registration page, password reset (request + confirm), email verification flow, auth layout wrapper, error handling, and accessibility (WCAG 2.1 AA for critical paths). Include multi-language support and RTL considerations for all auth flows. Output to /specs/01-ui/01-authentication/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Authentication aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: TanStack Start file-based routing, Mantine v9 form components, tRPC v11 mutations, TanStack Store for auth state. Architecture: auth layout wrapper component, form validation with Zod integration, error boundary integration, redirect flows using TanStack Router navigation. Include security considerations and session management. Output to /specs/01-ui/01-authentication/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Authentication aligned with the specifications at /specs/01-ui/01-authentication/. Tasks should: cover auth layout development, login form (email/password), registration form, password reset request/confirm flows, email verification, form validation, error handling, accessibility testing (keyboard nav, screen readers), RTL layout validation, and E2E test coverage. Output to /specs/01-ui/01-authentication/"
```

**Verification**:

- [ ] All auth flow pages specified
- [ ] Form validation strategy documented
- [ ] Error handling patterns defined
- [ ] Accessibility requirements for critical paths included

---

### Phase 02: Scaffold

**Directory**: `/specs/01-ui/02-scaffold/`
**Duration**: 1 week
**Dependencies**: 00-foundation, 01-authentication
**Scope**: Application routing, navigation structure, layout frameworks

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Scaffold based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: dashboard layout, auth layout, report layout, settings layout, sidebar navigation with collapsible sections, topbar with user menu and notifications, breadcrumb system, and responsive behavior. Include multi-language navigation labels and RTL layout mirroring. Output to /specs/01-ui/02-scaffold/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Scaffold aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: TanStack Start layouts, Mantine v9 AppShell and navigation components, tRPC for menu data. Architecture: layout component hierarchy, navigation state management, responsive breakpoints, RTL-aware navigation mirroring, route-based layout selection. Include navigation integration with tenant context. Output to /specs/01-ui/02-scaffold/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Scaffold aligned with the specifications at /specs/01-ui/02-scaffold/. Tasks should: cover layout component development, sidebar navigation with collapsible sections, topbar with user menu, breadcrumb system, responsive design implementation, RTL layout mirroring, navigation state management, and accessibility testing (keyboard navigation, screen reader announcements). Output to /specs/01-ui/02-scaffold/"
```

**Verification**:

- [ ] All layout types specified
- [ ] Navigation architecture documented
- [ ] RTL layout mirroring addressed
- [ ] Responsive behavior defined

---

### Phase 03: Connectors

**Directory**: `/specs/01-ui/03-connectors/`
**Duration**: 2 weeks
**Dependencies**: 00-foundation, 01-authentication, 02-scaffold
**Scope**: Data connector management, health monitoring, OAuth workflows

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Connectors based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: connector list page with health status indicators, connector add workflow (including OAuth flows), connector configuration interface, connector detail view, connector remove confirmation, and error handling for connection failures. Include multi-domain connector support (Marketing, Finance, Operations, SEO, Social, Local). Output to /specs/01-ui/03-connectors/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Connectors aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: Mantine v9 components, tRPC queries/mutations, Recharts for health metrics. Architecture: connector list with filtering/sorting, OAuth popup flow handling, configuration form generation based on connector schema, real-time health status updates, optimistic UI updates. Include error boundary integration for connector failures. Output to /specs/01-ui/03-connectors/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Connectors aligned with the specifications at /specs/01-ui/03-connectors/. Tasks should: cover connector list development, add connector workflow, OAuth integration, configuration forms, detail view, health status indicators, error handling, loading states, accessibility testing, and E2E test coverage for connector workflows. Output to /specs/01-ui/03-connectors/"
```

**Verification**:

- [ ] All connector management pages specified
- [ ] OAuth flow integration documented
- [ ] Health monitoring UI defined
- [ ] Multi-domain support addressed

---

### Phase 04: Insights ⭐

**Directory**: `/specs/01-ui/04-insights/`
**Duration**: 3 weeks
**Dependencies**: 00-foundation, 01-authentication, 02-scaffold, 03-connectors
**Scope**: Insight creation, management, feed—PRIMARY VALUE FEATURE

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Insights based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: insight list page with filtering and search, insight creation wizard (multi-step with template/connector/metric selection), insight detail view with data visualization, insight edit interface, insight clone functionality, insight feed (P2), and AI configuration panel. This is the HIGHEST PRIORITY feature—the core value proposition. Output to /specs/01-ui/04-insights/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Insights aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: Mantine v9 steppers and forms, Recharts for data visualization, tRPC for CRUD operations, TanStack Store for wizard state. Architecture: wizard-based creation flow, template selector component, connector selector with health checking, metric selector with live preview, AI configuration panel (model selection, parameters), insight feed with infinite scroll. Include optimistic updates and error recovery. Output to /specs/01-ui/04-insights/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Insights aligned with the specifications at /specs/01-ui/04-insights/. Tasks should: cover insight list development, creation wizard (all steps), template/connector/metric selectors, AI configuration panel, detail view with charts, edit interface, clone functionality, insight feed, state management, error handling, accessibility testing, and comprehensive E2E test coverage. Mark this as HIGHEST PRIORITY. Output to /specs/01-ui/04-insights/"
```

**Verification**:

- [ ] All insight management features specified
- [ ] Wizard workflow documented
- [ ] Data visualization approach defined
- [ ] AI configuration UI specified
- [ ] Marked as highest priority

---

### Phase 05: Reports

**Directory**: `/specs/01-ui/05-reports/`
**Duration**: 1-2 weeks
**Dependencies**: 00-foundation, 04-insights
**Scope**: Report viewing, export functionality, report library

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Reports based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: report viewer page with multi-page navigation, report export interface (PDF/Excel with format options), report library with filtering and search, and report sharing functionality. Include support for multi-language reports and PDF rendering of RTL layouts. Output to /specs/01-ui/05-reports/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Reports aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: PDF.js for rendering, ExcelJS for export, tRPC queries. Architecture: report viewer with lazy loading pages, export workflow with format selection, report library with search/filter, client-side caching for recent reports. Include PDF generation for RTL content and accessibility for exported files. Output to /specs/01-ui/05-reports/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Reports aligned with the specifications at /specs/01-ui/05-reports/. Tasks should: cover report viewer development, PDF/Excel export workflows, report library with search/filter, sharing functionality, RTL PDF rendering, accessibility testing, and E2E test coverage for report generation and export. Output to /specs/01-ui/05-reports/"
```

**Verification**:

- [ ] Report viewer and export specified
- [ ] RTL PDF support addressed
- [ ] Export format options documented

---

### Phase 06: Templates

**Directory**: `/specs/01-ui/06-templates/`
**Duration**: 1-2 weeks
**Dependencies**: 00-foundation, 04-insights
**Scope**: Template library, creation, editing, preview

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Templates based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: template list page with categories and search, template creation interface, template editor with configuration options, template preview (live), and template clone functionality. Include support for multi-language template content and domain-specific templates. Output to /specs/01-ui/06-templates/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Templates aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: Mantine v9 forms and components, tRPC CRUD operations. Architecture: template list with category filtering, creation form with domain selection, editor with live preview, template versioning support, and clone workflow. Include preview rendering for both LTR and RTL. Output to /specs/01-ui/06-templates/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Templates aligned with the specifications at /specs/01-ui/06-templates/. Tasks should: cover template list development, creation interface, editor with live preview, clone functionality, category management, RTL preview, accessibility testing, and E2E test coverage for template workflows. Output to /specs/01-ui/06-templates/"
```

**Verification**:

- [ ] Template management features specified
- [ ] Live preview approach documented
- [ ] Multi-language support addressed

---

### Phase 07: Scheduling

**Directory**: `/specs/01-ui/07-scheduling/`
**Duration**: 1-2 weeks
**Dependencies**: 00-foundation, 04-insights
**Scope**: Insight scheduling, delivery configuration, recipient management

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Scheduling based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: scheduling configuration page (cron expression builder, timezone selection), delivery configuration page (email, in-app, webhooks), schedule form component with validation, delivery channel selector, and recipient manager with role-based access. Include support for multi-language schedule descriptions. Output to /specs/01-ui/07-scheduling/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Scheduling aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: Mantine v9 forms and date-time pickers, cron expression builder library, tRPC mutations. Architecture: scheduling form with validation, delivery channel multi-select, recipient management with autocomplete, schedule list with active/inactive states. Include timezone handling and locale-aware date display. Output to /specs/01-ui/07-scheduling/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Scheduling aligned with the specifications at /specs/01-ui/07-scheduling/. Tasks should: cover scheduling configuration form, cron expression builder, delivery configuration, recipient manager, schedule list, validation logic, accessibility testing (especially for complex forms), and E2E test coverage for scheduling workflows. Output to /specs/01-ui/07-scheduling/"
```

**Verification**:

- [ ] Scheduling and delivery features specified
- [ ] Cron builder integration documented
- [ ] Timezone handling addressed

---

### Phase 08: Settings

**Directory**: `/specs/01-ui/08-settings/`
**Duration**: 1 week
**Dependencies**: 00-foundation, 01-authentication
**Scope**: User preferences, tenant configuration, team management

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Settings based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: user profile settings (name, email, language, timezone), notification preferences (email, in-app, frequency), integration settings, team management (invite, roles, permissions), and billing & subscription information. Include RTL layout support for all settings forms. Output to /specs/01-ui/08-settings/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Settings aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: Mantine v9 forms and tabs, tRPC queries/mutations. Architecture: settings layout with tabbed navigation, form sections with validation, team member list with role management, and billing information display. Include optimistic updates for settings changes and error recovery. Output to /specs/01-ui/08-settings/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Settings aligned with the specifications at /specs/01-ui/08-settings/. Tasks should: cover settings layout development, user profile form, notification preferences, integration settings, team management interface, billing information display, form validation, accessibility testing, and E2E test coverage for settings workflows. Output to /specs/01-ui/08-settings/"
```

**Verification**:

- [ ] All settings areas specified
- [ ] Team management features documented
- [ ] Form validation strategy defined

---

### Phase 09: Tenant Management

**Directory**: `/specs/01-ui/09-tenant-management/`
**Duration**: 1-2 weeks
**Dependencies**: 00-foundation, 01-authentication, 02-scaffold
**Scope**: Multi-tenant switching, tenant settings, client management

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Tenant Management based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: tenant switcher component (accessible from topbar), tenant settings page (branding, domain), tenant settings page (configuration), client management for agency partners, and tenant onboarding workflow. Include support for agency partner use case with per-client views. Output to /specs/01-ui/09-tenant-management/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Tenant Management aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: TanStack Start navigation, Mantine v9 components, tRPC queries, AsyncLocalStorage for tenant context. Architecture: tenant switcher dropdown with search, tenant settings form, tenant list for agencies, onboarding wizard, and tenant context propagation. Include tenant isolation validation in UI. Output to /specs/01-ui/09-tenant-management/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Tenant Management aligned with the specifications at /specs/01-ui/09-tenant-management/. Tasks should: cover tenant switcher development, tenant settings form, tenant settings, client management for agencies, onboarding workflow, tenant context updates, accessibility testing, and E2E test coverage for tenant switching. Output to /specs/01-ui/09-tenant-management/"
```

**Verification**:

- [ ] Tenant switcher specified
- [ ] Agency partner features documented
- [ ] Tenant context propagation addressed

---

### Phase 10: Agency

**Directory**: `/specs/01-ui/10-agency/`
**Duration**: 1 week
**Dependencies**: 00-foundation, 09-tenant-management
**Scope**: Agency dashboard, per-client performance overview

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Agency based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: agency partner dashboard with aggregated metrics, per-client performance overview cards, client comparison features, and agency-specific navigation. Include support for white-label branding and multi-client data visualization. Output to /specs/01-ui/10-agency/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Agency aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: Mantine v9 components, Recharts for data visualization, tRPC queries. Architecture: agency dashboard layout, per-client metric cards, client comparison table, and agency-specific navigation. Include data aggregation patterns and caching for performance. Output to /specs/01-ui/10-agency/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Agency aligned with the specifications at /specs/01-ui/10-agency/. Tasks should: cover agency dashboard development, per-client performance cards, client comparison features, agency navigation, data aggregation logic, accessibility testing, and E2E test coverage for agency workflows. Output to /specs/01-ui/10-agency/"
```

**Verification**:

- [ ] Agency dashboard features specified
- [ ] Multi-client data visualization addressed

---

### Phase 11: Administration

**Directory**: `/specs/01-ui/11-administration/`
**Duration**: 1 week
**Dependencies**: 00-foundation, 01-authentication
**Scope**: System administration, monitoring, user management

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Administration based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: system health dashboard (metrics, alerts), user administration interface (list, roles, permissions), and audit log viewer with filtering. Include admin-only access controls and sensitive data handling considerations. Output to /specs/01-ui/11-administration/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Administration aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: Mantine v9 components, Recharts for metrics, tRPC queries. Architecture: admin dashboard layout, real-time metric updates, user management table with role editing, and audit log viewer with search/filter. Include access control validation and sensitive data masking. Output to /specs/01-ui/11-administration/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Administration aligned with the specifications at /specs/01-ui/11-administration/. Tasks should: cover system health dashboard, user administration interface, audit log viewer, access control implementation, real-time updates, accessibility testing, and E2E test coverage for admin workflows. Output to /specs/01-ui/11-administration/"
```

**Verification**:

- [ ] Admin features specified
- [ ] Access control documented
- [ ] Audit log viewer addressed

---

### Phase 12: Internationalization

**Directory**: `/specs/01-ui/12-internationalization/`
**Duration**: 1 week + ongoing
**Dependencies**: 00-foundation
**Scope**: Multi-language switching, locale management, RTL optimization

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Internationalization based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: multi-language switching workflow (triggerable from settings), locale management interface for admins, RTL pattern optimization and testing, and translation file structure and maintenance. Include support for Arabic (RTL), English, and future languages. Output to /specs/01-ui/12-internationalization/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Internationalization aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: @tanstack/react-router i18n, Mantine v9 DirectionProvider, ICU message formatting. Architecture: language switcher component, locale routing, translation file organization, RTL layout testing utilities, and translation key management. Include lazy loading for locale bundles and missing translation detection. Output to /specs/01-ui/12-internationalization/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Internationalization aligned with the specifications at /specs/01-ui/12-internationalization/. Tasks should: cover language switcher development, locale routing setup, translation file structure, RTL pattern validation, missing translation detection, accessibility testing for screen readers in all languages, and comprehensive RTL layout testing. Output to /specs/01-ui/12-internationalization/"
```

**Verification**:

- [ ] Language switching specified
- [ ] RTL optimization documented
- [ ] Translation management addressed

---

### Phase 13: Production Hardening

**Directory**: `/specs/01-ui/13-production-hardening/`
**Duration**: 2-4 weeks + continuous
**Dependencies**: All previous phases
**Scope**: Accessibility audit, performance monitoring, optimization, observability

**Execute**:

```bash
claude --dangerously-skip-permissions -p "/speckit-specify Write functional specifications for Production Hardening based on the UI architecture at /docs/architecture/ui/00-overview.md and phase details at /specs/01-ui/PHASES.md. Focus on: accessibility audit and remediation (WCAG 2.1 AA), performance monitoring setup (Core Web Vitals), bundle analysis and optimization, error tracking setup, and analytics integration. Define success metrics and ongoing maintenance processes. Output to /specs/01-ui/13-production-hardening/"

claude --dangerously-skip-permissions -p "/speckit-plan Document the technical implementation for Production Hardening aligned with the UI architecture at /docs/architecture/ui/00-overview.md. Technology: Lighthouse CI, axe-core, webpack-bundle-analyzer, Sentry, Vercel Analytics. Architecture: automated accessibility testing in CI, performance budget enforcement, bundle splitting strategy, error boundary integration, and analytics event tracking. Include monitoring dashboards and alerting. Output to /specs/01-ui/13-production-hardening/"

claude --dangerously-skip-permissions -p "/speckit.tasks Generate implementation tasks for Production Hardening aligned with the specifications at /specs/01-ui/13-production-hardening/. Tasks should: cover accessibility audit (axe-core), performance monitoring setup, bundle analysis and optimization, error tracking integration, analytics implementation, CI automation, and documentation of ongoing maintenance processes. Output to /specs/01-ui/13-production-hardening/"
```

**Verification**:

- [ ] Accessibility audit scope defined
- [ ] Performance monitoring specified
- [ ] CI/CD integration documented

---

## Execution Order and Parallelization

**Recommended Sequential Execution**: 00 → 01 → 02 → 03 → 04

**Parallel Development Opportunities** (after Phase 04):

| Wave       | Phases                                                      |
| ---------- | ----------------------------------------------------------- |
| Wave 1     | 05-reports, 06-templates                                    |
| Wave 2     | 07-scheduling, 09-tenant-management                         |
| Wave 3     | 08-settings, 10-agency, 11-administration                   |
| Wave 4     | 12-internationalization (can start in parallel with Wave 3) |
| Continuous | 13-production-hardening (after all feature phases)          |

**Total Estimated Commands**: 42 (14 phases × 3 commands each)

---

## Global Acceptance Criteria

**After completing all 14 phases, verify**:

- [ ] All 14 specification directories have complete documentation (README.md, plan.md, tasks.md)
- [ ] Each phase aligns with `/docs/architecture/ui/00-overview.md` architecture
- [ ] Accessibility requirements (WCAG 2.1 AA) are specified for all features
- [ ] RTL/LTR support is addressed across all applicable phases
- [ ] Multi-tenant considerations are documented where relevant
- [ ] Performance targets from the UI overview are referenced
- [ ] Three-tier design token system is consistently applied
- [ ] Atomic design component organization is maintained
- [ ] tRPC integration patterns are consistent
- [ ] Testing strategies (unit + E2E) are specified for all features

---

## Notes

- This is a **forward-looking specification effort**; implementation has not yet begun
- **Alignment is critical** — all specifications must reflect the architecture in `/docs/architecture/ui/00-overview.md`
- **Accessibility is non-negotiable** — WCAG 2.1 AA compliance must be specified for all features
- **RTL is foundational** — not an add-on; must be considered from the start for all applicable features
- **Performance is a feature** — specifications should reference the performance targets from the UI overview
- **Multi-tenancy affects everything** — tenant context and isolation must be considered across all features
- **Dependencies matter** — respect the phase dependency chain to ensure specifications are complete

---

**Document Version**: 1.0
**Created**: 2026-04-14
**Status**: Ready for Execution
