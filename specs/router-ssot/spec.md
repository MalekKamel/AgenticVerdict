# TanStack Router Single Source of Truth

## Overview

This specification defines a centralized router abstraction layer that consolidates all `@tanstack/react-router` imports and usage patterns across the frontend application into a single source of truth (SSOT).

## Problem Statement

### Current State

The current implementation has `@tanstack/react-router` imported directly in **50+ files** across the codebase:

1. **Route definitions** (25+ files in `/routes/`)
2. **Page components** (10+ files in `/features/*/pages/`)
3. **Navigation components** (5+ files in `/components/layout/`)
4. **Route guards** (5+ files in `/lib/auth/route-guards/` and `/features/dashboard/route-guards/`)
5. **Utility modules** (navigation.tsx, router.tsx, etc.)

### Pain Points

- **Scattered imports**: Direct `@tanstack/react-router` imports everywhere
- **Inconsistent patterns**: Mixed usage of `useRouter`, `useNavigate`, `useSearch`, `useParams`
- **Duplication**: Locale-aware navigation logic duplicated in `i18n/navigation.tsx`
- **Maintenance burden**: Router API changes require updates across many files
- **Testing complexity**: Hard to mock router behavior in tests
- **Type safety gaps**: Inconsistent type usage for route paths and search params

## Goals

1. **Centralize router access**: Single export point for all router functionality
2. **Type-safe navigation**: Compile-time validation of route paths and parameters
3. **Consistent patterns**: Standardized hooks and utilities across the codebase
4. **Easy testing**: Mockable router abstractions for unit and integration tests
5. **Future-proof**: Easy to swap or upgrade router implementation

## Non-Goals

- Replacing TanStack Router with a different routing library
- Changing the file-based route structure
- Modifying existing route definitions (routes/*.tsx)

## Architecture

### Proposed Module Structure

```
src/router/
├── index.ts                    # Public API exports
├── router.ts                   # Router instance and configuration
├── hooks/
│   ├── index.ts               # Hook exports
│   ├── useRouter.ts           # Centralized useRouter hook
│   ├── useNavigate.ts         # Centralized navigation hook
│   ├── useSearch.ts           # Type-safe search param hook
│   ├── useParams.ts           # Type-safe route param hook
│   └── usePathname.ts         # Locale-aware pathname hook
├── utils/
│   ├── index.ts               # Utility exports
│   ├── navigation.ts          # Navigation helpers (locale-aware)
│   ├── route-paths.ts         # Type-safe route path constants
│   └── prefetch.ts            # Route prefetching utilities
├── types/
│   ├── index.ts               # Type exports
│   ├── routes.ts              # Route type definitions
│   └── search-params.ts       # Search param type definitions
└── testing/
    ├── index.ts               # Test utilities exports
    └── mock-router.ts         # Mock router for tests
```

### Core Abstractions

#### 1. Router Instance (`router/router.ts`)

```typescript
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: "intent",
});

export type AppRouter = typeof router;
```

#### 2. Centralized Hooks (`router/hooks/`)

```typescript
// router/hooks/useRouter.ts
import { useRouter as useTanStackRouter } from "@tanstack/react-router";
import { router } from "../router";

export function useRouter() {
  return useTanStackRouter();
}

// router/hooks/useNavigate.ts
import { useNavigate as useTanStackNavigate } from "@tanstack/react-router";
import { withLocalePrefix } from "../utils/navigation";
import { useLocaleParam } from "@/i18n/hooks";

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

#### 3. Type-Safe Route Paths (`router/utils/route-paths.ts`)

```typescript
import { type RoutePaths } from "@/routeTree.gen";

export const ROUTE_PATHS = {
  HOME: "/$locale" as const,
  DASHBOARD: "/$locale/dashboard" as const,
  DASHBOARD_CONNECTORS: "/$locale/dashboard/connectors" as const,
  DASHBOARD_CONNECTORS_ADD: "/$locale/dashboard/connectors/add" as const,
  DASHBOARD_CONNECTORS_DETAIL: "/$locale/dashboard/connectors/$id" as const,
  AUTH_LOGIN: "/$locale/auth/login" as const,
  AUTH_REGISTER: "/$locale/auth/register" as const,
  // ... etc
} satisfies Record<string, RoutePaths>;

export type RoutePath = typeof ROUTE_PATHS[keyof typeof ROUTE_PATHS];
```

#### 4. Search Param Types (`router/types/search-params.ts`)

```typescript
import { type SearchValidator } from "@tanstack/react-router";

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

// Export validators for use in route definitions
export const connectorListSearchValidator: SearchValidator<ConnectorListSearch> = (search) => ({
  status: search.status as ConnectorListSearch["status"],
  domain: typeof search.domain === "string" ? search.domain : undefined,
  search: typeof search.search === "string" ? search.search : undefined,
  page: typeof search.page === "number" ? search.page : 1,
  pageSize: typeof search.pageSize === "number" ? search.pageSize : 50,
});
```

#### 5. Testing Utilities (`router/testing/mock-router.ts`)

```typescript
import { vi, type Mock } from "vitest";

export function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    navigate: vi.fn(),
  };
}

export function mockUseRouter(mockRouter?: ReturnType<typeof createMockRouter>) {
  vi.mock("@/router/hooks/useRouter", () => ({
    useRouter: () => mockRouter ?? createMockRouter(),
  }));
}
```

## Public API

### Main Exports (`router/index.ts`)

```typescript
// Router instance
export { router, type AppRouter } from "./router";

// Hooks
export { useRouter } from "./hooks/useRouter";
export { useNavigate } from "./hooks/useNavigate";
export { useSearch } from "./hooks/useSearch";
export { useParams } from "./hooks/useParams";
export { usePathname } from "./hooks/usePathname";

// Utils
export { ROUTE_PATHS, type RoutePath } from "./utils/route-paths";
export { withLocalePrefix, stripLocalePrefix } from "./utils/navigation";
export { prefetchRoute, prefetchRoutes } from "./utils/prefetch";

// Types
export type { 
  ConnectorListSearch, 
  AuthRedirectSearch,
  // ... other search param types
} from "./types/search-params";

// Testing
export { createMockRouter, mockUseRouter } from "./testing/mock-router";
```

## Migration Strategy

### Phase 1: Foundation
- Create router module structure
- Implement core abstractions
- Write unit tests for new modules

### Phase 2: Parallel Usage
- Update new code to use router SSOT
- Keep existing imports working
- Document migration path

### Phase 3: Incremental Migration
- Migrate route guards
- Migrate page components
- Migrate navigation components

### Phase 4: Cleanup
- Remove direct `@tanstack/react-router` imports
- Update test setup
- Finalize documentation

## Success Criteria

1. ✅ All router imports go through `@/router` (zero direct `@tanstack/react-router` imports in app code)
2. ✅ Type-safe route paths with autocomplete support
3. ✅ Type-safe search params for all routes
4. ✅ Mock router utilities available for testing
5. ✅ 100% test coverage for router abstractions
6. ✅ Migration guide documented

## Dependencies

- `@tanstack/react-router` (existing)
- `@tanstack/react-start` (existing)
- TypeScript 5.x (existing)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes during migration | High | Parallel usage period, gradual migration |
| Type complexity | Medium | Well-documented types, examples |
| Performance overhead | Low | Thin wrappers, no runtime overhead |
| Team adoption | Medium | Documentation, code examples, pair programming |

## Related Documents

- `/specs/01-ui/03-routing/tanstack-start-integration.md`
- `/docs/05-reference/frontend-ui-architecture-guidelines.md`
- `/apps/frontend/src/i18n/navigation.tsx` (current locale-aware navigation)
