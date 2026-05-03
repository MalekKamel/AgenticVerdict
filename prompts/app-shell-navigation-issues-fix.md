# App Shell Navigation Issues - Agency Link

## Context

File: `/apps/frontend/src/components/layout/app-shell-navigation.ts`

## Issues to Resolve

### 1. Missing Localization

**Problem**: The agency navigation link displays the raw key `navigation.agency` instead of the localized text.

**Required**: Add proper localization using the project's i18n system to display the translated label.

### 2. Duplicate Locale in URL

**Problem**: Clicking the agency link navigates to:

```
http://localhost:3000/en/en/dashboard/agency
```

Instead of:

```
http://localhost:3000/en/dashboard/agency
```

**Required**: Fix the link construction to prevent duplicate locale segments in the URL path.

### 3. Missing Route Handler

**Problem**: The agency dashboard route returns "Page not found" when accessed directly at `/en/dashboard/agency`.

**Required**: Implement or verify the route handler exists for the agency dashboard page.

## Acceptance Criteria

- [ ] Agency link displays localized text (not the raw key)
- [ ] Clicking agency navigates to `/en/dashboard/agency` (no duplicate locale)
- [ ] Agency dashboard page loads successfully without 404 error
- [ ] Navigation follows TanStack Router conventions per `/docs/05-reference/router-navigation-guide.md`

## Relevant Documentation

- Router & Navigation: `/docs/05-reference/router-navigation-guide.md`
- Frontend UI Architecture: `/docs/05-reference/frontend-ui-architecture-guidelines.md`
