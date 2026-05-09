# Implementation Plan: Unified Entity Localization System

**Date:** 2026-05-10  
**Status:** Proposed  
**Scope:** Cross-package localization refactoring (database, api, frontend, types, i18n)

---

## Executive Summary

The current localization implementation is scattered across multiple packages with duplicated logic, inconsistent message formats, and no single source of truth. This plan proposes a unified `@agenticverdict/localization` package that centralizes all localization functionality while maintaining clear separation between UI messages (static, code-managed) and entity translations (dynamic, database-stored).

### Key Problems Addressed

| Problem                           | Current State                                 | Impact                                   |
| --------------------------------- | --------------------------------------------- | ---------------------------------------- |
| Duplicate locale resolution       | 3+ implementations across packages            | Inconsistent fallback behavior           |
| Duplicate Accept-Language parsing | Full RFC parser in i18n, naive 5-line in tRPC | Incorrect locale detection               |
| Two message formats               | Flat keys (i18n) vs nested objects (frontend) | API responses incompatible with frontend |
| Locale set mismatch               | i18n supports 5, frontend ships 3             | es/zh inaccessible in UI                 |
| Unused mixin pattern              | `translationsJsonb()` exists but never used   | Schema inconsistency                     |
| No tenant override persistence    | In-memory only, lost on restart               | Tenant customizations lost               |
| Single entity localized           | Only `insight_templates`                      | Other entities cannot be localized       |

---

## Architecture Overview

### Unified Localization Package Structure

```
packages/localization/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── types.ts                    # Shared locale types, interfaces
│   ├── config.ts                   # Single source of truth for locales
│   ├── negotiation.ts              # RFC 9110 Accept-Language parsing
│   ├── resolution.ts               # Unified fallback chain resolution
│   ├── validation.ts               # JSONB translation validation
│   ├── formatting.ts               # ICU message formatting, dates, numbers
│   ├── bidi.ts                     # RTL/BiDi utilities (moved from i18n)
│   ├── quality.ts                  # Translation parity, QA checks
│   ├── message-merge.ts            # Tenant override merging
│   ├── database/
│   │   ├── mixin.ts                # Drizzle JSONB column mixin
│   │   ├── resolver.ts             # SQL locale resolution helpers
│   │   └── seed.ts                 # Factory pattern for seed data
│   ├── api/
│   │   ├── middleware.ts           # tRPC/Express locale middleware
│   │   └── response.ts             # Locale-aware response wrapper
│   └── frontend/
│       ├── adapter.ts              # Message format bridge (flat ↔ nested)
│       ├── provider.tsx            # React context provider
│       └── hooks.ts                # useLocale, useTranslation hooks
├── messages/
│   ├── en.json                     # Source of truth (developer-authored)
│   ├── ar.json                     # Translated (TMS-managed)
│   └── fr.json                     # Translated (TMS-managed)
├── package.json
└── tsconfig.json
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  next-intl (UI messages)                                      │  │
│  │  - messages/{locale}.json (nested, component-scoped)          │  │
│  │  - TypeScript via AppConfig augmentation                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  @agenticverdict/localization (entity translations)           │  │
│  │  - useEntityTranslation() hook                                │  │
│  │  - Resolves from API response with fallback chain             │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    tRPC/REST with locale header
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                              API                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Locale Middleware (from @agenticverdict/localization/api)    │  │
│  │  1. ?locale= query param                                      │  │
│  │  2. Accept-Language header (RFC 9110 parser)                  │  │
│  │  3. User profile preference                                   │  │
│  │  4. Tenant default locale                                     │  │
│  │  5. Platform fallback (en)                                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Response Wrapper                                              │  │
│  │  { data, _locale: "ar", _fallbackChain: ["ar","en"],          │  │
│  │    _availableLocales: ["en","ar","fr"] }                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    Repository with locale param
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                          DATABASE                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  JSONB Columns (via Drizzle mixin)                            │  │
│  │  name_translations jsonb NOT NULL DEFAULT '{}'                │  │
│  │  description_translations jsonb NOT NULL DEFAULT '{}'         │  │
│  │  GIN index (jsonb_path_ops) for containment queries           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  i18n_strings table (tenant overrides)                        │  │
│  │  tenant_id, locale, message_key, message_value                │  │
│  │  UNIQUE(tenant_id, locale, message_key)                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation Package (Week 1)

**Goal:** Create `@agenticverdict/localization` as the single source of truth.

#### 1.1 Shared Locale Configuration

**File:** `packages/localization/src/config.ts`

```typescript
export const SUPPORTED_LOCALES = ["en", "ar", "fr"] as const;
export const EXTENDED_LOCALES = ["en", "ar", "es", "fr", "zh"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type ExtendedLocale = (typeof EXTENDED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const LOCALE_METADATA: Record<
  SupportedLocale,
  {
    name: string;
    direction: "ltr" | "rtl";
    flag: string;
  }
> = {
  en: { name: "English", direction: "ltr", flag: "🇺🇸" },
  ar: { name: "العربية", direction: "rtl", flag: "🇸🇦" },
  fr: { name: "Français", direction: "ltr", flag: "🇫🇷" },
};

export function isRtlLocale(locale: string): boolean {
  return ["ar", "he", "fa", "ur"].includes(locale);
}
```

**Migration:** Replace `APP_LOCALES` in `packages/i18n/src/formatters.ts` and `locales.config.json` in frontend with imports from this config.

#### 1.2 Unified Locale Negotiation

**File:** `packages/localization/src/negotiation.ts`

```typescript
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type SupportedLocale } from "./config";

interface LanguagePreference {
  locale: string;
  quality: number;
}

export function parseAcceptLanguage(header: string): LanguagePreference[] {
  return header
    .split(",")
    .map((segment) => {
      const [locale, ...params] = segment.trim().split(";");
      const qualityParam = params.find((p) => p.trim().startsWith("q="));
      const quality = qualityParam ? parseFloat(qualityParam.split("=")[1]) : 1.0;
      return { locale: locale.trim(), quality };
    })
    .filter((pref) => pref.quality > 0)
    .sort((a, b) => b.quality - a.quality);
}

export function negotiateLocale(
  acceptLanguage: string | null,
  supported: readonly string[] = SUPPORTED_LOCALES,
  fallback: string = DEFAULT_LOCALE,
): string {
  if (!acceptLanguage) return fallback;

  const preferences = parseAcceptLanguage(acceptLanguage);

  for (const pref of preferences) {
    // Exact match
    if (supported.includes(pref.locale)) return pref.locale;

    // Prefix match (e.g., "ar-SA" → "ar")
    const prefix = pref.locale.split("-")[0];
    if (supported.includes(prefix)) return prefix;

    // Wildcard match
    if (pref.locale === "*") return fallback;
  }

  return fallback;
}

export function buildFallbackChain(
  locale: string,
  supported: readonly string[] = SUPPORTED_LOCALES,
  fallback: string = DEFAULT_LOCALE,
): string[] {
  const chain = new Set<string>();

  // Add exact locale
  chain.add(locale);

  // Add parent locale (e.g., "ar-SA" → "ar")
  const parts = locale.split("-");
  if (parts.length > 1) {
    chain.add(parts[0]);
  }

  // Add explicit fallback
  chain.add(fallback);

  // Add all supported as final fallbacks
  for (const s of supported) {
    chain.add(s);
  }

  return Array.from(chain);
}
```

**Migration:** Replace `parseAcceptLanguage` in `packages/i18n/src/language-detection.ts` and `deriveLocale` in `apps/api/src/trpc/routers/insight-templates.ts`.

#### 1.3 Unified Translation Resolution

**File:** `packages/localization/src/resolution.ts`

```typescript
import { DEFAULT_LOCALE } from "./config";

export interface TranslationRecord {
  [locale: string]: string;
}

export interface TranslatableEntity {
  [field: string]: TranslationRecord | unknown;
}

export function resolveTranslation(
  translations: TranslationRecord | null | undefined,
  fallbackChain: string[],
): string {
  if (!translations || typeof translations !== "object") return "";

  for (const locale of fallbackChain) {
    const value = translations[locale];
    if (value && typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  return "";
}

export function resolveEntityField(
  entity: TranslatableEntity,
  fieldName: string,
  locale: string,
  fallbackChain?: string[],
): string {
  const translations = entity[`${fieldName}Translations`] as TranslationRecord | undefined;
  const chain = fallbackChain ?? [locale, DEFAULT_LOCALE];

  return resolveTranslation(translations, chain);
}

export function getAvailableLocales(translations: TranslationRecord | null | undefined): string[] {
  if (!translations) return [];
  return Object.entries(translations)
    .filter(([, value]) => typeof value === "string" && value.trim() !== "")
    .map(([key]) => key);
}
```

**Migration:** Replace `resolveLocale` in `packages/database/src/utils/localization.ts` and `resolveTemplateName`/`resolveTemplateDescription` in `apps/frontend/src/features/insights/services/template-service.ts`.

#### 1.4 Translation Validation

**File:** `packages/localization/src/validation.ts`

```typescript
import { SUPPORTED_LOCALES, type SupportedLocale } from "./config";
import type { TranslationRecord } from "./resolution";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateTranslations(
  translations: TranslationRecord | null | undefined,
  fieldName: string,
  requiredLocales: readonly string[] = SUPPORTED_LOCALES,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!translations || typeof translations !== "object") {
    errors.push(`${fieldName}: translations object is required`);
    return { valid: false, errors, warnings };
  }

  for (const [locale, value] of Object.entries(translations)) {
    if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
      warnings.push(`${fieldName}: unsupported locale "${locale}"`);
    }

    if (typeof value !== "string") {
      errors.push(`${fieldName}[${locale}]: value must be a string`);
    }
  }

  const missingLocales = requiredLocales.filter(
    (locale) => !translations[locale] || translations[locale].trim() === "",
  );

  if (missingLocales.length > 0) {
    warnings.push(`${fieldName}: missing translations for locales: ${missingLocales.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateEntityTranslations(
  entity: Record<string, unknown>,
  translatableFields: string[],
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (const field of translatableFields) {
    const translations = entity[`${field}Translations`] as TranslationRecord | undefined;
    const result = validateTranslations(translations, field);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
```

#### 1.5 Package Setup

**File:** `packages/localization/package.json`

```json
{
  "name": "@agenticverdict/localization",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./database": "./src/database/mixin.ts",
    "./api": "./src/api/middleware.ts",
    "./frontend": "./src/frontend/provider.tsx"
  },
  "dependencies": {
    "intl-messageformat": "^10.5.0"
  },
  "devDependencies": {
    "@agenticverdict/types": "workspace:*",
    "typescript": "^5.4.0"
  }
}
```

**File:** `packages/localization/src/index.ts`

```typescript
export {
  SUPPORTED_LOCALES,
  EXTENDED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_METADATA,
  isRtlLocale,
  type SupportedLocale,
  type ExtendedLocale,
} from "./config";

export { parseAcceptLanguage, negotiateLocale, buildFallbackChain } from "./negotiation";

export {
  resolveTranslation,
  resolveEntityField,
  getAvailableLocales,
  type TranslationRecord,
  type TranslatableEntity,
} from "./resolution";

export {
  validateTranslations,
  validateEntityTranslations,
  type ValidationResult,
} from "./validation";

export {
  createLocalizationFormatters,
  formatDate,
  formatNumber,
  formatCurrency,
} from "./formatting";
```

---

### Phase 2: Database Integration (Week 2)

**Goal:** Provide reusable database utilities for entity localization.

#### 2.1 Drizzle JSONB Mixin

**File:** `packages/localization/src/database/mixin.ts`

```typescript
import { jsonb } from "drizzle-orm/pg-core";
import type { TranslationRecord } from "../resolution";

export function translationsColumn(columnName: string = "translations") {
  return jsonb(columnName).$type<TranslationRecord>().notNull().default({});
}

export function makeTranslatable(tableName: string, fields: string[]) {
  return Object.fromEntries(
    fields.map((field) => [`${field}Translations`, translationsColumn(`${field}_translations`)]),
  );
}
```

**Migration:** Replace `translationsJsonb()` in `packages/database/src/schema/mixins/localizable.ts`.

#### 2.2 SQL Locale Resolution Helpers

**File:** `packages/localization/src/database/resolver.ts`

```typescript
import { sql, type SQL } from "drizzle-orm";

export function resolveLocaleColumn(column: SQL, locales: string[]): SQL<unknown> {
  const cases = locales
    .map((locale, i) => {
      const condition = sql`${column} ?? ${locale}`;
      const result = sql`${column}->>${locale}`;
      return i === 0
        ? sql`CASE WHEN ${condition} THEN ${result}`
        : sql`WHEN ${condition} THEN ${result}`;
    })
    .join(" ");

  return sql`${sql.raw(cases)} ELSE '' END`;
}

export function createGinIndex(tableName: string, columnName: string) {
  return sql`CREATE INDEX idx_${tableName}_${columnName}_gin ON ${sql.raw(tableName)} USING GIN (${sql.raw(columnName)} jsonb_path_ops)`;
}
```

#### 2.3 Seed Factory Pattern

**File:** `packages/localization/src/database/seed.ts`

```typescript
import type { TranslationRecord } from "../resolution";

export interface LocalizedSeedBlueprint {
  id: string;
  translations: Record<string, TranslationRecord>;
  metadata?: Record<string, unknown>;
}

export function createLocalizedSeed(blueprint: LocalizedSeedBlueprint): Record<string, unknown> {
  const entity: Record<string, unknown> = { id: blueprint.id };

  for (const [field, translations] of Object.entries(blueprint.translations)) {
    entity[`${field}Translations`] = translations;
  }

  if (blueprint.metadata) {
    Object.assign(entity, blueprint.metadata);
  }

  return entity;
}

export function createLocalizedSeedBatch(
  blueprints: LocalizedSeedBlueprint[],
): Record<string, unknown>[] {
  return blueprints.map(createLocalizedSeed);
}
```

**Migration:** Replace `InsightTemplateFactory` pattern with generic localized seed factory.

#### 2.4 Repository Pattern Update

**File:** `packages/database/src/repositories/base-localizable.repository.ts`

```typescript
import {
  buildFallbackChain,
  resolveTranslation,
  type TranslationRecord,
} from "@agenticverdict/localization";
import type { Database } from "../client";

export interface BaseLocalizableRepository {
  db: Database;
  resolveLocale(locale: string): string[];
  resolveField(translations: TranslationRecord | null, locale: string): string;
}

export abstract class BaseLocalizableRepositoryImpl implements BaseLocalizableRepository {
  constructor(
    public db: Database,
    private supportedLocales: readonly string[],
    private defaultLocale: string = "en",
  ) {}

  resolveLocale(locale: string): string[] {
    return buildFallbackChain(locale, this.supportedLocales, this.defaultLocale);
  }

  resolveField(translations: TranslationRecord | null, locale: string): string {
    const chain = this.resolveLocale(locale);
    return resolveTranslation(translations, chain);
  }
}
```

**Migration:** Update `insight-templates.repository.ts` to extend this base class.

---

### Phase 3: API Integration (Week 3)

**Goal:** Provide unified locale negotiation and response wrapping for API layer.

#### 3.1 tRPC Locale Middleware

**File:** `packages/localization/src/api/middleware.ts`

```typescript
import { negotiateLocale, buildFallbackChain, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "../index";
import type { Context } from "@agenticverdict/api";

export interface LocaleContext {
  locale: string;
  fallbackChain: string[];
  acceptLanguage: string | null;
}

export function deriveLocale(ctx: Context): LocaleContext {
  // Priority: query param > header > user preference > tenant default > platform fallback
  const explicitLocale = ctx.query?.locale as string | undefined;
  const acceptLanguage = ctx.headers?.["accept-language"] ?? null;
  const userLocale = ctx.user?.locale ?? null;
  const tenantLocale = ctx.tenant?.defaultLocale ?? null;

  const negotiated =
    explicitLocale ??
    (acceptLanguage ? negotiateLocale(acceptLanguage) : null) ??
    userLocale ??
    tenantLocale ??
    DEFAULT_LOCALE;

  return {
    locale: negotiated,
    fallbackChain: buildFallbackChain(negotiated),
    acceptLanguage,
  };
}

export function withLocale<T>(
  data: T,
  locale: string,
  availableLocales: string[],
): T & { _locale: string; _fallbackChain: string[]; _availableLocales: string[] } {
  return {
    ...data,
    _locale: locale,
    _fallbackChain: buildFallbackChain(locale),
    _availableLocales: availableLocales,
  };
}
```

**Migration:** Replace `deriveLocale()` in `apps/api/src/trpc/routers/insight-templates.ts`.

#### 3.2 Tenant Override Persistence

**File:** `packages/database/src/schema/i18n-strings.ts`

```typescript
import { pgTable, uuid, text, unique } from "drizzle-orm/pg-core";

export const i18nStrings = pgTable(
  "i18n_strings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    locale: text("locale").notNull(),
    messageKey: text("message_key").notNull(),
    messageValue: text("message_value").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueTenantLocaleKey: unique().on(table.tenantId, table.locale, table.messageKey),
  }),
);
```

**Migration:** Replace in-memory `translation-store.ts` with database-backed store.

#### 3.3 Translation Store Repository

**File:** `packages/database/src/repositories/i18n-strings.repository.ts`

```typescript
import { eq, and } from "drizzle-orm";
import { i18nStrings } from "../schema/i18n-strings";
import type { Database } from "../client";

export class I18nStringsRepository {
  constructor(private db: Database) {}

  async getOverrides(tenantId: string, locale: string): Promise<Record<string, string>> {
    const rows = await this.db
      .select({ key: i18nStrings.messageKey, value: i18nStrings.messageValue })
      .from(i18nStrings)
      .where(and(eq(i18nStrings.tenantId, tenantId), eq(i18nStrings.locale, locale)));

    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async setOverride(tenantId: string, locale: string, key: string, value: string): Promise<void> {
    await this.db
      .insert(i18nStrings)
      .values({ tenantId, locale, messageKey: key, messageValue: value })
      .onConflictDoUpdate({
        target: [i18nStrings.tenantId, i18nStrings.locale, i18nStrings.messageKey],
        set: { messageValue: value, updatedAt: new Date() },
      });
  }

  async deleteOverride(tenantId: string, locale: string, key: string): Promise<void> {
    await this.db
      .delete(i18nStrings)
      .where(
        and(
          eq(i18nStrings.tenantId, tenantId),
          eq(i18nStrings.locale, locale),
          eq(i18nStrings.messageKey, key),
        ),
      );
  }
}
```

---

### Phase 4: Frontend Integration (Week 4)

**Goal:** Bridge message formats and provide entity translation hooks.

#### 4.1 Message Format Adapter

**File:** `packages/localization/src/frontend/adapter.ts`

```typescript
/**
 * Bridges flat key→string messages (API/i18n package) with nested objects (frontend).
 *
 * Flat format: { "insights.templates.title": "Templates" }
 * Nested format: { insights: { templates: { title: "Templates" } } }
 */

export function flatToNested(flat: Record<string, string>): Record<string, unknown> {
  const nested: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let current = nested;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }

  return nested;
}

export function nestedToFlat(
  nested: Record<string, unknown>,
  prefix: string = "",
): Record<string, string> {
  const flat: Record<string, string> = {};

  for (const [key, value] of Object.entries(nested)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(flat, nestedToFlat(value as Record<string, unknown>, fullKey));
    } else {
      flat[fullKey] = String(value);
    }
  }

  return flat;
}

export function mergeWithOverrides(
  base: Record<string, string>,
  overrides: Record<string, string>,
): Record<string, string> {
  return { ...base, ...overrides };
}
```

#### 4.2 Entity Translation Hook

**File:** `packages/localization/src/frontend/hooks.ts`

```typescript
import { useState, useCallback } from "react";
import { resolveTranslation, buildFallbackChain, type TranslationRecord } from "../index";

export interface UseEntityTranslationOptions {
  locale: string;
  fallbackChain?: string[];
}

export function useEntityTranslation(
  translations: TranslationRecord | null | undefined,
  options: UseEntityTranslationOptions,
) {
  const { locale, fallbackChain } = options;
  const chain = fallbackChain ?? buildFallbackChain(locale);

  const resolve = useCallback(() => resolveTranslation(translations, chain), [translations, chain]);

  return {
    value: resolve(),
    locale,
    fallbackChain: chain,
    availableLocales: translations ? Object.keys(translations) : [],
  };
}
```

#### 4.3 React Provider

**File:** `packages/localization/src/frontend/provider.tsx`

```typescript
import { createContext, useContext, type ReactNode } from "react";
import { negotiateLocale, buildFallbackChain, SUPPORTED_LOCALES, DEFAULT_LOCALE } from "../index";

interface LocalizationContextValue {
  locale: string;
  fallbackChain: string[];
  supportedLocales: readonly string[];
  setLocale: (locale: string) => void;
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

export function LocalizationProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: string;
}) {
  const [locale, setLocale] = useState(initialLocale ?? DEFAULT_LOCALE);
  const fallbackChain = buildFallbackChain(locale);

  return (
    <LocalizationContext.Provider
      value={{ locale, fallbackChain, supportedLocales: SUPPORTED_LOCALES, setLocale }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextValue {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within LocalizationProvider");
  }
  return context;
}
```

---

### Phase 5: Migration & Cleanup (Week 5)

**Goal:** Migrate existing code to use the unified package and remove duplicates.

#### 5.1 Migration Steps

| Step | Action                                                        | Files Affected                                                                           |
| ---- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1    | Add `@agenticverdict/localization` dependency to all packages | All package.json files                                                                   |
| 2    | Replace `resolveLocale` in database repository                | `packages/database/src/repositories/insight-templates.repository.ts`                     |
| 3    | Replace `deriveLocale` in tRPC router                         | `apps/api/src/trpc/routers/insight-templates.ts`                                         |
| 4    | Replace `resolveTemplateName/Description` in frontend service | `apps/frontend/src/features/insights/services/template-service.ts`                       |
| 5    | Replace `translationsJsonb` mixin usage                       | `packages/database/src/schema/insight-templates.ts`                                      |
| 6    | Update `InsightTemplateFactory` to use generic seed factory   | `packages/database/src/factories/insight-template-factory.ts`                            |
| 7    | Create `i18n_strings` table in baseline schema                | `packages/database/scripts/baseline-schema.sql`                                          |
| 8    | Replace in-memory translation store with DB-backed            | `apps/api/src/services/translation-store.ts`                                             |
| 9    | Add message format adapter to frontend i18n                   | `apps/frontend/src/i18n/i18n.ts`                                                         |
| 10   | Remove duplicate utilities from old packages                  | `packages/database/src/utils/localization.ts`, `packages/i18n/src/language-detection.ts` |

#### 5.2 Deprecation Plan

| Old File                                             | Replacement                             | Action                       |
| ---------------------------------------------------- | --------------------------------------- | ---------------------------- |
| `packages/database/src/utils/localization.ts`        | `@agenticverdict/localization`          | Deprecate → Remove           |
| `packages/database/src/schema/mixins/localizable.ts` | `@agenticverdict/localization/database` | Deprecate → Remove           |
| `packages/i18n/src/language-detection.ts`            | `@agenticverdict/localization`          | Deprecate → Remove           |
| `packages/i18n/src/formatters.ts` (APP_LOCALES)      | `@agenticverdict/localization`          | Keep formatters, move config |
| `apps/api/src/services/translation-store.ts`         | DB-backed repository                    | Replace entirely             |

#### 5.3 Entity Migration Checklist

Apply localization to all entities that need it:

- [ ] `insight_templates` (already done, migrate to new mixin)
- [ ] `insights` (name, description)
- [ ] `reports` (title, description)
- [ ] `connectors` (name, description)
- [ ] `domains` (name, description)
- [ ] `tenants` (name, display_name)
- [ ] `ai_templates` (name, description, prompt_template)

---

### Phase 6: Testing & Validation (Week 6)

**Goal:** Ensure comprehensive test coverage and validation.

#### 6.1 Unit Tests

| Test File                                             | Coverage                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `packages/localization/src/negotiation.test.ts`       | Accept-Language parsing, locale negotiation, fallback chains       |
| `packages/localization/src/resolution.test.ts`        | Translation resolution, entity field resolution, available locales |
| `packages/localization/src/validation.test.ts`        | Translation validation, entity validation, error/warning reporting |
| `packages/localization/src/frontend/adapter.test.ts`  | Flat↔nested conversion, override merging                           |
| `packages/localization/src/database/resolver.test.ts` | SQL locale resolution, GIN index creation                          |

#### 6.2 Integration Tests

| Test File                                         | Coverage                              |
| ------------------------------------------------- | ------------------------------------- |
| `apps/api/tests/locale-negotiation.test.ts`       | Full tRPC locale negotiation flow     |
| `apps/api/tests/tenant-overrides.test.ts`         | DB-backed tenant override persistence |
| `apps/frontend/tests/entity-translation.test.tsx` | Entity translation hook behavior      |

#### 6.3 Validation Commands

```bash
# Type check all packages
pnpm run typecheck

# Lint all packages
pnpm run lint

# Run unit tests
pnpm run test:unit

# Run integration tests
pnpm run test:integration

# Validate translation parity
pnpm --filter @agenticverdict/localization run validate:translations
```

---

## Success Criteria

1. **Single Source of Truth:** All locale configuration, negotiation, and resolution logic lives in `@agenticverdict/localization`
2. **Zero Duplication:** No duplicate `resolveLocale`, `parseAcceptLanguage`, or fallback chain implementations
3. **Type Safety:** All localization operations are type-safe with shared `SupportedLocale` type
4. **Entity Agnostic:** Any entity can be localized using the mixin and repository patterns
5. **Tenant Overrides Persisted:** `i18n_strings` table stores tenant customizations durably
6. **Message Format Bridge:** API and frontend can exchange messages seamlessly
7. **Test Coverage:** >90% coverage on core localization utilities
8. **All Packages Pass:** `typecheck`, `lint`, and `test` commands pass across all packages

---

## Risk Mitigation

| Risk                                | Mitigation                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| Breaking changes during migration   | Use deprecation warnings before removal, maintain backward compatibility in Phase 5 |
| Performance impact of JSONB queries | Add GIN indexes, use generated columns for hot locales                              |
| Message format incompatibility      | Use adapter layer with comprehensive tests                                          |
| Tenant override data loss           | Migrate in-memory store to DB before removing old implementation                    |
| Locale set mismatch                 | Establish `SUPPORTED_LOCALES` as single source, validate at build time              |

---

## Appendix: Industry Standards Referenced

- **RFC 9110:** HTTP Content Negotiation (Accept-Language header parsing)
- **RFC 4647:** Matching of Language Tags (fallback chain construction)
- **ICU MessageFormat:** Unicode standard for localized message formatting
- **PostgreSQL JSONB:** Binary JSON type with GIN indexing support
- **Drizzle ORM:** TypeScript ORM with type-safe schema definitions
- **next-intl:** Next.js i18n library with RSC support and TypeScript augmentation
- **i18next:** Framework-agnostic i18n library with fallback and interpolation support
