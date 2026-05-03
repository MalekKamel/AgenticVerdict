# Feature-Based Architecture: 100% Enforcement Implementation Plan

**Document Status:** Ready for Execution  
**Generated:** 2026-05-03  
**Owner:** Frontend Architecture Team  
**Priority:** High

---

## Executive Summary

A comprehensive audit of `/apps/frontend/src/` reveals **58 architecture violations** where feature-specific code resides in shared directories instead of within their respective feature modules. The codebase has a partially implemented feature-based architecture with `/apps/frontend/src/features/`, but critical feature logic remains scattered across `lib/`, `components/`, `hooks/`, `providers/`, and `stores/`.

**Most severe violations:**

- **Auth feature fragmentation:** ~20 files across 7 directories (CRITICAL)
- **Shell/layout split:** ~10 files in `components/layout/` instead of `features/shell/` (CRITICAL)
- **Cross-feature utilities:** Tenant, storage, and observability logic in `lib/` instead of `packages/core/` or feature directories (MODERATE)

This plan provides a phased migration strategy to achieve 100% feature-based encapsulation with zero regression risk.

---

## 1. Current State Analysis

### 1.1 Directory Structure Overview

```
apps/frontend/src/
├── components/          # SHARED UI (10 subdirs, 24 files) - VIOLATIONS HERE
├── features/            # FEATURE MODULES (9 features) - TARGET STRUCTURE
│   ├── auth/            # Partially implemented
│   ├── connectors/      # ✓ Well-encapsulated (reference pattern)
│   ├── dashboard/       # Partially implemented
│   ├── home/            # ✓ Well-encapsulated
│   ├── onboarding/      # Partially implemented
│   ├── rbac/            # Partially implemented
│   └── shell/           # Partially implemented
├── hooks/               # SHARED hooks (1 file) - VIOLATIONS HERE
├── i18n/                # DUPLICATE (also exists in packages/i18n/)
├── lib/                 # SHARED utilities (21 subdirs, 75+ files) - VIOLATIONS HERE
├── providers/           # SHARED providers (2 files) - VIOLATIONS HERE
├── router/              # Router infrastructure (✓ acceptable)
├── routes/              # TanStack Start routes (✓ mostly correct)
├── stores/              # SHARED stores (2 files) - VIOLATIONS HERE
└── styles/              # Global styles
```

### 1.2 Violation Summary by Category

| Category                      | Violation Count | Severity | Impact                                  |
| ----------------------------- | --------------- | -------- | --------------------------------------- |
| Auth feature fragmentation    | ~20 files       | CRITICAL | High coupling, circular dependency risk |
| Shell/layout split            | ~10 files       | CRITICAL | Inconsistent imports, unclear ownership |
| Tenant in lib (cross-cutting) | ~12 files       | MODERATE | Should be in packages/core/             |
| Storage utilities             | ~5 files        | MODERATE | Should be feature-scoped or core        |
| Error handling split          | ~3 files        | MINOR    | Minor duplication                       |
| i18n duplication              | ~8 files        | MINOR    | Confusing for onboarding                |
| **Total**                     | **~58 files**   |          |                                         |

---

## 2. Target Architecture Specification

### 2.1 Canonical Feature Directory Structure

Every feature must follow this structure:

```
features/<feature-name>/
├── api/                    # API clients, tRPC routers, external calls
│   └── <feature>-api.ts
├── model/                  # Business logic, state machines, validations
│   ├── state/              # State management (Zustand stores)
│   ├── search/             # Search/filter logic
│   ├── persistence/        # Local storage, caching
│   ├── permissions/        # Feature-specific permissions
│   ├── errors/             # Feature-specific error types
│   └── validations/        # Zod schemas for feature data
├── hooks/                  # React hooks (custom, feature-scoped)
├── ui/                     # Presentational components
│   ├── surfaces/           # Major UI surfaces (cards, panels)
│   ├── controls/           # Interactive controls (buttons, inputs)
│   ├── feedback/           # Feedback UI (toasts, alerts)
│   └── a11y/               # Accessibility utilities
├── pages/                  # Page components (route adapters import from here)
│   ├── <page-name>/
│   │   └── <PageName>Page.tsx
├── route-guards/           # TanStack route guard factories
│   └── create-<feature>-before-load.ts
├── providers/              # React context providers (feature-scoped)
├── config/                 # Feature configuration, constants
├── i18n/                   # Feature-specific localization keys (optional)
├── observability/          # Feature-specific analytics, logging
└── tests/                  # Feature-scoped tests (unit, integration)
```

### 2.2 Shared Infrastructure Boundaries

**What stays in `lib/` (cross-cutting concerns):**

- `lib/api/` - tRPC client, generic API infrastructure
- `lib/adapter-infrastructure/` - Platform adapter health checks
- `lib/observability/` - Generic analytics (Pino, Sentry, Prometheus)
- `lib/validations/` - Generic validation utilities (not feature-specific)

**What moves to `packages/core/` (shared kernel):**

- `lib/tenant/` → `packages/core/tenant/` (tenant resolution, branding)
- `lib/storage/core.ts`, `keys.ts` → `packages/core/storage/`
- `lib/errors/normalized-error-adapter.ts` → `packages/core/error-system/`

**What moves to features (feature-owned):**

- All feature-specific logic (auth, dashboard, shell, onboarding, rbac)
- Feature-specific API clients
- Feature-specific hooks, components, pages
- Feature-specific route guards
- Feature-specific state stores
- Feature-specific observability

### 2.3 Import Boundary Rules

| Source                | Can Import                                              | Cannot Import                           |
| --------------------- | ------------------------------------------------------- | --------------------------------------- |
| `features/<feature>/` | `lib/`, `stores/`, `@agenticverdict/*`, own feature     | Other features (except rbac→lib, shell) |
| `components/`         | `lib/`, `stores/`, `@mantine/*`, `@agenticverdict/ui/*` | `features/*` (except shell, rbac)       |
| `lib/`                | `stores/`, `@agenticverdict/*` packages                 | `features/`, `components/`              |
| `routes/`             | `features/`, `components/`, `lib/`, `i18n/`             | Direct store access (use hooks)         |
| `stores/`             | `@agenticverdict/core/`                                 | `features/`, `components/`              |

**Enforcement:** ESLint `no-restricted-imports` rules (see Section 7).

---

## 3. Complete File Migration Manifest

### 3.1 Phase 1: Auth Feature Consolidation (CRITICAL)

**Target:** Move all auth-related code into `features/auth/`

| Source Path                                                        | Destination Path                                                        | Import Updates Required                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| `lib/auth/auth-access-policy.ts`                                   | `features/auth/model/auth-access-policy.ts`                             | Update imports in: dashboard pages, connectors pages        |
| `lib/auth/auth-resolution-state.ts`                                | `features/auth/model/auth-resolution-state.ts`                          | Update imports in: auth pages                               |
| `lib/auth/auth-session-transition.ts`                              | `features/auth/model/auth-session-transition.ts`                        | Update imports in: auth pages                               |
| `lib/auth/build-auth-seo-head.ts`                                  | `features/auth/ui/build-auth-seo-head.tsx`                              | Update imports in: all auth routes                          |
| `lib/auth/frontend-runtime-policy.ts`                              | `features/auth/model/frontend-runtime-policy.ts`                        | Update imports in: \_\_root.tsx                             |
| `lib/auth/mfa-readiness.ts`                                        | `features/auth/model/mfa-readiness.ts`                                  | Update imports in: auth pages                               |
| `lib/auth/protected-route-session.ts`                              | `features/auth/model/protected-route-session.ts`                        | Update imports in: route guards                             |
| `lib/auth/resolve-auth-brand-name.ts`                              | `features/auth/model/resolve-auth-brand-name.ts`                        | Update imports in: auth pages                               |
| `lib/auth/safe-auth-redirect.ts`                                   | `features/auth/model/safe-auth-redirect.ts`                             | Update imports in: auth pages                               |
| `lib/auth/route-guards/create-protected-before-load.ts`            | `features/auth/route-guards/create-protected-before-load.ts`            | Update imports in: dashboard route-guards, onboarding route |
| `lib/auth/route-guards/create-public-auth-before-load.ts`          | `features/auth/route-guards/create-public-auth-before-load.ts`          | Update imports in: auth routes                              |
| `lib/auth/route-guards/create-protected-onboarding-before-load.ts` | `features/auth/route-guards/create-protected-onboarding-before-load.ts` | Update imports in: onboarding route                         |
| `lib/auth/route-guards/require-tenant-owner-member.ts`             | `features/auth/route-guards/require-tenant-owner-member.ts`             | Update imports in: dashboard routes                         |
| `lib/auth/route-guards/require-tenant-owner.ts`                    | `features/auth/route-guards/require-tenant-owner.ts`                    | Update imports in: dashboard routes                         |
| `lib/auth/route-guards/redirect-if-authenticated.ts`               | `features/auth/route-guards/redirect-if-authenticated.ts`               | Update imports in: auth routes                              |
| `lib/api/auth-api.ts`                                              | `features/auth/api/auth-api.ts`                                         | Update imports in: auth pages, lib/tenant                   |
| `components/auth/AuthError.tsx`                                    | `features/auth/ui/AuthError.tsx`                                        | Update imports in: auth pages                               |
| `components/auth/AuthSuccess.tsx`                                  | `features/auth/ui/AuthSuccess.tsx`                                      | Update imports in: auth pages                               |
| `stores/auth-store.ts`                                             | `features/auth/model/state/auth-store.ts`                               | Update imports in: 27 files (auth-store dependents)         |
| `hooks/useTenantType.ts`                                           | `features/auth/hooks/useTenantType.ts`                                  | Update imports in: TenantProvider, auth pages               |
| `providers/TenantProvider.tsx`                                     | `features/auth/providers/TenantProvider.tsx`                            | Update imports in: $locale/route.tsx, \_\_root.tsx          |
| `providers/SessionProvider.tsx`                                    | `features/auth/providers/SessionProvider.tsx`                           | Update imports in: $locale/route.tsx, \_\_root.tsx          |
| `lib/validations/auth.ts`                                          | `features/auth/model/validations/auth.ts`                               | Update imports in: auth forms                               |
| `lib/observability/auth-funnel-analytics.ts`                       | `features/auth/observability/auth-funnel-analytics.ts`                  | Update imports in: auth pages                               |

**Post-Migration Structure:**

```
features/auth/
├── api/
│   └── auth-api.ts
├── model/
│   ├── auth-access-policy.ts
│   ├── auth-resolution-state.ts
│   ├── auth-session-transition.ts
│   ├── mfa-readiness.ts
│   ├── frontend-runtime-policy.ts
│   ├── protected-route-session.ts
│   ├── resolve-auth-brand-name.ts
│   ├── safe-auth-redirect.ts
│   ├── state/
│   │   └── auth-store.ts
│   └── validations/
│       └── auth.ts
├── hooks/
│   ├── useSessionQuery.ts
│   ├── useRequireAuth.ts
│   └── useTenantType.ts
├── ui/
│   ├── AuthError.tsx
│   ├── AuthSuccess.tsx
│   └── build-auth-seo-head.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── VerifyEmailPage.tsx
│   ├── HelpPage.tsx
│   ├── TermsPage.tsx
│   └── PrivacyPage.tsx
├── route-guards/
│   ├── create-protected-before-load.ts
│   ├── create-public-auth-before-load.ts
│   ├── create-protected-onboarding-before-load.ts
│   ├── require-tenant-owner-member.ts
│   ├── require-tenant-owner.ts
│   └── redirect-if-authenticated.ts
├── providers/
│   ├── TenantProvider.tsx
│   └── SessionProvider.tsx
└── observability/
    └── auth-funnel-analytics.ts
```

### 3.2 Phase 2: Shell/Layout Consolidation (CRITICAL)

**Target:** Move all shell-related code into `features/shell/`

| Source Path                                    | Destination Path                                        | Import Updates Required                                  |
| ---------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| `components/layout/AppShellLayout.tsx`         | `features/shell/ui/AppShellLayout.tsx`                  | Update imports in: components/layout/LocaleShellGate.tsx |
| `components/layout/AppNavigation.tsx`          | `features/shell/ui/AppNavigation.tsx`                   | Update imports in: AppShellLayout.tsx                    |
| `components/layout/AppShellCommandPalette.tsx` | `features/shell/ui/AppShellCommandPalette.tsx`          | Update imports in: AppShellLayout.tsx                    |
| `components/layout/ColorSchemeToggle.tsx`      | `features/shell/ui/ColorSchemeToggle.tsx`               | Update imports in: AppNavigation.tsx                     |
| `components/layout/LanguageSwitcher.tsx`       | `features/shell/ui/LanguageSwitcher.tsx`                | Update imports in: AppNavigation.tsx                     |
| `components/layout/LocaleShellGate.tsx`        | `features/shell/ui/LocaleShellGate.tsx`                 | Update imports in: $locale/route.tsx, \_\_root.tsx       |
| `components/layout/navbar-utils.ts`            | `features/shell/ui/navbar-utils.ts`                     | Update imports in: AppNavigation.tsx                     |
| `components/layout/app-shell-navigation.ts`    | `features/shell/model/app-shell-navigation.ts`          | Update imports in: AppNavigation.tsx                     |
| `lib/storage/app-shell-preferences-storage.ts` | `features/shell/model/app-shell-preferences-storage.ts` | Update imports in: useAppShellPreferences hook           |
| `lib/observability/shell-analytics.ts`         | `features/shell/observability/shell-analytics.ts`       | Update imports in: AppShellLayout.tsx, AppNavigation.tsx |

**Post-Migration Structure:**

```
features/shell/
├── ui/
│   ├── AppShellLayout.tsx
│   ├── AppNavigation.tsx
│   ├── AppShellCommandPalette.tsx
│   ├── ColorSchemeToggle.tsx
│   ├── LanguageSwitcher.tsx
│   ├── LocaleShellGate.tsx
│   └── navbar-utils.ts
├── model/
│   ├── app-shell-navigation.ts
│   └── app-shell-preferences-storage.ts
├── hooks/
│   ├── useAppShellPreferences.ts (already here ✓)
│   └── useShellBootstrap.ts (already here ✓)
└── observability/
    └── shell-analytics.ts
```

### 3.3 Phase 3: Core Infrastructure Promotion (MODERATE)

**Target:** Move cross-cutting concerns to `packages/core/`

| Source Path                               | Destination Path                                             | Import Updates Required                                   |
| ----------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| `lib/tenant/fetch-current-tenant-name.ts` | `packages/core/src/tenant/fetch-current-tenant-name.ts`      | Update imports in: $locale/route.tsx                      |
| `lib/tenant/tenant-branding.ts`           | `packages/core/src/tenant/tenant-branding.ts`                | Update imports in: auth pages                             |
| `lib/tenant/tenant-resolution.ts`         | `packages/core/src/tenant/tenant-resolution.ts`              | Update imports in: auth hooks, onboarding, TenantProvider |
| `lib/tenant/trpc-tenant-bridge.ts`        | `packages/core/src/tenant/trpc-tenant-bridge.ts`             | Update imports in: trpc-client, TenantProvider            |
| `lib/tenant/*` (8 more files)             | `packages/core/src/tenant/`                                  | Update imports across app                                 |
| `lib/storage/core.ts`                     | `packages/core/src/storage/core.ts`                          | Update imports in: storage utilities                      |
| `lib/storage/keys.ts`                     | `packages/core/src/storage/keys.ts`                          | Update imports in: storage utilities                      |
| `lib/errors/normalized-error-adapter.ts`  | `packages/core/src/error-system/normalized-error-adapter.ts` | Update imports in: error boundaries                       |

**Note:** This phase requires coordination with `packages/core/` team and may require publishing new package versions.

### 3.4 Phase 4: RBAC Reclassification (MODERATE)

**Decision Point:** RBAC is currently in `features/rbac/` but is used as a shared library.

**Option A: Move to lib/ (Recommended)**

```
lib/rbac/
├── useRoles.ts
├── usePermissions.ts
└── useCanAccess.ts
```

**Option B: Keep in features/ but allow as exception**

- Update import boundary rules to allow `features/rbac/` as a shared feature
- Document this exception in AGENTS.md

**Recommendation:** Option A (move to `lib/rbac/`) because:

- RBAC is used by ALL features (auth, dashboard, connectors, shell)
- RBAC has no feature-specific logic (it's generic permission infrastructure)
- Moving to `lib/` clarifies its role as cross-cutting concern

### 3.5 Phase 5: i18n Consolidation (MINOR)

**Issue:** i18n exists in two places:

- `packages/i18n/` (shared package)
- `apps/frontend/src/i18n/` (app-specific)

**Target:** Consolidate into `packages/i18n/`

| Source Path                                 | Destination Path                               | Notes           |
| ------------------------------------------- | ---------------------------------------------- | --------------- |
| `apps/frontend/src/i18n/i18n.ts`            | `packages/i18n/src/i18n.ts`                    | Merge configs   |
| `apps/frontend/src/i18n/react.tsx`          | `packages/i18n/src/react.tsx`                  | Merge providers |
| `apps/frontend/src/i18n/navigation.tsx`     | `apps/frontend/src/router/utils/navigation.ts` | Move to router  |
| `apps/frontend/src/i18n/*` (locale configs) | `packages/i18n/src/locales/`                   | Consolidate     |

---

## 4. Migration Strategy

### 4.1 Pre-Migration Checklist

Before starting Phase 1:

- [ ] Create migration branch: `feat/arch/100-percent-feature-based`
- [ ] Run baseline quality gates:
  ```bash
  pnpm --filter @agenticverdict/frontend exec tsc --noEmit
  pnpm --filter @agenticverdict/frontend run lint
  pnpm --filter @agenticverdict/frontend test
  pnpm --filter @agenticverdict/frontend run i18n:validate
  ```
- [ ] Capture baseline metrics (type errors, test pass rate, lint violations)
- [ ] Create release tag: `pre-feature-migration-baseline`
- [ ] Notify team of migration start (Slack, email)

### 4.2 Phase 1: Auth Consolidation (Estimated: 2-3 days)

**Day 1: Move model and API**

1. Create directory structure in `features/auth/`
2. Move `lib/auth/*.ts` → `features/auth/model/*.ts`
3. Move `lib/api/auth-api.ts` → `features/auth/api/auth-api.ts`
4. Update imports in moved files
5. Run typecheck, fix errors
6. Commit: `feat(auth): move model and API to features/auth/`

**Day 2: Move hooks, providers, stores**

1. Move `hooks/useTenantType.ts` → `features/auth/hooks/`
2. Move `providers/*.tsx` → `features/auth/providers/`
3. Move `stores/auth-store.ts` → `features/auth/model/state/auth-store.ts`
4. Update imports in 27 auth-store dependents
5. Run typecheck, fix errors
6. Commit: `feat(auth): move hooks, providers, and store to features/auth/`

**Day 3: Move route guards, UI, observability**

1. Move `lib/auth/route-guards/*.ts` → `features/auth/route-guards/`
2. Move `components/auth/*.tsx` → `features/auth/ui/`
3. Move `lib/observability/auth-funnel-analytics.ts` → `features/auth/observability/`
4. Update imports in auth routes
5. Run full quality gates
6. Commit: `feat(auth): move route guards, UI, and observability to features/auth/`

**Validation Checkpoints:**

- [ ] Zero type errors
- [ ] All auth tests pass
- [ ] Manual smoke test: login, register, password reset flows
- [ ] E2E smoke test: `pnpm run test:e2e:frontend:smoke`

### 4.3 Phase 2: Shell Consolidation (Estimated: 1-2 days)

**Day 1: Move UI components**

1. Move `components/layout/*.tsx` → `features/shell/ui/*.tsx`
2. Update imports in `LocaleShellGate.tsx`
3. Run typecheck, fix errors
4. Commit: `feat(shell): move UI components to features/shell/ui/`

**Day 2: Move model and observability**

1. Move `components/layout/app-shell-navigation.ts` → `features/shell/model/`
2. Move `lib/storage/app-shell-preferences-storage.ts` → `features/shell/model/`
3. Move `lib/observability/shell-analytics.ts` → `features/shell/observability/`
4. Update imports in hooks and components
5. Run full quality gates
6. Commit: `feat(shell): move model and observability to features/shell/`

**Validation Checkpoints:**

- [ ] Zero type errors
- [ ] Navigation works in all locales (en, ar, fr)
- [ ] RTL layout correct
- [ ] Theme toggle works
- [ ] Language switcher works

### 4.4 Phase 3: Core Promotion (Estimated: 2-3 days)

**Coordination Required:** `packages/core/` team

**Day 1: Tenant migration**

1. Create `packages/core/src/tenant/` directory
2. Move `lib/tenant/*.ts` → `packages/core/src/tenant/`
3. Update `packages/core/` barrel exports
4. Publish new `@agenticverdict/core` version
5. Update `apps/frontend/package.json` dependency
6. Run `pnpm install`
7. Update imports in frontend
8. Run typecheck, fix errors
9. Commit: `feat(core): promote tenant utilities to packages/core/`

**Day 2-3: Storage and error system**

1. Repeat process for `lib/storage/core.ts`, `keys.ts`
2. Repeat process for `lib/errors/normalized-error-adapter.ts`
3. Run full quality gates
4. Commit: `feat(core): promote storage and error adapters to packages/core/`

**Validation Checkpoints:**

- [ ] Zero type errors
- [ ] All packages build successfully
- [ ] Tenant resolution works in all flows
- [ ] Error boundaries render correctly

### 4.5 Phase 4: RBAC Reclassification (Estimated: 0.5 days)

**Option A: Move to lib/**

1. Create `lib/rbac/` directory
2. Move `features/rbac/hooks/*.ts` → `lib/rbac/`
3. Update imports in dependents (AppShellLayout, AppNavigation, connectors, dashboard)
4. Run typecheck, fix errors
5. Commit: `feat(rbac): reclassify as shared library in lib/rbac/`

**Validation Checkpoints:**

- [ ] Zero type errors
- [ ] Permission checks work in all features
- [ ] Role-based UI renders correctly

### 4.6 Phase 5: i18n Consolidation (Estimated: 1-2 days)

**Day 1: Merge configs**

1. Consolidate `apps/frontend/src/i18n/` into `packages/i18n/src/`
2. Update `packages/i18n/` barrel exports
3. Publish new `@agenticverdict/i18n` version
4. Update `apps/frontend/package.json` dependency
5. Run `pnpm install`

**Day 2: Update imports**

1. Update imports in frontend
2. Run `pnpm run i18n:validate`
3. Fix missing keys
4. Run full quality gates
5. Commit: `feat(i18n): consolidate into packages/i18n/`

**Validation Checkpoints:**

- [ ] Zero type errors
- [ ] All locales render correctly (en, ar, fr)
- [ ] RTL layout correct for Arabic
- [ ] No missing translation keys

---

## 5. Risk Assessment and Mitigations

### 5.1 High-Risk Areas

| Risk                                          | Probability | Impact | Mitigation                                               |
| --------------------------------------------- | ----------- | ------ | -------------------------------------------------------- |
| Auth store migration breaks 27 dependents     | Medium      | High   | Migrate in small batches, test after each batch          |
| Route guard migration causes redirect loops   | Medium      | High   | Manual smoke test after each guard migration             |
| Tenant promotion breaks cross-package imports | Low         | High   | Coordinate with core team, test in isolated branch first |
| i18n consolidation causes missing keys        | Medium      | Medium | Run `i18n:validate` after each move, fix immediately     |
| RTL regressions in shell migration            | Low         | Medium | Manual RTL testing in Arabic locale                      |

### 5.2 Rollback Procedures

**Per-Phase Rollback:**

If a phase causes critical regressions:

1. **Stop immediately** - do not continue migration
2. **Revert phase commit:**
   ```bash
   git revert HEAD --no-edit
   ```
3. **Verify rollback:**
   ```bash
   pnpm --filter @agenticverdict/frontend exec tsc --noEmit
   pnpm --filter @agenticverdict/frontend test
   ```
4. **Document failure** - create incident report with:
   - What broke
   - Root cause
   - Fix required before retry
5. **Fix and retry** - address root cause, then retry phase

**Emergency Rollback (Full Migration):**

If multiple phases cause cascading failures:

```bash
git reset --hard pre-feature-migration-baseline
```

**Note:** This is why we create a baseline tag before starting.

### 5.3 Testing Requirements Per Wave

| Phase           | Unit Tests       | Integration Tests | E2E Tests          | Manual QA            |
| --------------- | ---------------- | ----------------- | ------------------ | -------------------- |
| Phase 1 (Auth)  | All auth tests   | Auth flow tests   | Login/register E2E | Full auth flow       |
| Phase 2 (Shell) | Shell hook tests | Navigation tests  | Navigation E2E     | RTL, theme, language |
| Phase 3 (Core)  | Core unit tests  | Tenant resolution | Tenant switch E2E  | Multi-tenant flows   |
| Phase 4 (RBAC)  | RBAC hook tests  | Permission tests  | Access control E2E | Role-based UI        |
| Phase 5 (i18n)  | i18n unit tests  | Locale switching  | Locale E2E         | All 3 locales        |

---

## 6. Enforcement Mechanisms

### 6.1 ESLint Import Boundary Rules

Add to `apps/frontend/eslint.config.js`:

```typescript
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Components cannot import features (except shell, rbac)
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/features/auth/*",
                "@/features/dashboard/*",
                "@/features/connectors/*",
                "@/features/onboarding/*",
              ],
              message:
                "Components should not import feature modules directly. Use lib/ or stores/ instead. Exception: features/shell and features/rbac (after reclassification).",
            },
          ],
        },
      ],

      // Lib cannot import features or components
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/lib",
              from: "./src/features",
              message: "lib/ cannot import from features/",
            },
            {
              target: "./src/lib",
              from: "./src/components",
              message: "lib/ cannot import from components/",
            },
          ],
        },
      ],

      // Features cannot import other features (except rbac, shell)
      "import/no-internal-modules": [
        "error",
        {
          allow: ["@/features/rbac/*", "@/features/shell/*"],
        },
      ],
    },
  },
]);
```

### 6.2 CI Checks

Add to `.github/workflows/ci.yml`:

```yaml
- name: Check feature boundaries
  run: |
    pnpm --filter @agenticverdict/frontend exec madge --circular src/
    pnpm --filter @agenticverdict/frontend run lint

- name: Verify feature encapsulation
  run: |
    # Check that no feature code exists in shared directories
    ! find apps/frontend/src/lib/auth -type f | grep -q . && echo "✓ lib/auth/ is empty" || (echo "✗ lib/auth/ should be empty" && exit 1)
    ! find apps/frontend/src/components/layout -type f | grep -q . && echo "✓ components/layout/ is empty" || (echo "✗ components/layout/ should be empty" && exit 1)
```

### 6.3 PR Review Checklist

Add to `.github/pull_request_template.md`:

```markdown
## Feature Boundary Checklist

- [ ] No new files added to `lib/auth/`, `lib/tenant/`, `components/layout/`
- [ ] All new feature code placed in `features/<feature-name>/`
- [ ] No cross-feature imports (except rbac, shell)
- [ ] Import paths follow canonical structure
- [ ] Typecheck passes: `pnpm --filter @agenticverdict/frontend exec tsc --noEmit`
- [ ] Lint passes: `pnpm --filter @agenticverdict/frontend run lint`
```

---

## 7. Success Criteria

### 7.1 Measurable Definition of "100% Feature-Based"

The migration is complete when:

1. **Zero violations in shared directories:**
   - `lib/auth/` is empty or removed
   - `components/layout/` is empty or removed
   - `hooks/` contains only truly shared hooks (none feature-specific)
   - `providers/` is empty or removed
   - `stores/` contains only truly shared stores (auth-store moved to feature)

2. **All features follow canonical structure:**
   - Every feature has: `api/`, `model/`, `hooks/`, `ui/`, `pages/`
   - Route guards in `features/<feature>/route-guards/`
   - State stores in `features/<feature>/model/state/`

3. **Import boundary rules enforced:**
   - ESLint rules blocking violations
   - CI checks failing on boundary violations
   - Zero lint warnings in migrated code

4. **Quality gates passing:**

   ```bash
   pnpm --filter @agenticverdict/frontend exec tsc --noEmit  # Zero errors
   pnpm --filter @agenticverdict/frontend run lint           # Zero warnings
   pnpm --filter @agenticverdict/frontend test               # 100% pass
   pnpm --filter @agenticverdict/frontend run i18n:validate  # Zero missing keys
   ```

5. **No regression in KPIs:**
   - Bundle size unchanged or improved
   - Build time unchanged or improved
   - Test coverage unchanged or improved
   - Zero new circular dependencies

### 7.2 Quality Gates

**Per-Phase Gates (must pass before merging):**

| Gate          | Command                  | Threshold            |
| ------------- | ------------------------ | -------------------- |
| Typecheck     | `tsc --noEmit`           | 0 errors             |
| Lint          | `eslint src/`            | 0 errors, 0 warnings |
| Unit Tests    | `vitest run`             | 100% pass            |
| i18n Validate | `pnpm run i18n:validate` | 0 missing keys       |
| Circular Deps | `madge --circular src/`  | 0 circular           |
| Build         | `pnpm run build`         | Success              |

**Post-Migration Gates (must pass for 2 sprints):**

| Gate              | Metric                | Threshold         |
| ----------------- | --------------------- | ----------------- |
| Route Regressions | E2E failures          | 0 critical        |
| Accessibility     | a11y violations       | 0 new critical    |
| Locale Parity     | Missing keys          | 0 across en/ar/fr |
| Tenant Safety     | Tenant context errors | 0                 |
| Performance       | Bundle size           | <5% increase      |

---

## 8. Execution Timeline

### Week 1: Preparation

- [ ] Create migration branch
- [ ] Capture baseline metrics
- [ ] Create release tag
- [ ] Notify team
- [ ] Set up monitoring dashboards

### Week 2: Phase 1 (Auth)

- [ ] Days 1-3: Execute auth consolidation
- [ ] Day 4: Validation and fixes
- [ ] Day 5: Merge to main, monitor

### Week 3: Phase 2 (Shell) + Phase 3 Start

- [ ] Days 1-2: Execute shell consolidation
- [ ] Days 3-5: Start core promotion (tenant)

### Week 4: Phase 3 Completion + Phase 4-5

- [ ] Days 1-2: Complete core promotion (storage, errors)
- [ ] Day 3: RBAC reclassification
- [ ] Days 4-5: i18n consolidation

### Week 5: Hardening

- [ ] Run full test suite
- [ ] Performance benchmarking
- [ ] Documentation updates
- [ ] Team training on new structure

---

## 9. Ownership Model

| Role                        | Responsibility                        | Name |
| --------------------------- | ------------------------------------- | ---- |
| Frontend Architecture Owner | Approve boundaries, exceptions        | TBD  |
| Migration Lead              | Execute migration, coordinate phases  | TBD  |
| QA Lead                     | Own integration/E2E reliability       | TBD  |
| Accessibility Reviewer      | Sign off on a11y parity               | TBD  |
| Localization Reviewer       | Sign off on locale parity             | TBD  |
| Security Reviewer           | Tenant-safety, auth/guard risk review | TBD  |

---

## 10. Appendix

### 10.1 Files Correctly Placed (Reference Patterns)

These demonstrate proper feature encapsulation:

| Feature        | Well-Encapsulated Files                                         |
| -------------- | --------------------------------------------------------------- |
| **connectors** | All API, hooks, pages in `features/connectors/`                 |
| **rbac**       | All hooks in `features/rbac/hooks/` (until reclassification)    |
| **dashboard**  | Most model, hooks, pages, route-guards in `features/dashboard/` |
| **onboarding** | Model and pages in `features/onboarding/`                       |
| **home**       | UI components in `features/home/ui/`                            |

### 10.2 Validation Commands

```bash
# Typecheck
pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false

# Lint
pnpm --filter @agenticverdict/frontend run lint

# Unit tests
pnpm --filter @agenticverdict/frontend test

# i18n validation
pnpm --filter @agenticverdict/frontend run i18n:validate

# Circular dependency check
pnpm --filter @agenticverdict/frontend exec madge --circular src/

# Build
pnpm --filter @agenticverdict/frontend build

# E2E smoke test
pnpm run test:e2e:frontend:smoke
```

### 10.3 Related Documentation

- `/docs/05-reference/frontend-ui-architecture-guidelines.md`
- `/docs/05-reference/frontend-ui-architecture-guidelines-checklist.md`
- `/design-system/README.md`
- `/docs/05-reference/frontend-development-guidelines.md`
- `/AGENTS.md` (Frontend section)

---

**End of Document**
