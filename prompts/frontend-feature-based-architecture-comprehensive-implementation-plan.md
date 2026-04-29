# Frontend Feature-Based Architecture: Comprehensive Implementation Plan

## 1) Goal

Refactor `apps/frontend` from a layer-first organization (for example, split across `routes`, `components`, `lib`, and locale bundles) to a feature-based structure that improves:

- Discoverability and ownership
- Scalability and reuse
- Change safety and testability
- Consistency with repository frontend governance

This plan preserves TanStack Start file-based routing behavior and existing URL contracts while relocating implementation details to feature-owned modules.

## 2) Source of truth and constraints

This plan aligns with the required frontend governance order:

1. `docs/05-reference/frontend-ui-architecture-guidelines.md`
2. `docs/05-reference/frontend-ui-architecture-guidelines-checklist.md`
3. `design-system/README.md`
4. `docs/05-reference/frontend-development-guidelines.md`

Non-negotiable constraints:

- Preserve architecture chain: `route -> page -> component -> hook/service -> typed API contract`.
- Keep TanStack route modules under `apps/frontend/src/routes`.
- Avoid tenant-specific hardcoding and preserve tenant-safe behavior.
- Maintain WCAG 2.1 AA, RTL/LTR parity, and locale parity.
- Reuse design-system patterns (`@agenticverdict/ui`, Mantine v9), avoid one-off UI forks.
- Keep redirects and auth/guard behavior deterministic and safe.

## 3) Current-state diagnosis (dashboard as pilot)

Dashboard implementation is currently spread across:

- Routes: `apps/frontend/src/routes/$locale/*dashboard*`
- UI: `apps/frontend/src/components/dashboard/*`
- Feature logic/data/state: `apps/frontend/src/lib/dashboard/*`
- Route guards: `apps/frontend/src/lib/auth/route-guards/*dashboard*`
- Navigation coupling: `apps/frontend/src/components/layout/*navigation*`
- Localization: `apps/frontend/messages/en.json`, `fr.json`, `ar.json`
- Tests: split across `apps/frontend/e2e`, route tests, and `src/lib/dashboard/*.test.ts`

Resulting issues:

- No single ownership center for dashboard.
- Higher cognitive load for onboarding and code changes.
- Increased risk of missing dependencies during refactors.
- Harder test impact analysis and feature-level governance.

## 4) Target architecture

Use **feature-sliced implementation with route adapters**:

- Keep route files in `src/routes` as thin adapters.
- Move business logic, page composition, feature UI, and feature-scoped model/api into `src/features/<feature-name>`.

Recommended structure:

```text
apps/frontend/src/
  features/
    dashboard/
      pages/
        home/
        domain/
        agency/
        agency-client/
        customize/
        feature-flags/
      ui/
        surfaces/
        controls/
        feedback/
        a11y/
      route-guards/
      api/
      model/
        state/
        search/
        persistence/
        permissions/
        errors/
      config/
      i18n/
      tests/
  routes/$locale/
    dashboard.tsx
    -dashboard.page.tsx
    dashboard/*.tsx
```

## 5) Migration strategy (systematic, low risk)

### Phase 0: Baseline and controls

1. Confirm pilot feature (`dashboard`) and ownership.
2. Capture baseline metrics:
   - Type errors
   - Test pass rate
   - Route/navigation errors
   - a11y and i18n validation status
3. Define migration rules:
   - Route files remain adapter-only.
   - No cross-layer imports.
   - No path/URL behavior changes unless approved.
4. Prepare ADR/RFC and publish mapping plan.

Exit criteria:

- Rules approved.
- Baseline captured.
- CI checks and review checklist ready.

### Phase 1: Pilot migration (dashboard)

1. Create feature root: `apps/frontend/src/features/dashboard`.
2. Move page implementations (`-*.page.tsx` logic) into feature page modules.
3. Move `src/components/dashboard/*` into `features/dashboard/ui/*`.
4. Move `src/lib/dashboard/*` into `features/dashboard/{api,model,config}`.
5. Move dashboard-specific guards from `lib/auth/route-guards` to `features/dashboard/route-guards`.
6. Update route modules to thin adapters that import feature modules.
7. Keep URL structure and route IDs unchanged.
8. Run targeted quality gates and fix regressions immediately.

Exit criteria:

- Dashboard behavior unchanged for users.
- All mandatory validation gates pass.
- Pilot retrospective completed with lessons for next waves.

### Phase 2: Wave rollout for other features

1. Prioritize features by coupling and risk.
2. Migrate 1-3 features per wave.
3. Use temporary compatibility adapters only when required.
4. Remove temporary shims in the same wave when feasible.
5. Run wave-level regression and monitor KPIs.

Exit criteria:

- Each wave has zero critical regressions.
- Layer/import boundaries remain clean.

### Phase 3: Hardening and decommission

1. Remove legacy leftovers in old layer-first locations.
2. Enforce strict boundary checks as blocking in CI.
3. Finalize docs and onboarding guides.
4. Confirm two sprint cycles of stable KPIs.

Exit criteria:

- No active legacy feature logic outside new feature roots.
- Governance and quality gates are steady-state.

## 6) File mapping blueprint (dashboard representative set)

Keep-in-place + adapt:

- `apps/frontend/src/routes/$locale/dashboard.tsx`
- `apps/frontend/src/routes/$locale/dashboard/$domain.tsx`
- `apps/frontend/src/routes/$locale/dashboard/agency.tsx`
- `apps/frontend/src/routes/$locale/dashboard/agency.$clientId.tsx`
- `apps/frontend/src/routes/$locale/dashboard/customize.tsx`
- `apps/frontend/src/routes/$locale/dashboard/feature-flags.tsx`

Move to feature pages:

- `apps/frontend/src/routes/$locale/-dashboard.page.tsx` -> `apps/frontend/src/features/dashboard/pages/home/DashboardHomePage.tsx`
- `apps/frontend/src/routes/$locale/dashboard/-domain.page.tsx` -> `apps/frontend/src/features/dashboard/pages/domain/DomainDashboardPage.tsx`
- `apps/frontend/src/routes/$locale/dashboard/-agency.page.tsx` -> `apps/frontend/src/features/dashboard/pages/agency/AgencyDashboardPage.tsx`
- `apps/frontend/src/routes/$locale/dashboard/-agency-client.page.tsx` -> `apps/frontend/src/features/dashboard/pages/agency-client/AgencyClientDashboardPage.tsx`
- `apps/frontend/src/routes/$locale/dashboard/-customize.page.tsx` -> `apps/frontend/src/features/dashboard/pages/customize/CustomizeDashboardPage.tsx`
- `apps/frontend/src/routes/$locale/dashboard/-feature-flags.page.tsx` -> `apps/frontend/src/features/dashboard/pages/feature-flags/DashboardFeatureFlagsPage.tsx`

Move dashboard UI:

- `apps/frontend/src/components/dashboard/*` -> `apps/frontend/src/features/dashboard/ui/*`

Move dashboard logic:

- `apps/frontend/src/lib/dashboard/*` -> `apps/frontend/src/features/dashboard/{api,model,config}/*`

Move dashboard-specific guards:

- `apps/frontend/src/lib/auth/route-guards/create-dashboard-parent-before-load.ts` -> `apps/frontend/src/features/dashboard/route-guards/create-dashboard-parent-before-load.ts`
- `apps/frontend/src/lib/auth/route-guards/create-domain-dashboard-before-load.ts` -> `apps/frontend/src/features/dashboard/route-guards/create-domain-dashboard-before-load.ts`
- `apps/frontend/src/lib/auth/route-guards/create-agency-client-dashboard-before-load.ts` -> `apps/frontend/src/features/dashboard/route-guards/create-agency-client-dashboard-before-load.ts`

Tests and i18n:

- Keep E2E under `apps/frontend/e2e`, but group by feature folder.
- Keep runtime locale aggregate files (`messages/en.json`, `fr.json`, `ar.json`), optionally source dashboard namespace from feature-local files and sync during build.

## 7) Quality gates and validation checklist

Mandatory commands for migrated frontend scope:

- `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/frontend run i18n:validate` (when locale keys/messages change)
- `pnpm --filter @agenticverdict/frontend test -- <targeted-pattern>`

Required checks per wave:

- Route safety: no redirect loops or unsafe targets.
- Accessibility: keyboard flow, labels, semantic structure, focus visibility.
- RTL/LTR parity: layout and interaction checks in both directions.
- Locale parity: no missing keys across `en`, `fr`, `ar`.
- Tenant safety: no scoping regressions in route/session/query behavior.

## 8) Risk register and mitigations

1. Route regressions during file moves  
   Mitigation: keep route files stable, add route smoke E2E, canary rollout.

2. Layer boundary drift  
   Mitigation: import-boundary lint rules and PR checklist enforcement.

3. i18n/RTL regressions  
   Mitigation: locale parity validation and RTL targeted UI checks.

4. Accessibility regressions  
   Mitigation: a11y checks in changed surfaces and QA signoff.

5. Tenant/context safety regressions  
   Mitigation: tenant-aware integration tests around guards and session flows.

6. Migration slowdown from hidden coupling  
   Mitigation: phased waves, dependency mapping, and adapter expiration policy.

## 9) Rollback strategy

- Rollback unit: per feature wave.
- Before each wave: create release tag and manifest of moved files.
- If regressions occur:
  - Revert wave commit set or disable migrated path behind feature flag.
  - Run smoke checks and restore stable behavior.
  - Document cause and add regression tests before retry.

## 10) Ownership model

- Frontend Architecture Owner: approves boundaries and exceptions.
- Feature Team Lead: accountable for migration execution and quality.
- QA/Automation: owns integration/E2E reliability.
- Accessibility + Localization reviewers: mandatory signoff where applicable.
- Security/Platform reviewer: tenant-safety and auth/guard risk review.

## 11) KPIs

- Zero blocking layer violations in migrated features.
- Zero critical route/auth regressions per wave.
- 100% locale key parity for touched namespaces.
- Zero new critical accessibility violations.
- Stable or improved test pass rates and reduced change lead time.

## 12) Immediate next actions (execution order)

1. Approve this architecture and pilot scope (dashboard).
2. Create migration branch and add feature folder skeleton.
3. Perform route-adapter conversion for dashboard home flow first.
4. Migrate dashboard `ui` and `model/api` modules incrementally.
5. Run gates after each sub-step (typecheck + targeted tests + i18n where needed).
6. Merge pilot after acceptance, then schedule wave-based rollout for remaining features.
