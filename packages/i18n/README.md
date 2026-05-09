# @agenticverdict/i18n

Shared internationalization utilities for the AgenticVerdict monorepo. Provides cross-app formatters, locale detection, RTL/BiDi support, translation quality metrics, and **compile-time type-safe key validation** across all supported locales.

> The web frontend uses `next-intl` for runtime translations; this package supplies the shared infrastructure used by the API, worker, desktop app, report generator, and CI validation gates.

## Supported Locales

| Code | Language | Script         | Direction | Currency |
| ---- | -------- | -------------- | --------- | -------- |
| `en` | English  | Latin          | LTR       | USD      |
| `ar` | العربية  | Arabic         | RTL       | SAR      |
| `es` | Español  | Latin          | LTR       | EUR      |
| `fr` | Français | Latin          | LTR       | EUR      |
| `zh` | 中文     | Simplified Han | LTR       | CNY      |

## Installation

```bash
pnpm add @agenticverdict/i18n
```

## Quick Start

### Basic Translation (Worker / CLI)

```ts
import { I18nManager } from "@agenticverdict/i18n";

const i18n = new I18nManager("en");
const title = i18n.t("auth.login.title"); // Type-safe — autocomplete works
```

### React Components

```tsx
import { useTranslations } from "@/i18n/react";

export function LoginPage() {
  const t = useTranslations("auth");
  return <h1>{t("login.title")}</h1>;
}
```

### Localization Formatters

```ts
import { createLocalizationFormatters } from "@agenticverdict/i18n/formatters";

const fmt = createLocalizationFormatters("ar", {
  region: "SA",
  timezone: "Asia/Riyadh",
  currency: "SAR",
});

fmt.formatDate(new Date()); // "٢٠٢٤-٠١-١٥"
fmt.formatCurrency(1250.5); // "١٬٢٥٠٫٥٠ ر.س"
fmt.formatNumber(42.7); // "٤٢٫٧"
fmt.pluralCategory(3); // "few" (Arabic plural rules)
```

### Language Detection

```ts
import { detectPreferredAppLocale, normalizeToAppLocale } from "@agenticverdict/i18n";

// Server-side: parse Accept-Language header
const locale = detectPreferredAppLocale(req.headers["accept-language"], "en");

// Client-side: normalize arbitrary tags
const appLocale = normalizeToAppLocale("zh-CN", "en"); // → "zh"
```

### RTL / BiDi Support

```ts
import { isRtlLocale, textDirection, wrapHtmlDirAuto } from "@agenticverdict/i18n";

isRtlLocale("ar"); // true
textDirection("en"); // "ltr"
wrapHtmlDirAuto("مرحبا"); // <span dir="auto" style="unicode-bidi:isolate">مرحبا</span>
```

## Architecture

### Package Exports

| Import Path                               | Purpose                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| `@agenticverdict/i18n`                    | Core exports: `I18nManager`, formatters, locale detection, quality metrics, BiDi helpers |
| `@agenticverdict/i18n/formatters`         | `createLocalizationFormatters`, `APP_LOCALES`, locale display metadata                   |
| `@agenticverdict/i18n/locales`            | Direct JSON locale bundle exports                                                        |
| `@agenticverdict/i18n/language-detection` | `detectPreferredAppLocale`, `normalizeToAppLocale`, browser detection                    |
| `@agenticverdict/i18n/load-messages`      | `loadMessagesSync`, `flattenMessages`, `resolveLocaleOrFallback`                         |
| `@agenticverdict/i18n/rtl`                | `isRtlLocale`, `textDirection`                                                           |
| `@agenticverdict/i18n/types`              | Auto-generated TypeScript types: `MessageKey`, `NamespaceType`, `PlaceholderMap`         |

### Directory Structure

```
packages/i18n/
├── src/
│   ├── locales/           # JSON translation bundles (en, ar, es, fr, zh)
│   ├── scripts/
│   │   ├── generate-types.ts    # Type generation from en.json
│   │   └── find-dead-keys.ts    # Static analysis for unused keys
│   ├── types/
│   │   └── generated.ts         # Auto-generated — DO NOT EDIT
│   ├── i18n-manager.ts          # Core translation manager (worker/CLI)
│   ├── formatters.ts            # Intl-based date/number/currency formatters
│   ├── language-detection.ts    # Accept-Language parsing, browser detection
│   ├── load-messages.ts         # Message loading with caching & flattening
│   ├── translation-parity.ts    # Cross-locale key parity validation
│   ├── locale-quality.ts        # Structural quality checks (placeholders, untranslated)
│   ├── bleu-score.ts            # Sentence-level BLEU scoring for MT evaluation
│   ├── rtl.ts                   # RTL locale detection
│   ├── bidi.ts                  # Unicode BiDi isolation helpers
│   ├── document-direction.ts    # Document root direction resolution
│   ├── typography.ts            # Locale-aware font stacks for reports
│   ├── message-merge.ts         # Tenant override merging
│   └── index.ts                 # Public API surface
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Compile-Time Type Validation

The package generates TypeScript types from the reference locale (`en.json`) to catch missing/invalid translation keys at compile time.

### Generated Types

| Type               | Description                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| `MessageKey`       | Union of all ~1262 valid dot-notation keys                                    |
| `NamespaceType`    | Union of 28 top-level namespaces (e.g. `"auth" \| "dashboard" \| "settings"`) |
| `NamespaceKeys<N>` | Mapped type for keys within a specific namespace                              |
| `PlaceholderMap`   | ICU placeholder names extracted per key                                       |

### Scripts

```bash
# Regenerate types from en.json
pnpm --filter @agenticverdict/i18n generate:types

# Find unused translation keys (informational, non-blocking)
pnpm --filter @agenticverdict/i18n validate:dead-keys

# Run all tests
pnpm --filter @agenticverdict/i18n test

# Type-check (auto-regenerates types first via pretypecheck hook)
pnpm --filter @agenticverdict/i18n typecheck

# Build (auto-regenerates types first via prebuild hook)
pnpm --filter @agenticverdict/i18n build
```

### Type Safety Patterns

**Static keys (preferred):**

```ts
// Compile error if key doesn't exist
const title = i18n.t("auth.login.title");
```

**Dynamic keys (escape hatch):**

```ts
// Use sparingly — logs warning in development if key is missing
const label = i18n.tDynamic(dynamicKey, "Fallback text");
```

**React namespace typing:**

```ts
// Autocomplete scoped to "auth" namespace keys
const t = useTranslations("auth");
t("login.title"); // OK — key exists
t("nonexistent.key"); // Compile error
```

## Translation Quality & CI Gates

### Parity Validation

Ensures all locale bundles define the same keys as the reference (`en.json`):

```ts
import { assertAllLocalesHaveSameKeys, missingKeysComparedTo } from "@agenticverdict/i18n";

// Throws if any locale is missing keys or has extra keys
assertAllLocalesHaveSameKeys("en");

// Get list of missing keys for a specific locale
const missing = missingKeysComparedTo("en", "ar");
```

### Structural Quality Checks

Validates placeholder parity and detects likely untranslated strings:

```ts
import { analyzeLocaleQuality, assertStructuralLocaleQuality } from "@agenticverdict/i18n";

const report = analyzeLocaleQuality("ar", "en");
// report.issues → Array of PLACEHOLDER_MISMATCH or LIKELY_UNTRANSLATED issues
// report.meanLexicalOverlapVsEn → 0–1 diagnostic score

// CI-safe: throws on any structural issue
assertStructuralLocaleQuality("ar");
```

### BLEU Scoring

Sentence-level BLEU for machine translation evaluation (same-language candidate vs reference):

```ts
import { computeSentenceBleu, meanSentenceBleu, tokenizeBleu } from "@agenticverdict/i18n";

const score = computeSentenceBleu(
  "هذا نص تجريبي للاختبار", // candidate
  "هذا نص تجريبي للتجربة", // reference (human gold)
); // → 0.0–1.0

// Average over multiple pairs
const avg = meanSentenceBleu([
  { candidate: "...", reference: "..." },
  { candidate: "...", reference: "..." },
]);
```

### CI Pipeline

The CI workflow (`.github/workflows/ci.yml`) includes these i18n gates:

1. **Type generation validation** — ensures `generated.ts` is up to date
2. **Translation parity** — fails if any locale is missing keys
3. **Structural quality** — fails on placeholder mismatches or untranslated strings
4. **Dead key detection** — informational report of unused keys

## Multi-Tenancy Considerations

- Locale bundles are shared across tenants; tenant-specific overrides are merged at runtime via `mergeMessageDictionaries()`
- Formatting (currency, timezone, region) is tenant-scoped via `LocalizationConfig`
- Language detection respects tenant locale preferences with fallback to `en`

## Message Format

Translation files use **flat dot-notation keys** with ICU MessageFormat syntax:

```json
{
  "auth.login.title": "Sign In",
  "auth.login.subtitle": "Welcome back, {name}",
  "dashboard.items.count": "{count, plural, one {# item} other {# items}}",
  "common.date.format": "MMM d, yyyy"
}
```

Nested objects in JSON are automatically flattened to dot notation at load time.

## ICU Placeholder Rules

- Placeholders use `{variableName}` syntax
- Translations must declare the **same placeholders** as the English source
- Plural/select syntax: `{var, plural|select, ...}`
- Mismatched placeholders are flagged by `analyzeLocaleQuality()`

## RTL & BiDi Guidelines

- Use `isRtlLocale()` or `textDirection()` to determine document direction
- Apply `wrapHtmlDirAuto()` for mixed-direction inline content
- Use `isolateLtrText()` / `isolateRtlText()` for Unicode isolation in plain text
- Report font stacks use `reportBodyFontStack(locale)` for proper script rendering

## Testing

```bash
# Run all i18n tests
pnpm --filter @agenticverdict/i18n test

# Tests cover:
# - Translation parity across all locales
# - Locale quality structural checks
# - Language detection logic
# - BiDi isolation
# - BLEU scoring
# - Formatters
# - Message loading & flattening
```

## Development Workflow

### Adding a New Translation Key

1. Add the key to `src/locales/en.json`
2. Run `pnpm --filter @agenticverdict/i18n generate:types` (or `pnpm pretypecheck`)
3. Use the key in code — autocomplete will include it
4. Add translations to other locale files (`ar.json`, `es.json`, etc.)
5. CI will fail if parity checks detect missing translations

### Adding a New Locale

1. Add locale code to `APP_LOCALES` in `src/formatters.ts`
2. Add metadata to `LOCALE_DISPLAY_METADATA` and `LANGUAGE_NATIVE_NAMES`
3. Create `src/locales/{code}.json` (copy from `en.json` and translate)
4. Update `rtl.ts` if the locale uses RTL script
5. Update `typography.ts` font stack if needed
6. Run `generate:types` and verify CI passes

### Extracting Keys from Frontend

```bash
# Generate a report of all i18n key usage in the frontend
pnpm --filter @agenticverdict/frontend i18n:extract

# Output: apps/i18n-extracted-keys.json
# Contains: namespace breakdown, dynamic key count, file/line references
```

## Dependencies

| Package                  | Purpose                                                |
| ------------------------ | ------------------------------------------------------ |
| `@agenticverdict/config` | `LocalizationConfig` type (region, timezone, currency) |
| `@agenticverdict/types`  | `TextDirection` type                                   |

## Version

Current: `0.3.0`
