# Localization System Audit & i18n Package Migration Plan

## 1. Audit Findings

### 1.1 Key Inventory

| Source   | File                                | Format            | Key Count |
| -------- | ----------------------------------- | ----------------- | --------- |
| Frontend | `apps/frontend/messages/en.json`    | Nested objects    | 883       |
| Frontend | `apps/frontend/messages/ar.json`    | Nested objects    | 883       |
| Frontend | `apps/frontend/messages/fr.json`    | Nested objects    | 867       |
| Shared   | `packages/i18n/src/locales/en.json` | Flat dot-notation | 419       |
| Shared   | `packages/i18n/src/locales/ar.json` | Flat dot-notation | 371       |
| Shared   | `packages/i18n/src/locales/fr.json` | Flat dot-notation | 308       |
| Shared   | `packages/i18n/src/locales/es.json` | Flat dot-notation | 364       |
| Shared   | `packages/i18n/src/locales/zh.json` | Flat dot-notation | 308       |

### 1.2 Frontend Namespaces (18 total)

`common`, `navigation`, `actions`, `forms`, `Validation`, `errors`, `accessibility`, `Layout`, `Home`, `auth`, `admin`, `dashboard`, `connectors`, `insights`, `reports`, `onboarding`, `components`, `settings`

### 1.3 Shared Package Prefixes (20 total)

`accessibility`, `actions`, `agency`, `async`, `auditTrail`, `auth`, `common`, `connectorStatus`, `dashboard`, `domain`, `domains`, `download`, `errors`, `home`, `insights`, `language`, `navigation`, `report`, `reports`, `toolbar`, `validation`

### 1.4 Structural Incompatibility

- **Frontend**: Nested JSON objects — `useTranslations("auth")` + `t("login.title")` resolves via `getNested()` traversing `{ auth: { login: { title: "..." } } }`
- **Shared package**: Flat dot-notation keys — `{ "auth.login.title": "..." }`
- The frontend's `react.tsx` splits keys by `.` and traverses nested objects; flat keys from the shared package would not resolve correctly without conversion

### 1.5 Frontend Code References to Local Messages

| File                                            | Reference Type                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `src/i18n/i18n.ts:27`                           | Dynamic `import('../../messages/${locale}.json')`                  |
| `src/components/errors/AppRouteError.tsx:11-13` | Static imports of `../../../messages/{ar,en,fr}.json`              |
| `package.json:22-23`                            | Scripts `i18n:extract` and `i18n:validate` reference message files |
| `README.md:322`                                 | Documentation reference                                            |

### 1.6 Usage Patterns in Frontend Code

The frontend uses `useTranslations(namespace)` with these namespaces:

- `common`, `navigation`, `auth`, `connectors`, `insights`, `reports`, `dashboard`, `Home`, `Layout`, `errors`, `actions`, `onboarding`, `admin`
- Component-scoped: `components.inheritanceIndicator`, `components.domainMapper`, `settings.domainMapper`

All calls follow the pattern: `const t = useTranslations("namespace"); t("nested.key")`

## 2. Gap Analysis

### 2.1 Namespaces Exclusive to Frontend (not in shared package)

| Namespace    | Key Count         | Description                                                                                                          |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `connectors` | ~200              | Full connector CRUD (list, add, configure, detail, remove, platforms, metrics, status, frequency, freshness, alerts) |
| `onboarding` | 12                | Welcome flow steps                                                                                                   |
| `admin`      | 6                 | Feature flags page                                                                                                   |
| `forms`      | 11                | Form field labels and validation                                                                                     |
| `Validation` | 6                 | Demo request form validation                                                                                         |
| `Layout`     | 24                | Shell navigation, command palette, theme toggle                                                                      |
| `Home`       | 18                | Home page content, table samples, pluralization                                                                      |
| `components` | 0 (empty objects) | Placeholder namespaces for 13 components                                                                             |
| `settings`   | 0 (empty objects) | Placeholder namespaces for 5 settings pages                                                                          |

### 2.2 Namespaces Exclusive to Shared Package (not in frontend)

| Prefix       | Key Count | Description                                                            |
| ------------ | --------- | ---------------------------------------------------------------------- |
| `report`     | ~45       | Report template/generation strings (PDF/Excel)                         |
| `auditTrail` | ~10       | Audit trail event labels                                               |
| `download`   | ~7        | Download notification strings                                          |
| `agency`     | ~3        | Agency dashboard KPIs (also in frontend under `dashboard.agency`)      |
| `domain`     | ~6        | Domain-specific KPI labels (also in frontend under `dashboard.domain`) |
| `language`   | 5         | Language selector labels                                               |

### 2.3 Overlapping Namespaces (different key structures)

| Namespace       | Frontend Keys | Shared Keys | Notes                                                                                                           |
| --------------- | ------------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| `auth`          | ~120          | ~30         | Frontend has full login/register/forgot/reset/verify/password/legal/help/seo; shared has minimal login + errors |
| `insights`      | ~100          | ~80         | Frontend has list/create/detail/edit/templates; shared has list + wizard + detail + errors                      |
| `reports`       | ~50           | ~30         | Frontend has list/status/formats/viewer/notifications; shared has list + viewer + share                         |
| `dashboard`     | ~70           | ~15         | Frontend has full home/domain/agency/widgets/customize; shared has insights sub-keys only                       |
| `errors`        | ~30           | ~10         | Frontend has network/auth/server/rateLimit/common; shared has reports + common                                  |
| `common`        | ~27           | ~15         | Significant overlap with different values                                                                       |
| `navigation`    | 11            | 2           | Frontend has full nav; shared only insights + reports                                                           |
| `actions`       | 13            | 2           | Frontend has full action set; shared only retry + refresh                                                       |
| `accessibility` | 10            | 1           | Frontend has full a11y labels; shared only skipToContent                                                        |

### 2.4 Key Mapping Table (overlapping namespaces, frontend → shared)

| Frontend Key Path                   | Shared Key Path                     | Action                                                        |
| ----------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `auth.login.title`                  | `auth.login.title`                  | **Conflict** — different values; use frontend (more complete) |
| `auth.login.description`            | `auth.login.description`            | **Conflict** — use frontend                                   |
| `auth.errors.invalidCredentials`    | `auth.errors.invalidCredentials`    | **Match** — same value                                        |
| `insights.list.title`               | `insights.list.title`               | **Conflict** — use frontend                                   |
| `dashboard.insights.body.default`   | `dashboard.insights.body.default`   | **Match**                                                     |
| `dashboard.insights.relativeTime.*` | `dashboard.insights.relativeTime.*` | **Match** (5 keys)                                            |
| `common.cancel`                     | `common.cancel`                     | **Match**                                                     |
| `common.retry`                      | `actions.retry`                     | **Different path** — consolidate under `common`               |
| `errors.somethingWentWrong`         | `errors.generic`                    | **Different path** — keep frontend path                       |

## 3. Migration Strategy

### 3.1 Approach: Nested Format in Shared Package

Convert the shared package locale files from flat dot-notation to nested objects. This preserves the frontend's existing `useTranslations(namespace)` + `t("nested.key")` pattern without requiring changes to any component call sites.

### 3.2 Consolidation Rules

1. **Frontend wins** — for overlapping keys with different values, the frontend version is authoritative (more complete and actively used)
2. **Shared-only keys preserved** — keys like `report.*`, `auditTrail.*`, `download.*` are merged into the consolidated files
3. **Empty namespaces removed** — `components` and `settings` placeholder objects with no children are dropped
4. **All 5 locales** — `en`, `ar`, `fr`, `es`, `zh` receive the full consolidated key set; `es` and `zh` will have English fallback values for new keys (to be translated later)

## 4. Step-by-Step Migration Procedure

### Step 1: Consolidate locale files into shared package

**Files to modify:**

- `packages/i18n/src/locales/en.json` — merge all frontend keys (nested format) + existing shared keys
- `packages/i18n/src/locales/ar.json` — same for Arabic
- `packages/i18n/src/locales/fr.json` — same for French
- `packages/i18n/src/locales/es.json` — English fallback for new keys + existing Spanish
- `packages/i18n/src/locales/zh.json` — English fallback for new keys + existing Chinese

**Transformation:** Convert flat keys to nested objects. Example:

```
// Before (flat)
{ "auth.login.title": "Sign in to your account" }

// After (nested)
{ "auth": { "login": { "title": "Sign in to your account" } } }
```

### Step 2: Add `/locales` export to shared package

**File:** `packages/i18n/package.json`

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./formatters": "./src/formatters.ts",
    "./locales": "./src/locales/index.ts"
  }
}
```

**New file:** `packages/i18n/src/locales/index.ts`

```typescript
export { default as en } from "./en.json";
export { default as ar } from "./ar.json";
export { default as fr } from "./fr.json";
export { default as es } from "./es.json";
export { default as zh } from "./zh.json";
```

### Step 3: Update frontend `loadMessages` to consume shared package

**File:** `apps/frontend/src/i18n/i18n.ts`

Replace the dynamic local import with a synchronous lookup from the shared package:

```typescript
import { en, ar, fr, es, zh } from "@agenticverdict/i18n/locales";

const localeMessages: Record<string, Record<string, unknown>> = { en, ar, fr, es, zh };

export async function loadMessages(locale: LocaleCode): Promise<Record<string, unknown>> {
  return localeMessages[locale] ?? localeMessages[defaultLocale] ?? {};
}
```

### Step 4: Update `AppRouteError` to use shared package

**File:** `apps/frontend/src/components/errors/AppRouteError.tsx`

Replace local imports:

```typescript
// Before
import arMessages from "../../../messages/ar.json";
import enMessages from "../../../messages/en.json";
import frMessages from "../../../messages/fr.json";

// After
import { ar as arMessages, en as enMessages, fr as frMessages } from "@agenticverdict/i18n/locales";
```

### Step 5: Remove local message files and directory

**Delete:**

- `apps/frontend/messages/en.json`
- `apps/frontend/messages/ar.json`
- `apps/frontend/messages/fr.json`
- `apps/frontend/messages/` (directory)

### Step 6: Clean up references

- Remove `i18n:extract` and `i18n:validate` scripts from `apps/frontend/package.json` if they reference the deleted directory
- Update `apps/frontend/README.md` line 322 to reference the shared package location

### Step 7: Update `load-messages.ts` in shared package (if needed)

The existing `loadMessagesSync` reads from the filesystem. Since locale files are now JSON in the source directory, this should continue to work. Verify after migration.

## 5. Verification Checklist

### 5.1 Build & Type Checks

- [ ] `pnpm run typecheck` passes for all packages
- [ ] `pnpm run lint` passes for all packages
- [ ] `packages/i18n` builds successfully

### 5.2 Runtime Verification

- [ ] Frontend dev server starts without errors
- [ ] All locales (`/en`, `/ar`, `/fr`) load without missing keys
- [ ] `useTranslations("auth")` + `t("login.title")` resolves correctly
- [ ] `useTranslations("connectors")` resolves correctly (previously frontend-only)
- [ ] `useTranslations("onboarding")` resolves correctly (previously frontend-only)
- [ ] `AppRouteError` fallback messages work for all 3 supported locales
- [ ] Notification translations (`notifications-i18n.ts`) still work

### 5.3 Key Completeness

- [ ] All 883 English keys from frontend are present in shared `en.json`
- [ ] All 883 Arabic keys from frontend are present in shared `ar.json`
- [ ] All 867 French keys from frontend are present in shared `fr.json`
- [ ] Shared-only keys (`report.*`, `auditTrail.*`, `download.*`) preserved
- [ ] No keys resolve to their raw key path (indicating missing translation)

### 5.4 Cleanup Verification

- [ ] `apps/frontend/messages/` directory no longer exists
- [ ] No remaining imports of `../../../messages/` in frontend code
- [ ] No remaining references to `apps/frontend/messages/` in scripts or docs

## 6. Acceptance Criteria

1. All user-facing strings from `apps/frontend/messages/en.json` are preserved in `packages/i18n/src/locales/en.json`
2. Frontend consumes locale files exclusively from `@agenticverdict/i18n/locales`
3. No local message files remain in `apps/frontend/messages/`
4. All existing `useTranslations()` call sites work without modification
5. `es.json` and `zh.json` in the shared package contain the full key set (with English fallback for untranslated keys)
6. Type checking, linting, and the frontend dev server all pass
