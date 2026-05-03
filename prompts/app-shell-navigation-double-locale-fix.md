# App Shell Navigation Double Locale Prefix Fix

## Context

The navigation component at `/apps/frontend/src/components/layout/app-shell-navigation.ts` contains a routing bug that causes duplicate locale prefixes in generated URLs.

## Problem

When users click the `agency` navigation link, the application navigates to:

- **Actual**: `http://localhost:3000/en/en/dashboard/agency`
- **Expected**: `http://localhost:3000/en/dashboard/agency`

The locale prefix (`/en`) is being duplicated, resulting in malformed URLs.

## Task

Investigate and fix the navigation link construction in `app-shell-navigation.ts` to ensure locale prefixes are applied correctly without duplication.

## Acceptance Criteria

1. All navigation links in the app shell generate URLs with a single locale prefix
2. The `agency` link navigates to `/en/dashboard/agency` (not `/en/en/dashboard/agency`)
3. Verify other navigation links do not have similar duplication issues
4. Ensure the fix aligns with the project's internationalization patterns and router configuration

## Relevant Files

- Primary: `/apps/frontend/src/components/layout/app-shell-navigation.ts`
- Related: Router configuration and i18n setup files as needed for investigation
