# TanStack Router Navigation System Guide

## Overview

This guide documents the centralized router abstraction layer for the AgenticVerdict frontend application. All router access goes through `@/router` to ensure consistency, type safety, and maintainability.

## Architecture

```
src/router/
├── index.ts                    # Main entry point - public API
├── router.ts                   # Router instance and configuration
├── hooks/
│   ├── index.ts               # Hook exports
│   ├── useRouter.ts           # Centralized useRouter hook
│   ├── useNavigate.ts         # Locale-aware navigation hook
│   ├── useSearch.ts           # Type-safe search param hook
│   ├── useParams.ts           # Type-safe route param hook
│   ├── usePathname.ts         # Locale-aware pathname hook
│   └── useLocaleParam.ts      # Locale parameter hook
├── utils/
│   ├── index.ts               # Utility exports
│   ├── navigation.ts          # Locale-aware navigation helpers
│   └── route-paths.ts         # Type-safe route path constants
├── types/
│   ├── index.ts               # Type exports
│   └── search-params.ts       # Search param type definitions
└── testing/
    ├── index.ts               # Test utilities exports
    └── mock-router.ts         # Mock router for tests
```

## Core Principles

1. **Single Source of Truth**: All router access goes through `@/router`
2. **Type Safety**: Compile-time validation of route paths and parameters
3. **Locale Awareness**: Automatic locale prefix handling for internationalized routes
4. **Testability**: Easy to mock router behavior in unit tests
5. **Consistency**: Standardized patterns across the codebase

## Usage Guide

### Basic Navigation

#### useRouter Hook

Use `useRouter()` for programmatic navigation:

```typescript
import { useRouter } from "@/router";

function MyComponent() {
  const router = useRouter();

  const handleNavigate = () => {
    // Navigate to a new page
    router.push("/dashboard");

    // Replace current history entry
    router.replace("/auth/login");

    // Go back
    router.back();

    // Prefetch a route
    router.prefetch("/dashboard/connectors");
  };

  return <button onClick={handleNavigate}>Go to Dashboard</button>;
}
```

#### useNavigate Hook

For simple navigation without prefetch:

```typescript
import { useNavigate } from "@/router";

function MyComponent() {
  const navigate = useNavigate();

  return (
    <>
      <button onClick={() => navigate.push("/dashboard")}>
        Push to Dashboard
      </button>
      <button onClick={() => navigate.replace("/auth/login")}>
        Replace with Login
      </button>
    </>
  );
}
```

#### Link Component

For declarative navigation, use the locale-aware Link component:

```typescript
import { Link } from "@/i18n/navigation";

function Navigation() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/dashboard/connectors">Connectors</Link>
      <Link to="/auth/login" locale="fr">
        Connexion (French)
      </Link>
    </nav>
  );
}
```

### Route Parameters

#### useParams Hook

Extract route parameters with type safety:

```typescript
import { useParams } from "@/router";

function ConnectorDetailPage() {
  const params = useParams({ from: "/$locale/dashboard/connectors/$id" }) as {
    id: string
  };
  const { id } = params;

  // Use the id to fetch connector data
  const { data } = useConnectorDetail(id);

  return <div>Connector: {data?.name}</div>;
}
```

### Search Parameters

#### useSearch Hook

Access search/query parameters:

```typescript
import { useSearch } from "@/router";

function ConnectorListPage() {
  const search = useSearch({
    from: "/$locale/dashboard/connectors/"
  }) as {
    status?: "healthy" | "warning" | "error";
    page?: number;
  };

  const { status, page = 1 } = search;

  // Use search params to filter data
  const { data } = useConnectorList({ status, page });

  return <div>Showing connectors...</div>;
}
```

### Pathname Access

#### usePathname Hook

Get the current pathname (locale-stripped):

```typescript
import { usePathname } from "@/router";

function Breadcrumbs() {
  const pathname = usePathname();
  // Returns "/dashboard/connectors" (without locale prefix)

  return <nav>Current: {pathname}</nav>;
}
```

#### useLocaleParam Hook

Get the current locale:

```typescript
import { useLocaleParam } from "@/router";

function LocalizedComponent() {
  const locale = useLocaleParam();
  // Returns "en", "fr", "es", etc.

  return <div>Current locale: {locale}</div>;
}
```

## Route Path Constants

Use `ROUTE_PATHS` for type-safe route references:

```typescript
import { ROUTE_PATHS } from "@/router";

function Navigation() {
  return (
    <nav>
      <Link href={ROUTE_PATHS.AUTH_LOGIN}>Login</Link>
      <Link href={ROUTE_PATHS.DASHBOARD_CONNECTORS}>Connectors</Link>
      <Link href={ROUTE_PATHS.DASHBOARD}>Dashboard</Link>
    </nav>
  );
}

// Available route paths:
// - ROUTE_PATHS.HOME
// - ROUTE_PATHS.ONBOARDING
// - ROUTE_PATHS.AUTH_LOGIN
// - ROUTE_PATHS.AUTH_REGISTER
// - ROUTE_PATHS.AUTH_FORGOT_PASSWORD
// - ROUTE_PATHS.AUTH_RESET_PASSWORD
// - ROUTE_PATHS.AUTH_VERIFY_EMAIL
// - ROUTE_PATHS.AUTH_TERMS
// - ROUTE_PATHS.AUTH_PRIVACY
// - ROUTE_PATHS.AUTH_HELP
// - ROUTE_PATHS.DASHBOARD
// - ROUTE_PATHS.DASHBOARD_CONNECTORS
// - ROUTE_PATHS.DASHBOARD_CONNECTORS_ADD
// - ROUTE_PATHS.DASHBOARD_CONNECTORS_DETAIL
// - ROUTE_PATHS.DASHBOARD_CONNECTORS_CONFIGURE
// - ROUTE_PATHS.DASHBOARD_CONNECTORS_REMOVE
// - ROUTE_PATHS.DASHBOARD_DOMAIN
// - ROUTE_PATHS.DASHBOARD_AGENCY
// - ROUTE_PATHS.DASHBOARD_AGENCY_CLIENT
// - ROUTE_PATHS.DASHBOARD_CUSTOMIZE
// - ROUTE_PATHS.DASHBOARD_FEATURE_FLAGS
// - ROUTE_PATHS.API_HEALTH
// - ROUTE_PATHS.API_READY
```

## Navigation Utilities

### withLocalePrefix

Add locale prefix to a path:

```typescript
import { withLocalePrefix } from "@/router";
import { useLocaleParam } from "@/router";

function MyComponent() {
  const locale = useLocaleParam();
  const path = withLocalePrefix(locale, "/dashboard");
  // Returns "/en/dashboard" for English locale
}
```

### stripLocalePrefix

Remove locale prefix from a path:

```typescript
import { stripLocalePrefix } from "@/router";
import { useLocaleParam } from "@/router";

function MyComponent() {
  const locale = useLocaleParam();
  const path = stripLocalePrefix("/en/dashboard", locale);
  // Returns "/dashboard"
}
```

### Locale-safe auth redirects and `redirect` query params

These rules prevent **`/en/en/...`** paths and **login ↔ protected redirect loops** when signed-in users bounce between `/auth/login` and dashboard routes.

1. **Composing a full URL from locale + stored path**  
   Use **`withLocalePrefix(locale, path)`** whenever `path` might already begin with a supported locale segment (for example values deserialized from `redirect` query params). Do not concatenate `` `/${locale}${path}` `` unless `path` is guaranteed locale-relative.

2. **Encoding “return here after login” in SSR guards**  
   Prefer **`buildProtectedRedirectTarget(location)`** from `@/lib/auth/route-guards/redirect-target` so the stored **`redirect`** value is **locale-relative** (`/dashboard/...`), consistent with **`createProtectedBeforeLoad`** and [`frontend-development-guidelines.md`](./frontend-development-guidelines.md) §4.1 / §4.4.

**Related implementation:** `apps/frontend/src/lib/auth/auth-access-policy.ts` (post-login target composition), dashboard route guards under `apps/frontend/src/features/dashboard/route-guards/`.

## Testing

### Mock Router

Use the mock router utilities for unit testing:

```typescript
import { describe, it, expect, vi } from "vitest";
import { createMockRouter } from "@/router/testing";

describe("MyComponent", () => {
  it("should navigate on button click", () => {
    const mockRouter = createMockRouter();

    // Use mockRouter in your test
    mockRouter.push.mockImplementation((path: string) => {
      console.log(`Navigating to: ${path}`);
    });

    // Render component with mock router
    // ...

    // Assert navigation was called
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
  });
});
```

### Mocking useRouter

```typescript
import { vi } from "vitest";
import { mockUseRouter } from "@/router/testing";

describe("MyComponent", () => {
  it("should use router", () => {
    const customMock = createMockRouter();
    mockUseRouter(customMock);

    // Your component will use the mocked router
    // ...
  });
});
```

## Search Parameter Types

Define and use typed search parameters:

```typescript
// Define search param types
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

// Use in components
function ConnectorListPage() {
  const search = useSearch({
    from: "/$locale/dashboard/connectors/",
  }) as ConnectorListSearch;

  const { status, page = 1, pageSize = 50 } = search;
  // ...
}
```

## Migration Guide

### From Direct TanStack Router Imports

**Before:**

```typescript
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
```

**After:**

```typescript
import { useNavigate, useParams, useSearch } from "@/router";
```

### From i18n/navigation

The `i18n/navigation` module still exports all navigation utilities and is safe to use:

```typescript
import { useRouter, Link } from "@/i18n/navigation";
// This still works and uses router SSOT internally
```

### From useNavigate (TanStack)

**Before:**

```typescript
const navigate = useNavigate();
navigate({ to: "/dashboard", replace: true });
```

**After:**

```typescript
const navigate = useNavigate();
navigate.replace("/dashboard");
// or
navigate.push("/dashboard");
```

## Best Practices

### 1. Always Use Router SSOT

✅ **Do:**

```typescript
import { useRouter } from "@/router";
```

❌ **Don't:**

```typescript
import { useRouter } from "@tanstack/react-router";
```

### 2. Use Route Path Constants

✅ **Do:**

```typescript
<Link href={ROUTE_PATHS.DASHBOARD_CONNECTORS}>Connectors</Link>
```

❌ **Don't:**

```typescript
<Link href="/en/dashboard/connectors">Connectors</Link>
```

### 3. Type Your Search Parameters

✅ **Do:**

```typescript
const search = useSearch({ from: "/$locale/dashboard" }) as ConnectorListSearch;
```

❌ **Don't:**

```typescript
const search = useSearch({ from: "/$locale/dashboard" });
// search is unknown, no type safety
```

### 4. Use Locale-Aware Navigation

✅ **Do:**

```typescript
const router = useRouter();
router.push("/dashboard"); // Automatically adds locale prefix
```

❌ **Don't:**

```typescript
const router = useRouter();
router.push(`/${locale}/dashboard`); // Manual locale handling
```

### 5. Mock Router in Tests

✅ **Do:**

```typescript
const mockRouter = createMockRouter();
// Use in tests
```

❌ **Don't:**

```typescript
// Test without mocking router
// Hard to assert navigation behavior
```

### 6. Locale doubling on redirects

❌ **Don't:**

```typescript
const href = `/${locale}${redirectTarget}`; // breaks when redirectTarget is "/en/dashboard/..."
```

✅ **Do:**

```typescript
import { withLocalePrefix } from "@/router/utils/navigation";
import type { AppLocale } from "@/i18n/locales";

const href = withLocalePrefix(locale as AppLocale, redirectTarget);
```

### 7. Phantom auth on `routeContext`

❌ **Don't:** Infer signed-out state from **`context.auth`** (or similar) in `beforeLoad` unless the router explicitly assigns it—missing fields are not authentication failures.

✅ **Do:** Use **`fetchProtectedRouteSession`** for SSR probes and documented SPA deferrals (see [`frontend-development-guidelines.md`](./frontend-development-guidelines.md) §4.4).

### 8. Dynamic parent routes with child pages

When a dynamic route segment has nested children, the parent route must be a layout route.

❌ **Don't:** Use the parent as a leaf page component while also defining children.

```typescript
// routes/$locale/dashboard/insights/$id.tsx
export const Route = createFileRoute("/$locale/dashboard/insights/$id")({
  component: lazyRouteComponent(() => import("@/features/insights/pages/InsightDetailPage")),
});
// plus routes/$locale/dashboard/insights/$id/edit.tsx
```

✅ **Do:** Use `Outlet` in the parent and move the default page to `$id.index.tsx`.

```typescript
// routes/$locale/dashboard/insights/$id.tsx
export const Route = createFileRoute("/$locale/dashboard/insights/$id")({
  component: Outlet,
});

// routes/$locale/dashboard/insights/$id.index.tsx
export const Route = createFileRoute("/$locale/dashboard/insights/$id/")({
  component: lazyRouteComponent(() => import("@/features/insights/pages/InsightDetailPage")),
});

// routes/$locale/dashboard/insights/$id/edit.tsx
export const Route = createFileRoute("/$locale/dashboard/insights/$id/edit")({
  component: lazyRouteComponent(() => import("@/features/insights/pages/InsightEditPage")),
});
```

This prevents child routes (like `/edit`) from being shadowed by the parent leaf route.

## Troubleshooting

### TypeError: Cannot read property 'push' of undefined

Make sure you're calling `useRouter()` inside a component:

```typescript
// ❌ Wrong - calling outside component
const router = useRouter();
function MyComponent() {}

// ✅ Correct - calling inside component
function MyComponent() {
  const router = useRouter();
}
```

### TypeScript Error: Property 'id' does not exist on type 'unknown'

Cast the params to the correct type:

```typescript
// ❌ Wrong
const { id } = useParams({ from: "/$locale/dashboard/$id" });

// ✅ Correct
const params = useParams({ from: "/$locale/dashboard/$id" }) as { id: string };
const { id } = params;
```

### Navigation Not Adding Locale Prefix

Make sure you're using the router SSOT hooks:

```typescript
// ❌ Wrong - direct TanStack import
import { useNavigate } from "@tanstack/react-router";

// ✅ Correct - router SSOT
import { useNavigate } from "@/router";
```

### `/edit` child route not rendering under dynamic parent

Symptoms:

- URL briefly includes child segment (`/.../$id/edit`) but page renders parent detail view
- URL normalizes back to `.../$id` in UI flows

Checklist:

1. Confirm dynamic parent route uses `Outlet` (not a leaf page component).
2. Confirm default child page is defined in `$id.index.tsx`.
3. Keep nested children (`$id/edit.tsx`, `$id/remove.tsx`, etc.) under the same parent folder.
4. Regenerate route types after adding/renaming route files by running frontend build/dev tooling (for example `pnpm --filter @agenticverdict/frontend build`), then re-run typecheck.

## Related Documentation

- [TanStack Router Documentation](https://tanstack.com/router/latest/docs)
- [Frontend development guidelines](./frontend-development-guidelines.md) (§4.1 locale redirects, §4.4 guards)
- [Frontend UI Architecture Guidelines](/docs/05-reference/frontend-ui-architecture-guidelines.md)
- [i18n Navigation](/apps/frontend/src/i18n/navigation.tsx)
- [Router SSOT Specification](/specs/router-ssot/spec.md)
- [Router SSOT Implementation Plan](/specs/router-ssot/plan.md)

## API Reference

### Router Hooks

| Hook               | Description                                      | Returns                             |
| ------------------ | ------------------------------------------------ | ----------------------------------- |
| `useRouter()`      | Get router instance with locale-aware navigation | `{ push, replace, prefetch, back }` |
| `useNavigate()`    | Get navigation helpers                           | `{ push, replace }`                 |
| `useParams()`      | Get route parameters                             | `unknown` (cast to your type)       |
| `useSearch()`      | Get search parameters                            | `unknown` (cast to your type)       |
| `usePathname()`    | Get current pathname (locale-stripped)           | `string`                            |
| `useLocaleParam()` | Get current locale                               | `AppLocale`                         |

### Navigation Utilities

| Function                              | Description               | Example                                                     |
| ------------------------------------- | ------------------------- | ----------------------------------------------------------- |
| `withLocalePrefix(locale, path)`      | Add locale prefix to path | `withLocalePrefix("en", "/dashboard")` → `"/en/dashboard"`  |
| `stripLocalePrefix(pathname, locale)` | Remove locale prefix      | `stripLocalePrefix("/en/dashboard", "en")` → `"/dashboard"` |

### Testing Utilities

| Function              | Description                 | Example                           |
| --------------------- | --------------------------- | --------------------------------- |
| `createMockRouter()`  | Create mock router instance | `const mock = createMockRouter()` |
| `mockUseRouter(mock)` | Mock useRouter hook         | `mockUseRouter(customMock)`       |
