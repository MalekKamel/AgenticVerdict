# Web Apps TanStack Current State Analysis

**Date:** 2026-04-16  
**Author:** Claude Code  
**Purpose:** Analysis of current `apps/frontend` implementation against industry standards and TanStack Start best practices.

## Table of Contents

## 1. Executive Summary

The `apps/frontend` application demonstrates a solid foundation with TanStack Start v1, Mantine UI v9, and modern React patterns. The implementation shows good adherence to core TanStack Start conventions with file-based routing, type-safe navigation, and proper separation of concerns. However, several areas require improvement to meet production SaaS standards, particularly around multi-tenancy, error handling, and testing.

**Key Strengths:**

- **Modern Stack:** TanStack Start v1 with React 19, TypeScript 5, and Vite
- **Proper Routing:** File-based routing with automatic route tree generation
- **Design System Integration:** Mantine UI with custom theme provider
- **Internationalization:** Built-in locale support with RTL/LTR awareness
- **Type Safety:** Comprehensive TypeScript configuration

**Critical Gaps:**

- **Multi-Tenancy Implementation:** Tenant context propagation is incomplete
- **Error Handling:** Lack of structured error boundaries and centralized error logging
- **Authentication Flow:** Basic implementation lacking proper integration with TanStack Start patterns
- **Testing Coverage:** Insufficient test coverage for business logic
- **Performance Optimization:** Missing route-based code splitting and image optimization

**Overall Assessment:** The application is at a **beta maturity level** with strong architectural foundations but requires significant enhancements for production multi-tenant SaaS deployment. The priority should be addressing multi-tenancy gaps and error handling before adding new features.

## 2. Methodology

This analysis was conducted through systematic examination of the `apps/frontend` codebase against industry standards and TanStack Start best practices:

**Analysis Approach:**

1. **Codebase Exploration:** Direct examination of source files, configuration, and dependencies
2. **Pattern Recognition:** Identification of architectural patterns and anti-patterns
3. **Standards Comparison:** Evaluation against TanStack Start v1 conventions and industry best practices
4. **Multi-Tenancy Assessment:** Special focus on SaaS-specific requirements for tenant isolation
5. **Tooling Analysis:** Review of build tools, testing frameworks, and development workflows

**Data Sources:**

- **Primary Codebase:** `apps/frontend/src/` directory and configuration files
- **Dependencies:** `package.json` for technology stack analysis
- **Build Configuration:** `vite.config.ts`, `tsconfig.json`
- **Testing Infrastructure:** Test files in `test/` and `e2e/` directories
- **Documentation:** Project documentation in `docs/` directory

**Assessment Criteria:**

- **Compliance:** Adherence to TanStack Start v1 requirements
- **Quality:** Code organization, type safety, test coverage
- **Performance:** Bundle optimization, loading strategies
- **Security:** Authentication, data protection, vulnerability prevention
- **Accessibility:** WCAG 2.1 AA compliance, RTL/LTR support

**Severity Classification:**

- **Critical:** Blocks production deployment or creates security risks
- **High:** Significantly impacts user experience or maintainability
- **Medium:** Important improvements for long-term sustainability
- **Low:** Minor enhancements or optimizations

## 3. Architecture Assessment

### 3.1 Route Organization

**Current Implementation:**
The application uses TanStack Start's file-based routing with routes defined in `src/routes/`. Key routes include:

- `/$locale/` - Localized root route with language parameter
- `/$locale/auth/*` - Authentication routes (login, register, reset-password, etc.)
- `/api/health/*` - Health check API routes
- `/` - Non-localized root route

**File Structure:**

```
src/routes/
├── __root.tsx              # Root layout (good practice)
├── index.tsx              # Home route (non-localized)
├── $locale/               # Localized route group
│   ├── route.tsx          # Locale route wrapper
│   ├── index.tsx          # Localized home
│   └── auth/              # Authentication routes
├── api.health.ts          # Health check API
├── api.ready.ts           # Ready check API
└── api.health.adapters.ts # Adapter health check
```

**Strengths:**

- **Proper File-Based Routing:** Adheres to TanStack Start conventions
- **Locale Support:** Built-in internationalization via `$locale` parameter
- **Route Tree Generation:** Automatic `routeTree.gen.ts` generation
- **Type Safety:** Full TypeScript support for route parameters

**Gaps:**

- **Missing Dashboard Routes:** No business routes for core functionality
- **Limited Nested Routing:** Shallow route hierarchy
- **No Protected Routes:** Missing authentication guards
- **Incomplete Error Boundaries:** No route-level error components

**Severity:** Medium  
**Impact:** Limits scalability and user experience  
**File References:** `src/routes/`, `src/routeTree.gen.ts`, `src/router.tsx`

### 3.2 Component Structure

**Current Implementation:**
Components are organized by domain with reasonable separation:

- `src/components/auth/` - Authentication components
- `src/components/layout/` - Layout components
- `src/components/ui/` - Reusable UI components
- `src/components/forms/` - Form components

**Strengths:**

- **Domain-Based Organization:** Logical grouping by feature area
- **Reusable Components:** `AppButton`, `AppCard`, `AppTextInput` patterns
- **Layout Components:** `AppShellLayout` for consistent page structure
- **Separation of Concerns:** UI components separated from business logic

**Gaps:**

- **Missing Feature Components:** No components for dashboard, reports, analytics
- **Limited Composition:** Few compound components or patterns
- **Inconsistent Naming:** Mix of `App*` prefix and domain-based naming
- **No Storybook Integration:** Missing component documentation

**Severity:** Medium  
**Impact:** Reduces development velocity and consistency  
**File References:** `src/components/`, `src/components/ui/`

### 3.3 State Management

**Current Implementation:**
The application uses a combination of state management solutions:

- **React Query (TanStack Query):** Server state management for API data
- **React Context:** Dependency injection (TRPCProvider, theme providers)
- **Custom Hooks:** `useAuth`, `useSessionQuery`, `useLoginMutation`
- **Local State:** React `useState` for component-level state

**Strengths:**

- **Proper Server State:** TanStack Query for caching, background updates, and optimistic UI
- **Custom Hooks:** Well-structured authentication hooks with mutation handling
- **Query Client Factory:** `getQueryClient()` function for consistent configuration
- **Type Safety:** Full TypeScript support for queries and mutations

**Gaps:**

- **Missing Tenant Context:** No tenant-aware query client or state propagation
- **Limited Global State:** No solution for cross-component client state
- **No State Persistence:** Missing localStorage/IndexedDB persistence for user preferences
- **Incomplete TRPC Integration:** TRPC provider is a placeholder without real implementation

**Severity:** High  
**Impact:** Critical for multi-tenant SaaS functionality  
**File References:** `src/hooks/useAuth.ts`, `src/lib/query-client.ts`, `src/providers/TRPCProvider.tsx`

### 3.4 Error Handling

**Current Implementation:**
Error handling is basic with limited structure:

- **Basic Try-Catch:** Simple try-catch blocks in API calls
- **Error Utilities:** `error-handlers.ts` with basic error formatting
- **Validation Errors:** Zod validation errors in forms
- **No Error Boundaries:** Missing React error boundaries

**Strengths:**

- **Error Utility Functions:** `formatError`, `logError` functions
- **Validation Integration:** Zod validation with user-friendly messages
- **Type-Safe Errors:** `PlatformError` class with error categorization

**Gaps:**

- **No Error Boundaries:** Missing route-level or component-level error boundaries
- **Limited Error Logging:** No centralized error logging with context
- **Poor User Experience:** Basic error displays without recovery options
- **No Error Monitoring:** Missing integration with error tracking services

**Severity:** High  
**Impact:** Poor user experience and difficult debugging  
**File References:** `src/lib/utils/error-handlers.ts`, `src/lib/types/errors.ts`

### 3.5 Performance

**Current Implementation:**
Performance optimization is minimal with basic Vite defaults:

- **Vite Defaults:** Basic code splitting and minification
- **No Route-Based Splitting:** Missing dynamic imports for routes
- **Basic Image Handling:** Standard `<img>` tags without optimization
- **No Performance Monitoring:** Missing Core Web Vitals tracking

**Strengths:**

- **Modern Build Tool:** Vite with fast development server
- **TypeScript Compilation:** Efficient TypeScript compilation
- **CSS Extraction:** Critical CSS extraction during build

**Gaps:**

- **No Route-Based Code Splitting:** All routes bundled together
- **Missing Image Optimization:** No lazy loading or modern image formats
- **No Bundle Analysis:** Missing bundle size monitoring and optimization
- **Poor Caching Strategy:** No optimal cache headers for static assets

**Severity:** Medium  
**Impact:** Slower load times and poor user experience  
**File References:** `vite.config.ts`, `package.json`

### 3.6 Security

**Current Implementation:**
Security implementation is basic with some good practices:

- **Environment Variables:** Proper use of environment variables for configuration
- **Input Validation:** Zod validation for form inputs
- **HTTPS Enforcement:** Vite dev server with HTTPS support
- **Basic Auth Flow:** Password hashing and J token management

**Strengths:**

- **Environment Configuration:** Separate development/production configurations
- **Input Validation:** Strong Zod validation for all form inputs
- **Secure Dependencies:** Regular dependency updates
- **Type Safety:** TypeScript reduces runtime security issues

**Gaps:**

- **No CSP Headers:** Missing Content Security Policy configuration
- **Limited XSS Protection:** Basic React escaping but no additional protection
- **No Security Headers:** Missing security headers (HSTS, X-Frame-Options, etc.)
- **Incomplete Auth:** Missing multi-factor authentication and session management

**Severity:** High  
**Impact:** Security vulnerabilities in production deployment  
**File References:** `src/lib/validations/auth.ts`, `src/lib/validations/password.ts`, `vite.config.ts`

## 4. Design System Integration

### 4.1 Theming Implementation

**Current Implementation:**
Theming uses `@agenticverdict/ui` package with Mantine v9:

- **Theme Provider:** `ThemeProvider` from shared UI package
- **Mantine Integration:** `MantineProvider` with default theme
- **Color Scheme:** Support for light/dark mode via `ColorSchemeToggle`
- **Design Tokens:** Basic color palette and spacing scales

**Strengths:**

- **Shared UI Package:** Consistent theming across monorepo
- **Mantine Integration:** Leverages Mantine's robust theming system
- **Color Scheme Toggle:** User preference for light/dark mode
- **CSS Variables:** Uses CSS custom properties for dynamic theming

**Gaps:**

- **Limited Token System:** Basic design token implementation
- **No Tenant-Specific Themes:** Missing tenant-aware theming
- **Incomplete Token Generation:** No automatic token generation from `.pen` files
- **Missing Theme Switching:** No runtime theme switching beyond light/dark

**Severity:** Medium  
**Impact:** Limits branding customization for multi-tenant SaaS  
**File References:** `src/components/Providers.tsx`, `src/components/layout/ColorSchemeToggle.tsx`

### 4.2 RTL/LTR Readiness

**Current Implementation:**
RTL/LTR support is implemented via `DirectionProvider`:

- **Locale Detection:** Automatic direction based on locale (`ar` = RTL, others = LTR)
- **Mantine Direction:** `DirectionProvider` wrapper from `@agenticverdict/ui`
- **CSS Logical Properties:** Some use of logical properties

**Strengths:**

- **Locale Integration:** Automatic direction based on language selection
- **Mantine Support:** Full RTL support from Mantine components
- **Direction Provider:** Proper context provider for direction
- **Language Switcher:** `LanguageSwitcher` component for locale changes

**Gaps:**

- **Incomplete CSS:** Mix of physical and logical CSS properties
- **No RTL-Specific Layouts:** Missing RTL-optimized layouts for complex components
- **Limited Testing:** No RTL-specific tests
- **Icon Flipping:** Missing directional icon flipping

**Severity:** Medium  
**Impact:** Critical for Arabic-speaking markets but implementation is incomplete  
**File References:** `src/i18n/react.tsx`, `src/components/layout/LanguageSwitcher.tsx`

### 4.3 Accessibility Compliance

**Current Implementation:**
Accessibility implementation is basic with Mantine defaults:

- **Mantine Components:** Most components have built-in accessibility
- **ARIA Attributes:** Basic ARIA support in custom components
- **Keyboard Navigation:** Tab navigation works but could be improved
- **Screen Reader Testing:** Limited testing with screen readers

**Strengths:**

- **Mantine Foundation:** Mantine components are generally accessible
- **Semantic HTML:** Good use of semantic HTML elements
- **Focus Management:** Basic focus management in forms
- **Color Contrast:** Mantine's default color palette meets contrast requirements

**Gaps:**

- **No WCAG Audit:** No comprehensive accessibility audit performed
- **Limited ARIA Usage:** Missing ARIA attributes in custom components
- **No Screen Reader Testing:** No regular testing with screen readers
- **Missing Accessibility Documentation:** No accessibility statement or VPAT

**Severity:** High  
**Impact:** Legal compliance risk and exclusion of users with disabilities  
**File References:** `src/lib/utils/accessibility.ts`, Mantine component usage throughout

## 5. Quality Assessment

### 5.1 Testing Strategy

**Current Implementation:**
The application has a basic testing setup with Vitest for unit testing and Playwright for E2E testing. The testing infrastructure is minimal with limited coverage:

- **Unit Testing:** Vitest with happy-dom environment, basic configuration in `vitest.config.mjs`
- **Test Files:** Only two unit test files exist: `error-handlers.test.ts` and `errors.test.ts` covering error utilities
- **E2E Testing:** Playwright configured with basic test helpers but no actual E2E test files
- **Coverage Configuration:** Basic coverage setup with exclusions for test files and node_modules
- **Test Scripts:** `npm test` runs Vitest, `npm run test:e2e` runs Playwright

**Strengths:**

- **Modern Testing Stack:** Vitest + Playwright aligns with modern React testing practices
- **Type-Safe Tests:** Full TypeScript support for test files
- **Error Testing:** Comprehensive error handler and error type tests with good coverage
- **Test Utilities:** Basic E2E test helpers for common patterns
- **CI Integration:** Test scripts ready for CI/CD integration

**Gaps:**

- **Missing Component Tests:** No tests for React components, hooks, or routes
- **No Integration Tests:** Missing tests for API routes, authentication flows, or data fetching
- **Limited E2E Coverage:** Playwright configured but no actual E2E test files
- **Low Test Coverage:** Estimated <10% coverage with only error utilities tested
- **No Snapshot Testing:** Missing component snapshot tests for UI regression prevention
- **No Mocking Strategy:** No established patterns for mocking external services or API calls
- **Missing Test Utilities:** No test factories, fixtures, or testing utilities for common patterns

**Severity:** High  
**Impact:** High risk of regression, difficult refactoring, poor code quality  
**File References:** `vitest.config.mjs`, `src/lib/utils/error-handlers.test.ts`, `src/lib/types/errors.test.ts`, `test/e2e/utils/test-helpers.ts`, `package.json`

### 5.2 Type Safety

**Current Implementation:**
The application uses TypeScript 5 with strict mode enabled and comprehensive type definitions:

- **Strict Mode:** `tsconfig.json` enforces strict TypeScript settings
- **Error Typing:** Comprehensive error type definitions with discriminated unions
- **Zod Integration:** Runtime validation with Zod schemas for API inputs and forms
- **Component Typing:** React components use TypeScript with proper props interfaces
- **Route Typing:** TanStack Router provides type-safe route parameters and navigation

**Strengths:**

- **Strict TypeScript:** Full strict mode with no implicit any
- **Discriminated Unions:** Well-structured error types with type guards
- **Runtime Validation:** Zod schemas provide runtime type safety for external data
- **Route Type Safety:** TanStack Router generates type-safe route definitions
- **Component Props:** Strongly typed React component props

**Gaps:**

- **Missing Tenant Typing:** No TypeScript types for tenant context propagation
- **Incomplete TRPC Types:** TRPC provider lacks proper typing for API routes
- **Any Types Present:** Some `any` types in provider configurations
- **Missing Generic Constraints:** Limited use of TypeScript generics for reusable utilities
- **No Branded Types:** Missing branded types for IDs and sensitive values

**Severity:** Medium  
**Impact:** Reduced type safety for multi-tenant context and API integration  
**File References:** `tsconfig.json`, `src/lib/types/errors.ts`, `src/lib/validations/`, `src/providers/TRPCProvider.tsx`

### 5.3 Code Quality

**Current Implementation:**
Code quality is maintained through ESLint, Prettier, and basic code organization:

- **Linting:** ESLint with TypeScript and React plugins
- **Formatting:** Prettier configuration for consistent code style
- **Import Organization:** Basic import grouping but no automatic sorting
- **Component Structure:** Reasonable component organization with separation of concerns
- **Error Handling:** Structured error handling with centralized utilities

**Strengths:**

- **ESLint Configuration:** Comprehensive linting rules for TypeScript and React
- **Prettier Integration:** Consistent code formatting across the codebase
- **Error Handling Patterns:** Well-structured error utilities with consistent patterns
- **Component Organization:** Logical grouping of components by domain
- **Separation of Concerns:** UI components separated from business logic

**Gaps:**

- **No Code Quality Metrics:** Missing tools for code complexity, duplication, or maintainability
- **Limited Documentation:** Sparse inline documentation and no API documentation generation
- **Inconsistent Naming:** Mix of naming conventions (`App*` prefix vs domain-based)
- **No Automated Refactoring:** Missing tools for automated code refactoring
- **Missing Code Reviews:** No established code review process or quality gates

**Severity:** Medium  
**Impact:** Reduced maintainability and developer velocity  
**File References:** `.eslintrc.cjs`, `.prettierrc`, `src/components/`, `src/lib/utils/error-handlers.ts`

## 6. Severity Assessment

### 6.1 Critical Issues

**Issues that block production deployment or create severe security risks:**

- **Missing Tenant Isolation:** No tenant context propagation or row-level security integration (Section 3.3)
- **Security Vulnerabilities:** Missing CSP headers, XSS protection, and security headers (Section 3.6)
- **Incomplete Authentication:** Basic auth flow lacking multi-factor authentication and session management (Section 3.6)
- **No Error Boundaries:** Missing React error boundaries causing complete application crashes (Section 3.4)
- **Accessibility Compliance Gaps:** Missing WCAG 2.1 AA compliance with legal risk (Section 4.3)

### 6.2 High Priority Issues

**Issues that significantly impact user experience or maintainability:**

- **State Management Gaps:** Missing tenant-aware query client and global state solution (Section 3.3)
- **Error Handling Limitations:** No centralized error logging or error monitoring integration (Section 3.4)
- **Testing Strategy Deficiencies:** Missing component, integration, and E2E tests (Section 5.1)
- **RTL/LTR Implementation Gaps:** Incomplete RTL support for Arabic markets (Section 4.2)
- **Missing Dashboard Routes:** No business routes for core functionality (Section 3.1)
- **Limited Component Library:** Missing feature components for dashboard, reports, analytics (Section 3.2)
- **Incomplete TRPC Integration:** TRPC provider placeholder without real implementation (Section 3.3)

### 6.3 Medium Priority Issues

**Important improvements for long-term sustainability and user experience:**

- **Performance Optimization:** Missing route-based code splitting and image optimization (Section 3.5)
- **Theming Limitations:** Basic design token system without tenant-specific themes (Section 4.1)
- **Component Structure Gaps:** Limited composition patterns and inconsistent naming (Section 3.2)
- **Route Organization:** Shallow route hierarchy and missing protected routes (Section 3.1)
- **Type Safety Gaps:** Missing tenant typing and incomplete TRPC types (Section 5.2)
- **Code Quality Issues:** No code quality metrics and limited documentation (Section 5.3)
- **Missing Storybook Integration:** No component documentation or design system playground (Section 3.2)

### 6.4 Low Priority Issues

**Minor enhancements and optimizations:**

- **Import Organization:** No automatic import sorting or grouping
- **Bundle Analysis:** Missing bundle size monitoring and optimization tools
- **Icon Flipping:** Missing directional icon flipping for RTL layouts
- **Snapshot Testing:** No component snapshot tests for UI regression prevention
- **Automatic Token Generation:** No automatic design token generation from `.pen` files
- **State Persistence:** Missing localStorage/IndexedDB persistence for user preferences

## 7. Quick Wins vs Structural Changes

### Quick Wins (Easy Implementation, High Impact)

**These improvements can be implemented quickly with immediate benefits:**

1. **Add React Error Boundaries** — Implement route-level and component-level error boundaries to prevent application crashes
2. **Implement Security Headers** — Add CSP, HSTS, X-Frame-Options headers via TanStack Start middleware
3. **Create Basic Component Tests** — Add Vitest tests for critical UI components using Testing Library
4. **Add Route-Based Code Splitting** — Implement dynamic imports for routes to reduce initial bundle size
5. **Set Up Bundle Analysis** — Integrate `rollup-plugin-visualizer` for bundle size monitoring
6. **Improve Error Logging** — Enhance error handlers with structured logging and error monitoring integration
7. **Add Snapshot Testing** — Implement component snapshot tests for UI regression prevention
8. **Implement Import Sorting** — Add `@trivago/prettier-plugin-sort-imports` for consistent import organization

### Structural Changes (Architectural Modifications)

**These require significant architectural changes and careful planning:**

1. **Tenant Isolation Implementation** — Add tenant context propagation via AsyncLocalStorage and row-level security
2. **Multi-Tenant State Management** — Implement tenant-aware query client and global state solution
3. **Complete TRPC Integration** — Replace placeholder TRPC provider with fully typed API client
4. **Comprehensive Testing Strategy** — Establish testing pyramid with unit, integration, and E2E tests
5. **Design System Enhancement** — Build tenant-specific theming and design token generation pipeline
6. **RTL/LTR Complete Implementation** — Add RTL-optimized layouts and directional icon flipping
7. **Protected Routes Implementation** — Add authentication guards and route protection middleware
8. **Performance Optimization Pipeline** — Implement image optimization, caching strategies, and Core Web Vitals tracking

## 8. Recommendations

### Phase 1: Critical Production Readiness (Weeks 1-2)

**Goal:** Address issues that block production deployment and security risks.

1. **Implement Tenant Isolation**
   - Add tenant context propagation via AsyncLocalStorage
   - Integrate row-level security for database operations
   - Update all API routes to include tenant validation

2. **Enhance Security Foundation**
   - Implement CSP headers and security middleware
   - Add XSS protection and input sanitization
   - Set up authentication with multi-factor support

3. **Add Error Boundaries**
   - Implement route-level error boundaries
   - Create component-level error recovery
   - Set up error monitoring integration (Sentry/LogRocket)

4. **Improve Accessibility Compliance**
   - Conduct WCAG 2.1 AA audit
   - Fix accessibility issues in critical components
   - Add screen reader testing to CI pipeline

### Phase 2: High Priority Improvements (Weeks 3-4)

**Goal:** Address significant user experience and maintainability gaps.

1. **Complete State Management**
   - Implement tenant-aware TanStack Query client
   - Add global state solution for cross-component data
   - Set up state persistence for user preferences

2. **Establish Testing Strategy**
   - Add component tests for critical UI components
   - Implement integration tests for API routes
   - Create E2E tests for core user journeys

3. **Enhance RTL/LTR Support**
   - Complete RTL layouts for Arabic language
   - Add directional icon flipping
   - Test RTL support across all components

4. **Build Core Feature Routes**
   - Add dashboard routes with protected access
   - Implement business feature routes (reports, analytics)
   - Add route guards for authentication

### Phase 3: Medium Priority Enhancements (Weeks 5-6)

**Goal:** Improve long-term sustainability and developer experience.

1. **Optimize Performance**
   - Implement route-based code splitting
   - Add image optimization and lazy loading
   - Set up Core Web Vitals monitoring

2. **Enhance Design System**
   - Build tenant-specific theming system
   - Create design token generation from `.pen` files
   - Add Storybook integration for component documentation

3. **Improve Code Quality**
   - Set up code complexity and duplication metrics
   - Implement automated refactoring tools
   - Establish code review process with quality gates

4. **Complete TRPC Integration**
   - Replace placeholder provider with fully typed client
   - Implement API route validation with Zod
   - Add request/response logging middleware

### Success Metrics

- **Production Readiness:** All critical issues resolved, security audit passed
- **Test Coverage:** 70%+ unit test coverage, 80%+ business logic coverage
- **Performance:** Core Web Vitals scores ≥ 90 (LCP ≤ 2.5s, FID ≤ 100ms, CLS ≤ 0.1)
- **Accessibility:** WCAG 2.1 AA compliance verified with automated and manual testing
- **Developer Experience:** CI/CD pipeline with automated testing, linting, and deployment

## 9. Appendix: File Reference Index

| File Path                                     | Description                                           | Section Reference |
| --------------------------------------------- | ----------------------------------------------------- | ----------------- |
| `src/routes/`                                 | Route definitions and file-based routing              | 3.1               |
| `src/routeTree.gen.ts`                        | Generated route tree with type safety                 | 3.1               |
| `src/router.tsx`                              | Router configuration with scroll restoration          | 3.1               |
| `src/components/`                             | Component library organized by domain                 | 3.2               |
| `src/components/ui/`                          | Reusable UI components (`AppButton`, `AppCard`, etc.) | 3.2               |
| `src/hooks/useAuth.ts`                        | Authentication hook with mutation handling            | 3.3               |
| `src/lib/query-client.ts`                     | TanStack Query client factory                         | 3.3               |
| `src/providers/TRPCProvider.tsx`              | TRPC provider (placeholder)                           | 3.3               |
| `src/lib/utils/error-handlers.ts`             | Error handling utilities and logging                  | 3.4               |
| `src/lib/types/errors.ts`                     | Error type definitions and type guards                | 3.4               |
| `src/lib/validations/auth.ts`                 | Authentication validation schemas (Zod)               | 3.6               |
| `src/lib/validations/password.ts`             | Password validation schemas                           | 3.6               |
| `src/i18n/react.tsx`                          | Internationalization setup and locale management      | 4.2               |
| `src/components/layout/LanguageSwitcher.tsx`  | Language switcher component                           | 4.2               |
| `src/components/layout/ColorSchemeToggle.tsx` | Theme toggle for light/dark mode                      | 4.1               |
| `src/components/Providers.tsx`                | Provider composition (Theme, Query, Direction)        | 4.1               |
| `vitest.config.mjs`                           | Vitest configuration for unit testing                 | 5.1               |
| `src/lib/utils/error-handlers.test.ts`        | Error handler unit tests                              | 5.1               |
| `src/lib/types/errors.test.ts`                | Error type unit tests                                 | 5.1               |
| `test/e2e/utils/test-helpers.ts`              | Playwright E2E test utilities                         | 5.1               |
| `package.json`                                | Dependencies, scripts, and project configuration      | 3.5, 5.1          |
| `tsconfig.json`                               | TypeScript configuration with strict mode             | 5.2               |
| `.eslintrc.cjs`                               | ESLint configuration for code quality                 | 5.3               |
| `.prettierrc`                                 | Prettier configuration for code formatting            | 5.3               |
| `vite.config.ts`                              | Vite configuration for build optimization             | 3.5               |
| `apps/frontend/`                              | Web application root directory                        | All sections      |
