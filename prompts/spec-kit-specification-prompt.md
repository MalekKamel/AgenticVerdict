# SpecKit UI Specification Prompt

**Document Version:** 2.0
**Date Created:** 2026-04-13
**Last Updated:** 2026-04-13
**Status:** Active
**Target Audience:** Development Team, SpecKit Operators

---

## Executive Summary

This document provides a comprehensive, structured prompt for creating the UI system specification at `/specs/o1-ui` using the SpecKit framework. The specification is based on the comprehensive UI architecture documented at `/docs/architecture/ui/00-overview.md` and should follow the organizational patterns established in `/specs/00-core`.

The UI system encompasses a multi-tenant, internationalized **multi-business-domain intelligence platform** built on TanStack Start and Mantine UI v9, with first-class RTL support, atomic design principles, and comprehensive accessibility compliance. The platform serves direct businesses and agency partners across marketing, finance, operations, SEO, social media, and local business domains.

---

## Table of Contents

1. [Context & Background](#context--background)
2. [Primary Objectives](#primary-objectives)
3. [Source Documentation](#source-documentation)
4. [Organizational Requirements](#organizational-requirements)
5. [Execution Framework](#execution-framework)
6. [Quality Gates & Verification](#quality-gates--verification)
7. [Deliverable Specifications](#deliverable-specifications)

---

## Context & Background

### System Overview

AgenticVerdict is a **multi-business-domain intelligence platform** that aggregates data from multiple business domains (Marketing, Finance, Operations, SEO, Social Media, Local Business), generates AI-powered cross-domain insights, and delivers actionable verdicts through automated reports. The UI system serves as the primary interface for users to configure connectors, view insights, manage reports, and switch between tenant tenants.

### Current State

The UI architecture has been comprehensively documented in `/docs/architecture/ui/00-overview.md`, including:

- Design system architecture and component organization
- Technology evaluation with comparison matrices
- B2B SaaS best practices and data visualization patterns
- WCAG 2.1 AA accessibility standards
- Performance optimization strategies
- Three-tier design token system (global → brand → component)
- Atomic design component hierarchy (atoms → molecules → organisms → templates → pages)
- RTL/LTR implementation patterns

### Technology Stack

| Component               | Technology                  | Status               |
| ----------------------- | --------------------------- | -------------------- |
| Framework               | TanStack Start              | ✅ Implemented       |
| Component Library       | Mantine UI v9               | ✅ Implemented       |
| Supplemental Components | Radix UI                    | 🔄 Phase 2           |
| Internationalization    | @tanstack/react-router i18n | ✅ Implemented       |
| State Management        | TanStack Store              | ✅ Implemented       |
| Form Handling           | TanStack Form               | ✅ Implemented       |
| Data Visualization      | Recharts                    | 📋 To Be Implemented |
| Documentation           | Ladle                       | 🔄 Phase 2           |
| Testing                 | Playwright + Vitest         | ✅ Implemented       |
| Build Tool              | Vite                        | ✅ Implemented       |

---

## Primary Objectives

### Primary Objective

Create a comprehensive SpecKit specification at `/specs/o1-ui` that translates the UI architecture documentation into actionable implementation plans, following the organizational patterns and quality standards established in `/specs/00-core`.

### Secondary Objectives

1. **Organizational Alignment:** Structure the specification into logical, encapsulated phases that enable incremental implementation and verification
2. **Implementation Guidance:** Provide detailed task breakdowns with clear acceptance criteria for each component and feature
3. **Quality Assurance:** Define comprehensive testing strategies, coverage targets, and verification checkpoints
4. **Documentation Standards:** Maintain consistency with existing project documentation patterns and conventions
5. **Dependency Management:** Clearly identify prerequisites, interdependencies, and blocking relationships between phases

---

## Source Documentation

### Primary Source

**Document:** `/docs/architecture/ui/00-overview.md`  
**Description:** Executive summary and entry point for the UI system specification  
**Key Sections:** Architecture highlights, implementation timeline, success metrics

### Supporting Documentation

| Document                 | Path                                                                     | Relevance                                                         |
| ------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Design System Landscape  | `/docs/architecture/ui/01-research-findings/design-system-landscape.md`  | Component organization, token architecture, multi-tenant patterns |
| Technology Evaluation    | `/docs/architecture/ui/01-research-findings/technology-evaluation.md`    | Tech stack evaluation with comparison matrices                    |
| Best Practices           | `/docs/architecture/ui/01-research-findings/best-practices.md`           | 2024-2025 B2B SaaS design trends, data viz, responsive design     |
| Accessibility Standards  | `/docs/architecture/ui/01-research-findings/accessibility-standards.md`  | WCAG 2.1 AA compliance, screen readers, keyboard nav, RTL         |
| Performance Optimization | `/docs/architecture/ui/01-research-findings/performance-optimization.md` | Lazy loading, bundle optimization, monitoring                     |

### Cross-Reference Documentation

| Document                           | Path                                                    | Purpose                                                         |
| ---------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| TanStack Start Full-Stack Adoption | `/prompts/tanstack-start-full-stack-adoption.md`        | tRPC unified API layer, TanStack Store, TanStack Form decisions |
| Technical Architecture             | `/docs/architecture/business/technical-architecture.md` | System architecture, components, data flow                      |
| Implementation Guide               | `/docs/architecture/business/implementation-guide.md`   | Current status, patterns, conventions                           |
| Business Architecture              | `/docs/architecture/business/business-architecture.md`  | Domain entities, multi-tenancy model                            |
| Testing Strategy                   | `/docs/02-planning-and-methodology/testing-strategy.md` | Coverage targets, test types, quality gates                     |

---

## Organizational Requirements

### Directory Structure

The specification must be created at `/specs/o1-ui/` with the following organizational structure:

```
specs/o1-ui/
├── README.md                           # Phase overview, navigation, quick reference
├── 00-foundation/                      # Base setup, configuration, infrastructure
│   ├── README.md                       # Sub-phase overview and navigation
│   ├── overview.md                     # Detailed objectives, scope, timeline
│   ├── tasks.md                        # Complete task breakdown with dependencies
│   ├── acceptance-criteria.md          # Quality gates and exit criteria
│   └── implementation-scope.md         # Waves, in-scope vs. out-of-scope items
├── 01-design-system/                   # Design tokens, component architecture
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
├── 02-components/                      # Atomic design components (atoms, molecules)
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
├── 03-organisms/                       # Complex components and templates
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
├── 04-data-visualization/              # Charts, graphs, analytics visualizations
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
├── 05-internationalization/            # RTL, multi-language, localization
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
├── 06-accessibility/                   # WCAG compliance, testing, remediation
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
├── 07-performance/                     # Optimization, monitoring, budgets
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
├── 08-documentation/                   # Component docs, Storybook/Ladle setup
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
├── 09-testing/                         # Unit, integration, E2E, visual regression
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
└── 10-production-hardening/            # Final validation, monitoring, deployment
    ├── README.md
    ├── overview.md
    ├── tasks.md
    └── acceptance-criteria.md
```

### Sub-Phase Definitions

| Sub-Phase                   | Focus Area                                   | Key Deliverables                                                  |
| --------------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| **00-foundation**           | Project setup, configuration, build pipeline | Monorepo config, TypeScript setup, build tooling, dev environment |
| **01-design-system**        | Design tokens, theming, architecture         | Three-tier token system, theme provider, CSS architecture         |
| **02-components**           | Atomic design components (atoms, molecules)  | Base component library, input components, navigation elements     |
| **03-organisms**            | Complex components and templates             | Data tables, dashboards, forms, layouts                           |
| **04-data-visualization**   | Charts, graphs, analytics                    | Recharts integration, custom visualizations, RTL charts           |
| **05-internationalization** | RTL, multi-language, localization            | Locale detection, text direction, date/currency formatting        |
| **06-accessibility**        | WCAG compliance, testing, remediation        | A11y tests, keyboard navigation, screen reader support            |
| **07-performance**          | Optimization, monitoring, budgets            | Bundle analysis, lazy loading, Core Web Vitals tracking           |
| **08-documentation**        | Component docs, Storybook/Ladle setup        | Interactive documentation, component examples, usage guidelines   |
| **09-testing**              | Unit, integration, E2E, visual regression    | Test infrastructure, coverage targets, visual tests               |
| **10-production-hardening** | Final validation, monitoring, deployment     | Production readiness, monitoring setup, deployment pipeline       |

### Encapsulation Requirements

Each sub-phase must:

1. **Be Self-Contained:** Include all necessary documentation (overview, tasks, acceptance criteria) within its directory
2. **Define Clear Boundaries:** Explicitly state what is in-scope and what is deferred to later phases
3. **Specify Prerequisites:** List any dependencies on earlier phases or external systems
4. **Include Exit Criteria:** Define measurable criteria that must be met before proceeding to the next phase
5. **Provide Verification Steps:** Include specific commands or tests to validate completion

---

## Execution Framework

### SpecKit Command Sequence

Use the following SpecKit commands sequentially to create the specification:

#### 1. Specification Phase (`/speckit-specify`)

**Purpose:** Define the high-level scope and objectives of the UI system

**Command:**

```
/speckit-specify Build a comprehensive multi-tenant multi-business-domain intelligence platform UI for AgenticVerdict, an intelligence platform that aggregates data from multiple business domains (Marketing, Finance, Operations, SEO, Social Media, Local Business) through reusable connectors. The system must support full internationalization with first-class Arabic RTL support, WCAG 2.1 AA accessibility compliance, and atomic design component organization. The UI should enable users to configure data connectors across domains, visualize cross-domain insights through interactive dashboards, generate automated reports, and manage multiple tenant tenants (for agency partners). Built on TanStack Start with Mantine UI v9, the system uses a three-tier design token architecture for multi-tenant branding flexibility while maintaining consistent user experience across all supported languages and regions.
```

**Expected Outputs:**

- High-level system description
- Core user journeys and use cases
- Primary functional requirements
- Key non-functional requirements (performance, accessibility, internationalization)

#### 2. Planning Phase (`/speckit-plan`)

**Purpose:** Define the technical architecture, technology choices, and implementation strategy

**Command:**

```
/speckit-plan The UI system builds upon the existing TanStack Start application foundation with Mantine UI v9 as the primary component library. Component architecture follows atomic design principles organized into atoms, molecules, organisms, templates, and pages. Internationalization uses TanStack Router's built-in i18n patterns with automatic locale detection and RTL/LTR layout rendering. State management leverages TanStack Store for client-side state and TanStack Form for type-safe form validation with Zod integration. Design tokens implement a three-tier system (global → brand → component) using CSS custom properties for runtime theming. Data visualization uses Recharts with RTL support. Component documentation uses Ladle for zero-config storytelling. Testing combines Vitest for unit tests (70%+ coverage target), Playwright for E2E testing of critical user journeys, and axe-core for accessibility validation. Performance optimization includes route-based code splitting, component lazy loading (>50KB threshold), virtual scrolling for large lists, and bundle size budgets enforced in CI. The project uses Turborepo for monorepo management with Vite as the build tool, TypeScript strict mode and zero any types enforced. The platform serves multiple business domains (Marketing, Finance, Operations, SEO, Social Media, Local Business) through reusable, domain-tagged connectors.
```

**Expected Outputs:**

- Technology stack justification
- Architecture patterns and conventions
- Development workflow and tooling
- Testing strategy and coverage targets
- Performance optimization approach

#### 3. Task Breakdown Phase (`/speckit-tasks`)

**Purpose:** Create actionable task lists organized by sub-phase with dependencies and estimates

**Command:**

```
/speckit-tasks Based on the specification and plan, create a comprehensive task breakdown organized into 11 sub-phases: 00-foundation, 01-design-system, 02-components, 03-organisms, 04-data-visualization, 05-internationalization, 06-accessibility, 07-performance, 08-documentation, 09-testing, and 10-production-hardening. Each task should include a unique identifier, title, description, acceptance criteria, estimated effort, dependencies on other tasks, and assigned sub-phase. Tasks should be granular enough to be completed in 2-8 hours with clear completion criteria. Include cross-cutting concerns such as RTL validation, accessibility testing, and performance monitoring as tasks in relevant sub-phases. Mark critical path tasks that must be completed before dependent sub-phases can begin. The platform supports multiple business domains (Marketing, Finance, Operations, SEO, Social Media, Local Business) with domain-tagged connectors, so tasks should reflect multi-domain UI patterns.
```

**Expected Outputs:**

- Detailed task list with IDs, titles, and descriptions
- Task dependencies and sequencing
- Effort estimates for each task
- Acceptance criteria for task completion
- Critical path identification

#### 4. Implementation Phase (`/speckit-implement`)

**Purpose:** Execute the tasks according to the plan, building the UI system incrementally

**Command:**

```
/speckit-implement Execute the task list sequentially by sub-phase, starting with 00-foundation and progressing through each subsequent sub-phase only after all acceptance criteria for the current phase are met. For each task, follow the Test-Driven Development approach: write tests first, implement the functionality, verify all tests pass, and validate against acceptance criteria. Create git commits at logical breakpoints with descriptive messages. Run the full test suite after completing each sub-phase to ensure no regressions were introduced. Generate documentation updates as features are implemented. Stop and request review if any task cannot be completed according to its acceptance criteria or if unexpected architectural decisions need to be made.
```

**Expected Outputs:**

- Implemented code following the specification
- Passing test suite with coverage targets met
- Updated documentation reflecting implementation
- Git history with clear commit messages
- Completion status for each task and sub-phase

---

## Quality Gates & Verification

### Sub-Phase Completion Criteria

Before proceeding from one sub-phase to the next, verify:

1. **Task Completion:** All tasks in the current sub-phase are marked as complete
2. **Acceptance Criteria Met:** All acceptance criteria defined in `acceptance-criteria.md` are satisfied
3. **Tests Passing:** All unit, integration, and E2E tests pass with adequate coverage
4. **Documentation Updated:** All relevant documentation is updated to reflect implementation
5. **Code Review Approved:** All code changes have been reviewed and approved
6. **No Regressions:** Existing functionality remains intact with no breaking changes

### Automated Verification Commands

Include verification scripts in each sub-phase:

```bash
# Run all tests for the sub-phase
pnpm --filter=@agenticverdict/ui test

# Check test coverage meets targets
pnpm --filter=@agenticverdict/ui test:coverage

# Verify TypeScript compilation
pnpm --filter=@agenticverdict/ui type-check

# Run linting
pnpm --filter=@agenticverdict/ui lint

# Run accessibility tests (where applicable)
pnpm --filter=@agenticverdict/ui test:a11y

# Run visual regression tests (where applicable)
pnpm --filter=@agenticverdict/ui test:visual
```

### Manual Verification Checklist

Each sub-phase should include a manual verification checklist:

- [ ] Functionality works as expected in both LTR and RTL modes
- [ ] Component renders correctly in all supported languages
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces appropriate information
- [ ] Performance budgets are not exceeded
- [ ] Visual design matches specifications
- [ ] Documentation is complete and accurate
- [ ] Code follows project conventions and patterns

---

## Deliverable Specifications

### Required Documentation Artifacts

For each sub-phase, the following documents must be created:

#### README.md

- Sub-phase summary and objectives
- Quick reference guide
- Links to all sub-phase documents
- Common workflows and commands
- Troubleshooting section

#### overview.md

- Detailed objectives and scope
- Timeline and milestones
- Risk assessment and mitigation strategies
- Dependencies on other sub-phases
- Success criteria

#### tasks.md

- Complete task breakdown with unique identifiers
- Task descriptions with clear acceptance criteria
- Task dependencies and sequencing
- Effort estimates
- Task status tracking

#### acceptance-criteria.md

- Quality gates for sub-phase completion
- Specific, measurable criteria for each deliverable
- Testing requirements and coverage targets
- Performance benchmarks
- Accessibility requirements

#### implementation-scope.md (for 00-foundation only)

- Waves or iterations within the sub-phase
- In-scope vs. out-of-scope items
- Deferrals to future sub-phases
- Rationale for scoping decisions

### Cross-Phase Documentation

In addition to sub-phase-specific documentation, create the following cross-phase documents at the root level (`/specs/o1-ui/`):

#### Phase Overview

- High-level phase summary
- Sub-phase descriptions and relationships
- Cross-phase dependencies
- Overall timeline and milestones

#### Specification (SPEC.md)

- Complete scope definition
- Domain breakdown
- Dependency mapping
- Acceptance criteria summary

#### Plan (PLAN.md)

- Implementation approach
- Risk mitigation strategies
- Resource allocation
- Communication plan

#### Tasks (TASKS.md)

- Master task list across all sub-phases
- Critical task identification
- Task dependencies and sequencing
- Progress tracking

---

## Best Practices & Guidelines

### Documentation Standards

1. **Markdown Format:** Use GitHub Flavored Markdown (GFM) for all documentation
2. **Version Control:** Include version number, last updated date, and maintainer
3. **Internal Links:** Use relative links for cross-references within the specification
4. **External Links:** Use absolute URLs for references to external documentation
5. **Code Blocks:** Specify language for syntax highlighting (e.g., ` ```typescript `)
6. **Tables:** Use Markdown tables for structured data and comparisons
7. **Lists:** Use numbered lists for sequences and bulleted lists for options

### Task Definition Standards

1. **Unique Identifiers:** Use hierarchical IDs (e.g., `UI-001`, `UI-FOUNDATION-001`)
2. **Clear Titles:** Use imperative mood (e.g., "Implement design token system")
3. **Detailed Descriptions:** Provide sufficient context for implementation
4. **Testable Acceptance Criteria:** Define verifiable completion criteria
5. **Realistic Estimates:** Base estimates on similar previous work
6. **Explicit Dependencies:** List all task dependencies clearly

### Code Organization Standards

1. **Atomic Design Hierarchy:** Organize components by atomic design levels
2. **Feature-Based Structure:** Group related functionality together
3. **Clear Boundaries:** Maintain clear separation between components
4. **Consistent Naming:** Use descriptive, consistent naming conventions
5. **Type Safety:** Leverage TypeScript with strict mode enabled
6. **Zero Any Types:** Avoid using `any` type; use `unknown` or proper types

### Testing Standards

1. **Test-Driven Development:** Write tests before implementation
2. **Coverage Targets:** Meet or exceed defined coverage thresholds
3. **Test Types:** Use appropriate test types for different scenarios
4. **Accessibility Testing:** Include a11y tests for all components
5. **RTL Testing:** Validate components in both LTR and RTL modes
6. **Visual Regression:** Use visual tests for UI components

---

## Appendix

### Glossary

| Term                      | Definition                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Atomic Design**         | A methodology for creating design systems with five levels: atoms, molecules, organisms, templates, and pages                                              |
| **RTL**                   | Right-to-Left text direction, required for Arabic and other languages                                                                                      |
| **Design Tokens**         | Named entities that store visual design attributes, used in a three-tier system (global, brand, component)                                                 |
| **Multi-Tenancy**         | Architecture where a single instance serves multiple customers (tenants) with data isolation                                                               |
| **Multi-Business-Domain** | Platform architecture supporting multiple business domains (Marketing, Finance, Operations, SEO, Social, Local) through reusable, domain-tagged connectors |
| **SpecKit**               | Framework for creating specifications with define, plan, tasks, and implement phases                                                                       |
| **WCAG 2.1 AA**           | Web Content Accessibility Guidelines level AA, the accessibility standard for web content                                                                  |
| **TanStack Store**        | Client-side state management library from the TanStack ecosystem, providing type-safe state with framework-agnostic design                                 |
| **TanStack Form**         | Type-safe form library from the TanStack ecosystem with native Zod integration and framework-agnostic core                                                 |
| **tRPC**                  | End-to-end type-safe RPC layer for TypeScript applications, enabling zero-API development experience                                                       |

### Related Resources

- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [TanStack Store Documentation](https://tanstack.com/store/latest)
- [TanStack Form Documentation](https://tanstack.com/form/latest)
- [Mantine UI Documentation](https://mantine.dev/)
- [tRPC Documentation](https://trpc.io/docs)
- [TanStack Start + tRPC Integration](https://tanstack.com/start/latest/docs/framework/react/examples/with-trpc)
- [SpecKit Framework Guide](/docs/02-planning-and-methodology/spec-kit-guide.md)
- [Project Testing Strategy](/docs/02-planning-and-methodology/testing-strategy.md)
- [Architecture Documentation](/docs/architecture/)
- [Business Architecture](/docs/architecture/business/business-architecture.md)
- [TanStack Start Full-Stack Adoption](/prompts/tanstack-start-full-stack-adoption.md)

---

## Change Log

| Version | Date       | Changes                   | Author           |
| ------- | ---------- | ------------------------- | ---------------- |
| 1.0     | 2026-04-13 | Initial document creation | Development Team |

---

**Document Status:** Active  
**Next Review:** After specification completion  
**Maintainer:** Development Team  
**Approval Status:** Pending

---

_This document serves as the comprehensive prompt for creating the UI system specification using SpecKit. Follow the execution framework sequentially, ensuring all quality gates are met before proceeding between sub-phases._
