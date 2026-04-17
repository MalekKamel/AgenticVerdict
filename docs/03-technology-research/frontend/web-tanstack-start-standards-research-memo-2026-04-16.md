# Web TanStack Start Standards Research Memo

**Date:** 2026-04-16  
**Author:** Claude Code  
**Purpose:** Research industry-standard practices and TanStack Start-specific conventions for modern web applications, focusing on application architecture, design system alignment, and quality standards.

## Table of Contents

## 1. Executive Summary

This research memo examines industry-standard practices and TanStack Start-specific conventions for modern web application development within the AgenticVerdict multi-tenant SaaS platform. The analysis reveals that TanStack Start v1 (released November 2025) provides a robust foundation for type-safe, full-stack React applications with built-in support for file-based routing, SSR/streaming, and progressive enhancement; **application APIs** are delivered via **tRPC v11** on the unified Fastify service ([Decision 11](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support)), not TanStack Start server functions as the primary RPC surface.

Key findings include:

- **Architecture:** TanStack Start promotes a server-first architecture; **business APIs** use **tRPC v11** as the unified, type-safe layer for web, mobile, and CLI per [Decision 11](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support) (not TanStack Start server functions as the primary API surface)
- **Routing:** File-based routing with automatic route tree generation provides excellent developer experience
- **Data Loading:** Loaders run on both server and client with automatic caching and error boundaries; data access goes through the **tRPC client** (for example via `@tanstack/start-trpc` integration with the standalone API)
- **State Management:** Built-in solutions for server-state (TanStack Query paired with tRPC) with client-state left to React Context or Zustand
- **Performance:** Streaming SSR, code splitting, and image optimization are first-class concerns
- **Accessibility:** Framework-agnostic, requiring explicit implementation to meet WCAG 2.1 AA standards

The AgenticVerdict `apps/frontend` implementation aligns well with core TanStack Start patterns but requires enhancements in authentication flow, error boundaries, and RTL/LTR theming consistency.

## 2. Research Methodology

This research was conducted through:

1. **Primary Source Analysis:** Review of official TanStack Start documentation (React framework guide, routing, data loading) and tRPC integration patterns for TanStack Start
2. **Industry Benchmarking:** Examination of established patterns in production TanStack applications (Reactive Resume case study)
3. **Version Analysis:** Focus on TanStack Start v1 (November 2025 release) with attention to breaking changes from earlier versions
4. **Codebase Assessment:** Direct review of `apps/frontend` implementation against identified standards
5. **Multi-Tenancy Consideration:** Evaluation of patterns specific to SaaS applications with tenant isolation requirements

Sources were prioritized by:

- Official TanStack documentation and GitHub repositories
- Framework release notes and migration guides
- Production case studies with similar technical constraints
- Accessibility standards (WCAG 2.1 AA) and internationalization best practices

## 3. Industry-Standard Practices

### 3.1 Application Architecture

Modern web applications follow several key architectural patterns:

**Feature-Based Organization:** Production applications increasingly adopt feature-based folder structures over technology-based groupings (MVC). Features are self-contained units with their own UI components, data fetching logic, and tests.

**Layer Boundaries:** Clear separation between:

- **Presentation Layer:** React components and hooks
- **Business Logic Layer:** Custom hooks, services, domain models
- **Data Access Layer:** tRPC client (`@trpc/react-query`), TanStack Query, and the unified API served by **`apps/api`** (Fastify + tRPC v11)
- **Infrastructure Layer:** Authentication, routing, error handling

**Multi-Tenancy Patterns:** SaaS applications require tenant isolation at multiple levels:

- Route-level tenant context propagation
- API client configuration per tenant
- CSS theming and localization per tenant
- Row-level security in data access

**Framework Requirements:** TanStack Start expects:

- File-based routing under `src/routes/` with automatic route tree generation
- **Platform API:** Type-safe RPC via **tRPC** (not `createServerFn` as the unified API—see [Decision 11](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support))
- Loaders for route-level data fetching that execute on both server and client (typically calling tRPC procedures or hydrating TanStack Query)
- Error boundaries for graceful failure handling

**Team Conventions Recommended:**

- Feature flags for gradual rollout of new functionality
- Component library with design tokens for consistency
- Shared utility packages for cross-feature logic
- Environment-specific configuration injection

**Optional Enhancements:**

- Micro-frontend architecture for large teams
- Module federation for code splitting across teams
- Edge deployment for global performance optimization

### 3.2 State Management Boundaries

Effective state management in modern React applications follows clear boundaries:

**Server State vs Client State:**

- **Server State:** Data fetched from APIs, cached with TanStack Query (formerly React Query). Includes automatic background refetching, cache invalidation, and optimistic updates.
- **Client State:** UI state, form state, and local preferences. Typically managed with React Context, Zustand, or Jotai.

**TanStack Start Framework Requirements:**

- **TanStack Query Integration:** Built-in support for server state management with automatic hydration during SSR
- **Route-Level State:** Loaders provide initial data for routes, cached at route match level
- **tRPC + TanStack Query:** Mutations and queries go through **tRPC procedures** (`@trpc/react-query` / `@tanstack/start-trpc`), keeping one contract for web, mobile, and CLI

**Recommended Team Conventions for Multi-Tenant SaaS:**

- **Tenant-Aware Query Clients:** Separate query client instances per tenant or tenant-aware query key prefixes
- **Authentication State:** Global auth state with tenant context propagation
- **Feature Flags:** Tenant-specific feature toggles integrated with state management
- **Localization State:** Language and RTL/LTR direction stored in global context

**Implementation Patterns:**

```typescript
// Tenant-aware query client factory
export function createTenantQueryClient(tenantId: string) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryKey: (queryKey) => [`tenant:${tenantId}`, ...queryKey],
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });
}

// Authentication context with tenant awareness
export const AuthProvider = ({ children, tenantId }) => {
  const [user, setUser] = useState(null);
  const value = { user, tenantId, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**Optional Enhancements:**

- **Offline Support:** Local-first architecture with conflict resolution
- **Real-Time Updates:** WebSocket integration with state synchronization
- **Persistence:** Automatic state persistence to localStorage/IndexedDB

### 3.3 Error Handling & Observability

Robust error handling and observability are critical for production SaaS applications:

**Error Boundaries in TanStack Start:**

- **Route-Level Error Boundaries:** Each route can define an `errorComponent` for loader/action errors
- **Global Error Boundaries:** Root error boundary catches unhandled exceptions
- **Error Recovery:** Automatic retry logic for transient failures

**Framework Requirements:**

- **Loader Error Handling:** Loaders can throw `Response` objects to trigger error boundaries
- **tRPC Errors:** Standard tRPC error shapes and middleware (for example logging, mapping to HTTP) apply to all clients
- **Development vs Production:** Detailed errors in development, user-friendly messages in production

**Recommended Team Conventions:**

- **Structured Error Types:** Custom error classes for different failure modes (NetworkError, ValidationError, TenantError)
- **Error Logging:** Centralized error logging with tenant context and user identifiers
- **Error Monitoring:** Integration with observability platforms (Sentry, LogRocket)
- **User Feedback:** Toast notifications for non-critical errors, modal dialogs for critical failures

**Implementation Patterns:**

```typescript
// Structured error hierarchy
export class PlatformError extends Error {
  constructor(
    public platform: PlatformType,
    public code: string,
    message: string,
    public tenantId?: string
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}

// Error boundary with tenant context
export function TenantErrorBoundary({ children, tenantId }) {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return <ErrorDisplay error={error} tenantId={tenantId} />;
  }

  return (
    <ErrorBoundary
      onError={(error) => {
        logError(error, { tenantId });
        setError(error);
      }}
      fallback={null}
    >
      {children}
    </ErrorBoundary>
  );
}
```

**Observability for Multi-Tenant Applications:**

- **Request Tracing:** Distributed tracing with tenant IDs for cross-service debugging
- **Performance Metrics:** Tenant-specific performance monitoring (TTFB, FCP, LCP)
- **Business Metrics:** Feature usage, conversion rates, error rates per tenant
- **A/B Testing:** Feature flag performance tracking

**Optional Enhancements:**

- **Real-Time Error Reporting:** WebSocket connections for immediate error alerts
- **Error Analytics Dashboard:** Tenant-specific error trends and patterns
- **Automated Error Resolution:** AI-assisted error diagnosis and suggested fixes

### 3.4 Performance Optimization

Performance is critical for user experience and SEO in multi-tenant applications:

**Core Web Vitals Targets:**

- **LCP (Largest Contentful Paint):** < 2.5 seconds
- **FID (First Input Delay):** < 100 milliseconds
- **CLS (Cumulative Layout Shift):** < 0.1

**TanStack Start Performance Features:**

- **Streaming SSR:** Progressive HTML delivery with Suspense boundaries
- **Automatic Code Splitting:** Route-based code splitting with dynamic imports
- **Image Optimization:** Built-in image component with lazy loading and WebP conversion
- **Font Optimization:** Automatic font subsetting and display swapping

**Framework Requirements:**

- **Route Preloading:** Automatic preloading of adjacent routes
- **Cache Headers:** Static asset caching configuration
- **Bundle Analysis:** Build-time bundle size reporting

**Recommended Team Conventions for SaaS:**

- **Tenant-Specific Bundle Optimization:** Code splitting by tenant feature sets
- **Performance Budgets:** Size limits per route with CI enforcement
- **Real User Monitoring (RUM):** Tenant-aware performance tracking
- **A/B Testing Performance Impact:** Feature flag performance monitoring

**Implementation Patterns:**

```typescript
// Route-based code splitting with tenant awareness
const DashboardRoute = lazy(() =>
  import("./routes/dashboard").then((module) => ({
    default: module.DashboardRoute,
    // Optional: tenant-specific overrides
    tenantOverrides: module.tenantOverrides,
  })),
);

// Performance monitoring hook
export function usePerformanceMonitor(tenantId: string) {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        logPerformanceMetric(entry, { tenantId });
      });
    });
    observer.observe({ entryTypes: ["navigation", "resource", "paint"] });
    return () => observer.disconnect();
  }, [tenantId]);
}
```

**Critical Optimization Areas:**

1. **First Load Performance:** Critical CSS extraction, font preloading, image optimization
2. **Navigation Performance:** Route preloading, data prefetching, transition animations
3. **Runtime Performance:** Virtual scrolling for large lists, memoization, Web Workers for heavy computations
4. **Network Optimization:** HTTP/2 push, CDN configuration, cache strategies

**Optional Enhancements:**

- **Edge Computing:** Tenant-specific edge logic for geo-distributed performance
- **Predictive Prefetching:** ML-based route prediction and data prefetching
- **Performance Insights:** AI-powered performance recommendations

### 3.5 Security Hygiene

Frontend security is often overlooked but critical for multi-tenant SaaS applications:

**OWASP Top 10 Frontend Concerns:**

1. **Injection Attacks:** SQL/NoSQL, OS command, LDAP injection prevention
2. **Broken Authentication:** JWT management, session fixation, credential stuffing
3. **Sensitive Data Exposure:** Client-side secret handling, encryption
4. **XML External Entities (XXE):** XML parser configuration
5. **Broken Access Control:** Tenant isolation, authorization checks
6. **Security Misconfiguration:** Default configurations, unnecessary features
7. **Cross-Site Scripting (XSS):** Content sanitization, CSP headers
8. **Insecure Deserialization:** JSON parsing, prototype pollution
9. **Using Components with Known Vulnerabilities:** Dependency scanning
10. **Insufficient Logging & Monitoring:** Security event tracking

**TanStack Start Security Features:**

- **CSP Support:** Content Security Policy configuration for XSS protection
- **CSRF Protection:** Built-in CSRF tokens for form submissions
- **XSS Sanitization:** Automatic escaping in JSX templates
- **Subresource Integrity (SRI):** Hash verification for external resources

**Framework Requirements:**

- **Environment Variable Handling:** Server-side only variables marked appropriately
- **Build-Time Security Checks:** Dependency vulnerability scanning
- **HTTP Security Headers:** Automatic configuration of security headers

**Recommended Team Conventions for Multi-Tenant Apps:**

- **Tenant Isolation Verification:** Automated tests for tenant data leakage
- **Authentication Flow Security:** Multi-factor authentication, session management
- **API Security:** Rate limiting, request signing, audit logging
- **Secret Management:** Environment-based configuration, rotation policies

**Implementation Patterns:**

```typescript
// Secure API client with tenant context
export function createSecureApiClient(tenantId: string, authToken: string) {
  return axios.create({
    baseURL: process.env.API_URL,
    headers: {
      Authorization: `Bearer ${authToken}`,
      "X-Tenant-ID": tenantId,
      "X-Request-ID": generateRequestId(),
    },
    timeout: 10000,
    withCredentials: true,
  });
}

// CSP configuration for multi-tenant app
export const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "*.trusted-cdn.com"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "*.storage.googleapis.com"],
    connectSrc: ["'self'", "*.api.agenticverdict.com"],
    fontSrc: ["'self'", "fonts.gstatic.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
};
```

**Critical Security Practices:**

1. **Dependency Security:** Regular vulnerability scanning with `npm audit` or Snyk
2. **Secret Protection:** Never commit secrets, use environment variables with encryption
3. **Input Validation:** Client-side validation with server-side verification
4. **Output Encoding:** Context-aware output encoding for dynamic content
5. **Error Handling:** Generic error messages without system details

**Optional Enhancements:**

- **Security Headers Automation:** Automatic security header configuration per route
- **Real-Time Threat Detection:** Anomaly detection for suspicious tenant behavior
- **Compliance Automation:** Automated compliance checks for regulations (GDPR, CCPA)

### 3.6 Testing Strategy

Comprehensive testing is essential for maintaining quality in fast-evolving SaaS applications:

**Testing Pyramid for Modern Web Apps:**

- **Unit Tests (60%):** Isolated component and utility function testing
- **Integration Tests (25%):** API integration, component composition, route testing
- **E2E Tests (10%):** Critical user journeys across multiple components
- **Visual Tests (5%):** UI regression testing, design system consistency

**TanStack Start Testing Features:**

- **Route Testing Utilities:** Built-in utilities for testing file-based routes
- **tRPC Testing:** Mock tRPC server/router in tests, or integration tests against **`apps/api`** with test fixtures (aligns with unified API)
- **SSR Testing:** Utilities for testing server-side rendering behavior
- **Type Testing:** TypeScript testing with `tsd` for type safety verification

**Framework Requirements:**

- **Test Environment:** Isolated test environment with mock server capabilities
- **Snapshot Testing:** Support for component snapshot testing
- **Coverage Reporting:** Built-in code coverage reporting integration

**Recommended Team Conventions for Multi-Tenant Testing:**

- **Tenant-Aware Test Data:** Factory patterns for tenant-specific test data
- **Isolation Testing:** Tests verifying tenant data isolation
- **Feature Flag Testing:** Testing feature variations across tenant segments
- **Performance Testing:** Load testing with realistic tenant distributions

**Implementation Patterns:**

```typescript
// Tenant-aware test factory
export function createTenantTestFactory(tenantId: string) {
  return {
    createUser: (overrides = {}) => ({
      id: faker.string.uuid(),
      tenantId,
      email: faker.internet.email(),
      name: faker.person.fullName(),
      ...overrides,
    }),
    createCompany: (overrides = {}) => ({
      id: faker.string.uuid(),
      tenantId,
      name: faker.company.name(),
      industry: faker.company.buzzNoun(),
      ...overrides,
    }),
  };
}

// Route testing with tenant context
describe('DashboardRoute', () => {
  it('loads tenant-specific data', async () => {
    const tenantId = 'test-tenant-123';
    const { container } = render(
      <TenantProvider tenantId={tenantId}>
        <DashboardRoute />
      </TenantProvider>
    );

    await waitFor(() => {
      expect(container).toHaveTextContent(`Tenant: ${tenantId}`);
    });
  });
});
```

**Critical Testing Areas for SaaS Applications:**

1. **Authentication & Authorization:** Login flows, permission checks, tenant isolation
2. **Data Integrity:** CRUD operations, validation, error handling
3. **User Interface:** Responsive design, accessibility, internationalization
4. **Performance:** Load times, memory usage, bundle sizes
5. **Security:** Input validation, XSS prevention, data leakage

**Testing Tool Recommendations:**

- **Unit Testing:** Vitest (faster than Jest, built-in TypeScript support)
- **Component Testing:** React Testing Library with user-event
- **E2E Testing:** Playwright (cross-browser, reliable auto-wait)
- **Visual Testing:** Storybook with Chromatic
- **API Testing:** MSW (Mock Service Worker) for API mocking
- **Performance Testing:** Lighthouse CI, WebPageTest

**Optional Enhancements:**

- **AI-Powered Test Generation:** LLM-assisted test case generation
- **Flaky Test Detection:** Automated detection and quarantine of flaky tests
- **Test Impact Analysis:** Smart test selection based on code changes
- **Visual Regression AI:** AI-powered visual diff analysis

## 4. TanStack Start-Specific Conventions

TanStack Start v1 (released November 2025) introduces specific patterns and conventions that differ from other React frameworks:

### 4.1 Routing & File-Based Routing

TanStack Start builds on **TanStack Router** to provide type-safe, file-based routing:

**Core Routing Concepts:**

- **File-Based Routing:** Routes defined as files in `src/routes/` directory
- **Automatic Route Tree Generation:** `routeTree.gen.ts` file generated at build time
- **Type-Safe Navigation:** Fully typed route parameters, search params, and hash
- **Nested Routing:** Parent routes automatically render child route components

**File Structure Example:**

```
src/routes/
├── __root.tsx              # Root layout (always rendered)
├── index.tsx              # Home route (/)
├── dashboard.tsx          # Dashboard layout route
├── dashboard/
│   ├── index.tsx         # Dashboard home (/dashboard)
│   ├── analytics.tsx     # Analytics page (/dashboard/analytics)
│   └── settings.tsx      # Settings page (/dashboard/settings)
├── posts/
│   ├── index.tsx         # Posts list (/posts)
│   └── $postId.tsx       # Dynamic post detail (/posts/:postId)
└── 404.tsx               # Not found route
```

**Route Definition Pattern:**

```typescript
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  component: PostComponent,
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    return { post }
  },
  errorComponent: PostErrorComponent,
})

function PostComponent() {
  const { post } = Route.useLoaderData()
  const params = Route.useParams() // Type-safe: { postId: string }
  return <article>{post.title}</article>
}
```

**Key Routing Features:**

1. **Path Parameters:** `$paramName` syntax for dynamic segments
2. **Search Parameters:** Type-safe search params with Zod validation
3. **Hash Navigation:** Client-side hash routing support
4. **Route Groups:** Logical grouping without affecting URL structure
5. **Layout Routes:** Parent routes that render child content via `<Outlet />`

**Framework Requirements:**

- **Route Tree Generation:** Requires `@tanstack/router-generator` plugin
- **Type Safety:** Full TypeScript support with automatic type generation
- **Build Integration:** Route generation happens during Vite build process

**Version Sensitivity:** TanStack Start v1 uses TanStack Router v1, which introduced breaking changes from earlier alpha versions:

- `createRoute` → `createFileRoute`
- Different loader/action signature
- Enhanced type inference system

### 4.2 Data Loading (Loaders) and tRPC (Mutations / Shared Queries)

TanStack Start uses **route loaders** for SSR-friendly, route-scoped data. **Mutations and shared API access** go through **tRPC** on the unified Fastify API, per [Decision 11](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support)—not `createServerFn` as the platform’s primary RPC layer (server functions are web-only and would duplicate the API for mobile/CLI).

**Loaders for Data Fetching:**
Loaders are async functions defined on routes that run on **both server (during SSR) and client (during navigation)**:

```typescript
export const Route = createFileRoute('/dashboard')({
  loader: async ({ context }) => {
    // Runs on server during SSR, on client during navigation
    // Use a tRPC caller or server-side client wired in router context (procedure names illustrative)
    const [reports, notifications] = await Promise.all([
      trpc.reports.list.query({ tenantId: context.tenantId }),
      trpc.notifications.list.query({ tenantId: context.tenantId }),
    ])
    return { reports, notifications }
  },
  component: DashboardComponent,
})

function DashboardComponent() {
  const { reports, notifications } = Route.useLoaderData()
  // Type-safe access to loader data
  return (
    <div>
      <ReportsList reports={reports} />
      <NotificationBell count={notifications.length} />
    </div>
  )
}
```

**Loader Features:**

- **Automatic Caching:** Loader results cached at route match level
- **Parallel Loading:** Multiple loaders run in parallel with `Promise.all`
- **Error Boundaries:** Throwing `Response` objects triggers error components
- **Revalidation:** Manual and automatic cache invalidation
- **Deferred Data:** Streaming support with `defer()` utility

**tRPC for Mutations and Client Queries:**
AgenticVerdict implements procedures on the **Fastify + tRPC v11** router in **`apps/api`**. The web app uses **`@trpc/react-query`** (and TanStack Start integration such as **`@tanstack/start-trpc`**) so loaders, components, and future mobile/CLI clients share one contract:

```typescript
// apps/api — procedure definition (illustrative; names match your router)
// .mutation() with Zod input — single source of truth for all clients

// apps/frontend — mutation from a component (TanStack Query integration)
import { trpc } from "../utils/trpc"; // typed client

function CreateReportForm() {
  const { tenantId } = useTenantContext();
  const utils = trpc.useUtils();

  const createReport = trpc.reports.create.useMutation({
    onSuccess: () => {
      void utils.reports.list.invalidate({ tenantId });
    },
  });

  const handleSubmit = (data: ReportInput) => {
    createReport.mutate({ ...data, tenantId });
  };
  // …
}
```

**Why tRPC instead of `createServerFn` for this platform (Decision 11):**

1. **Multi-client:** Same procedures for web, mobile, and CLI; server functions are tied to the TanStack Start deployable only
2. **Type Safety:** Inferred types from the router without a separate generated client
3. **Validation:** Zod (or equivalent) at the procedure boundary, enforced for every client
4. **Operational consistency:** Auth, rate limits, and tenant context live in one API process (**Fastify**)

**Framework / repo requirements:**

- **API process:** `apps/api` must be reachable from web (and other clients); not a substitute for TanStack Router’s own SSR/runtime needs
- **Web integration:** Route tree generation (`@tanstack/router-generator`) remains a TanStack Start concern; tRPC is the **application** API layer

**Note on TanStack Start server functions:** `createServerFn` remains available in the framework for edge cases (for example progressive enhancement or colocated server-only utilities), but **do not** use it as the primary business API—keep business logic in tRPC procedures so non-web clients stay supported.

### 4.3 SSR/Streaming Considerations

TanStack Start provides first-class support for Server-Side Rendering (SSR) and streaming with specific patterns:

**SSR Architecture:**

- **Universal Rendering:** Same code runs on server and client
- **Hydration:** Automatic hydration of server-rendered markup
- **Streaming SSR:** Progressive HTML delivery with Suspense boundaries
- **Selective Hydration:** Critical components hydrate first

**Streaming Patterns:**

```typescript
// Deferred data loading with streaming
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // Critical data loads immediately
    const user = await getUser()

    // Non-critical data can be deferred
    const analyticsPromise = getAnalytics().then(data => ({
      analytics: data,
    }))

    return {
      user,
      analytics: defer(analyticsPromise),
    }
  },
  component: DashboardComponent,
})

function DashboardComponent() {
  const { user, analytics } = Route.useLoaderData()

  return (
    <div>
      <UserProfile user={user} />
      <Suspense fallback={<AnalyticsLoading />}>
        <Await promise={analytics}>
          {(analyticsData) => <AnalyticsDashboard data={analyticsData} />}
        </Await>
      </Suspense>
    </div>
  )
}
```

**Key SSR/Streaming Features:**

1. **Suspense Boundaries:** Control streaming chunks with React Suspense
2. **Error Boundaries:** Graceful error handling during streaming
3. **Progressive Enhancement:** Core content first, enhancements later
4. **Islands Architecture:** Partial hydration of interactive components

**Framework Requirements for SSR:**

- **Node.js/Bun Runtime:** SSR requires server runtime
- **Build Configuration:** Separate client and server entry points
- **Hydration Mismatch Detection:** Development warnings for hydration mismatches

**Deployment Considerations:**

- **Edge Runtime:** Support for Cloudflare Workers, Deno, Vercel Edge
- **Static Generation:** Pre-rendering static routes at build time
- **Hybrid Rendering:** Mix of static, SSR, and client-side routes

**Performance Optimization:**

- **Streaming Priorities:** Critical CSS first, scripts deferred
- **Component Preloading:** Predictive preloading of likely components
- **Cache Headers:** Appropriate caching for static vs dynamic content

**Multi-Tenant SSR Considerations:**

- **Tenant-Aware Caching:** Separate cache keys per tenant
- **Dynamic Configuration:** Tenant-specific SSR behavior
- **A/B Testing SSR:** Feature flag integration during server rendering

### 4.4 Deployment & Build Assumptions

TanStack Start makes specific assumptions about build and deployment that influence application architecture:

**Build System (Vite-Based):**

- **Zero-Config Defaults:** Sensible defaults for most applications
- **TypeScript First:** Built-in TypeScript support without additional configuration
- **Plugin Ecosystem:** Vite plugin compatibility for additional tooling

**Build Output Structure:**

```
dist/
├── client/              # Static assets (JS, CSS, images)
│   ├── assets/
│   │   ├── index-[hash].js
│   │   └── index-[hash].css
│   └── index.html      # Client entry point
├── server/              # Server bundle for SSR
│   └── index.js        # Server entry point
└── static/              # Static files (public directory)
```

**Deployment Targets:**

1. **Node.js/Bun Server:** Traditional server deployment with SSR
2. **Serverless Functions:** AWS Lambda, Vercel Functions, Netlify Functions
3. **Edge Runtimes:** Cloudflare Workers, Deno Deploy, Vercel Edge
4. **Static Sites:** Pre-rendered static HTML (for mostly static content)

**Framework Build Requirements:**

- **Route Tree Generation:** `@tanstack/router-generator` runs during build
- **Type Generation:** Automatic TypeScript type generation for routes
- **Code Splitting:** Automatic route-based code splitting
- **Asset Optimization:** Image compression, font subsetting, CSS minification

**Environment Configuration:**

```typescript
// Environment-specific configuration
export default defineConfig({
  // Build-time environment variables
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL),
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(process.env.npm_package_version),
  },

  // Server-side environment variables
  server: {
    env: {
      DATABASE_URL: process.env.DATABASE_URL, // Server-only
      JWT_SECRET: process.env.JWT_SECRET, // Server-only
    },
  },
});
```

**Multi-Tenant Build Considerations:**

- **Tenant-Specific Builds:** Different build outputs per tenant (if needed)
- **Feature Flag Compilation:** Dead code elimination based on feature flags
- **Localization Bundles:** Language-specific bundle splitting
- **Theme Compilation:** CSS variable compilation per tenant theme

**Deployment Pipeline:**

1. **Build Phase:** Type checking, route generation, bundle creation
2. **Test Phase:** Unit tests, integration tests, E2E tests
3. **Optimization Phase:** Image optimization, code splitting analysis
4. **Deployment Phase:** Environment-specific deployment with rollback capability

**Version Sensitivity:** TanStack Start v1 requires Vite 5+ and specific plugin versions for optimal performance.

### 4.5 Version Sensitivity (TanStack Start v1)

TanStack Start v1 (released November 2025) introduced significant changes from earlier versions:

**Breaking Changes from v0/Alpha:**

1. **Routing API:** `createRoute` → `createFileRoute` with different signature
2. **Server Functions:** TanStack Start v1 exposes `createServerFn` for framework-level server RPC; **platform business APIs** still use **tRPC** per Decision 11
3. **Type Generation:** Improved type inference with less manual configuration
4. **Build Configuration:** Simplified Vite plugin configuration

**Compatibility Matrix:**
| Package | v1 Requirement | v0 Compatibility |
|---------|----------------|------------------|
| @tanstack/react-start | 1.0.0+ | Not compatible |
| @tanstack/router | 1.0.0+ | Breaking changes |
| @tanstack/react-query | 5.0.0+ | Compatible |
| React | 18.2.0+ | Compatible |
| TypeScript | 5.3+ | Recommended |

**Migration Path from v0:**

```typescript
// v0 Alpha (deprecated)
import { createRoute } from "@tanstack/react-start";

export const route = createRoute({
  path: "/dashboard",
  component: Dashboard,
  loader: () => fetchData(),
});

// v1 Stable
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  loader: async () => {
    const data = await fetchData();
    return { data };
  },
});
```

**Critical Version Considerations:**

1. **TypeScript 5.3+ Required:** New TypeScript features used for type inference
2. **Vite 5+ Required:** Build system dependencies
3. **React 18.2+ Recommended:** Concurrent features and Suspense improvements
4. **Node.js 18+ Recommended:** Modern JavaScript features

**Framework vs Library Versions:**

- **TanStack Start v1:** Framework layer (routing, SSR, deployment)
- **TanStack Router v1:** Routing library (file-based routing, loaders)
- **TanStack Query v5:** Data fetching library (server state management)
- **TanStack Table v8:** Table component library (data grids)

**Stability Guarantees:**

- **Major Versions:** Breaking changes, migration guides provided
- **Minor Versions:** Feature additions, backward compatible
- **Patch Versions:** Bug fixes, security patches

**Recommendation for AgenticVerdict:** Adopt TanStack Start v1 with latest compatible versions of all TanStack libraries for optimal type safety and performance.

## 5. Design System Alignment

Design system integration is critical for consistent user experience across multi-tenant SaaS applications:

### 5.1 Theming & Token Systems

Modern design systems use token-based theming for consistency and maintainability:

**Token Architecture:**

- **Design Tokens:** Named values for colors, spacing, typography, etc.
- **Theme Variables:** CSS custom properties for dynamic theming
- **Component Tokens:** Component-specific token mappings

**Mantine UI v9 Integration (AgenticVerdict's Choice):**

```typescript
// Theme configuration with design tokens
import { createTheme, MantineProvider } from '@mantine/core'

const theme = createTheme({
  primaryColor: 'brand-blue',
  colors: {
    'brand-blue': [
      '#e7f5ff', '#d0ebff', '#a5d8ff', '#74c0fc', '#4dabf7',
      '#339af0', '#228be6', '#1c7ed6', '#1971c2', '#1864ab'
    ],
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
})

// Application wrapper
export function App({ children }) {
  return (
    <MantineProvider theme={theme}>
      {children}
    </MantineProvider>
  )
}
```

**Multi-Tenant Theming Considerations:**

- **Tenant-Specific Themes:** Different color palettes per tenant
- **White-Label Support:** Custom logos, colors, and fonts per tenant
- **Theme Switching:** Dynamic theme loading based on tenant configuration

**Framework Requirements:**

- **CSS-in-JS Compatibility:** TanStack Start works with Mantine's Emotion-based styling
- **Server-Side Rendering:** Theme styles must be extracted during SSR
- **Critical CSS Extraction:** First-paint styles need server-side extraction

**Implementation Patterns:**

```typescript
// Tenant-aware theme provider
export function TenantThemeProvider({ tenantId, children }) {
  const [tenantTheme, setTenantTheme] = useState(defaultTheme)

  useEffect(() => {
    async function loadTenantTheme() {
      const config = await fetchTenantConfig(tenantId)
      const theme = createTheme({
        primaryColor: config.brandColor,
        colors: config.colorPalette,
        fontFamily: config.fontFamily,
      })
      setTenantTheme(theme)
    }
    loadTenantTheme()
  }, [tenantId])

  return (
    <MantineProvider theme={tenantTheme}>
      {children}
    </MantineProvider>
  )
}
```

**Design Token Implementation Strategy:**

1. **Single Source of Truth:** Design tokens defined in `.pen` design files (Pencil MCP)
2. **Code Generation:** Automated token generation from design files
3. **Type Safety:** TypeScript types for all design tokens
4. **Runtime Flexibility:** CSS custom properties for dynamic theming

### 5.2 RTL/LTR Support

Right-to-left (RTL) language support is essential for international SaaS applications, particularly for Arabic-speaking markets:

**RTL Implementation Requirements:**

- **Layout Reversal:** Mirroring of horizontal layout (margins, paddings, floats)
- **Text Direction:** `direction: rtl` and `text-align` adjustments
- **Icon Flipping:** Mirroring directional icons (arrows, chevrons, carets)
- **Scrollbar Position:** Scrollbars on left side for RTL layouts

**Mantine RTL Support:**
Mantine v9 provides built-in RTL support through the `dir` attribute:

```typescript
import { DirectionProvider } from '@mantine/core'

export function App({ children, direction = 'ltr' }) {
  return (
    <DirectionProvider direction={direction}>
      <MantineProvider>
        {children}
      </MantineProvider>
    </DirectionProvider>
  )
}

// Component usage automatically respects direction
function NavigationMenu() {
  return (
    <Group>
      <Button>Previous</Button> {/* Automatically positioned correctly */}
      <Button>Next</Button>
    </Group>
  )
}
```

**Tenant-Aware Direction Configuration:**

```typescript
// Determine direction from tenant configuration
export function useTenantDirection(tenantId: string): 'ltr' | 'rtl' {
  const { language } = useTenantConfig(tenantId)

  // Arabic and Hebrew are RTL
  const rtlLanguages = ['ar', 'he', 'fa', 'ur']

  return rtlLanguages.includes(language) ? 'rtl' : 'ltr'
}

// Application wrapper with tenant direction
export function TenantApp({ tenantId, children }) {
  const direction = useTenantDirection(tenantId)

  return (
    <DirectionProvider direction={direction}>
      <TenantThemeProvider tenantId={tenantId}>
        {children}
      </TenantThemeProvider>
    </DirectionProvider>
  )
}
```

**Critical RTL Considerations:**

1. **CSS Logical Properties:** Use `margin-inline-start` instead of `margin-left`
2. **Flexbox/Grid:** Use `start` and `end` instead of `left` and `right`
3. **Transformations:** Avoid `translateX(-50%)` patterns that assume LTR
4. **Background Positions:** Use logical background position values

**Testing RTL Support:**

```typescript
// RTL-specific tests
describe('RTL Layout', () => {
  it('reverses navigation order for Arabic', () => {
    const { container } = render(
      <DirectionProvider direction="rtl">
        <NavigationMenu />
      </DirectionProvider>
    )

    const buttons = container.querySelectorAll('button')
    expect(buttons[0]).toHaveTextContent('Next') // Next button first in RTL
    expect(buttons[1]).toHaveTextContent('Previous')
  })

  it('adjusts text alignment for RTL', () => {
    const { container } = render(
      <DirectionProvider direction="rtl">
        <Paragraph>نص عربي</Paragraph>
      </DirectionProvider>
    )

    expect(container.firstChild).toHaveStyle({
      textAlign: 'right',
      direction: 'rtl',
    })
  })
})
```

**Framework Compatibility:**

- **TanStack Start:** Framework-agnostic, works with any RTL solution
- **Mantine v9:** Excellent RTL support with automatic component adjustments
- **React Intl:** Internationalization library with RTL awareness
- **CSS Frameworks:** Tailwind CSS RTL plugin, Styled Components RTL

**Performance Considerations:**

- **Bundle Size:** RTL-specific CSS can increase bundle size
- **Runtime Performance:** Direction switching should be efficient
- **Caching:** Separate cache entries for LTR vs RTL versions

### 5.3 Accessibility (WCAG 2.1 AA)

Web Content Accessibility Guidelines (WCAG) 2.1 Level AA compliance is essential for inclusive SaaS applications:

**WCAG 2.1 AA Key Requirements:**

1. **Perceivable:** Content must be presentable to users in ways they can perceive
2. **Operable:** Interface components must be operable by all users
3. **Understandable:** Information and operation must be understandable
4. **Robust:** Content must be robust enough for various user agents

**Critical Accessibility Requirements:**

**1. Keyboard Navigation:**

- All interactive elements must be focusable and operable via keyboard
- Logical tab order following visual layout
- Skip navigation links for bypassing repetitive content

**2. Screen Reader Compatibility:**

- Semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<footer>`)
- ARIA attributes for complex widgets
- Alternative text for images and icons
- Live regions for dynamic content updates

**3. Color Contrast:**

- Text must have contrast ratio of at least 4.5:1 (normal text)
- Large text (18pt+ or 14pt+ bold) must have contrast ratio of at least 3:1
- UI components and graphical objects must have contrast ratio of at least 3:1

**4. Focus Management:**

- Visible focus indicators for all interactive elements
- Focus trapping in modal dialogs
- Programmatic focus management for single-page applications

**Mantine Accessibility Features:**
Mantine v9 includes accessibility as a core principle:

- All components are keyboard accessible
- Built-in ARIA attributes
- Focus management utilities
- Color contrast compliance

**Implementation Patterns:**

```typescript
// Accessible modal dialog
function AccessibleModal({ opened, onClose, title, children }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      closeButtonLabel="Close dialog" // Screen reader label
      trapFocus={true}
      returnFocus={true}
    >
      <div id="modal-description">
        {children}
      </div>
    </Modal>
  )
}

// Accessible form with validation
function AccessibleForm() {
  return (
    <form aria-labelledby="form-title">
      <h2 id="form-title">Create Report</h2>

      <TextInput
        label="Report Name"
        required
        aria-required="true"
        aria-describedby="name-hint"
      />
      <Text id="name-hint" size="xs" color="dimmed">
        Enter a descriptive name for your report
      </Text>

      <Button type="submit" aria-label="Create new report">
        Create
      </Button>
    </form>
  )
}
```

**Accessibility Testing Strategy:**

1. **Automated Testing:** axe-core, eslint-plugin-jsx-a11y
2. **Manual Testing:** Keyboard navigation, screen reader testing
3. **User Testing:** Testing with users with disabilities
4. **Continuous Monitoring:** Regular accessibility audits

**Framework Compatibility:**

- **TanStack Start:** Framework-agnostic, accessibility depends on component implementation
- **React Accessibility:** React DOM includes accessibility warnings
- **Testing Tools:** Jest-axe for unit testing accessibility

**Multi-Tenant Accessibility Considerations:**

- **Tenant-Specific Themes:** Color contrast must be maintained across all tenant themes
- **Localization:** Accessibility labels must be translated for all languages
- **Custom Components:** Tenant-specific components must meet accessibility standards

**Compliance Documentation:**

- **Accessibility Statement:** Public commitment to accessibility
- **VPAT (Voluntary Product Accessibility Template):** Formal documentation of compliance
- **Testing Reports:** Regular accessibility audit reports

## 6. Framework Requirements vs Team Conventions

Understanding what TanStack Start requires versus what teams can customize is crucial for effective implementation:

### Framework Requirements (Non-Negotiable)

**TanStack Start v1 Requires:**

1. **File-Based Routing:** Routes must be defined in `src/routes/` directory structure
2. **Route Tree Generation:** Automatic generation of `routeTree.gen.ts` file
3. **Application API:** Type-safe RPC via **tRPC** to **`apps/api`** (unified layer for web and other clients—[Decision 11](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support)); do not standardize on `createServerFn` for business operations
4. **Vite Build System:** Cannot switch to Webpack or other bundlers without significant effort
5. **TypeScript Configuration:** Specific TypeScript settings for optimal type inference
6. **React 18+:** Concurrent features and Suspense required for streaming SSR

**Build Configuration Requirements:**

```typescript
// Required Vite configuration
export default defineConfig({
  plugins: [
    tanstackStart({
      // Required for route generation
      routesDirectory: "src/routes",
      generatedRouteTree: "src/routeTree.gen.ts",
    }),
  ],
  // Required for TypeScript type generation
  build: {
    target: "es2020",
  },
});
```

### Team Conventions (Customizable)

**Recommended Conventions for AgenticVerdict:**

**1. Project Structure:**

```
src/
├── routes/           # Framework requirement (TanStack Start)
├── components/       # Team convention (shared components)
├── features/         # Team convention (feature-based organization)
│   ├── auth/        # Authentication feature
│   ├── dashboard/   # Dashboard feature
│   └── reports/     # Reports feature
├── lib/             # Team convention (utilities, hooks)
├── providers/       # Team convention (context providers)
└── types/           # Team convention (TypeScript types)
```

**2. State Management Strategy:**

- **Framework:** TanStack Query for server state, backed by the **tRPC** client (required for optimal integration with Decision 11)
- **Team Convention:** Zustand for client state (choice based on team preference)
- **Team Convention:** React Context for dependency injection

**3. Styling Approach:**

- **Framework:** Compatible with any CSS-in-JS or CSS solution
- **Team Convention:** Mantine v9 with Emotion (already chosen)
- **Team Convention:** Design tokens from `.pen` files via Pencil MCP

**4. Testing Strategy:**

- **Framework:** Compatible with any testing framework
- **Team Convention:** Vitest for unit/integration tests
- **Team Convention:** Playwright for E2E tests
- **Team Convention:** Testing Library patterns

### Optional Enhancements (Team Choice)

**Performance Optimizations:**

- **Route Preloading:** Automatic vs manual preloading strategies
- **Bundle Analysis:** Regular bundle size monitoring and optimization
- **Image Optimization:** Custom image transformation pipelines

**Developer Experience:**

- **Code Generation:** Custom generators for common patterns
- **Development Tools:** Custom ESLint rules, Prettier configuration
- **Documentation:** Living documentation with Storybook or similar

**Multi-Tenant Patterns:**

- **Tenant Isolation:** Implementation details of tenant context propagation
- **Feature Flags:** Choice of feature flag system and integration pattern
- **White-Labeling:** Degree of customization per tenant

### Decision Framework

When making implementation decisions, consider:

1. **Framework Constraints:** What TanStack Start requires vs allows
2. **Team Expertise:** Match conventions to team skills and preferences
3. **Project Requirements:** Multi-tenancy, internationalization, accessibility
4. **Long-Term Maintenance:** Choose conventions that reduce technical debt
5. **Ecosystem Compatibility:** Ensure conventions work with TanStack ecosystem

## 7. Recommendations for AgenticVerdict

**Architecture alignment:** All recommendations below assume **[Decision 11: tRPC as unified API layer](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support)**—the web app calls **tRPC v11** procedures implemented in **`apps/api`** (Fastify), integrated with TanStack Start via **`@trpc/react-query`** / **`@tanstack/start-trpc`**, rather than standardizing on TanStack Start **`createServerFn`** for business operations.

Based on the research findings, here are specific recommendations for the `apps/frontend` implementation:

### High-Priority Recommendations (Immediate Impact)

**1. Adopt TanStack Start v1 Fully:**

- Upgrade to TanStack Start v1 with all compatible library versions
- Implement file-based routing in `src/routes/` directory
- Use **tRPC** (`@trpc/react-query` / `@tanstack/start-trpc`) against **`apps/api`** for all business queries and mutations—aligned with [Decision 11](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support)
- Generate route tree automatically via build process

**2. Implement Proper Tenant Context Propagation:**

```typescript
// Current gap: Tenant context not properly propagated
// Recommendation: Implement tenant-aware providers
export function TenantRoot({ tenantId, children }) {
  return (
    <TenantProvider tenantId={tenantId}>
      <TenantThemeProvider tenantId={tenantId}>
        <TenantDirectionProvider tenantId={tenantId}>
          <TenantQueryProvider tenantId={tenantId}>
            {children}
          </TenantQueryProvider>
        </TenantDirectionProvider>
      </TenantThemeProvider>
    </TenantProvider>
  )
}
```

**3. Enhance Error Handling:**

- Implement route-level error boundaries for all routes
- Create structured error hierarchy (PlatformError, ValidationError, etc.)
- Add centralized error logging with tenant context
- Implement user-friendly error display components

**4. Improve Authentication Flow:**

- Current implementation needs proper integration with TanStack Start
- Implement protected routes with authentication checks
- Add session management with automatic token refresh
- Implement multi-factor authentication support

### Medium-Priority Recommendations (Near-Term Improvements)

**5. Optimize Performance:**

- Implement route-based code splitting for all non-critical routes
- Add image optimization with Mantine's Image component
- Configure proper caching headers for static assets
- Implement Core Web Vitals monitoring

**6. Enhance Testing Strategy:**

- Add unit tests for all business logic (target: 85% coverage)
- Implement integration tests for critical user journeys
- Add E2E tests for authentication and multi-tenancy flows
- Implement accessibility testing with axe-core

**7. Design System Integration:**

- Generate design tokens from `.pen` files via Pencil MCP
- Ensure all components use Mantine tokens and theme variables
- Implement proper RTL support for Arabic language
- Verify WCAG 2.1 AA compliance across all components

### Long-Term Recommendations (Strategic Improvements)

**8. Advanced Multi-Tenancy Features:**

- Implement tenant-specific feature flags
- Add white-labeling support (custom logos, colors)
- Develop tenant analytics dashboard
- Create tenant onboarding wizard

**9. Developer Experience Improvements:**

- Create code generators for common patterns (CRUD, auth, etc.)
- Implement comprehensive documentation with Storybook
- Set up automated code quality checks
- Create development environment with hot reload

**10. Production Readiness:**

- Implement comprehensive monitoring and alerting
- Set up automated deployment pipeline
- Create disaster recovery and rollback procedures
- Implement security scanning and penetration testing

### Implementation Phasing

**Phase 1 (Week 1-2): Foundation**

- Upgrade to TanStack Start v1
- Implement tenant context propagation
- Set up basic error handling

**Phase 2 (Week 3-4): Core Features**

- Enhance authentication flow
- Implement design system integration
- Add basic testing infrastructure

**Phase 3 (Week 5-6): Optimization**

- Performance optimization
- Advanced error handling
- Enhanced testing coverage

**Phase 4 (Week 7-8): Production Readiness**

- Monitoring and observability
- Security enhancements
- Deployment automation

### Success Metrics

1. **Performance:** Core Web Vitals within target ranges
2. **Quality:** Test coverage > 85% for business logic
3. **Accessibility:** WCAG 2.1 AA compliance verified
4. **Developer Experience:** Reduced time for common tasks
5. **Tenant Satisfaction:** Positive feedback on customization options

## 8. Citations & References

### Official Documentation

1. **TanStack Start Documentation** – Official documentation for TanStack Start v1
   - URL: `https://tanstack.com/start/latest/docs/framework/react/guide/routing`
   - Primary source for routing, loaders, and SSR patterns

2. **tRPC Documentation** – Unified API layer ([Decision 11](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support))
   - URL: `https://trpc.io/docs`
   - Primary source for procedures, middleware, and TanStack Query integration

3. **AgenticVerdict UI Decision Record — Decision 11**
   - Path: `/docs/architecture/ui/04-decision-record.md` (tRPC as unified API layer; Fastify runtime)

4. **TanStack Router Documentation** – Underlying routing library
   - URL: `https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading`
   - Source for data loading patterns and type safety

5. **Mantine v9 Documentation** – UI component library used by AgenticVerdict
   - URL: `https://mantine.dev/`
   - Source for component APIs, theming, and accessibility

6. **Vite Documentation** – Build tool used by TanStack Start
   - URL: `https://vitejs.dev/`
   - Source for build configuration and optimization

### Industry Standards

7. **Web Content Accessibility Guidelines (WCAG) 2.1**
   - URL: `https://www.w3.org/TR/WCAG21/`
   - Accessibility standard for web applications

8. **OWASP Top 10** – Web application security risks
   - URL: `https://owasp.org/www-project-top-ten/`
   - Security best practices for web applications

9. **Core Web Vitals** – Google's web performance metrics
   - URL: `https://web.dev/vitals/`
   - Performance measurement standards

### Reference Implementations

10. **Reactive Resume** – TanStack-based reference project

- URL: `https://github.com/amruthpillai/reactive-resume`
- Pattern inspiration for TanStack application structure

11. **TanStack Start Examples** – Official examples repository

- URL: `https://github.com/TanStack/start/tree/main/examples`
- Reference implementations of various patterns

### Research Articles

12. **TanStack Start v1 Announcement** – InfoQ article
    - URL: `https://www.infoq.com/news/2025/11/tanstack-start-v1/`
    - Overview of v1 features and changes from earlier versions

13. **Building Full-Stack Apps with TanStack Start** – Tutorial

- URL: `https://webrtc.noqta.tn/en/tutorials/tanstack-start-fullstack-react-tutorial-2026`
- Practical implementation guide

### Tools & Libraries

14. **Vitest** – Testing framework recommendation
    - URL: `https://vitest.dev/`
    - Modern testing framework with TypeScript support

15. **Playwright** – E2E testing framework

- URL: `https://playwright.dev/`
- Cross-browser testing solution

16. **axe-core** – Accessibility testing engine
    - URL: `https://github.com/dequelabs/axe-core`
    - Automated accessibility testing

### Design System Resources

17. **Pencil MCP** – Design tool integration
    - Used for `.pen` file design system integration
    - Design token generation from design files

18. **Design Tokens Specification** – W3C Community Group
    - URL: `https://design-tokens.github.io/community-group/format/`
    - Standard for design token representation

### Version Information

- **Research Date:** April 2026
- **TanStack Start Version:** v1 (released November 2025)
- **React Version:** 18.2.0+
- **TypeScript Version:** 5.3+
- **Mantine Version:** v9
- **API:** tRPC v11 on Fastify (`apps/api`), per [Decision 11](/docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support)

---

**Document Version:** 1.1  
**Last Updated:** 2026-04-17  
**Next Review Date:** 2026-07-16 (Quarterly review recommended)
