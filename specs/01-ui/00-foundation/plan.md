# Implementation Plan: UI Foundation

**Branch**: `001-ui-foundation` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/00-foundation/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Establish the foundational design system infrastructure for the AgenticVerdict multi-business-domain intelligence platform. This phase implements the three-tier design token system (global→brand→component), TanStack Start + Mantine v9 integration with CSS-in-JS, RTL/LTR layout foundation via DirectionProvider and logical properties, and the base component library (atoms and molecules) organized by atomic design principles. All components include WCAG 2.1 AA accessibility requirements from day one, with multi-tenant theming support for white-label agency partnerships.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), React 18+
**Primary Dependencies**:
- TanStack Start (framework)
- Mantine UI v9 (component library)
- @tanstack/react-router i18n (internationalization)
- @mantine/core (CSS-in-JS styling)
- tRPC v11 (type-safe API layer)
**Storage**: N/A (frontend design system; tenant theme config from backend API)
**Testing**: Vitest (unit), Playwright (E2E), @axe-core/react (accessibility)
**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge) with CSS custom properties support
**Project Type**: Web application (monorepo package: @agenticverdict/ui)
**Performance Goals**:
- Initial bundle size: <500KB gzipped
- First Contentful Paint: <1.5s (mobile 4G)
- Time to Interactive: <3s (3G connection)
- Page load time: <2s (3G connection)
- Cumulative Layout Shift: <0.1
**Constraints**:
- WCAG 2.1 AA compliance (non-negotiable)
- Zero `any` types (strict TypeScript)
- RTL support from day one (Arabic primary)
- Multi-tenant theming without code changes
- Route-based code splitting for components >50KB
**Scale/Scope**:
- 20+ atom components
- 15+ molecule components
- 3-tier design token system
- Support for 10+ languages (RTL/LTR)
- 50+ tenant themes (agency partners)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Multi-Tenancy First ✅ PASS

**Requirement**: Tenant context propagation and isolation
**Implementation**:
- Design token system supports tenant-specific brand tokens (colors, fonts, logo)
- Theme configuration loaded via backend API based on authenticated tenant
- Tenant isolation maintained at component level via CSS custom properties
- No hardcoded tenant-specific logic in component code

**Status**: Compliant - Multi-tenant theming is a core feature

### II. Configuration-Driven Architecture ✅ PASS

**Requirement**: Tenant-specific behavior through TenantConfig schema
**Implementation**:
- Three-tier design token system: global (brand-agnostic) → brand (tenant-specific) → component
- Tenant branding applied via CSS custom properties at runtime
- Theme configuration validated via Zod schemas
- Fallback to default tokens when tenant config not provided

**Status**: Compliant - All tenant customization flows through configuration

### III. Plugin Architecture ⚠️ N/A

**Requirement**: ConnectorAdapter interface for data connectors
**Implementation**: Not applicable to UI foundation phase
**Justification**: This is a UI design system, not a data integration layer. Component architecture follows atomic design principles instead.

**Status**: N/A - UI components don't use connector pattern

### IV. Type Safety & Quality Standards ✅ PASS

**Requirement**: Zero `any` types, strict TypeScript, Zod validation
**Implementation**:
- Strict TypeScript mode enforced
- All component props typed with interfaces
- Theme configuration validated via Zod schemas
- No `any` types permitted in component code

**Status**: Compliant - Type safety enforced throughout

### V. Battle-Tested Technology Only ✅ PASS

**Requirement**: Use production-proven tools from technology research
**Implementation**:
- TanStack Start: Documented in architecture (approved framework)
- Mantine v9: Documented in architecture (approved component library)
- @tanstack/react-router i18n: Approved i18n solution
- Vitest + Playwright: Approved testing stack
- CSS-in-JS via Mantine v9: Approved styling approach

**Status**: Compliant - All technologies from approved architecture

### Technology Standards Compliance

**Database Layer**: N/A (frontend design system)

**Testing Requirements**:
- Unit tests: Vitest with 70%+ coverage target
- E2E tests: Playwright for critical user journeys
- Accessibility: @axe-core/react for WCAG 2.1 AA validation

**Docker & Infrastructure**: N/A (frontend package)

### Development Standards Compliance

**Code Organization**:
- Atomic design hierarchy: atoms → molecules → organisms → templates → pages
- Monorepo structure: `packages/ui/src/`

**Error Handling**:
- Component-level error boundaries
- Graceful fallback for invalid theme configurations
- Proper error messages for accessibility tools

**Security Requirements**:
- Tenant theme isolation via CSS custom properties
- No credential storage in frontend
- Input validation via Zod schemas

**Language & Internationalization**:
- @tanstack/react-router i18n for multi-language support
- DirectionProvider for RTL/LTR switching
- Logical properties for layout mirroring
- Externalized translation files

**Overall Status**: ✅ PASS - All applicable principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/00-foundation/
├── spec.md              # Feature specification (user stories, requirements)
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (research findings)
├── data-model.md        # Phase 1 output (entities and relationships)
├── quickstart.md        # Phase 1 output (developer quick start)
├── contracts/           # Phase 1 output (component contracts)
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
packages/ui/
├── src/
│   ├── atoms/              # Basic building blocks
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Checkbox/
│   │   ├── Radio/
│   │   ├── Switch/
│   │   ├── Badge/
│   │   ├── Icon/
│   │   ├── Typography/
│   │   ├── Link/
│   │   ├── Separator/
│   │   └── Spinner/
│   ├── molecules/          # Simple combinations
│   │   ├── FormField/
│   │   ├── SearchInput/
│   │   ├── Card/
│   │   ├── Dropdown/
│   │   ├── Select/
│   │   ├── DatePicker/
│   │   ├── Tooltip/
│   │   ├── Popover/
│   │   ├── Alert/
│   │   └── Toast/
│   ├── organisms/          # Complex sections (future phases)
│   ├── templates/          # Page layouts (future phases)
│   ├── hooks/              # Custom React hooks
│   │   ├── useTheme.ts
│   │   ├── useDirection.ts
│   │   └── useComponentVariants.ts
│   ├── providers/          # Context providers
│   │   ├── ThemeProvider.tsx
│   │   ├── DirectionProvider.tsx
│   │   └── MantineProvider.tsx
│   ├── tokens/             # Design token definitions
│   │   ├── global.ts       # Brand-agnostic tokens
│   │   ├── brand.ts        # Tenant-specific token interface
│   │   └── component.ts    # Component token compositions
│   ├── styles/             # Global styles and utilities
│   │   ├── reset.css
│   │   └── utilities.css
│   ├── utils/              # Helper functions
│   │   ├── cn.ts           # className utility (clsx + tailwind-merge if needed)
│   │   └── accessibility.ts
│   └── index.ts            # Package exports
├── tests/
│   ├── unit/               # Component unit tests
│   │   ├── atoms/
│   │   └── molecules/
│   ├── accessibility/      # A11y tests with axe-core
│   └── visual-regression/  # Visual regression tests (future)
└── package.json

apps/frontend/
├── src/
│   ├── routes/             # TanStack Start file-based routing
│   │   ├── __root.tsx      # Root layout with providers
│   │   ├── index.tsx       # Home page
│   │   └── components/     # Route-specific components
│   ├── providers/          # App-level providers
│   │   └── TRPCProvider.tsx
│   └── i18n/               # Internationalization configuration
│       ├── locales/
│       │   ├── ar.json     # Arabic translations
│       │   └── en.json     # English translations
│       └── i18n.ts
└── package.json
```

**Structure Decision**: Monorepo web application following atomic design principles. The UI components are organized in `packages/ui/` as a shared package that can be imported by `apps/frontend/` (TanStack Start frontend), with potential for future reuse in mobile (React Native) and CLI interfaces. The atomic design hierarchy (atoms → molecules → organisms → templates) scales naturally with the codebase and mirrors component complexity.

## Complexity Tracking

> **No violations requiring justification - all applicable constitution principles satisfied.**

---

## Phase Completion Status

### Phase 0: Research ✅ COMPLETE

**Deliverables**:
- [x] research.md with all technical decisions and rationale
- [x] Technology stack validation (TanStack Start, Mantine v9, @tanstack/react-router i18n)
- [x] Design token system architecture (three-tier: global→brand→component)
- [x] RTL implementation strategy (logical properties + DirectionProvider)
- [x] Accessibility implementation strategy (WCAG 2.1 AA compliance)
- [x] Performance optimization strategy (route-based code splitting)

**Status**: All research questions resolved. No additional prototyping required.

### Phase 1: Design & Contracts ✅ COMPLETE

**Deliverables**:
- [x] data-model.md with component entities and relationships
- [x] contracts/component-api.md with all component API contracts
- [x] quickstart.md for developer onboarding
- [x] Agent context updated with new technology stack

**Entities Defined**:
- DesignToken (three-tier token system)
- Component (atomic design hierarchy)
- Theme (tenant-specific branding)
- Locale (language-region with RTL/LTR)
- ComponentVariant (visual styles)
- AccessibilityState (WCAG compliance)

**Component Contracts Defined**:
- 11 atom components: Button, Input, Checkbox, Radio, Switch, Badge, Icon, Typography, Link, Separator, Spinner
- 10 molecule components: FormField, SearchInput, Card, Dropdown, Select, DatePicker, Tooltip, Popover, Alert, Toast
- 2 providers: DirectionProvider, ThemeProvider
- 3 hooks: useDirection, useTheme, useBreakpoint

**Status**: All design artifacts complete. Ready for Phase 2 task generation.

### Constitution Re-Check ✅ PASS

**Post-Design Evaluation**:

| Principle | Pre-Design | Post-Design | Status |
|-----------|------------|-------------|--------|
| Multi-Tenancy First | ✅ PASS | ✅ PASS | No changes - theme system supports tenant isolation |
| Configuration-Driven Architecture | ✅ PASS | ✅ PASS | No changes - CSS custom properties enable runtime theming |
| Plugin Architecture | N/A | N/A | Not applicable to UI foundation |
| Type Safety & Quality Standards | ✅ PASS | ✅ PASS | No changes - all TypeScript interfaces defined |
| Battle-Tested Technology Only | ✅ PASS | ✅ PASS | No changes - all technologies from approved architecture |

**Overall Status**: ✅ PASS - All applicable principles satisfied. No violations or complexity justifications required.

---

## Next Steps

### Phase 2: Task Generation (Ready to Execute)

**Command**: `/speckit-tasks` (or manually create tasks.md)

**Expected Output**:
- Implementation tasks for all 21 components (11 atoms + 10 molecules)
- Provider implementation tasks (DirectionProvider, ThemeProvider, MantineProvider)
- Design token system implementation tasks
- Testing infrastructure setup tasks
- Documentation tasks (Ladle setup, component examples)

**Task Breakdown Structure**:
1. Setup & Configuration (TanStack Start + Mantine v9 integration)
2. Design Token System (global, brand, component tiers)
3. Provider Implementation (DirectionProvider, ThemeProvider, MantineProvider)
4. Atom Components (11 components with tests)
5. Molecule Components (10 components with tests)
6. Testing Infrastructure (Vitest, Playwright, axe-core setup)
7. Documentation (Ladle setup, component examples)
8. Validation & Polish (accessibility audit, RTL testing, performance optimization)

**Estimated Effort**: 2-3 weeks (based on architecture document timeline)

---

## Artifacts Generated

| Artifact | Path | Purpose |
|----------|------|---------|
| Feature Specification | `/specs/01-ui/00-foundation/spec.md` | User stories, requirements, success criteria |
| Implementation Plan | `/specs/01-ui/00-foundation/plan.md` | This file - technical approach and structure |
| Research Findings | `/specs/01-ui/00-foundation/research.md` | Technology decisions and rationale |
| Data Model | `/specs/01-ui/00-foundation/data-model.md` | Component entities and relationships |
| Component API Contracts | `/specs/01-ui/00-foundation/contracts/component-api.md` | Component interfaces and behavior |
| Quick Start Guide | `/specs/01-ui/00-foundation/quickstart.md` | Developer onboarding guide |

---

## References

### Architecture Documentation
- **UI Architecture Overview**: `/docs/architecture/ui/00-overview.md`
- **Design System Research**: `/docs/architecture/ui/01-research-findings/design-system-landscape.md`
- **Technology Evaluation**: `/docs/architecture/ui/01-research-findings/technology-evaluation.md`
- **Accessibility Standards**: `/docs/architecture/ui/01-research-findings/accessibility-standards.md`
- **Performance Optimization**: `/docs/architecture/ui/01-research-findings/performance-optimization.md`

### Project Documentation
- **Technical Architecture**: `/docs/architecture/business/technical-architecture.md`
- **Implementation Guide**: `/docs/architecture/business/implementation-guide.md`
- **Testing Strategy**: `/docs/02-planning-and-methodology/testing-strategy.md`
- **Constitution**: `.specify/memory/constitution.md`

---

**Plan Status**: ✅ COMPLETE - Ready for Phase 2 task generation
**Last Updated**: 2026-04-14
**Maintainer**: AgenticVerdict Architecture Team
