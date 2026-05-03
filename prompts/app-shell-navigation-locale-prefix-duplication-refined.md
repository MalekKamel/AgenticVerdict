# App shell navigation: duplicate locale segment in Agency URL

## Objective

Correct URL construction for the **Agency** item in app shell navigation so paths include the locale **once**, consistent with the application’s i18n and router conventions.

## Background

Navigation links are assembled in:

`/apps/frontend/src/components/layout/app-shell-navigation.ts`

A defect in how the **agency** target is built causes the locale segment to appear twice in the final URL.

## Expected vs actual

|              | URL (example base: `http://localhost:3000`) |
| ------------ | ------------------------------------------- |
| **Expected** | `/en/dashboard/agency`                      |
| **Actual**   | `/en/en/dashboard/agency`                   |

The redundant segment is a duplicated locale prefix (`/en/en/…` instead of `/en/…`).

## Scope of work

1. Trace how the **agency** link (and any shared helpers) resolve locale and dashboard paths.
2. Fix link construction so the locale is not prepended when it is already part of the resolved path (or align with the single source of truth for localized routes).
3. Confirm other app shell entries do not exhibit the same duplication.

## Success criteria

- Visiting **Agency** from the shell navigates to `/en/dashboard/agency` (single locale), not `/en/en/dashboard/agency`.
- No regressions for other locales or other primary nav targets.
- Implementation follows project routing and i18n guidance (for example `/docs/05-reference/router-navigation-guide.md` and existing router utilities under `apps/frontend/src/router/`).

## Primary file

- `/apps/frontend/src/components/layout/app-shell-navigation.ts`

Investigate related router and tenant/navigation helpers only as needed to land a minimal, correct fix.
