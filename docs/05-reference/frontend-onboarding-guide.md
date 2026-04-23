# Frontend Onboarding Guide (`apps/frontend`)

This guide helps experienced TypeScript/React engineers get productive quickly in the AgenticVerdict frontend codebase.

## 1) Purpose And Scope

`apps/frontend` is the primary web client for AgenticVerdict. It owns:

- User-facing flows (auth, dashboard, onboarding surfaces, feature-flag admin surface)
- Locale-aware and direction-aware rendering (`en`/`ar`, LTR/RTL)
- Typed API interaction with backend via tRPC
- Frontend observability hooks and web vitals reporting

Scope boundaries:

- Domain/business logic should stay in shared packages (`packages/*`) or backend (`apps/api`) where appropriate
- UI primitives and tokens should come from `@agenticverdict/ui`, not one-off local systems

Relevant paths:

- `apps/frontend/README.md`
- `apps/frontend/src/routes/$locale/-dashboard.page.tsx`
- `apps/frontend/src/routes/$locale/onboarding.tsx`
- `apps/frontend/src/routes/$locale/dashboard/feature-flags.tsx`

## 2) High-Level Architecture And Key Technologies

Core stack:

- TanStack Start + TanStack Router (file-based routing and SSR app shell)
- React Query for server-state fetching/cache
- tRPC v11 for type-safe frontend-backend contracts
- Mantine + shared `@agenticverdict/ui` for design-system implementation
- JSON message catalogs + custom i18n provider/hooks
- Vitest + Playwright for unit/integration and E2E

Key files:

- `apps/frontend/package.json`
- `apps/frontend/src/router.tsx`
- `apps/frontend/src/components/Providers.tsx`
- `apps/frontend/src/routes/__root.tsx`

## 3) Application Flow

### Routing

- Routes are file-based under `apps/frontend/src/routes/`.
- `/` redirects to default locale route.
- `/$locale` validates locale, loads messages, and composes global providers/layout.

References:

- `apps/frontend/src/routes/index.tsx`
- `apps/frontend/src/routes/$locale/route.tsx`
- `apps/frontend/src/i18n/routing.ts`

### Data Flow And State

- Request data: React Query (`getQueryClient`) with SSR-aware query client behavior.
- Session/auth bootstrap: `SessionProvider` + `useSessionQuery`, then mirrored into auth store.
- UI state: TanStack Store (`auth-store`, `ui-store`).

References:

- `apps/frontend/src/lib/query-client.ts`
- `apps/frontend/src/providers/SessionProvider.tsx`
- `apps/frontend/src/hooks/useSessionQuery.ts`
- `apps/frontend/src/stores/auth-store.ts`
- `apps/frontend/src/stores/ui-store.ts`

### API Interaction

- Typed tRPC client (`createTRPCReact<AppRouter>`) points to `/api/v1/trpc`.
- Request headers include `x-tenant-id` and `x-request-id`.
- Client chooses base URL from desktop runtime config, `VITE_PUBLIC_API_URL`, or same-origin fallback.

References:

- `apps/frontend/src/lib/api/trpc-client.ts`
- `apps/api/src/trpc/router-export.ts`

### UI Composition

- `Providers` composes app-level concerns (QueryClient, tRPC, session, tenant, theme, direction, Mantine).
- `AppShellLayout` wraps locale route content for shell-level UX.

References:

- `apps/frontend/src/components/Providers.tsx`
- `apps/frontend/src/components/layout/AppShellLayout.tsx`

## 4) Project Structure (What Lives Where)

Main directories in `apps/frontend/src`:

- `routes/`: route definitions, route loaders, and route-level guards
- `components/`: reusable UI implementation (feature and shared components)
- `providers/`: cross-cutting providers (session, tenant, theming composition)
- `lib/`: infrastructure helpers (`api`, auth helpers, utilities)
- `hooks/`: reusable hooks for UI/data behavior
- `stores/`: TanStack stores for auth and UI state
- `i18n/`: locale configuration, provider wiring, navigation helpers
- `styles/`: global and shared CSS

Also relevant:

- `apps/frontend/messages/*.json`: translation catalogs
- `apps/frontend/e2e/`: Playwright specs
- `apps/frontend/scripts/`: i18n extraction/validation scripts

## 5) Local Setup And Daily Workflow

## Prerequisites

- Node.js 20 LTS
- pnpm 10+

## Install

```bash
pnpm install
```

## Start Frontend In Dev

```bash
pnpm --filter @agenticverdict/frontend dev
```

## Core Daily Commands

```bash
# Type safety
pnpm --filter @agenticverdict/frontend typecheck

# Lint
pnpm --filter @agenticverdict/frontend lint

# Unit/integration tests
pnpm --filter @agenticverdict/frontend test
pnpm --filter @agenticverdict/frontend test:coverage

# E2E tests
pnpm --filter @agenticverdict/frontend test:e2e

# Production build
pnpm --filter @agenticverdict/frontend build
```

Optional workflow commands:

```bash
# i18n support
pnpm --filter @agenticverdict/frontend i18n:extract
pnpm --filter @agenticverdict/frontend i18n:validate

# SPA build mode
pnpm --filter @agenticverdict/frontend build:spa

# Bundle analysis
pnpm --filter @agenticverdict/frontend build:analyze
```

References:

- `apps/frontend/package.json`
- `package.json`
- `.github/workflows/ci.yml`

## 6) Environment Variables And Configuration

Frontend-relevant runtime variables include:

- `VITE_PUBLIC_API_URL`
- `VITE_PUBLIC_TRPC_API_URL`
- `VITE_PUBLIC_AUTH_API_MODE`
- `VITE_PUBLIC_ENABLE_AUTH`
- `VITE_PUBLIC_ENABLE_MFA_UI`
- `VITE_PUBLIC_ENABLE_FEATURE_FLAGS_ADMIN_UI`
- `VITE_PUBLIC_ENABLE_ONBOARDING_WIZARD`
- `VITE_PUBLIC_TENANT_BASE_DOMAINS`
- `VITE_PUBLIC_TELEMETRY_INGEST_URL`
- `VITE_PUBLIC_TELEMETRY_INGEST_TOKEN`
- `VITE_PUBLIC_TELEMETRY_SAMPLE_RATE`
- `API_URL` (SSR/server-side fallback path)

Where these are defined/used:

- `apps/frontend/src/vite-env.d.ts`
- `apps/frontend/src/lib/api/trpc-client.ts`
- `apps/frontend/src/lib/auth/protected-route-session.ts`
- `apps/frontend/README.md`

Important note:

- If telemetry ingest auth is enabled, keep frontend `VITE_PUBLIC_TELEMETRY_INGEST_TOKEN` aligned with API `TELEMETRY_INGEST_SECRET`.

## 7) Coding Standards, Conventions, And Design System

- TypeScript strict mode is enforced; avoid `any`.
- Use ESLint and existing repo conventions before opening PRs.
- Build UI from `@agenticverdict/ui` and Mantine patterns already used in repo.
- Keep localization and direction support intact (no hardcoded left/right assumptions).
- Follow WCAG 2.1 AA expectations for accessibility.
- For design assets (`.pen`), use Pencil MCP workflows and validate with:

```bash
pnpm run validate:pen-files
```

References:

- `configs/tsconfig.base.json`
- `apps/frontend/tsconfig.json`
- `apps/frontend/eslint.config.mjs`
- `design-system/README.md`
- `docs/05-reference/frontend-development-guidelines.md`
- `docs/05-reference/frontend-ui-architecture-guidelines.md`
- `.cursor/rules/ui-guidelines.mdc`

## 8) Common Development Tasks (Step By Step)

### A) Add A New Locale-Aware Route

1. Create route file under `apps/frontend/src/routes/$locale/...`.
2. Follow patterns from existing route files.
3. Add localized copy via `useTranslations`.
4. Verify behavior in both `/en/...` and `/ar/...`.
5. Run `typecheck`, `lint`, and tests.

Example references:

- `apps/frontend/src/routes/$locale/dashboard/feature-flags.tsx`
- `apps/frontend/src/routes/$locale/auth/login.tsx`

### B) Add A Typed tRPC Query/Mutation In A UI Screen

1. Reuse existing tRPC client (`trpc`) from `src/lib/api/trpc-client.ts`.
2. Consume with React Query hooks in route/component.
3. Ensure tenant-aware headers remain via `buildTrpcHeaders`.
4. Handle loading/error/success states in UI.
5. Add or update tests.

Example references:

- `apps/frontend/src/lib/api/trpc-client.ts`
- `apps/frontend/src/hooks/useSessionQuery.ts`

### C) Add New Translation Keys

1. Add keys to `apps/frontend/messages/en.json` and `apps/frontend/messages/ar.json` (and additional supported locales where relevant).
2. Use keys with `useTranslations` in components/routes.
3. Validate with:
   - `pnpm --filter @agenticverdict/frontend i18n:extract`
   - `pnpm --filter @agenticverdict/frontend i18n:validate`
4. Confirm copy and layout in LTR and RTL contexts.

## 9) Debugging, Troubleshooting, And Pitfalls

Frequent checks:

- API connectivity errors: verify `VITE_PUBLIC_API_URL`/`API_URL` and API server availability
- Auth redirect issues: inspect protected route session logic and auth mode (`VITE_PUBLIC_AUTH_API_MODE`)
- Missing translations: run i18n extract/validate scripts and inspect message files
- Layout regressions: always test both `/en` and `/ar`

Known pitfalls in current repo context:

- Some docs/workflows still reference legacy `apps/frontend`; the active frontend package is `apps/frontend`
- Prefer `apps/frontend/package.json` scripts as source of truth for executable commands

## 10) Testing Strategy And Quality Expectations

For frontend contributors:

- Write/maintain unit tests for hooks, utility logic, and critical UI behavior
- Keep E2E coverage for core user journeys (auth, dashboard, locale/a11y checks)
- Run coverage and ensure changed areas stay above thresholds configured for frontend
- Treat accessibility checks as part of definition-of-done

References:

- `apps/frontend/vitest.config.mjs`
- `apps/frontend/e2e/`
- `docs/05-reference/web-unit-test-coverage-policy.md`
- `docs/02-planning-and-methodology/testing-strategy.md`

## 11) Build/Deployment Overview (Frontend Contributor View)

- Build artifact is produced by `pnpm --filter @agenticverdict/frontend build`.
- Frontend runtime entrypoint uses `.output/server/index.mjs` (`start` script).
- CI uses frontend build and E2E patterns that should mirror local verification.
- For release/deploy procedures, check runbooks rather than ad-hoc commands.

References:

- `apps/frontend/package.json`
- `apps/frontend/playwright.config.mjs`
- `.github/workflows/ci.yml`
- `docs/05-reference/runbooks/web-deploy-rollback.md`

## 12) Recommended First Tasks (Week 1)

1. Run app and fix one small lint/type issue in `apps/frontend`.
2. Add a small localized UI improvement on an existing dashboard/auth route.
3. Add or improve one unit test for a hook or utility.
4. Run one Playwright test locally and understand test data/setup flow.
5. Pair with a reviewer on one PR to learn architecture decisions and conventions.

Useful companion docs:

- `apps/frontend/README.md`
- `apps/frontend/src/lib/api/README.md`
- `apps/frontend/src/lib/api/AUTH_API_USAGE.md`
- `docs/architecture/ui/04-decision-record.md`
- `docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`
