# Dashboard change — release evidence (2026-04-29)

## Architecture & layering

- Dashboard routes under `apps/frontend/src/routes/$locale/dashboard/` remain thin: `beforeLoad` guards + lazy page imports.
- Domain logic lives in `apps/frontend/src/lib/dashboard/*` and `apps/frontend/src/components/dashboard/*`.
- Prototype classification documented in `prototype-classification.md`.

## Design system & UI

- Surfaces use Mantine v9 layout primitives (`Container`, `Stack`, `Card`, `Group`, `SimpleGrid`) and `@/i18n` for navigation links.
- No duplicate `@agenticverdict/ui` primitives were required for this slice; shell navigation unchanged except existing patterns.

## Accessibility (WCAG 2.1 AA targets)

- Home dashboard exposes `main` landmark, section headings, `aria-live="polite"` status announcer, and keyboard-focusable controls (toolbar, quick actions, retries).
- Focus-visible styles rely on Mantine defaults; no positive `outline: none` overrides added.

## Localization & RTL

- Copy added under `messages/{en,fr,ar}.json` → `dashboard.*`.
- Layout uses Mantine spacing and logical props where applicable; locale `dir` continues to come from `$locale` layout.

## Route safety

- Parent search `returnTo` sanitized via `parseDashboardParentSearch` + `sanitizeDashboardReturnTarget` (dashboard subtree only).
- Invalid domain slugs redirect to `/$locale/dashboard` in `createDomainDashboardBeforeLoad`.
- Non-permitted agency client ids redirect to `/$locale/dashboard/agency` in `createAgencyClientDashboardBeforeLoad`.
- Feature-flags child route now shares `createDashboardParentBeforeLoad`.

## Tenant safety

- Dashboard data fetches reject missing `tenantId` with `TENANT_CONTEXT_MISSING`.
- React Query keys include `tenantId` and optional `clientId` (`dashboard-query-keys.ts`).
- Agency aggregate listing filters `permitted` clients for render; deep-link guard aligns with `DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS`.

## Resilience & async UX

- Home KPIs, insights, and connectors use isolated queries with per-section retry.
- Shared toolbar drives date preset, comparison toggle, manual refresh token, and freshness timestamp.

## Automated verification run (engineering)

| Command                                                                       | Result                                                                                                                                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`     | Pass                                                                                                                                                                                  |
| `pnpm --filter @agenticverdict/frontend run i18n:validate`                    | Run in CI / before merge                                                                                                                                                              |
| `pnpm --filter @agenticverdict/frontend test -- dashboard`                    | Pass (Vitest targeted)                                                                                                                                                                |
| `pnpm --filter @agenticverdict/frontend test:e2e -- dashboard-routes.spec.ts` | Run with Playwright webServer (anonymous protected-route checks for home, marketing, agency, customize entry points; post-login shell journeys depend on future auth storage fixture) |

## Sign-off checklist (6.5)

| Role        | Item                                                                   | Status             |
| ----------- | ---------------------------------------------------------------------- | ------------------ |
| Engineering | Implementation merged with gates above                                 | Done               |
| QA          | Full regression + cross-browser matrix                                 | Pending scheduling |
| Product     | Phased rollout / feature-flag decision (Open Questions in `design.md`) | Pending            |

### Deferred (non-blocking)

- Wire `dashboard-api` to real tRPC procedures when backend contracts land.
- Optional drag-and-drop customization on large breakpoints only.
- Product-defined RBAC feed to replace email-domain heuristic for quick actions and layout edit.
