# TanStack Router SSOT - Implementation Tasks

## Phase 1: Foundation Setup

### Task 1.1: Create Directory Structure
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: None

**Description**: Create the router module directory structure under `/apps/frontend/src/router/`

**Acceptance Criteria**:
- [ ] `/apps/frontend/src/router/` directory created
- [ ] `/apps/frontend/src/router/hooks/` directory created
- [ ] `/apps/frontend/src/router/utils/` directory created
- [ ] `/apps/frontend/src/router/types/` directory created
- [ ] `/apps/frontend/src/router/testing/` directory created

---

### Task 1.2: Implement Router Instance Module
**Priority**: High  
**Estimated Time**: 1 hour  
**Dependencies**: Task 1.1

**Description**: Create the router instance module that wraps TanStack Router configuration

**Files to Create**:
- `/apps/frontend/src/router/router.ts`

**Implementation Details**:
```typescript
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { getCspNonce } from "@web-csp-nonce";

export function createAppRouter() {
  const nonce = getCspNonce();
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    ...(nonce ? { ssr: { nonce } } : {}),
  });
}

export const router = createAppRouter();
export type AppRouter = typeof router;
```

**Acceptance Criteria**:
- [ ] Router instance created with existing configuration
- [ ] CSP nonce support maintained
- [ ] Type exported for AppRouter
- [ ] Unit test written for router creation

---

### Task 1.3: Implement Centralized Hooks
**Priority**: High  
**Estimated Time**: 3 hours  
**Dependencies**: Task 1.2

**Description**: Create wrapper hooks for all TanStack Router hooks

**Files to Create**:
- `/apps/frontend/src/router/hooks/index.ts`
- `/apps/frontend/src/router/hooks/useRouter.ts`
- `/apps/frontend/src/router/hooks/useNavigate.ts`
- `/apps/frontend/src/router/hooks/useSearch.ts`
- `/apps/frontend/src/router/hooks/useParams.ts`
- `/apps/frontend/src/router/hooks/usePathname.ts`

**Implementation Details**:

**useRouter.ts**:
```typescript
import { useRouter as useTanStackRouter } from "@tanstack/react-router";

export function useRouter() {
  return useTanStackRouter();
}
```

**useNavigate.ts**:
```typescript
import { useNavigate as useTanStackNavigate } from "@tanstack/react-router";
import { withLocalePrefix } from "../utils/navigation";
import { useLocaleParam } from "@/i18n/hooks";

type NavigateOptions = {
  replace?: boolean;
};

export function useNavigate() {
  const navigate = useTanStackNavigate();
  const locale = useLocaleParam();
  
  return {
    push: (to: string, options?: NavigateOptions) => 
      navigate({ to: withLocalePrefix(locale, to), ...options }),
    replace: (to: string, options?: NavigateOptions) =>
      navigate({ to: withLocalePrefix(locale, to), replace: true, ...options }),
  };
}
```

**useSearch.ts**:
```typescript
import { useSearch as useTanStackSearch } from "@tanstack/react-router";
import type { AnyRoute } from "@tanstack/react-router";

export function useSearch<TRouteId extends string>(options?: {
  from: TRouteId;
  strict?: boolean;
}): ReturnType<typeof useTanStackSearch<TRouteId>> {
  return useTanStackSearch(options as any);
}
```

**useParams.ts**:
```typescript
import { useParams as useTanStackParams } from "@tanstack/react-router";

export function useParams<TRouteId extends string = any>(options?: {
  strict?: boolean;
}): ReturnType<typeof useTanStackParams<TRouteId>> {
  return useTanStackParams(options);
}
```

**usePathname.ts**:
```typescript
import { useRouterState } from "@tanstack/react-router";
import { stripLocalePrefix } from "../utils/navigation";
import { useLocaleParam } from "@/i18n/hooks";

export function usePathname(): string {
  const locale = useLocaleParam();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return stripLocalePrefix(pathname, locale);
}
```

**hooks/index.ts**:
```typescript
export { useRouter } from "./useRouter";
export { useNavigate } from "./useNavigate";
export { useSearch } from "./useSearch";
export { useParams } from "./useParams";
export { usePathname } from "./usePathname";
```

**Acceptance Criteria**:
- [ ] All 5 hooks implemented
- [ ] Hooks export from index.ts
- [ ] Unit tests for each hook
- [ ] Type safety verified

---

### Task 1.4: Implement Navigation Utilities
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Task 1.1

**Description**: Create locale-aware navigation utility functions

**Files to Create**:
- `/apps/frontend/src/router/utils/index.ts`
- `/apps/frontend/src/router/utils/navigation.ts`
- `/apps/frontend/src/router/utils/route-paths.ts`
- `/apps/frontend/src/router/utils/prefetch.ts`

**Implementation Details**:

**navigation.ts**:
```typescript
import { isSupportedLocale, supportedLocales, defaultLocale, type AppLocale } from "@/i18n/locales";

export function withLocalePrefix(locale: AppLocale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const hasLocalePrefix = (supportedLocales as readonly string[]).some(
    (l) => normalized === `/${l}` || normalized.startsWith(`/${l}/`)
  );
  
  if (hasLocalePrefix) return normalized;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export function stripLocalePrefix(pathname: string, locale: AppLocale): string {
  const prefix = `/${locale}`;
  if (pathname === prefix || pathname === `${prefix}/`) return "/";
  if (pathname.startsWith(`${prefix}/`)) {
    const rest = pathname.slice(prefix.length);
    return rest || "/";
  }
  return pathname;
}

export function ensureLocalePrefix(pathname: string, locale?: AppLocale): string {
  const targetLocale = locale ?? defaultLocale;
  if (pathname.startsWith("/api/") || pathname.startsWith("/_build/")) {
    return pathname;
  }
  return withLocalePrefix(targetLocale, pathname);
}
```

**route-paths.ts**:
```typescript
import type { RoutePaths } from "@/routeTree.gen";

export const ROUTE_PATHS = {
  AUTH_LOGIN: "/$locale/auth/login" as const,
  AUTH_REGISTER: "/$locale/auth/register" as const,
  AUTH_LOGOUT: "/$locale/auth/logout" as const,
  AUTH_FORGOT_PASSWORD: "/$locale/auth/forgot-password" as const,
  AUTH_RESET_PASSWORD: "/$locale/auth/reset-password" as const,
  AUTH_VERIFY_EMAIL: "/$locale/auth/verify-email" as const,
  AUTH_PRIVACY: "/$locale/auth/privacy" as const,
  AUTH_TERMS: "/$locale/auth/terms" as const,
  AUTH_HELP: "/$locale/auth/help" as const,
  
  DASHBOARD: "/$locale/dashboard" as const,
  DASHBOARD_HOME: "/$locale/dashboard" as const,
  DASHBOARD_CONNECTORS: "/$locale/dashboard/connectors" as const,
  DASHBOARD_CONNECTORS_ADD: "/$locale/dashboard/connectors/add" as const,
  DASHBOARD_CONNECTORS_DETAIL: "/$locale/dashboard/connectors/$id" as const,
  DASHBOARD_CONNECTORS_CONFIGURE: "/$locale/dashboard/connectors/$id/configure" as const,
  DASHBOARD_CONNECTORS_REMOVE: "/$locale/dashboard/connectors/$id/remove" as const,
  DASHBOARD_DOMAIN: "/$locale/dashboard/$domain" as const,
  DASHBOARD_AGENCY: "/$locale/dashboard/agency" as const,
  DASHBOARD_AGENCY_CLIENT: "/$locale/dashboard/agency/$clientId" as const,
  DASHBOARD_CUSTOMIZE: "/$locale/dashboard/customize" as const,
  DASHBOARD_FEATURE_FLAGS: "/$locale/dashboard/feature-flags" as const,
  
  HOME: "/$locale" as const,
  ONBOARDING: "/$locale/onboarding" as const,
} as const satisfies Record<string, RoutePaths>;

export type RoutePath = typeof ROUTE_PATHS[keyof typeof ROUTE_PATHS];

export function isValidRoutePath(path: string): path is RoutePath {
  return Object.values(ROUTE_PATHS).includes(path as RoutePath);
}
```

**prefetch.ts**:
```typescript
import { router } from "../router";
import { withLocalePrefix } from "./navigation";
import { useLocaleParam } from "@/i18n/hooks";

export function prefetchRoute(path: string, locale?: AppLocale) {
  const targetLocale = locale ?? useLocaleParam();
  void router.preloadRoute({
    to: withLocalePrefix(targetLocale, path),
  });
}

export function prefetchRoutes(paths: string[], locale?: AppLocale) {
  paths.forEach((path) => prefetchRoute(path, locale));
}
```

**utils/index.ts**:
```typescript
export { withLocalePrefix, stripLocalePrefix, ensureLocalePrefix } from "./navigation";
export { ROUTE_PATHS, type RoutePath, isValidRoutePath } from "./route-paths";
export { prefetchRoute, prefetchRoutes } from "./prefetch";
```

**Acceptance Criteria**:
- [ ] All utility functions implemented
- [ ] Route paths defined for all routes
- [ ] Unit tests for navigation utilities
- [ ] Type safety for route paths

---

### Task 1.5: Implement Search Param Types
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Task 1.1

**Description**: Create type definitions for search parameters used across routes

**Files to Create**:
- `/apps/frontend/src/router/types/index.ts`
- `/apps/frontend/src/router/types/search-params.ts`

**Implementation Details**:

**search-params.ts**:
```typescript
export type ConnectorListSearch = {
  status?: "healthy" | "warning" | "error" | "inactive" | "syncing";
  domain?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AuthRedirectSearch = {
  redirect?: string;
  session?: "expired";
  oauth?: "google" | "microsoft" | "apple";
};

export type DashboardSearch = {
  tab?: string;
  view?: "grid" | "list";
};

export type AgencyClientSearch = {
  clientId?: string;
  view?: string;
};

// Validators for use in route definitions
export function validateConnectorListSearch(search: Record<string, unknown>): ConnectorListSearch {
  return {
    status: ["healthy", "warning", "error", "inactive", "syncing"].includes(search.status as string)
      ? (search.status as ConnectorListSearch["status"])
      : undefined,
    domain: typeof search.domain === "string" ? search.domain : undefined,
    search: typeof search.search === "string" ? search.search : undefined,
    page: typeof search.page === "number" ? search.page : 1,
    pageSize: typeof search.pageSize === "number" ? search.pageSize : 50,
  };
}

export function validateAuthRedirectSearch(search: Record<string, unknown>): AuthRedirectSearch {
  return {
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    session: search.session === "expired" ? "expired" : undefined,
    oauth: ["google", "microsoft", "apple"].includes(search.oauth as string)
      ? (search.oauth as AuthRedirectSearch["oauth"])
      : undefined,
  };
}
```

**types/index.ts**:
```typescript
export type {
  ConnectorListSearch,
  AuthRedirectSearch,
  DashboardSearch,
  AgencyClientSearch,
} from "./search-params";

export {
  validateConnectorListSearch,
  validateAuthRedirectSearch,
} from "./search-params";
```

**Acceptance Criteria**:
- [ ] Search param types defined for all routes
- [ ] Validators implemented
- [ ] Types exported from index
- [ ] Unit tests for validators

---

### Task 1.6: Implement Testing Utilities
**Priority**: Medium  
**Estimated Time**: 2 hours  
**Dependencies**: Task 1.2, Task 1.3

**Description**: Create mock router utilities for testing

**Files to Create**:
- `/apps/frontend/src/router/testing/index.ts`
- `/apps/frontend/src/router/testing/mock-router.ts`

**Implementation Details**:

**mock-router.ts**:
```typescript
import { vi, type MockInstance } from "vitest";

export interface MockRouter {
  push: MockInstance<(path: string) => void>;
  replace: MockInstance<(path: string) => void>;
  back: MockInstance<() => void>;
  prefetch: MockInstance<(path: string) => void>;
  navigate: MockInstance;
}

export function createMockRouter(partial?: Partial<MockRouter>): MockRouter {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    navigate: vi.fn(),
    ...partial,
  };
}

export function mockUseRouter(mockRouter?: MockRouter) {
  return vi.mock("@/router/hooks/useRouter", () => ({
    useRouter: () => mockRouter ?? createMockRouter(),
  }));
}

export function mockUseNavigate(mockNavigate?: Partial<MockRouter>) {
  return vi.mock("@/router/hooks/useNavigate", () => ({
    useNavigate: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      ...mockNavigate,
    }),
  }));
}
```

**testing/index.ts**:
```typescript
export { createMockRouter, mockUseRouter, mockUseNavigate } from "./mock-router";
export type { MockRouter } from "./mock-router";
```

**Acceptance Criteria**:
- [ ] Mock router factory implemented
- [ ] Mock hook utilities implemented
- [ ] Example test usage documented
- [ ] Unit tests for mock utilities

---

### Task 1.7: Create Public API Exports
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: Tasks 1.2-1.6

**Description**: Create the main entry point that exports all router SSOT functionality

**Files to Create**:
- `/apps/frontend/src/router/index.ts`

**Implementation Details**:

```typescript
// Router instance
export { router, createAppRouter, type AppRouter } from "./router";

// Hooks
export { useRouter } from "./hooks/useRouter";
export { useNavigate } from "./hooks/useNavigate";
export { useSearch } from "./hooks/useSearch";
export { useParams } from "./hooks/useParams";
export { usePathname } from "./hooks/usePathname";

// Utils
export {
  withLocalePrefix,
  stripLocalePrefix,
  ensureLocalePrefix,
} from "./utils/navigation";
export { ROUTE_PATHS, type RoutePath, isValidRoutePath } from "./utils/route-paths";
export { prefetchRoute, prefetchRoutes } from "./utils/prefetch";

// Types
export type {
  ConnectorListSearch,
  AuthRedirectSearch,
  DashboardSearch,
  AgencyClientSearch,
} from "./types/search-params";
export {
  validateConnectorListSearch,
  validateAuthRedirectSearch,
} from "./types/search-params";

// Testing
export {
  createMockRouter,
  mockUseRouter,
  mockUseNavigate,
  type MockRouter,
} from "./testing";
```

**Acceptance Criteria**:
- [ ] All exports defined
- [ ] Types exported correctly
- [ ] No circular dependencies
- [ ] Import paths verified

---

### Task 1.8: Write Unit Tests for Router Module
**Priority**: High  
**Estimated Time**: 4 hours  
**Dependencies**: Tasks 1.2-1.7

**Description**: Write comprehensive unit tests for all router abstractions

**Files to Create**:
- `/apps/frontend/src/router/router.test.ts`
- `/apps/frontend/src/router/hooks/useRouter.test.tsx`
- `/apps/frontend/src/router/hooks/useNavigate.test.tsx`
- `/apps/frontend/src/router/hooks/useSearch.test.tsx`
- `/apps/frontend/src/router/hooks/useParams.test.tsx`
- `/apps/frontend/src/router/hooks/usePathname.test.tsx`
- `/apps/frontend/src/router/utils/navigation.test.ts`
- `/apps/frontend/src/router/utils/route-paths.test.ts`
- `/apps/frontend/src/router/types/search-params.test.ts`
- `/apps/frontend/src/router/testing/mock-router.test.ts`

**Acceptance Criteria**:
- [ ] All modules have unit tests
- [ ] 100% code coverage for router module
- [ ] All tests passing
- [ ] Mock utilities tested

---

## Phase 2: Migration of Navigation Utilities

### Task 2.1: Refactor i18n/navigation.tsx
**Priority**: High  
**Estimated Time**: 3 hours  
**Dependencies**: Phase 1 complete

**Description**: Update the locale-aware navigation module to use router SSOT

**Files to Modify**:
- `/apps/frontend/src/i18n/navigation.tsx`

**Implementation Details**:
Update imports to use router SSOT:
```typescript
import {
  Link as RouterLink,
  useRouterState,
} from "@tanstack/react-router";
import { useRouter, useNavigate, useParams, usePathname as usePathnameBase } from "@/router";
import { withLocalePrefix, stripLocalePrefix } from "@/router/utils/navigation";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
```

**Acceptance Criteria**:
- [ ] All functions use router SSOT
- [ ] Backward-compatible exports maintained
- [ ] All existing imports still working
- [ ] Tests passing

---

### Task 2.2: Update Navigation Tests
**Priority**: Medium  
**Estimated Time**: 2 hours  
**Dependencies**: Task 2.1

**Description**: Update tests for navigation utilities after refactor

**Files to Modify**:
- Search for and update any test files that test navigation.tsx

**Acceptance Criteria**:
- [ ] All navigation tests passing
- [ ] Tests use new router SSOT patterns where applicable

---

## Phase 3: Route Guard Migration

### Task 3.1: Migrate Auth Route Guards
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Phase 1 complete

**Description**: Update auth route guards to use router SSOT types

**Files to Modify**:
- `/apps/frontend/src/lib/auth/route-guards/create-public-auth-before-load.ts`
- `/apps/frontend/src/lib/auth/route-guards/create-protected-before-load.ts`
- `/apps/frontend/src/lib/auth/route-guards/redirect-target.ts`
- `/apps/frontend/src/lib/auth/route-guards/guard-types.ts`

**Acceptance Criteria**:
- [ ] All auth guards using router SSOT types
- [ ] Search param validators using centralized types
- [ ] Tests passing

---

### Task 3.2: Migrate Dashboard Route Guards
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Task 3.1

**Description**: Update dashboard route guards to use router SSOT types

**Files to Modify**:
- `/apps/frontend/src/features/dashboard/route-guards/create-dashboard-parent-before-load.ts`
- `/apps/frontend/src/features/dashboard/route-guards/create-domain-dashboard-before-load.ts`
- `/apps/frontend/src/features/dashboard/route-guards/create-agency-client-dashboard-before-load.ts`

**Acceptance Criteria**:
- [ ] All dashboard guards using router SSOT types
- [ ] Search param validators using centralized types
- [ ] Tests passing

---

### Task 3.3: Update Route Definitions
**Priority**: High  
**Estimated Time**: 3 hours  
**Dependencies**: Tasks 3.1, 3.2

**Description**: Update route definitions to use centralized search param types

**Files to Modify**:
- `/apps/frontend/src/routes/$locale/auth/login.tsx`
- `/apps/frontend/src/routes/$locale/auth/register.tsx`
- `/apps/frontend/src/routes/$locale/dashboard.tsx`
- `/apps/frontend/src/routes/$locale/dashboard/connectors/index.tsx`
- And other route files with search param validation

**Acceptance Criteria**:
- [ ] All route definitions using centralized types
- [ ] No direct search param validation logic
- [ ] Type safety verified

---

## Phase 4: Page Component Migration

### Task 4.1: Migrate Connector Pages
**Priority**: High  
**Estimated Time**: 3 hours  
**Dependencies**: Phase 1 complete

**Description**: Migrate all connector pages to use router SSOT hooks

**Files to Modify**:
- `/apps/frontend/src/features/connectors/pages/ConnectorAddPage.tsx`
- `/apps/frontend/src/features/connectors/pages/ConnectorListPage.tsx`
- `/apps/frontend/src/features/connectors/pages/ConnectorDetailPage.tsx`
- `/apps/frontend/src/features/connectors/pages/ConnectorConfigurePage.tsx`
- `/apps/frontend/src/features/connectors/pages/ConnectorRemovePage.tsx`

**Changes**:
Replace:
```typescript
import { useSearch } from "@tanstack/react-router";
import { useRouter } from "@/i18n/navigation";
```

With:
```typescript
import { useSearch, useRouter } from "@/router";
import type { ConnectorListSearch } from "@/router/types";
```

**Acceptance Criteria**:
- [ ] All 5 connector pages migrated
- [ ] Type-safe search params usage
- [ ] All tests passing

---

### Task 4.2: Migrate Auth Pages
**Priority**: High  
**Estimated Time**: 3 hours  
**Dependencies**: Task 4.1

**Description**: Migrate all auth pages to use router SSOT hooks

**Files to Modify**:
- `/apps/frontend/src/features/auth/pages/LoginPage.tsx`
- `/apps/frontend/src/features/auth/pages/RegisterPage.tsx`
- `/apps/frontend/src/features/auth/pages/ForgotPasswordPage.tsx`
- `/apps/frontend/src/features/auth/pages/VerifyEmailPage.tsx`
- `/apps/frontend/src/features/auth/pages/ResetPasswordPage.tsx`

**Acceptance Criteria**:
- [ ] All 5 auth pages migrated
- [ ] Type-safe navigation
- [ ] All tests passing

---

### Task 4.3: Migrate Dashboard Pages
**Priority**: Medium  
**Estimated Time**: 2 hours  
**Dependencies**: Task 4.2

**Description**: Migrate dashboard pages to use router SSOT hooks

**Files to Modify**:
- `/apps/frontend/src/features/dashboard/pages/domain/DomainDashboardPage.tsx`
- `/apps/frontend/src/features/dashboard/pages/agency-client/AgencyClientDashboardPage.tsx`
- `/apps/frontend/src/features/onboarding/pages/OnboardingPage.tsx`

**Acceptance Criteria**:
- [ ] All dashboard pages migrated
- [ ] Type-safe navigation
- [ ] All tests passing

---

### Task 4.4: Migrate Navigation Components
**Priority**: Medium  
**Estimated Time**: 2 hours  
**Dependencies**: Task 4.3

**Description**: Migrate navigation and layout components to use router SSOT

**Files to Modify**:
- `/apps/frontend/src/components/layout/AppNavigation.tsx`
- `/apps/frontend/src/components/layout/LocaleShellGate.tsx`
- `/apps/frontend/src/components/layout/AppShellLayout.tsx`
- `/apps/frontend/src/components/desktop/DesktopDeepLinkBridge.tsx`

**Acceptance Criteria**:
- [ ] All navigation components migrated
- [ ] Consistent navigation patterns
- [ ] All tests passing

---

## Phase 5: Testing & Cleanup

### Task 5.1: Update Existing Test Files
**Priority**: High  
**Estimated Time**: 3 hours  
**Dependencies**: Phase 4 complete

**Description**: Update existing test files to use router SSOT mock utilities

**Files to Modify**:
- Search for test files that mock router and update to use `@/router/testing`

**Acceptance Criteria**:
- [ ] All test files using router SSOT mocks
- [ ] Consistent mocking patterns
- [ ] All tests passing

---

### Task 5.2: Remove Deprecated Imports
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Task 5.1

**Description**: Remove all direct `@tanstack/react-router` imports from app code

**Acceptance Criteria**:
- [ ] Zero direct imports in app code (routes/ can keep imports)
- [ ] ESLint rule added (optional future work)
- [ ] Code review completed

---

### Task 5.3: Update Documentation
**Priority**: Medium  
**Estimated Time**: 2 hours  
**Dependencies**: Task 5.2

**Description**: Update documentation with router SSOT usage examples

**Files to Create/Modify**:
- `/docs/05-reference/router-ssot-guide.md` (new)
- Update any existing router-related documentation

**Acceptance Criteria**:
- [ ] Usage guide created
- [ ] Examples documented
- [ ] Migration guide for future reference

---

### Task 5.4: Run Full Test Suite
**Priority**: High  
**Estimated Time**: 1 hour  
**Dependencies**: All previous tasks

**Description**: Run complete test suite to verify no regressions

**Commands**:
```bash
cd apps/frontend
pnpm test
pnpm test:coverage
pnpm typecheck
```

**Acceptance Criteria**:
- [ ] All tests passing
- [ ] No type errors
- [ ] Coverage targets met

---

### Task 5.5: Performance Verification
**Priority**: Medium  
**Estimated Time**: 1 hour  
**Dependencies**: Task 5.4

**Description**: Verify no performance regression from router abstractions

**Acceptance Criteria**:
- [ ] Bundle size within acceptable range
- [ ] No runtime performance issues
- [ ] Navigation performance verified

---

## Summary

**Total Tasks**: 25  
**Estimated Total Time**: 45-50 hours  
**Phases**: 5

### Phase Breakdown:
- Phase 1 (Foundation): 8 tasks, ~15 hours
- Phase 2 (Navigation Migration): 2 tasks, ~5 hours
- Phase 3 (Route Guards): 3 tasks, ~7 hours
- Phase 4 (Page Components): 4 tasks, ~10 hours
- Phase 5 (Testing & Cleanup): 5 tasks, ~8 hours

### Critical Path:
1. Phase 1 must complete before any migration
2. Phase 2 depends on Phase 1
3. Phase 3 depends on Phase 1
4. Phase 4 depends on Phase 1
5. Phase 5 depends on all previous phases

### Parallel Work:
- Phases 2, 3, and 4 can proceed in parallel after Phase 1
- Individual tasks within phases can often be done in parallel
