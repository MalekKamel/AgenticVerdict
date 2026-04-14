# AgenticVerdict UI System: Executive Overview

**Document Version:** 1.0
**Last Updated:** 2026-04-11
**Status:** Active
**Target Audience:** Product Managers, Designers, Developers, Architects

---

## Executive Summary

The AgenticVerdict UI System Specification provides comprehensive guidance for building a world-class multi-business-domain intelligence platform. Built on TanStack Start and Mantine UI v9, our design system prioritizes accessibility, internationalization (including full Arabic RTL support), and performance while maintaining the flexibility needed for white-label agency partnerships.

This specification synthesizes research across five critical domains: design system architecture, technology evaluation, modern B2B SaaS best practices, WCAG 2.1 AA accessibility standards, and performance optimization. The result is a pragmatic, production-ready approach that leverages our existing technology investments while addressing the unique challenges of multi-domain business intelligence visualization.

**Key differentiators:** First-class RTL support from day one, atomic design component organization, comprehensive accessibility without compromise, and a three-tier design token system that enables both consistent branding and tenant-specific customization. Our performance targets (<2s page load on 3G, <500KB initial bundle) ensure the platform remains responsive even with complex cross-domain data visualizations.

---

## Quick Reference: Technology Stack

| Category                    | Technology                  | Purpose                                                         | Status               |
| --------------------------- | --------------------------- | --------------------------------------------------------------- | -------------------- |
| **Framework**               | TanStack Start              | File-based routing, type-safe navigation, load & action pattern | ✅ Implemented       |
| **API Layer**               | tRPC v11                    | Unified type-safe API for web, mobile, and CLI clients          | ✅ Implemented       |
| **Component Library**       | Mantine UI v9               | Primary component system with built-in RTL                      | ✅ Implemented       |
| **Supplemental Components** | Radix UI                    | Enhanced accessibility for complex interactions                 | 🔄 Phase 2           |
| **Styling**                 | CSS-in-JS (Mantine v9)      | Theme integration, automatic RTL handling                       | ✅ Implemented       |
| **Documentation**           | Ladle                       | Zero-config component documentation                             | 🔄 Phase 2           |
| **Design Tokens**           | Custom Mantine v9 Theme     | Three-tier token system (global→brand→component)                | 🔄 Phase 2           |
| **Internationalization**    | @tanstack/react-router i18n | Multi-language with RTL support                                 | ✅ Implemented       |
| **State Management**        | TanStack Store              | Lightweight client state (web client only)                      | ✅ Implemented       |
| **Data Visualization**      | Recharts                    | Chart components with RTL support                               | 🔄 To Be Implemented |
| **Testing**                 | Playwright + Vitest         | E2E and unit testing                                            | ✅ Implemented       |

**Legend:** ✅ Implemented | 🔄 Planned | 📋 Research Complete

---

## Documentation Navigation

### Core Specification Documents

| Document                                                                            | Description                                                       | Audience         |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------- |
| **[00-overview.md](./00-overview.md)**                                              | This document - executive summary and entry point                 | All              |
| **[01-research-findings/](./01-research-findings/)**                                | Comprehensive research across 5 domains                           | All              |
| → [design-system-landscape.md](./01-research-findings/design-system-landscape.md)   | Component organization, token architecture, multi-tenant patterns | Architects, Devs |
| → [technology-evaluation.md](./01-research-findings/technology-evaluation.md)       | Tech stack evaluation with comparison matrices                    | Architects, Devs |
| → [best-practices.md](./01-research-findings/best-practices.md)                     | 2024-2025 B2B SaaS design trends, data viz, responsive design     | PMs, Designers   |
| → [accessibility-standards.md](./01-research-findings/accessibility-standards.md)   | WCAG 2.1 AA compliance, screen readers, keyboard nav, RTL         | All              |
| → [performance-optimization.md](./01-research-findings/performance-optimization.md) | Lazy loading, bundle optimization, monitoring                     | Devs, Architects |

### Related Architecture Documents

- **[Technical Architecture](/docs/architecture/business/technical-architecture.md)** - System architecture, components, data flow
- **[Implementation Guide](/docs/architecture/business/implementation-guide.md)** - Current status, patterns, conventions
- **[Business Architecture](/docs/architecture/business/business-architecture.md)** - Domain entities, multi-tenancy model

---

## Key Principles

### 1. Accessibility Without Compromise

WCAG 2.1 AA compliance is non-negotiable. Every component must support keyboard navigation, screen readers, and high-contrast modes. We target AAA compliance for critical user paths (authentication, data export, connector management). Accessibility is tested automatically in CI and validated manually before each release.

### 2. Internationalization From Day One

Arabic RTL support is not an afterthought—it's foundational. Our design system uses logical properties (CSS `margin-inline-start` vs `margin-left`), automatic direction detection, and comprehensive layout mirroring. All user-facing strings are externalized, and date/currency formatting is locale-aware.

### 3. Progressive Disclosure for Complex Data

Analytics dashboards can overwhelm users. We prioritize clarity over density: show 3-5 key metrics by default with drill-down capabilities for detailed analysis. Card-based layouts, generous whitespace (24-32px between sections), and visual hierarchy guide attention to critical information first.

### 4. Performance Is a Feature

Targets: <2s page load on 3G, <3s time to interactive, <500KB initial bundle. We achieve this through route-based code splitting, lazy loading for components >50KB, virtual scrolling for large lists, and strategic preloading. Performance is monitored in production and protected by CI budgets.

### 5. Multi-Tenant Flexibility

Our three-tier token system (global → brand → component) enables white-label customization for agency partners while maintaining brand consistency for direct customers. Tenant-specific themes are injected at runtime via CSS custom properties, requiring no code changes for brand customization.

### 6. Atomic Design Organization

Components are organized into five levels: atoms (basic building blocks), molecules (simple combinations), organisms (complex sections), templates (page layouts), and pages (complete views). This hierarchy mirrors component complexity, facilitates discovery, and scales naturally with the codebase.

### 7. Test-Driven Component Development

Every component has unit tests (70%+ coverage target, 90%+ for business logic), visual regression tests for UI integrity, and accessibility tests via axe-core. E2E tests cover critical user journeys: connector setup, insight creation, report generation, and multi-language switching.

---

## Architecture Highlights

### Design Token System

Our three-tier token architecture balances consistency with customization:

```typescript
// Global tokens (brand-agnostic)
--av-color-primary: #228BE6;
--av-spacing-md: 1rem;
--av-radius-md: 0.5rem;

// Brand tokens (tenant-specific overrides)
--brand-color-primary: #FF6B35;  // Masafh orange
--brand-logo-url: /logos/masafh.svg;

// Component tokens (composed from global/brand)
--button-primary-bg: var(--brand-color-primary, var(--av-color-primary));
--card-padding: var(--av-spacing-md);
```

**Benefits:** Single source of truth, runtime theming without rebuilds, tenant isolation, design tool synchronization (future via Style Dictionary).

### Component Organization

```
packages/ui/src/
├── atoms/              # Button, Input, Badge, Icon, Typography
├── molecules/          # SearchInput, FormField, Card, Dropdown
├── organisms/          # DataTable, DashboardCard, Navigation, Sidebar
├── templates/          # DashboardLayout, AuthLayout, ReportLayout
└── hooks/              # useConnectorStatus, useInsightData
```

**Pattern:** Atoms wrap Mantine with minimal customization. Molecules compose atoms for business logic. Organisms encapsulate complex, reusable sections.

### RTL Implementation

- **Logical Properties:** Use `margin-inline-start` instead of `margin-left`
- **Automatic Direction:** `DirectionProvider` detects locale and sets `dir="rtl"` or `dir="ltr"`
- **Layout Mirroring:** Flexbox/grid automatically reverse; test with both directions
- **Icon Mirroring:** Directional icons (arrows) flip automatically via CSS transforms
- **Text Alignment:** Use `text-align: start` instead of `text-align: left`

### Performance Strategy

1. **Route-Based Splitting:** Automatic with TanStack Router file-based routing
2. **Component Lazy Loading:** Dynamic imports for components >50KB
3. **Virtual Scrolling:** @tanstack/react-virtual for large lists
4. **Bundle Optimization:** Tree-shakeable Mantine imports, chunk splitting
5. **Image Optimization:** TanStack Start image optimizations with WebP/AVIF formats
6. **Monitoring:** Core Web Vitals tracking in production
7. **Multi-Process Architecture:** TanStack Start handles frontend routing/UI while the standalone API server (Fastify + tRPC) handles data operations, enabling independent scaling and optimal resource utilization

### Multi-Tenant Agency Partner Support

The AgenticVerdict platform is designed as a multi-business-domain intelligence platform serving multiple agency partners across diverse business domains (Marketing, Finance, Operations, SEO, Social Media, Local Business). The unified tRPC API layer serves multiple client types while maintaining full type safety and tenant isolation across all platforms:

| Client Type | Technology             | API Access                           | Type Safety                           |
| ----------- | ---------------------- | ------------------------------------ | ------------------------------------- |
| **Web**     | TanStack Start + React | tRPC client (`@tanstack/start-trpc`) | ✅ Full end-to-end type safety        |
| **Mobile**  | React Native           | tRPC client (`@trpc/client`)         | ✅ Full end-to-end type safety        |
| **CLI**     | Node.js                | HTTP client (fetch)                  | ⚠️ Runtime validation via Zod schemas |

**Key Benefits:**

- **Single API Surface:** All clients and agency partners consume the same tRPC routers, eliminating API duplication across business domains
- **Type Safety Across Clients:** Web and mobile clients automatically infer types from the backend, no manual type definitions needed
- **Consistent Business Logic:** All clients execute the same server-side procedures with identical validation, tenant isolation, and multi-domain data access
- **Independent Scaling:** The API server (Fastify + tRPC) scales independently of the web frontend, mobile apps, and CLI tools
- **Multi-Domain Tenant Isolation:** Each agency partner operates within their own tenant boundary, with domain-specific data models (Marketing campaigns, Financial reports, Operational metrics, SEO analytics, Social Media insights, Local Business performance) fully isolated and customizable

**Multi-Tenant Agency Architecture:**

The platform supports white-label agency partnerships where each partner can:

- Customize branding via the three-tier design token system (no code changes required)
- Configure domain-specific dashboards and workflows for their business vertical
- Maintain complete data isolation from other agency partners
- Access all business domains through the same unified interface with role-based permissions

**Client Architecture Pattern:**

```typescript
// Single tRPC router definition (server)
export const connectorsRouter = t.router({
  getMetrics: t.procedure
    .input(z.object({ dateRange: DateRangeSchema, tenantId: z.string() }))
    .query(async ({ input }) => {
      return await fetchMetrics(input);
    }),
});

// Web client usage (TanStack Start)
const { data } = trpc.connectors.getMetrics.useQuery({
  dateRange: { start: "2026-04-01", end: "2026-04-13" },
  tenantId: "agency-partner-id",
});

// Mobile client usage (React Native) - same query, same types
const { data } = trpc.connectors.getMetrics.useQuery({
  dateRange: { start: "2026-04-01", end: "2026-04-13" },
  tenantId: "agency-partner-id",
});
```

For detailed tRPC architecture specifications, see [`/prompts/tanstack-start-full-stack-adoption.md`](/prompts/tanstack-start-full-stack-adoption.md).

---

## Getting Started

### For New Developers

1. **Read this overview** to understand the system architecture
2. **Review [best-practices.md](./01-research-findings/best-practices.md)** for UI/UX patterns
3. **Explore existing components** in `packages/ui/src/` to understand conventions
4. **Set up Ladle** (Phase 2) for interactive component development
5. **Follow the Component Development Workflow** in [technology-evaluation.md](./01-research-findings/technology-evaluation.md#71-component-development-workflow)

### For Product Managers

1. **Start with [best-practices.md](./01-research-findings/best-practices.md)** to understand modern analytics UX
2. **Review the Component Organization** section to understand what's available
3. **Reference [accessibility-standards.md](./01-research-findings/accessibility-standards.md)** for requirements
4. **Consult the Implementation Timeline** below for planning

### For Designers

1. **Read [best-practices.md](./01-research-findings/best-practices.md)** for B2B SaaS design patterns
2. **Review the Design Token System** to understand theming capabilities
3. **Explore RTL Considerations** in [accessibility-standards.md](./01-research-findings/accessibility-standards.md)
4. **Reference Data Visualization** section for chart guidelines

### For Architects

1. **Read all research documents** in `01-research-findings/` for deep technical context
2. **Review [technology-evaluation.md](./01-research-findings/technology-evaluation.md)** for tech stack rationale
3. **Consult [design-system-landscape.md](./01-research-findings/design-system-landscape.md)** for architectural patterns
4. **Review [performance-optimization.md](./01-research-findings/performance-optimization.md)** for optimization strategies

---

## Implementation Timeline

### Phase 1: Foundation (✅ Complete)

- **Week 1-2:** TanStack Start + Mantine v9 setup
- **Week 1-2:** TanStack Router i18n integration
- **Week 1-2:** RTL support via DirectionProvider
- **Week 1-2:** Base component library (atoms, molecules)
- **Week 1-2:** Design token foundation

**Deliverables:** Working app with Arabic/English support, basic component library, RTL layouts

### Phase 2: Enhancement (🔄 In Progress - 1-2 weeks)

- **Week 1:** Ladle documentation setup (2-4 hours)
- **Week 1:** Custom design token system (8-12 hours)
- **Week 1:** Radix UI integration for accessibility gaps (4-8 hours)
- **Week 2:** RTL test coverage expansion (8-12 hours)
- **Week 2:** Component development guide

**Deliverables:** Interactive component docs, three-tier token system, comprehensive RTL tests

### Phase 3: Polish (📋 Planned - 1 week)

- **Week 1:** Document RTL patterns and guidelines
- **Week 1:** Visual regression testing setup
- **Week 1:** Performance optimization (bundle analysis, lazy loading)
- **Week 1:** Accessibility audit and remediation

**Deliverables:** Complete documentation, automated testing, performance targets met

### Phase 4: Production Hardening (📋 Planned - Ongoing)

- **Continuous:** Monitor Core Web Vitals in production
- **Continuous:** A11y testing in CI (axe-core)
- **Monthly:** Performance audits (Lighthouse)
- **Quarterly:** Design system reviews and updates

---

## For Different Audiences

### Product Managers

**What You Need to Know:**

- Our design system enables rapid feature development without sacrificing consistency
- Multi-language support (Arabic/English) is built-in, not a separate concern
- White-label customization is supported via design tokens (no code changes)
- Performance targets ensure the platform feels fast even with complex data

**Key Documents:**

- [best-practices.md](./01-research-findings/best-practices.md) - Analytics UX patterns
- [accessibility-standards.md](./01-research-findings/accessibility-standards.md) - Compliance requirements

### Designers

**What You Need to Know:**

- Atomic design provides a shared language for component organization
- Design tokens enable Figma-to-code synchronization (future enhancement)
- RTL layouts require mirrored designs, not just text direction changes
- Accessibility requirements (WCAG 2.1 AA) affect color contrast, touch targets, and screen readers

**Key Documents:**

- [best-practices.md](./01-research-findings/best-practices.md) - Modern B2B SaaS patterns
- [design-system-landscape.md](./01-research-findings/design-system-landscape.md) - Token architecture

### Developers

**What You Need to Know:**

- Use existing atoms/molecules before creating new components
- Follow atomic design hierarchy (atoms → molecules → organisms)
- Test with both LTR and RTL layouts during development
- Lazy load components >50KB and use virtual scrolling for large lists
- All components must have unit tests and accessibility checks

**Key Documents:**

- [technology-evaluation.md](./01-research-findings/technology-evaluation.md) - Tech stack decisions
- [performance-optimization.md](./01-research-findings/performance-optimization.md) - Optimization strategies
- [accessibility-standards.md](./01-research-findings/accessibility-standards.md) - A11y implementation

### Architects

**What You Need to Know:**

- Three-tier token system balances consistency with tenant customization
- Mantine v9 + Radix UI provides comprehensive component coverage with maximal accessibility
- Performance is achieved through strategic lazy loading, not premature optimization
- RTL support is foundational, using logical properties and automatic direction detection

**Key Documents:**

- [design-system-landscape.md](./01-research-findings/design-system-landscape.md) - System architecture
- [technology-evaluation.md](./01-research-findings/technology-evaluation.md) - Evaluation criteria
- [performance-optimization.md](./01-research-findings/performance-optimization.md) - Performance strategy

---

## Success Metrics

### Performance Targets

- Page load time: <2s (3G connection)
- Time to interactive: <3s (3G connection)
- Initial bundle size: <500KB gzipped
- First Contentful Paint: <1.5s (mobile, 4G)
- Cumulative Layout Shift: <0.1

### Accessibility Targets

- WCAG 2.1 Level AA compliance (100% of components)
- WCAG 2.1 Level AAA compliance (critical user paths)
- Zero axe-core violations in CI
- Keyboard navigation for all interactive elements
- Screen reader compatibility (NVDA, JAWS, VoiceOver)

### Development Quality Targets

- 70%+ unit test coverage (80%+ for business logic)
- Zero console errors in production
- Visual regression test coverage for all components
- RTL layout validation for all pages
- Bundle size budgets enforced in CI

---

## Next Steps

1. **For Immediate Implementation:** Review [best-practices.md](./01-research-findings/best-practices.md) and begin prototyping key components (dashboard cards, data tables, connector status indicators)

2. **For Phase 2 Planning:** Consult [technology-evaluation.md](./01-research-findings/technology-evaluation.md) Section 6.2 for the enhancement roadmap

3. **For Long-Term Strategy:** Reference the implementation timeline and success metrics to track progress

4. **For Questions:** Consult the relevant research document based on your domain (design, development, architecture)

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-11
**Status:** Active
**Next Review:** After Phase 2 completion (estimated 2 weeks)
**Maintainer:** Architecture Team

**Related Documents:**

- [Technical Architecture](/docs/architecture/business/technical-architecture.md)
- [Implementation Guide](/docs/architecture/business/implementation-guide.md)
- [Testing Strategy](/docs/02-planning-and-methodology/testing-strategy.md)
