# Implementation Plan: Consolidate `/apps/frontend/src/i18n` into `/packages/i18n`

## Current State Analysis

### `/packages/i18n` (Single Source of Truth Target)

Already provides:

- **Locale definitions**: `APP_LOCALES = ["en", "ar", "es", "fr", "zh"]` as const, `AppLocale` type
- **Message loading**: `loadMessagesSync()`, `resolveLocaleOrFallback()`, `MessageDictionary` type, message flattening
- **Language detection**: `detectPreferredAppLocale()` (Accept-Language header), `appLocaleFromLanguageTag()`, `normalizeToAppLocale()`
- **RTL support**: `isRtlLocale()`, `textDirection()`, `TextDirection` type
- **Formatters**: `createLocalizationFormatters()` (date, currency, number, plural), `intlLocaleTag()`, `LANGUAGE_NATIVE_NAMES`
- **I18nManager**: Class with locale switching, message lookup (`t()`), direction override
- **Quality tools**: Translation parity checks, BLEU scoring, locale quality analysis
- **Locale exports**: `en`, `ar`, `fr`, `es`, `zh` JSON re-exports

### `/apps/frontend/src/i18n/i18n.ts` (To Be Refactored)

Currently duplicates/re-implements:

- `loadMessages()` — async wrapper around static import map (packages/i18n has sync `loadMessagesSync()`)
- `detectLocale()` — browser-language detection with `getPreferredLocale()` from core (packages/i18n has `detectPreferredAppLocale()` for server/Accept-Language)
- `formatDate()`, `formatNumber()`, `formatCurrency()` — standalone functions (packages/i18n has `createLocalizationFormatters()` factory)
- Re-exports: `defaultLocale`, `getDirection`, `getLocaleName`, `supportedLocales`

### `/apps/frontend/src/i18n/locales.ts` (To Be Refactored)

Currently duplicates:

- `defaultLocale`, `supportedLocales`, `draftLocales` — from `locales.config.json`
- `localeMeta` — hardcoded metadata (currency, direction, intlLocale) per locale
- `isSupportedLocale()`, `isConfiguredLocale()` — type guards
- `getDirection()`, `getLocaleName()` — metadata lookups
- `parseLocaleFromPathname()` — Next.js route parsing helper

### `/apps/frontend/src/i18n/locales.config.json` (To Be Migrated)

App-specific configuration:

- `defaultLocale: "en"`
- `shippingLocales: ["en", "ar", "fr"]` (subset of `APP_LOCALES`)
- `draftLocales: []`
- `metadata` — per-locale: name, direction, currency, currencySymbol, currencySymbolPosition, intlLocale

---

## Design Principles

1. **Packages/i18n is the single source of truth** for all locale definitions, metadata, and core logic
2. **Frontend owns only framework-specific glue** (next-intl integration, route parsing, browser detection)
3. **No duplication** — frontend imports everything from `@agenticverdict/i18n`
4. **Tenant-aware formatting** — packages/i18n formatters accept region/timezone/currency from tenant config
5. **Browser vs server detection** — packages/i18n provides server-side `detectPreferredAppLocale()`; frontend adds browser-side `detectPreferredBrowserLocale()`

---

## Phase 1: Extend `/packages/i18n` with Missing Capabilities

### 1.1 Add Browser-Side Language Detection

**File**: `packages/i18n/src/language-detection.ts`

Add a new export:

```typescript
/**
 * Detects preferred locale from browser `navigator.languages` with optional persisted preference.
 * Works in browser contexts only; returns fallback in SSR.
 */
export function detectPreferredBrowserLocale(
  getPreferredLocale: () => string | null,
  fallback: AppLocale,
): AppLocale;
```

- Accepts a `getPreferredLocale` callback (dependency-injected to avoid coupling to `@agenticverdict/core`)
- Reads `navigator.languages`, maps each to `AppLocale` via `appLocaleFromLanguageTag()`
- Falls back to persisted preference, then to `fallback`

### 1.2 Add Locale Metadata Registry

**File**: `packages/i18n/src/formatters.ts` (new section) or `packages/i18n/src/locale-metadata.ts`

Move `locales.config.json` metadata into a typed registry:

```typescript
export type LocaleDisplayMetadata = {
  name: string; // Native name (e.g. "العربية")
  currency: string; // ISO 4217 (e.g. "SAR")
  currencySymbol: string; // Display symbol (e.g. "ر.س")
  currencySymbolPosition: "before" | "after";
};

export const LOCALE_DISPLAY_METADATA: Record<AppLocale, LocaleDisplayMetadata> = {
  en: { name: "English", currency: "USD", currencySymbol: "$", currencySymbolPosition: "before" },
  ar: { name: "العربية", currency: "SAR", currencySymbol: "ر.س", currencySymbolPosition: "after" },
  fr: { name: "Français", currency: "EUR", currencySymbol: "€", currencySymbolPosition: "after" },
  es: { name: "Español", currency: "EUR", currencySymbol: "€", currencySymbolPosition: "after" },
  zh: { name: "中文", currency: "CNY", currencySymbol: "¥", currencySymbolPosition: "before" },
};
```

Add helper:

```typescript
export function getLocaleDisplayName(locale: AppLocale): string {
  return LOCALE_DISPLAY_METADATA[locale]?.name ?? locale;
}
```

### 1.3 Add Default Locale and Shipping/Draft Concepts

**File**: `packages/i18n/src/index.ts` (new exports)

```typescript
export const DEFAULT_APP_LOCALE: AppLocale = "en";

/**
 * Subsets of APP_LOCALES for deployment gating.
 * Shipping = production-ready; Draft = in translation, not yet exposed to users.
 */
export type LocaleShippingStatus = "shipping" | "draft";
```

**Note**: The actual `shippingLocales` / `draftLocales` arrays remain app-configurable (see Phase 2), but packages/i18n provides the type and default.

### 1.4 Export `flattenMessages` for Framework Adapters

**File**: `packages/i18n/src/load-messages.ts`

Export the existing `flattenMessages()` function (currently internal) so next-intl adapters can preprocess nested JSON:

```typescript
export { flattenMessages };
```

### 1.5 Update Package Exports

**File**: `packages/i18n/package.json`

Add new export paths:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./formatters": "./src/formatters.ts",
    "./locales": "./src/locales/index.ts",
    "./language-detection": "./src/language-detection.ts",
    "./load-messages": "./src/load-messages.ts",
    "./rtl": "./src/rtl.ts"
  }
}
```

---

## Phase 2: Refactor Frontend to Use Packages/i18n

### 2.1 Replace `/apps/frontend/src/i18n/locales.ts`

**Before** (47 lines, duplicative):

- Reads `locales.config.json`, defines `LocaleMeta`, `localeMeta`, type guards, helpers

**After** (~15 lines, thin adapter):

```typescript
import {
  APP_LOCALES,
  type AppLocale as BaseAppLocale,
  DEFAULT_APP_LOCALE,
  LOCALE_DISPLAY_METADATA,
  intlLocaleTag,
} from "@agenticverdict/i18n/formatters";
import { textDirection, type TextDirection } from "@agenticverdict/i18n/rtl";

// App-specific shipping configuration (can be env-driven in future)
export const shippingLocales = ["en", "ar", "fr"] as const;
export const draftLocales = [] as const;

export type AppLocale = (typeof shippingLocales)[number];
export type LocaleCode = AppLocale; // Draft is empty; simplify

export const defaultLocale: AppLocale = DEFAULT_APP_LOCALE;

export function isSupportedLocale(value: string): value is AppLocale {
  return (shippingLocales as readonly string[]).includes(value as AppLocale);
}

// Re-export package helpers with app types
export function getDirection(locale: LocaleCode): TextDirection {
  return textDirection(locale);
}

export function getLocaleName(locale: LocaleCode): string {
  return LOCALE_DISPLAY_METADATA[locale]?.name ?? locale;
}

// Keep: Next.js-specific route parsing (framework glue, not package concern)
export function parseLocaleFromPathname(pathname: string): AppLocale {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isSupportedLocale(segment)) {
    return segment as AppLocale;
  }
  return defaultLocale;
}
```

### 2.2 Replace `/apps/frontend/src/i18n/i18n.ts`

**Before** (99 lines, duplicative):

- `loadMessages()` — static import map
- `detectLocale()` — browser detection
- `formatDate()`, `formatNumber()`, `formatCurrency()` — standalone

**After** (~30 lines, re-exports + thin wrappers):

```typescript
import {
  detectPreferredBrowserLocale,
  normalizeToAppLocale,
} from "@agenticverdict/i18n/language-detection";
import {
  createLocalizationFormatters,
  type AppLocale as BaseAppLocale,
} from "@agenticverdict/i18n/formatters";
import { loadMessagesSync, resolveLocaleOrFallback } from "@agenticverdict/i18n/load-messages";
import { getPreferredLocale } from "@agenticverdict/core/storage/locale-storage";
import { defaultLocale, supportedLocales, type LocaleCode } from "./locales";

// Re-exports from package
export { defaultLocale, getDirection, getLocaleName, supportedLocales } from "./locales";
export { textDirection, type TextDirection } from "@agenticverdict/i18n/rtl";
export { flattenMessages, type MessageDictionary } from "@agenticverdict/i18n/load-messages";
export { LANGUAGE_NATIVE_NAMES, intlLocaleTag } from "@agenticverdict/i18n/formatters";

/**
 * Detect user's preferred language (browser context).
 * Delegates to packages/i18n with persisted-locale callback.
 */
export function detectLocale(): LocaleCode {
  if (typeof window === "undefined") {
    return defaultLocale;
  }
  const detected = detectPreferredBrowserLocale(getPreferredLocale, defaultLocale as BaseAppLocale);
  return normalizeToAppLocale(detected, defaultLocale as BaseAppLocale) as LocaleCode;
}

/**
 * Load messages for a locale (sync, from package cache).
 * For next-intl, use the framework's message provider instead.
 */
export function loadMessages(locale: LocaleCode) {
  return loadMessagesSync(locale as BaseAppLocale);
}

/**
 * Create formatters bound to a locale and tenant localization config.
 * Usage: const formatters = createFormatters("ar", tenant.localization);
 */
export { createLocalizationFormatters };
```

### 2.3 Delete `/apps/frontend/src/i18n/locales.config.json`

All metadata now lives in `packages/i18n/src/formatters.ts` as `LOCALE_DISPLAY_METADATA`.

### 2.4 Update Frontend Import Sites

Search and replace across `apps/frontend/src/`:

- `from "./locales"` → keep (thin adapter still exists)
- `from "./i18n"` → keep (thin adapter still exists)
- Any direct imports of `localeMeta` → use `LOCALE_DISPLAY_METADATA` from `@agenticverdict/i18n/formatters`
- Any direct imports of `formatDate`/`formatNumber`/`formatCurrency` → use `createLocalizationFormatters(locale, tenant.localization)` and call methods on the returned object

---

## Phase 3: Update Other Consumers

### 3.1 Report Generator (`packages/report-generator`)

- Already imports from `@agenticverdict/i18n` — verify no breakage
- If it uses `resolveReportTextDirection`, confirm it still works with updated exports

### 3.2 API/Worker Apps

- If they import locale detection, update to use `detectPreferredAppLocale()` (Accept-Language) or `normalizeToAppLocale()`
- Remove any ad-hoc locale parsing logic

### 3.3 Desktop App (`apps/desktop`)

- If it has its own i18n setup, align it to use `@agenticverdict/i18n`

---

## Phase 4: Testing & Validation

### 4.1 Package Tests

- Add test for `detectPreferredBrowserLocale()` in `packages/i18n/src/language-detection.test.ts`
- Add test for `LOCALE_DISPLAY_METADATA` completeness (all `APP_LOCALES` have entries)
- Verify existing tests pass: `cd packages/i18n && pnpm test`

### 4.2 Frontend Integration Tests

- Verify locale switching works in browser
- Verify RTL layout for Arabic
- Verify currency/date formatting with tenant config
- Run: `cd apps/frontend && pnpm test`

### 4.3 Type Checking

- `pnpm run typecheck` — ensure no type errors across monorepo
- Verify `AppLocale` type narrowing works correctly at app boundaries

### 4.4 Linting

- `pnpm run lint` — ensure no lint errors

---

## Phase 5: Cleanup & Documentation

### 5.1 Remove Dead Code

- Delete any unused imports in frontend that referenced old `localeMeta` structure
- Remove `locales.config.json` from frontend build pipeline if referenced

### 5.2 Update Package README

- Document the single-source-of-truth contract
- Document which exports are for framework glue vs. core logic

### 5.3 Update AGENTS.md (Optional)

- Add note: "All i18n logic lives in `/packages/i18n`; apps import from `@agenticverdict/i18n`"

---

## Dependency Graph

```
packages/i18n/src/formatters.ts          ← source of truth for APP_LOCALES, metadata, formatters
packages/i18n/src/language-detection.ts  ← browser + server detection
packages/i18n/src/load-messages.ts       ← message loading + flattening
packages/i18n/src/rtl.ts                 ← RTL detection
packages/i18n/src/i18n-manager.ts        ← stateful manager (workers/CLI)
         ↓
apps/frontend/src/i18n/locales.ts        ← thin adapter: shippingLocales, parseLocaleFromPathname
apps/frontend/src/i18n/i18n.ts           ← thin adapter: detectLocale, re-exports
         ↓
apps/frontend components/pages           ← import from ./i18n or directly from @agenticverdict/i18n
```

---

## Risks & Mitigations

| Risk                                                                           | Mitigation                                                                                 |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `AppLocale` type mismatch between package and frontend                         | Frontend adapter narrows `BaseAppLocale` to app-specific `AppLocale` via `as const` arrays |
| `locales.config.json` referenced in build scripts                              | Search for references before deletion; update webpack/vite configs if needed               |
| `createLocalizationFormatters` requires tenant config not available everywhere | Make tenant config optional with sensible defaults, or use React context for propagation   |
| Breaking changes for other packages importing from `@agenticverdict/i18n`      | All existing exports are preserved; new exports are additive                               |

---

## Estimated Effort

- **Phase 1** (extend packages/i18n): 2-3 hours
- **Phase 2** (refactor frontend): 2-3 hours
- **Phase 3** (update other consumers): 1-2 hours
- **Phase 4** (testing): 1-2 hours
- **Phase 5** (cleanup): 1 hour

**Total**: ~7-11 hours

---

## Success Criteria

1. `apps/frontend/src/i18n/i18n.ts` has zero duplicated logic — only re-exports and framework glue
2. `apps/frontend/src/i18n/locales.ts` has zero duplicated metadata — only app-specific shipping configuration
3. `apps/frontend/src/i18n/locales.config.json` is deleted
4. All packages/i18n tests pass
5. Frontend typecheck, lint, and tests pass
6. No other package imports from `apps/frontend/src/i18n`
