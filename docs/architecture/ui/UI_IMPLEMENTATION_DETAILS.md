# UI Implementation Details: AgenticVerdict User Interface System

**Document Version:** 1.0
**Date:** 2026-04-11
**Status:** Active
**Prepared For:** Development Team, Architecture Team

---

## Executive Summary

This document outlines the technical implementation details for the User Interface layer of the AgenticVerdict multi-business-domain intelligence platform. It builds upon the business requirements defined in [BUSINESS_REQUIREMENTS.md](./BUSINESS_REQUIREMENTS.md) and provides the technical specifications for building a modern, scalable UI system using Next.js, Mantine, and tRPC.

### Foundation Status

The foundation phase (`/specs/00-core/00-foundation/`) is complete, including:

- Monorepo infrastructure with Turborepo + pnpm workspaces
- Multi-tenancy core with AsyncLocalStorage context propagation
- Database layer with Drizzle ORM and row-level security
- Configuration management via CompanyConfig schema
- Basic web application structure with Next.js 15 and Mantine UI
- Internationalization (i18n) system supporting English/Arabic with RTL/LTR
- Testing infrastructure with Vitest and Playwright

---

## 1. Technology Stack

### 1.1 Existing Technology Stack

From the foundation phase implementation:

| Component            | Technology                  | Status        | Notes                             |
| -------------------- | --------------------------- | ------------- | --------------------------------- |
| **Framework**        | Next.js 15                  | ✅ Complete   | App Router, Turbopack enabled     |
| **UI Library**       | Mantine UI v7               | ✅ Selected   | TypeScript-first, 100+ components |
| **Styling**          | CSS Modules + PostCSS       | ✅ Configured | Mantine's styling system          |
| **Forms**            | @mantine/form               | ✅ Available  | Form validation library           |
| **State Management** | TanStack Store              | ✅ Available  | Lightweight state management      |
| **i18n**             | next-intl                   | ✅ Configured | English/Arabic with RTL support   |
| **Data Fetching**    | tRPC v11                    | ✅ Available  | End-to-end type safety            |
| **Database**         | Drizzle ORM + PostgreSQL 16 | ✅ Complete   | Multi-tenant with RLS             |
| **Testing**          | Vitest + Playwright         | ✅ Configured | Unit and E2E testing              |

### 1.2 Package Structure (Relevant to UI)

```
packages/
├── ui/                 # [TO BE IMPLEMENTED] Shared UI components
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── layouts/        # Layout components (AppShell, Dashboard)
│   │   ├── forms/          # Form components and validators
│   │   ├── charts/         # Data visualization components
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # UI utilities
│   └── package.json
│
└── i18n/              # ✅ Complete Internationalization
    ├── src/
    │   ├── locales/        # Translation files (ar, en, and extensible for more)
    │   │   ├── ar/
    │   │   │   └── common.json
    │   │   └── en/
    │   │       └── common.json
    │   ├── config/         # i18n configuration
    │   └── utils/          # i18n helpers
    └── package.json

apps/
└── web/              # Next.js web application
    └── src/
        ├── app/            # App Router pages
        ├── components/     # Page-specific components
        └── lib/            # Web-specific utilities
```

---

## 2. Multi-Tenancy UI Requirements

### 2.1 Tenant Context

All UI components must respect tenant isolation:

```typescript
// Tenant context must be available in UI
interface UITenantContext {
  tenantId: string;
  companyName: string;
  language: "ar" | "en"; // Extensible for more languages
  textDirection: "ltr" | "rtl";
  timezone: string;
  currency: string;
}

// Agency partner context
interface AgencyContext extends UITenantContext {
  isAgency: true;
  managedTenants: Array<{
    tenantId: string;
    companyName: string;
  }>;
  activeTenantId: string;
}
```

### 2.2 Configuration-Driven UI

The UI must be fully configuration-driven via CompanyConfig:

```typescript
// UI derives all behavior from CompanyConfig
interface CompanyConfig {
  localization: {
    language: "ar" | "en"; // Determines RTL/LTR, translations (extensible)
    region: string;
    timezone: string; // Timezone formatting
    currency: string; // Currency display
  };
  marketing: {
    channels: PlatformConfig[]; // Available platforms
  };
  features: {
    enableInsights: boolean;
    enableVerdict: boolean;
    enableDelivery: boolean;
  };
}
```

---

## 3. Implementation Objectives

### 3.1 Primary Objectives

1. **Develop a Comprehensive UI System** that covers all business capabilities
2. **Ensure Maximum Code Reuse** between Web and Desktop (Electron) implementations
3. **Maintain Consistency** with existing Mantine UI foundation
4. **Support Multi-Tenancy** with visual tenant isolation
5. **Enable Self-Service** operation without developer assistance
6. **Provide Enterprise-Grade** usability and accessibility

### 3.2 Secondary Objectives

1. **Establish Design System** with reusable component patterns
2. **Implement Responsive Design** for mobile/tablet/desktop
3. **Ensure Accessibility** (WCAG 2.1 AA compliance minimum)
4. **Optimize Performance** with code splitting and lazy loading
5. **Support Progressive Enhancement** with graceful degradation

---

## 4. Design Principles

### 4.1 Core Design Principles

1. **Clarity Over Density**: Prioritize information clarity over data density
2. **Progressive Disclosure**: Show advanced options only when needed
3. **Consistency**: Uniform patterns across all interfaces
4. **Efficiency**: Minimize clicks for common operations
5. **Feedback**: Immediate response to all user actions
6. **Forgiveness**: Easy undo/redo for destructive actions
7. **Accessibility**: WCAG 2.1 AA compliance minimum

---

## 5. Technical Specifications

### 5.1 Component Architecture

```typescript
// Base component structure
interface BaseComponentProps {
  className?: string;
  testId?: string;
}

// All components support RTL
interface LocalizedComponentProps extends BaseComponentProps {
  dir?: "ltr" | "rtl"; // Inherited from context
}

// All components support theming
interface ThemedComponentProps {
  variant?: "light" | "dark";
}
```

### 5.2 State Management Strategy

```typescript
// TanStack Store store structure
interface UIStore {
  // Tenant context
  tenantContext: UITenantContext | null;

  // Navigation
  currentRoute: string;
  breadcrumbs: Breadcrumb[];

  // UI state
  sidebarOpen: boolean;
  theme: "light" | "dark";
  language: "ar" | "en"; // Extensible for more languages

  // Data caches
  insights: Insight[];
  connectors: Connector[];
  reports: Report[];

  // Actions
  setTenantContext: (context: UITenantContext) => void;
  navigate: (route: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (lang: "ar" | "en") => void; // Extensible for more languages
}
```

### 5.3 Form Strategy

```typescript
// Using @mantine/form with validation
interface InsightFormData {
  name: string;
  template?: string;
  connectors: string[];
  metrics: MetricConfig[];
  aiSettings?: AISettings;
  schedule: ScheduleConfig;
  delivery: DeliveryConfig;
}

// Form validation schema
const insightFormSchema = z.object({
  name: z.string().min(1).max(100),
  template: z.string().optional(),
  connectors: z.array(z.string()).min(1),
  metrics: z.array(metricSchema),
  aiSettings: aiSettingsSchema.optional(),
  schedule: scheduleSchema,
  delivery: deliverySchema,
});
```

### 5.4 Data Fetching Strategy

```typescript
// tRPC procedures for type-safe data fetching
export const uiRouter = router({
  // Dashboard
  dashboardData: publicProcedure
    .input(z.object({ tenantId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return getDashboardData(input.tenantId);
    }),

  // Insights
  listInsights: publicProcedure
    .input(z.object({ tenantId: z.string().uuid() }))
    .query(async ({ input }) => {
      return listInsights(input.tenantId);
    }),

  createInsight: publicProcedure.input(insightFormSchema).mutation(async ({ input }) => {
    return createInsight(input);
  }),
});
```

---

## 6. Localization Implementation

### 6.1 i18n Configuration

The localization system uses `next-intl` with the following structure:

```typescript
// i18n configuration
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// RTL language mapping
export const rtlLocales: Locale[] = ["ar"];

export function isRTLLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// Extensible: Add new locales here without code changes
// Example: export const locales = ['en', 'ar', 'fr', 'es', 'ur', 'he'] as const;
```

### 6.2 Translation File Structure

```
packages/i18n/src/locales/
├── en/                    # English (LTR)
│   └── common.json
├── ar/                    # Arabic (RTL)
│   └── common.json
└── [future-locale]/       # Extensible for additional languages
    └── common.json
```

### 6.3 Adding New Languages

To add a new language, create a new locale directory and add the language code to the configuration:

```typescript
// 1. Create translation file
packages / i18n / src / locales / fr / common.json;

// 2. Update locale configuration
export const locales = ["en", "ar", "fr"] as const;

// 3. Update RTL mapping if needed
export const rtlLocales: Locale[] = ["ar"]; // English is LTR

// No code changes needed in components - the system handles new locales automatically
```

---

## 7. Implementation Approach Using SpecKit

### 7.1 SpecKit Command Usage

This implementation must use the SpecKit framework for systematic specification:

1. **`/speckit.specify`** - Describe WHAT to build and WHY, focusing on business requirements
2. **`/speckit.plan`** - Define the technical architecture, tech stack, and implementation approach
3. **`/speckit.tasks`** - Generate actionable task lists from the implementation plan

### 7.2 Phase Structure

Create the UI specification at `/specs/01-ui/` following the structure of `/specs/00-core/`:

```
specs/01-ui/
├── README.md                    # Phase overview and navigation
├── SPEC.md                      # Scope, domains, dependencies
├── PLAN.md                      # Authoring and migration approach
├── TASKS.md                     # Actionable maintenance checklist
├── phase-overview.md            # Dependencies and parallelization
│
├── 00-foundation/               # UI foundation components
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   ├── acceptance-criteria.md
│   └── implementation-scope.md
│
├── 01-auth/                     # Authentication & authorization UI
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
│
├── 02-dashboard/                # Main dashboard
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
│
├── 03-insights/                 # Insight management UI
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
│
├── 04-connectors/               # Connector management UI
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
│
├── 05-reports/                  # Report viewing UI
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
│
├── 06-agency/                   # Agency partner features
│   ├── README.md
│   ├── overview.md
│   ├── tasks.md
│   └── acceptance-criteria.md
│
└── 07-admin/                    # Administration UI
    ├── README.md
    ├── overview.md
    ├── tasks.md
    └── acceptance-criteria.md
```

---

## 8. Non-Functional Requirements

### 8.1 Performance

- **Page Load Time**: <2 seconds on 3G
- **Time to Interactive**: <3 seconds on 3G
- **Bundle Size**: Initial load <500KB gzipped
- **Code Splitting**: Lazy load routes and heavy components
- **Image Optimization**: Next.js Image component with responsive sizing

### 8.2 Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

### 8.3 Code Reuse

- **>80% code reuse** between Web and Desktop implementations
- Shared components in `packages/ui/`
- Platform-specific code isolated to `apps/frontend/` and `apps/desktop/`

### 8.4 Testing

- **>70% coverage** for UI components
- Unit tests with Vitest
- E2E tests with Playwright for critical paths
- Visual regression tests for design system

---

## 9. Quality Gates

- Zero TypeScript errors
- All accessibility tests passing
- All visual regression tests passing
- All E2E tests passing for critical paths
- No console errors or warnings
- 100% translation coverage for supported languages

---

## 10. Code Deliverables

1. **`packages/ui/`** - Shared UI component library
2. **`apps/frontend/`** - Complete Next.js web application
3. **`apps/desktop/`** - Electron desktop application (wrapper)
4. **E2E Tests** - Playwright test suite
5. **Component Documentation** - Storybook or similar

---

## 11. Next Steps

### 11.1 Immediate Actions

1. **Review business requirements** with product team
2. **Confirm technical approach** with architecture team
3. **Execute `/speckit.specify`** for the overall UI system
4. **Execute `/speckit.plan`** for technical architecture
5. **Execute `/speckit.tasks`** to generate implementation tasks
6. **Begin foundation sub-phase** at `/specs/01-ui/00-foundation/`

### 11.2 Execution Order

1. Foundation → Auth → Dashboard → Insights → Connectors → Reports → Agency → Admin
2. Each sub-phase follows: specify → plan → tasks → implement → test → document

---

## Appendix A: References

### Technology Research

- **UI Libraries Research**: `/docs/04-technology-research/frontend/ui-libraries.md`
- **Testing Strategy**: `/docs/02-planning-and-methodology/testing-strategy.md`

### Existing Specifications

- **Core Foundation**: `/specs/00-core/00-foundation/`
- **Core Connectors**: `/specs/00-core/01-connectors/`
- **Core Intelligence**: `/specs/00-core/02-intelligence/`
- **Core Insights**: `/specs/00-core/03-insights/`

### Architecture Documents

- **Technical Architecture**: `/docs/architecture/business/technical-architecture.md`
- **Implementation Guide**: `/docs/architecture/business/implementation-guide.md`

---

**Document Status**: ✅ Active
**Next Review**: After foundation sub-phase completion
**Maintainer**: Architecture Team

---

_For business requirements, refer to [BUSINESS_REQUIREMENTS.md](./BUSINESS_REQUIREMENTS.md)_
