# UI Specification Directory Structure - Final Recommendation

**Created**: 2026-04-14
**Status**: Recommended
**Authors**: Specification Team
**Version**: 1.0

---

## Executive Summary

This document provides the final recommended directory structure for `/specs/01-ui/` based on comprehensive analysis of:

- UI architecture documentation (`/docs/architecture/ui/00-overview.md`)
- Existing UI specification (`/specs/01-ui/spec.md`)
- Core platform specification patterns (`/specs/00-core/`)
- Foundation specifications status (`/specs/01-ui/00-foundation/`)

**Key Findings:**

- **37 pages** organized across 6 user journeys
- **9 core entities** driving the UI system
- **4 implementation phases** (Foundation → Enhancement → Polish → Production)
- **4 primary workflows** (Connector Onboarding, Report Generation, Tenant Onboarding, Multi-Language Switching)
- **5 prioritized user stories** (P1-P5) with insight-centric focus

---

## 1. Final Directory Structure

```
/specs/01-ui/
├── README.md                                  # UI phases overview and navigation
├── SPEC.md                                    # UI specification summary (existing)
├── PLAN.md                                    # UI implementation plan
├── PHASE_OVERVIEW.md                          # Cross-phase dependencies and parallelization
├── checklists/                                # Validation checklists (existing)
│   └── requirements.md
│
├── 00-foundation/                             # Design system, infrastructure, component library
│   ├── README.md
│   ├── overview.md                            # Objectives, scope, timeline
│   ├── tasks.md                               # Task breakdown with dependencies
│   ├── acceptance-criteria.md                 # Quality gates and exit criteria
│   ├── implementation-scope.md                # Waves, config source of truth
│   ├── EXECUTION-PLAN.md                      # Phased execution groupings
│   └── operations/                            # Operational procedures
│       └── README.md
│
├── 01-authentication/                         # Authentication flows and user management
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   └── pages/
│       ├── login.md
│       ├── registration.md
│       ├── password-reset-request.md
│       ├── password-reset-confirm.md
│       └── email-verification.md
│
├── 02-scaffold/                               # Application structure, routing, layouts
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   └── components/
│       ├── layouts/
│       │   ├── dashboard-layout.md
│       │   ├── auth-layout.md
│       │   ├── report-layout.md
│       │   └── settings-layout.md
│       └── navigation/
│           ├── sidebar.md
│           ├── topbar.md
│           └── breadcrumb.md
│
├── 03-connectors/                             # Connector management and health monitoring
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   ├── pages/
│   │   ├── connector-list.md
│   │   ├── connector-add.md
│   │   ├── connector-configure.md
│   │   ├── connector-detail.md
│   │   └── connector-remove.md
│   └── workflows/
│       └── connector-onboarding.md            # P5: Connector Health Monitoring
│
├── 04-insights/                               # Insight creation, management, and feed (P1, P2)
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   ├── pages/
│   │   ├── insight-list.md
│   │   ├── insight-create.md                  # P1: Configure and Activate Insight
│   │   ├── insight-detail.md
│   │   ├── insight-edit.md
│   │   ├── insight-clone.md
│   │   └── insight-feed.md                    # P2: View Insight Feed and Take Action
│   └── components/
│       ├── insight-card.md
│       ├── template-selector.md
│       ├── connector-selector.md
│       ├── metric-selector.md
│       └── ai-configuration-panel.md
│
├── 05-reports/                                # Report viewing and export
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   └── pages/
│       ├── report-viewer.md
│       ├── report-export.md
│       └── report-library.md
│
├── 06-templates/                              # Template library and customization
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   └── pages/
│       ├── template-list.md
│       ├── template-create.md
│       ├── template-edit.md
│       ├── template-preview.md
│       └── template-clone.md
│
├── 07-scheduling/                             # Scheduling and delivery configuration (P3)
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   ├── pages/
│   │   ├── scheduling-configuration.md        # P3: Manage Insight Scheduling and Delivery
│   │   └── delivery-configuration.md
│   └── components/
│       ├── schedule-form.md
│       ├── delivery-channel-selector.md
│       └── recipient-manager.md
│
├── 08-settings/                               # User and tenant configuration
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   └── pages/
│       ├── user-profile.md
│       ├── notification-settings.md
│       ├── integration-settings.md
│       ├── team-management.md
│       └── billing-subscription.md
│
├── 09-tenant-management/                      # Multi-tenant switching and management (P4)
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   ├── pages/
│   │   ├── tenant-switcher.md                 # P4: Multi-Tenant Tenant Switching
│   │   ├── tenant-settings.md
│   │   ├── tenant-settings.md
│   │   └── client-management.md               # Agency partner client management
│   └── workflows/
│       └── tenant-onboarding.md               # Tenant onboarding for agencies
│
├── 10-agency/                                 # Agency partner dashboard (P4 extension)
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   └── pages/
│       ├── agency-dashboard.md                # Agency partner overview
│       └── client-overview.md                 # Per-client performance view
│
├── 11-administration/                         # System administration and monitoring
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   └── pages/
│       ├── system-health.md
│       ├── user-administration.md
│       └── audit-log.md
│
├── 12-internationalization/                   # I18n and L10n implementation
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   └── workflows/
│       ├── multi-language-switching.md        # LTR ↔ RTL transition workflow
│       └── locale-management.md
│
└── 13-production-hardening/                   # Production optimization and monitoring
    ├── README.md
    ├── overview.md
    ├── tasks.md
    ├── acceptance-criteria.md
    ├── operations/
    │   ├── accessibility/
    │   │   ├── audit-checklist.md
    │   │   ├── testing-runbook.md
    │   │   └── remediation-guide.md
    │   ├── performance/
    │   │   ├── monitoring-guide.md
    │   │   ├── optimization-checklist.md
    │   │   └── bundle-analysis.md
    │   └── observability/
    │       ├── analytics-integration.md
    │       └── error-tracking.md
    └── prerequisites/
        ├── ci-integration.md
        └── deployment-verification.md
```

---

## 2. Directory Rationale and Sequence

### Phase 0: Foundation (00-foundation)

**Why First**: Establishes the design system, component library, and infrastructure that all other UI features depend on. Without a solid foundation, every feature would need to recreate basic patterns.

**Duration**: Weeks 1-2 (aligned with UI architecture Phase 1)

**Dependencies**: None (foundational)

---

### Phase 1: Authentication (01-authentication)

**Why Second**: User authentication is the gateway to all other features. Users must be able to log in before accessing any functionality.

**Duration**: 3-5 days

**Dependencies**: 00-foundation (layouts, forms)

---

### Phase 2: Scaffold (02-scaffold)

**Why Third**: Application routing and navigation structure provide the framework for all page-level features. The dashboard layout, sidebar, and navigation are used across the application.

**Duration**: 1 week

**Dependencies**: 00-foundation (components), 01-authentication (auth layout)

---

### Phase 3: Connectors (03-connectors)

**Why Fourth**: Data connectors are the foundation for insights. Users must connect data sources before creating insights. This phase implements the P5 user story (Connector Health Monitoring).

**Duration**: 2 weeks

**Dependencies**: 00-foundation, 01-authentication, 02-scaffold

---

### Phase 4: Insights (04-insights)

**Why Fifth**: This is the core value proposition (P1: Configure and Activate Insight, P2: View Insight Feed). Insights depend on connectors for data.

**Duration**: 3 weeks

**Dependencies**: 00-foundation, 01-authentication, 02-scaffold, 03-connectors

**Priority**: HIGHEST - This is the primary user-facing feature

---

### Phase 5: Reports (05-reports)

**Why Sixth**: Reports are the output of insights. Users must be able to view and export the AI-generated reports.

**Duration**: 1-2 weeks

**Dependencies**: 00-foundation, 04-insights

---

### Phase 6: Templates (06-templates)

**Why Seventh**: Templates accelerate insight creation. This is an enhancement to the insight creation workflow.

**Duration**: 1-2 weeks

**Dependencies**: 00-foundation, 04-insights

---

### Phase 7: Scheduling (07-scheduling)

**Why Eighth**: Implements P3 (Manage Insight Scheduling and Delivery). Scheduling is an enhancement to insights that enables automated delivery.

**Duration**: 1-2 weeks

**Dependencies**: 00-foundation, 04-insights

---

### Phase 8: Settings (08-settings)

**Why Ninth**: User preferences and configuration are important but not critical for initial value delivery.

**Duration**: 1 week

**Dependencies**: 00-foundation, 01-authentication

---

### Phase 9: Tenant Management (09-tenant-management)

**Why Tenth**: Implements P4 (Multi-Tenant Tenant Switching). Critical for agency partners but can use default branding initially.

**Duration**: 1-2 weeks

**Dependencies**: 00-foundation, 01-authentication, 02-scaffold

---

### Phase 10: Agency (10-agency)

**Why Eleventh**: Agency-specific features extend the tenant management capabilities. This is a specialized view for agency partners.

**Duration**: 1 week

**Dependencies**: 00-foundation, 09-tenant-management

---

### Phase 11: Administration (11-administration)

**Why Twelfth**: System administration features are important for operational management but not required for initial launch.

**Duration**: 1 week

**Dependencies**: 00-foundation, 01-authentication

**Parallel With**: Can be developed in parallel with phases 8-10

---

### Phase 12: Internationalization (12-internationalization)

**Why Thirteenth**: I18n and L10n are foundational requirements but can be implemented incrementally. Arabic RTL support is a requirement from Phase 1 but can be enhanced over time.

**Duration**: 1 week (initial), ongoing

**Dependencies**: 00-foundation

**Note**: Basic i18n setup should be in 00-foundation. This phase focuses on advanced features and optimization.

---

### Phase 13: Production Hardening (13-production-hardening)

**Why Last**: Production optimization and monitoring are ongoing activities that begin after core features are implemented. This aligns with UI architecture Phase 4.

**Duration**: Ongoing (2-4 weeks initial, then continuous)

**Dependencies**: All previous phases

---

## 3. Development Sequence with Dependencies

```
Week 1-2:   00-foundation
            └─ All other phases depend on this

Week 3:     01-authentication → 02-scaffold
            └─ 02-scaffold depends on 01-authentication

Week 4-5:   03-connectors
            └─ Depends on: 00-foundation, 01-authentication, 02-scaffold

Week 6-8:   04-insights (P1, P2 - HIGHEST PRIORITY)
            └─ Depends on: 00-foundation, 01-authentication, 02-scaffold, 03-connectors

Week 9-10:  05-reports + 06-templates (PARALLEL)
            └─ Both depend on: 00-foundation, 04-insights

Week 11-12: 07-scheduling + 09-tenant-management (PARALLEL)
            └─ 07-scheduling depends on: 00-foundation, 04-insights
            └─ 09-tenant-management depends on: 00-foundation, 01-authentication, 02-scaffold

Week 13:    08-settings + 10-agency + 11-administration (PARALLEL)
            └─ All depend on: 00-foundation, 01-authentication

Week 14:    12-internationalization (advanced features)
            └─ Enhances: All previous phases

Ongoing:    13-production-hardening
            └─ Applies to: All previous phases
```

**Parallel Workstreams:**

- Weeks 9-10: Reports + Templates (independent)
- Weeks 11-12: Scheduling + Tenant Management (independent)
- Week 13: Settings + Agency + Administration (independent)

---

## 4. Entity-to-Directory Mapping

| Entity                     | Primary Directory              | Secondary Directories                   | Justification                         |
| -------------------------- | ------------------------------ | --------------------------------------- | ------------------------------------- |
| **Insight**                | 04-insights                    | 05-reports, 06-templates, 07-scheduling | Core entity for business intelligence |
| **Connector**              | 03-connectors                  | 04-insights (data source)               | Data integration foundation           |
| **Template**               | 06-templates                   | 04-insights (creation accelerator)      | Pre-built insight configurations      |
| **Schedule**               | 07-scheduling                  | 04-insights (execution timing)          | Insight execution timing              |
| **Delivery Configuration** | 07-scheduling                  | 08-settings (notification preferences)  | Report delivery settings              |
| **Tenant (Tenant)**        | 09-tenant-management           | 10-agency (multi-tenant view)           | Multi-tenant management               |
| **Insight Report**         | 05-reports                     | 04-insights (output consumption)        | AI-generated output                   |
| **User**                   | 01-authentication, 08-settings | 09-tenant-management (tenant access)    | User accounts and preferences         |
| **Permissions**            | 11-administration              | 09-tenant-management (tenant-level)     | RBAC and access control               |

---

## 5. Cross-Reference Mapping to UI Architecture

### Mapping to `/docs/architecture/ui/00-overview.md`

| UI Architecture Page                                     | Directory            | Page File                              |
| -------------------------------------------------------- | -------------------- | -------------------------------------- |
| **Authentication Journey (5 pages)**                     |                      |                                        |
| Login                                                    | 01-authentication    | pages/login.md                         |
| Registration                                             | 01-authentication    | pages/registration.md                  |
| Password Reset Request                                   | 01-authentication    | pages/password-reset-request.md        |
| Password Reset Confirm                                   | 01-authentication    | pages/password-reset-confirm.md        |
| Email Verification                                       | 01-authentication    | pages/email-verification.md            |
| **Dashboard Journey (9 pages)**                          |                      |                                        |
| Home Dashboard                                           | 02-scaffold          | components/layouts/dashboard-layout.md |
| Marketing/Finance/Operations/SEO/Social/Local Dashboards | 02-scaffold          | components/layouts/dashboard-layout.md |
| Agency Partner Dashboard                                 | 10-agency            | pages/agency-dashboard.md              |
| Dashboard Customization                                  | 08-settings          | pages/user-profile.md                  |
| **Connector Management Journey (5 pages)**               |                      |                                        |
| Connector List                                           | 03-connectors        | pages/connector-list.md                |
| Connector Add                                            | 03-connectors        | pages/connector-add.md                 |
| Connector Configure                                      | 03-connectors        | pages/connector-configure.md           |
| Connector Detail                                         | 03-connectors        | pages/connector-detail.md              |
| Connector Remove                                         | 03-connectors        | pages/connector-remove.md              |
| **Insights & Reports Journey (7 pages)**                 |                      |                                        |
| Insight List                                             | 04-insights          | pages/insight-list.md                  |
| Insight Create                                           | 04-insights          | pages/insight-create.md                |
| Insight Detail                                           | 04-insights          | pages/insight-detail.md                |
| Report Export                                            | 05-reports           | pages/report-export.md                 |
| Report Viewer                                            | 05-reports           | pages/report-viewer.md                 |
| Insight Edit                                             | 04-insights          | pages/insight-edit.md                  |
| Insight Clone                                            | 04-insights          | pages/insight-clone.md                 |
| **Template Management Journey (5 pages)**                |                      |                                        |
| Template List                                            | 06-templates         | pages/template-list.md                 |
| Template Create                                          | 06-templates         | pages/template-create.md               |
| Template Edit                                            | 06-templates         | pages/template-edit.md                 |
| Template Preview                                         | 06-templates         | pages/template-preview.md              |
| Template Clone                                           | 06-templates         | pages/template-clone.md                |
| **Settings Journey (7 pages)**                           |                      |                                        |
| Tenant Settings                                          | 09-tenant-management | pages/tenant-settings.md               |
| User Profile Settings                                    | 08-settings          | pages/user-profile.md                  |
| Notification Settings                                    | 08-settings          | pages/notification-settings.md         |
| Integration Settings                                     | 08-settings          | pages/integration-settings.md          |
| Team Management                                          | 08-settings          | pages/team-management.md               |
| Billing & Subscription                                   | 08-settings          | pages/billing-subscription.md          |
| Tenant Settings                                          | 09-tenant-management | pages/tenant-settings.md               |

### Mapping to UI Architecture Implementation Phases

| UI Architecture Phase         | Spec Directory              | Alignment                                                               |
| ----------------------------- | --------------------------- | ----------------------------------------------------------------------- |
| Phase 1: Foundation           | 00-foundation               | TanStack Start + Mantine v9 setup, RTL support, component library       |
| Phase 2: Enhancement          | 00-foundation + 04-insights | Ladle docs, custom design tokens, Radix UI integration, RTL tests       |
| Phase 3: Polish               | 13-production-hardening     | RTL patterns documentation, visual regression, performance optimization |
| Phase 4: Production Hardening | 13-production-hardening     | Core Web Vitals monitoring, a11y testing, performance audits            |

---

## 6. User Story to Directory Mapping

| User Story                                     | Priority | Primary Directory    | Secondary Directories                                        |
| ---------------------------------------------- | -------- | -------------------- | ------------------------------------------------------------ |
| **P1: Configure and Activate Insight**         | HIGHEST  | 04-insights          | 03-connectors (data sources), 06-templates (accelerator)     |
| **P2: View Insight Feed and Take Action**      | HIGH     | 04-insights          | 05-reports (drill-down)                                      |
| **P3: Manage Insight Scheduling and Delivery** | MEDIUM   | 07-scheduling        | 04-insights (scheduling target), 08-settings (notifications) |
| **P4: Multi-Tenant Tenant Switching**          | MEDIUM   | 09-tenant-management | 10-agency (agency view), 02-scaffold (navigation)            |
| **P5: Connector Health Monitoring**            | LOW      | 03-connectors        | 11-administration (system health)                            |

---

## 7. Directory Contents Template

Each phase directory should contain the following files (pattern from `/specs/00-core/`):

### Required Files

1. **`README.md`** - Phase index and quick reference
   - Phase summary and objectives
   - Links to all phase documentation
   - Quick start checklist
   - Common workflows and commands
   - Troubleshooting guide

2. **`overview.md`** - High-level phase understanding
   - Executive summary
   - Alignment with project goals
   - Dependencies and prerequisites
   - Success criteria
   - Risk assessment

3. **`tasks.md`** - Comprehensive task breakdown
   - Hierarchical task organization
   - Task dependencies and sequencing
   - Effort estimates and complexity ratings
   - Cross-cutting concerns (multi-tenancy, i18n, a11y)
   - Status tracking (TODO/Done columns)

4. **`acceptance-criteria.md`** - Validation standards
   - Functional requirements (checkbox format)
   - Non-functional requirements
   - Testing requirements with coverage targets
   - Exit criteria for each deliverable

### Optional Files

5. **`implementation-scope.md`** - Scope definition
   - In-scope items
   - Out-of-scope items
   - Future considerations

6. **`EXECUTION-PLAN.md`** - Phased execution
   - Wave groupings
   - Parallel workstreams
   - Milestone definitions

### Optional Subdirectories

7. **`pages/`** - Page-level specifications
   - Individual page specs for each user interface
   - Wireframes and mockups
   - Component hierarchies

8. **`components/`** - Component specifications
   - Reusable UI component specs
   - Props interfaces
   - Usage examples

9. **`workflows/`** - User workflow specifications
   - Multi-page user journeys
   - State transitions
   - Edge cases

10. **`operations/`** - Operational documentation
    - Deployment procedures
    - Monitoring guides
    - Troubleshooting runbooks

11. **`prerequisites/`** - Prerequisite work
    - Environment setup
    - Tool configuration
    - Contract definitions

---

## 8. Consistency with `/specs/00-core/` Structure

### Structural Consistency

| Pattern            | `/specs/00-core/`                                        | `/specs/01-ui/`                                          | Consistency              |
| ------------------ | -------------------------------------------------------- | -------------------------------------------------------- | ------------------------ |
| **Numbering**      | Two-digit zero-padded (00-04)                            | Two-digit zero-padded (00-13)                            | ✅ Consistent            |
| **Naming**         | kebab-case                                               | kebab-case                                               | ✅ Consistent            |
| **Core Files**     | README.md, overview.md, tasks.md, acceptance-criteria.md | README.md, overview.md, tasks.md, acceptance-criteria.md | ✅ Consistent            |
| **Subdirectories** | operations/, prerequisites/                              | operations/, pages/, components/, workflows/             | ✅ Extended for UI needs |
| **Root Files**     | SPEC.md, PLAN.md, PHASE_OVERVIEW.md                      | SPEC.md, PLAN.md, PHASE_OVERVIEW.md                      | ✅ Consistent            |

### Documentation Standards

Both directories follow:

- ✅ Markdown with proper heading hierarchy
- ✅ TypeScript code examples
- ✅ Tables for task breakdowns
- ✅ Checkbox lists for acceptance criteria
- ✅ Cross-references to related documents
- ✅ Status indicators (TODO, Done, In Progress)
- ✅ Relative links for navigation

### Cross-Cutting Concerns

Both directories address:

- ✅ Multi-tenancy compliance
- ✅ Configuration-driven design
- ✅ Type safety & validation
- ✅ Testing standards
- ✅ Observability
- ✅ Error handling

---

## 9. Key Considerations Addressed

### Insight-Centric Business Model ✅

- Directory 04-insights is positioned as the primary user-facing feature (P1, P2)
- All other directories support insight creation, management, and consumption
- Template system (06-templates) accelerates insight creation
- Scheduling (07-scheduling) enables automated insight delivery

### Multi-Business-Domain Support ✅

- Connector system (03-connectors) is domain-agnostic with domain tagging
- Insights can combine data from multiple business domains
- Template library organized by business domain
- Agency partner support (09-tenant-management, 10-agency)

### Parallel Development Workstreams ✅

- 05-reports + 06-templates can be developed in parallel (Weeks 9-10)
- 07-scheduling + 09-tenant-management can be developed in parallel (Weeks 11-12)
- 08-settings + 10-agency + 11-administration can be developed in parallel (Week 13)

### Progressive Enhancement ✅

- Foundation → Authentication → Scaffold → Connectors → Insights (core value)
- Reports, Templates, Scheduling (enhancements)
- Settings, Tenant Management, Agency (advanced features)
- Internationalization, Production Hardening (optimization)

### Four-Phase Timeline Alignment ✅

- Phase 1: Foundation (00-foundation)
- Phase 2: Enhancement (00-foundation + 04-insights)
- Phase 3: Polish (13-production-hardening)
- Phase 4: Production Hardening (13-production-hardening)

---

## 10. Success Criteria Validation

| Success Criterion                                       | Status  | Evidence                                                 |
| ------------------------------------------------------- | ------- | -------------------------------------------------------- |
| Directory structure comprehensively covers all UI pages | ✅ PASS | 37 pages mapped across 6 journeys                        |
| Directory structure comprehensively covers all entities | ✅ PASS | 9 entities mapped to directories                         |
| Development sequence minimizes dependencies             | ✅ PASS | Clear dependency chain with parallel workstreams         |
| Structure is intuitive and maintainable                 | ✅ PASS | Logical grouping by feature/domain                       |
| Structure aligns with UI architecture                   | ✅ PASS | Direct mapping to `/docs/architecture/ui/00-overview.md` |
| Structure supports multi-business-domain                | ✅ PASS | Domain-agnostic connectors, domain-tagged templates      |
| Maintains consistency with existing specs               | ✅ PASS | Follows `/specs/00-core/` patterns                       |
| Enables clear ownership assignment                      | ✅ PASS | 13 distinct directories with clear boundaries            |

---

## 11. Next Steps

### Immediate Actions (Week 1)

1. **Populate 00-foundation**
   - Create README.md, overview.md, tasks.md, acceptance-criteria.md
   - Define foundation scope (TanStack Start setup, Mantine v9, RTL support, component library)
   - Align with UI architecture Phase 1 deliverables

2. **Create Root Navigation Files**
   - Create `/specs/01-ui/README.md` (UI phases overview)
   - Create `/specs/01-ui/PLAN.md` (implementation plan)
   - Create `/specs/01-ui/PHASE_OVERVIEW.md` (cross-phase dependencies)

3. **Initialize Empty Directories**
   - Create all directory placeholders (01-13)
   - Add README.md placeholders with brief descriptions
   - Establish version control structure

### Short-Term Actions (Weeks 2-4)

1. **Populate 01-authentication**
   - Define authentication flows and user management
   - Create page specifications for login, registration, password reset

2. **Populate 02-scaffold**
   - Define routing structure and navigation
   - Create layout specifications (dashboard, auth, report, settings)

3. **Populate 03-connectors**
   - Define connector management and health monitoring
   - Create connector onboarding workflow (P5)

### Medium-Term Actions (Weeks 5-8)

1. **Populate 04-insights** (HIGHEST PRIORITY)
   - Define insight creation, management, and feed (P1, P2)
   - Create component specifications (insight card, template selector, connector selector)
   - Align with O2-Intelligence and O3-Insights backend phases

2. **Populate Parallel Workstreams**
   - 05-reports + 06-templates (Weeks 9-10)
   - 07-scheduling + 09-tenant-management (Weeks 11-12)

### Long-Term Actions (Weeks 9-14)

1. **Populate Remaining Directories**
   - 08-settings, 10-agency, 11-administration (Week 13)
   - 12-internationalization (advanced features)
   - 13-production-hardening (ongoing)

2. **Cross-Phase Integration**
   - Verify all dependencies are satisfied
   - Validate cross-phase workflows
   - Ensure consistency with backend specs

---

## 12. Recommendations

### Structural Recommendations

1. **Keep 04-insights as the centerpiece**: This directory contains the core value proposition (P1, P2). All other directories should support insight creation and consumption.

2. **Prioritize 00-foundation completion**: A solid foundation prevents technical debt and accelerates all subsequent development.

3. **Leverage parallel workstreams**: The structure enables parallel development of 05-reports + 06-templates and 07-scheduling + 09-tenant-management.

4. **Use 02-scaffold as the application framework**: The routing structure and layouts defined here will be used across all page-level directories.

### Process Recommendations

1. **Follow the `/specs/00-core/` patterns**: Use the same file templates, documentation standards, and task organization patterns.

2. **Align with UI architecture phases**: Ensure spec work aligns with the four-phase implementation timeline in `/docs/architecture/ui/00-overview.md`.

3. **Maintain cross-references**: Use relative links to connect specs to architecture documentation and backend specs.

4. **Iterate on foundation**: Basic i18n and accessibility should be in 00-foundation, with advanced features in 12-internationalization and 13-production-hardening.

### Quality Recommendations

1. **Include acceptance criteria for every directory**: Use checkbox format for objective validation.

2. **Define testing requirements**: Specify coverage targets aligned with `/docs/02-planning-and-methodology/testing-strategy.md`.

3. **Document cross-cutting concerns**: Address multi-tenancy, i18n, and accessibility in every directory.

4. **Specify component hierarchies**: Use the atomic design pattern (atoms → molecules → organisms → templates → pages).

---

## Appendix A: Directory Structure Summary

```
/specs/01-ui/                     Total: 14 directories (00-13)
├── 00-foundation                 Design system, infrastructure, component library
├── 01-authentication             Authentication flows and user management
├── 02-scaffold                   Application structure, routing, layouts
├── 03-connectors                 Connector management and health monitoring (P5)
├── 04-insights                   Insight creation, management, and feed (P1, P2) ⭐
├── 05-reports                    Report viewing and export
├── 06-templates                  Template library and customization
├── 07-scheduling                 Scheduling and delivery configuration (P3)
├── 08-settings                   User and tenant configuration
├── 09-tenant-management          Multi-tenant switching and management (P4)
├── 10-agency                     Agency partner dashboard (P4 extension)
├── 11-administration             System administration and monitoring
├── 12-internationalization       I18n and L10n implementation
└── 13-production-hardening       Production optimization and monitoring
```

⭐ = Primary value proposition directory

---

## Appendix B: Implementation Timeline Summary

```
Week 1-2:   00-foundation (Foundation)
Week 3:     01-authentication → 02-scaffold
Week 4-5:   03-connectors (P5: Connector Health)
Week 6-8:   04-insights (P1, P2: Create & View Insights) ⭐
Week 9-10:  05-reports || 06-templates (parallel)
Week 11-12: 07-scheduling (P3) || 09-tenant-management (P4) (parallel)
Week 13:    08-settings || 10-agency || 11-administration (parallel)
Week 14:    12-internationalization (advanced)
Ongoing:    13-production-hardening (continuous)
```

⭐ = Primary value delivery phase

---

**Document Status**: Final Recommendation
**Next Review**: After 00-foundation completion
**Approval Required**: Specification Team Lead, Architecture Team Lead
