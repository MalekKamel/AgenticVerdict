# Implementation Plan: Internationalization (I18n) & Localization (L10n)

**Branch**: `12-internationalization` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/12-internationalization/spec.md`

## Summary

Phase 12 implements comprehensive internationalization (I18n) and localization (L10n) for the AgenticVerdict UI, building on the foundation established in Phase 00. The implementation focuses on multi-language switching (Arabic/English), RTL layout optimization, locale management for admins, and maintainable translation file structure. Technical approach leverages @tanstack/react-router i18n plugin for type-safe translations, Mantine v9's DirectionProvider for RTL/LTR switching, and ICU message formatting for locale-aware dates, currencies, and pluralization.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), React 18+
**Primary Dependencies**: @tanstack/react-router with i18n plugin, Mantine UI v9 with DirectionProvider, @formatjs/icu-messageformat-parser for ICU parsing
**Storage**: Translation files stored as JSON in apps/frontend/src/locales/, user language preference in PostgreSQL (users.language_preference) and localStorage for immediate hydration
**Testing**: Vitest for unit tests, Playwright for RTL/LTR visual regression tests
**Target Platform**: TanStack Start web application (SSR with client hydration)
**Project Type**: Monorepo web application (Turborepo)
**Performance Goals**: <500ms language switch time, <100KB additional bundle size for i18n runtime
**Constraints**: Must maintain backward compatibility with existing English-only UI, must support SSR with locale-aware routing
**Scale/Scope**: 2 languages initially (Arabic, English), designed for 10+ languages, ~500 translation keys at launch

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Constitution Compliance

✅ **No `any` types**: Translation types use strict TypeScript with Zod validation
✅ **No hardcoded tenant logic**: Locale configuration is tenant-agnostic via TenantConfig
✅ **No database access without tenant context**: User preferences accessed via tRPC procedures with tenant context
✅ **No platform-specific code in core**: Translation system is generic across all business domains
✅ **No sensitive data in logs**: Translation keys and locale preferences are non-sensitive
✅ **No blocking operations in API routes**: Translation files loaded client-side, server uses cached versions

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| RTL layout breaks existing components | High | Comprehensive RTL testing suite, gradual rollout with feature flag |
| Translation file loading slows page load | Medium | Lazy loading per namespace, localStorage caching, compression |
| Pluralization rules differ across languages | Medium | ICU messageformat handles complex plural forms (Arabic has 6 plural forms) |
| Mixed LTR/RTL content rendering issues | Medium | Use HTML dir attribute and Unicode bidirectional algorithm |
| Translation key conflicts across domains | Low | Namespace keys by feature area (e.g., "marketing.dashboard.title") |

---

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/12-internationalization/
├── plan.md              # This file
├── spec.md              # Feature specification with user stories
└── tasks.md             # Implementation tasks (generated separately)
```

### Source Code (repository root)

```text
apps/frontend/
├── src/
│   ├── locales/                    # Translation files by language
│   │   ├── en/
│   │   │   ├── common.json         # Shared translations (buttons, labels)
│   │   │   ├── dashboard.json      # Dashboard feature translations
│   │   │   ├── connectors.json     # Connectors feature translations
│   │   │   ├── insights.json       # Insights feature translations
│   │   │   └── settings.json       # Settings feature translations
│   │   └── ar/
│   │       ├── common.json         # Arabic translations
│   │       ├── dashboard.json
│   │       ├── connectors.json
│   │       ├── insights.json
│   │       └── settings.json
│   ├── lib/
│   │   ├── i18n.ts                 # I18n configuration and utilities
│   │   ├── locales.ts              # Locale type definitions
│   │   └── formatters.ts           # Date/currency/number formatters
│   ├── components/
│   │   ├── i18n/
│   │   │   ├── LanguageSwitcher.tsx    # Language selector component
│   │   │   ├── LocaleProvider.tsx      # I18n context provider
│   │   │   └── TranslatedText.tsx      # Translation wrapper component
│   │   └── admin/
│   │       └── LocaleManagement.tsx    # Admin interface for translations
│   ├── stores/
│   │   └── locale-store.ts         # Locale state management (extends existing ui-store.ts)
│   └── routes/
│       ├── [...lang]/              # Locale-based routing (e.g., /en/dashboard, /ar/dashboard)
│       │   └── dashboard.tsx
│       └── __root.tsx              # Root route with LocaleProvider
├── tests/
│   ├── unit/
│   │   ├── i18n.test.ts            # I18n utility tests
│   │   └── formatters.test.ts      # Formatter tests
│   └── e2e/
│       ├── language-switching.spec.ts   # E2E language switch tests
│       └── rtl-layouts.spec.ts          # RTL layout validation tests
└── package.json

packages/
├── config/
│   └── src/
│       └── schemas/
│           └── locale.ts           # Locale configuration Zod schemas
└── database/
    └── src/
        └── schema/
            └── users.ts            # Add language_preference column
```

**Structure Decision**: Monorepo web application structure. Translation files are co-located with the web app for client-side loading. Locale configuration schemas are shared via @agenticverdict/config for type safety across packages.

---

## Technical Implementation

### Phase 1: I18n Infrastructure Setup

#### 1.1 Translation File Structure

**Organization**: Namespaced JSON files per feature area

```json
// apps/frontend/src/locales/en/common.json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "labels": {
    "loading": "Loading...",
    "noData": "No data available",
    "error": "An error occurred"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "connectors": "Connectors",
    "insights": "Insights",
    "settings": "Settings"
  }
}

// apps/frontend/src/locales/ar/common.json
{
  "buttons": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل"
  },
  "labels": {
    "loading": "جاري التحميل...",
    "noData": "لا توجد بيانات متاحة",
    "error": "حدث خطأ"
  },
  "navigation": {
    "dashboard": "لوحة التحكم",
    "connectors": "الموصلات",
    "insights": "الرؤى",
    "settings": "الإعدادات"
  }
}
```

**Benefits**: Namespace organization prevents key conflicts, enables partial loading (lazy loading per feature), and scales to multiple languages.

#### 1.2 Type-Safe Translations with @tanstack/react-router i18n

**Setup**: Configure the i18n plugin with locale definitions

```typescript
// apps/frontend/src/lib/i18n.ts
import { i18n } from '@tanstack/react-router-i18n'
import { z } from 'zod'

// Locale schema for type safety
export const localeSchema = z.enum(['en', 'ar'])
export type Locale = z.infer<typeof localeSchema>

// Translation namespaces (lazy loaded)
export const locales = {
  en: () => import('./locales/en/common.json'),
  ar: () => import('./locales/ar/common.json'),
}

// Configure i18n plugin
export const i18nConfig = i18n({
  locales,
  defaultLocale: 'en',
  fallbackLocale: 'en',
})
```

**Usage in components**:

```typescript
// apps/frontend/src/components/dashboard/DashboardHeader.tsx
import { useTrans } from '@tanstack/react-router-i18n'

export function DashboardHeader() {
  const trans = useTrans()

  return (
    <div>
      <h1>{trans('dashboard.title')}</h1>
      <p>{trans('dashboard.description', { count: 5 })}</p>
    </div>
  )
}
```

#### 1.3 RTL/LTR Switching with Mantine DirectionProvider

**Root route configuration**:

```typescript
// apps/frontend/src/routes/__root.tsx
import { DirectionProvider } from '@mantine/core'
import { useLocale } from './lib/i18n'

export function Route() {
  const locale = useLocale()
  const direction = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html dir={direction}>
      <head>
        <Meta />
      </head>
      <body>
        <DirectionProvider initialDirection={direction}>
          <Outlet />
        </DirectionProvider>
      </body>
    </html>
  )
}
```

**RTL-aware styling** (using Mantine's built-in RTL support):

```typescript
// All Mantine components automatically handle RTL
// Custom components use logical properties
import { createStyles } from '@mantine/core'

const useStyles = createStyles((theme) => ({
  container: {
    // Logical properties automatically flip for RTL
    paddingInline: theme.spacing.md,
    marginInlineStart: theme.spacing.lg,
    textAlign: 'start',  // Instead of 'left'
  },
}))
```

#### 1.4 Locale-Aware Formatting

**Date/currency/number formatters**:

```typescript
// apps/frontend/src/lib/formatters.ts
import { Locale } from './i18n'

export interface Formatters {
  formatDate: (date: Date) => string
  formatCurrency: (amount: number) => string
  formatNumber: (num: number) => string
}

export function createFormatters(locale: Locale): Formatters {
  const localeTag = locale === 'ar' ? 'ar-SA' : 'en-US'

  return {
    formatDate: (date) =>
      new Intl.DateTimeFormat(localeTag, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date),

    formatCurrency: (amount) =>
      new Intl.NumberFormat(localeTag, {
        style: 'currency',
        currency: 'SAR',
      }).format(amount),

    formatNumber: (num) =>
      new Intl.NumberFormat(localeTag).format(num),
  }
}

// Arabic numerals (١٢٣ instead of 123)
export function formatArabicNumerals(num: number): string {
  return num.toLocaleString('ar-SA', { useGrouping: false })
}
```

### Phase 2: User Story Implementation

#### US1: Multi-Language Switching (P1)

**Language switcher component**:

```typescript
// apps/frontend/src/components/i18n/LanguageSwitcher.tsx
import { Select } from '@mantine/core'
import { useLocale, useTrans } from '@tanstack/react-router-i18n'

export function LanguageSwitcher() {
  const trans = useTrans()
  const locale = useLocale()
  const setLocale = useSetLocale()

  return (
    <Select
      value={locale}
      onChange={(value) => setLocale(value as Locale)}
      data={[
        { value: 'en', label: trans('common.languages.english') },
        { value: 'ar', label: trans('common.languages.arabic') },
      ]}
    />
  )
}
```

**Locale persistence**:

```typescript
// apps/frontend/src/stores/locale-store.ts
import { create } from '@tanstack/react-store'
import { Locale } from '@/lib/i18n'

interface LocaleStore {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: (typeof window !== 'undefined'
    ? localStorage.getItem('locale') || 'en'
    : 'en') as Locale,
  setLocale: (locale) => {
    set({ locale })
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale)
    }
  },
}))
```

#### US2: Locale Management Interface (P2)

**Admin locale management page**:

```typescript
// apps/frontend/src/components/admin/LocaleManagement.tsx
import { useState } from 'react'
import { Button, FileInput, Group, Stack, Text, Progress } from '@mantine/core'

export function LocaleManagement() {
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('translationFile', file)

    // Upload to server for validation
    await fetch('/api/admin/locales/upload', {
      method: 'POST',
      body: formData,
    })
  }

  return (
    <Stack>
      <FileInput
        label="Upload translation file"
        accept=".json"
        onChange={handleFileUpload}
      />
      <TranslationCoverage locale="ar" />
    </Stack>
  )
}

function TranslationCoverage({ locale }: { locale: string }) {
  const { data: coverage } = trpc.admin.locales.getCoverage.useQuery({ locale })

  return (
    <div>
      <Text>Translation coverage: {coverage?.percent}%</Text>
      <Progress value={coverage?.percent} />
      <MissingKeysList keys={coverage?.missingKeys} />
    </div>
  )
}
```

#### US3: RTL Pattern Optimization (P1)

**RTL validation tests**:

```typescript
// apps/frontend/tests/e2e/rtl-layouts.spec.ts
import { test, expect } from '@playwright/test'

test.describe('RTL Layouts', () => {
  test('dashboard layout mirrors correctly in Arabic', async ({ page }) => {
    await page.goto('/ar/dashboard')

    // Check sidebar is on the right
    const sidebar = page.locator('[data-testid="sidebar"]')
    const sidebarBox = await sidebar.boundingBox()
    const mainContent = page.locator('[data-testid="main-content"]')
    const mainBox = await mainContent.boundingBox()

    expect(sidebarBox.x).toBeGreaterThan(mainBox.x)
  })

  test('form fields tab in RTL order', async ({ page }) => {
    await page.goto('/ar/connectors/add')

    await page.keyboard.press('Tab')
    const firstField = await page.locator(':focus').getAttribute('name')

    await page.keyboard.press('Tab')
    const secondField = await page.locator(':focus').getAttribute('name')

    // Verify focus order is right-to-left
    expect(firstField).toBe('lastField')
    expect(secondField).toBe('firstField')
  })
})
```

#### US4: Translation File Structure & Maintenance (P2)

**Translation validation script**:

```typescript
// apps/frontend/scripts/validate-translations.ts
import fs from 'fs'
import path from 'path'

const enTranslations = require('./src/locales/en/common.json')
const arTranslations = require('./src/locales/ar/common.json')

function findMissingKeys(
  base: Record<string, unknown>,
  target: Record<string, unknown>,
  path = '',
): string[] {
  const missing: string[] = []

  for (const key in base) {
    const currentPath = path ? `${path}.${key}` : key

    if (!(key in target)) {
      missing.push(currentPath)
      continue
    }

    if (typeof base[key] === 'object' && typeof target[key] === 'object') {
      missing.push(
        ...findMissingKeys(
          base[key] as Record<string, unknown>,
          target[key] as Record<string, unknown>,
          currentPath,
        ),
      )
    }
  }

  return missing
}

const missingKeys = findMissingKeys(enTranslations, arTranslations)
console.log('Missing Arabic translations:', missingKeys)

process.exit(missingKeys.length > 0 ? 1 : 0)
```

---

## Complexity Tracking

_No constitution violations detected. Implementation follows established patterns._

---

## Testing Strategy

### Unit Tests

- **I18n utilities** (Vitest): Test locale detection, translation key resolution, fallback behavior
- **Formatters** (Vitest): Test date/currency/number formatting for each locale
- **Locale store** (Vitest): Test locale persistence and retrieval

### Integration Tests

- **Language switching** (Playwright): Test end-to-end language switch workflow
- **RTL layouts** (Playwright): Test layout mirroring for all pages
- **Translation loading** (Playwright): Test lazy loading of translation namespaces

### Visual Regression Tests

- **LTR vs RTL screenshots**: Compare screenshots for each page in both languages
- **Mixed content**: Test embedded LTR content within RTL layouts

---

## Performance Optimization

### Bundle Size Management

- **Lazy loading**: Translation files loaded per namespace (dashboard, connectors, etc.)
- **Tree shaking**: Unused translations are eliminated from the bundle
- **Compression**: JSON files are gzip-compressed by the server

### Loading Performance

- **localStorage caching**: Translation files cached after first load
- **Preloading**: Critical translations (common.json) preloaded on initial page load
- **SSR optimization**: Server uses user's saved preference for initial render

---

## Accessibility Considerations

### WCAG 2.1 AA Compliance

- **lang attribute**: HTML lang attribute set correctly (ar, en)
- **dir attribute**: dir="rtl" or dir="ltr" set on html element
- **Mixed content**: Use span with dir="ltr" for embedded LTR content
- **Screen readers**: Test with NVDA (Windows) and VoiceOver (macOS) for both languages

### Keyboard Navigation

- **RTL tab order**: Ensure tab order follows RTL when Arabic is selected
- **Focus indicators**: Ensure focus indicators are visible in both directions

---

## Deployment Strategy

### Phased Rollout

1. **Week 1**: Deploy i18n infrastructure behind feature flag
2. **Week 2**: Enable language switching for internal users
3. **Week 3**: Enable for beta users (Masafh team)
4. **Week 4**: General availability

### Monitoring

- **Missing translations**: Log missing translation keys to Sentry
- **Performance**: Monitor language switch time
- **Errors**: Track translation loading failures

---

## Future Enhancements

Out of scope for Phase 12, but planned for future iterations:

- **CMS integration**: Move translation files to a headless CMS for non-technical translators
- **Machine translation**: Integrate translation API (e.g., DeepL) for initial drafts
- **Language detection**: Auto-detect language from user's browser settings
- **Additional languages**: French (fr), Spanish (es), German (de)
- **RTL language additions**: Hebrew (he), Farsi (fa)
- **Translation memory**: Store translated segments for reuse across similar content
- **Collaborative translation**: Web interface for translators to submit and review translations
