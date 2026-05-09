# i18n Library Migration: Analysis & Implementation Plan

**Date:** 2026-05-12
**Scope:** AgenticVerdict monorepo — `@agenticverdict/i18n` package + `apps/frontend`
**Status:** Analysis complete, implementation plan ready

---

## 1. Executive Summary

The current custom i18n implementation (documented in `compile-time-i18n-validation.md`) relies on a hand-built TypeScript type generation system with `intl-messageformat` for runtime ICU formatting. While functional, it introduces maintenance burden and lacks the battle-tested reliability of established libraries.

**Critical finding:** The project uses **TanStack Start** (NOT Next.js), which fundamentally changes the candidate library landscape. `next-intl` is **incompatible** with the current architecture.

**Recommendation:** **Lingui 6.x** is the best-fit library for this migration, offering native ICU MessageFormat compatibility, Vite plugin support, framework-agnostic design, and active maintenance (Crowdin-backed since 2026).

---

## 2. Current Architecture Analysis

### 2.1 Stack

| Layer        | Technology                                         |
| ------------ | -------------------------------------------------- |
| Framework    | TanStack Start v1.167 + TanStack Router v1.168     |
| Bundler      | Vite v8                                            |
| SSR Engine   | Nitro (nightly)                                    |
| React        | 19.1.0                                             |
| Current i18n | Custom `I18nManager` + `IntlMessageFormat` v11.2.1 |
| UI Library   | Mantine v7                                         |

### 2.2 Current i18n Scope

| Metric                   | Value                                    |
| ------------------------ | ---------------------------------------- |
| Locales                  | 5 (`en`, `ar`, `fr`, `es`, `zh`)         |
| Reference keys (en.json) | ~1,262 leaf keys                         |
| Translation coverage     | 89-95% across target locales             |
| React call sites         | 227+ `useTranslations()` invocations     |
| Top-level namespaces     | 28 (mixed PascalCase/camelCase)          |
| Non-React call sites     | `I18nManager.t()` in worker/CLI contexts |

### 2.3 Identified Limitations of Current Approach

1. **Maintenance burden** — Custom type generation script (`generate-types.ts`) must be maintained and kept in sync with JSON schema changes
2. **Fragile type generation** — Generated `MessageKey` union of ~1,290 keys creates large TypeScript union types that slow down tsc
3. **No dead key detection in CI** — `find-dead-keys.ts` script exists but is not integrated as a CI gate
4. **ICU placeholder validation only at runtime** — Mismatches like `{count}` vs `{cnt}` caught only during execution
5. **No translation management integration** — No built-in support for TMS platforms (Crowdin, Lokalise, etc.)
6. **Mixed namespace conventions** — PascalCase (`Home`, `Layout`, `Validation`) alongside camelCase creates inconsistency
7. **No plural/select type safety** — ICU plural and select syntax not validated at compile time
8. **Single-point failure risk** — Custom implementation lacks the community testing and edge-case coverage of battle-tested libraries

---

## 3. Candidate Library Evaluation

### 3.1 Framework Compatibility Matrix

| Library                   | TanStack Start | Vite         | React 19 | ICU MessageFormat    | SSR Compatible |
| ------------------------- | -------------- | ------------ | -------- | -------------------- | -------------- |
| **next-intl**             | NO             | NO           | YES      | YES                  | Next.js only   |
| **react-i18next**         | YES            | YES          | YES      | NO (custom syntax)   | YES            |
| **Lingui 6.x**            | YES            | YES (plugin) | YES      | YES (native)         | YES            |
| **react-intl (FormatJS)** | YES            | YES          | YES      | YES (reference impl) | YES            |
| **Paraglide**             | Partial        | YES          | YES      | YES                  | Vite-coupled   |

### 3.2 next-intl — INCOMPATIBLE (Eliminated)

`next-intl` is tightly coupled to Next.js architecture and relies on:

- Next.js App Router conventions (`app/` directory, `layout.tsx`, `page.tsx`)
- Next.js `headers()` / `cookies()` APIs for locale detection
- Next.js middleware for locale prefixing/redirects
- `next.config.js` plugin system
- React Server Components patterns specific to Next.js

The project uses **TanStack Start + Nitro + TanStack Router**, which has an entirely different architecture. There is no drop-in compatibility path. Adopting `next-intl` would require migrating the entire frontend from TanStack Start to Next.js — an order-of-magnitude larger undertaking than the i18n migration itself.

**Verdict: Eliminated — framework-incompatible.**

### 3.3 react-i18next / i18next v25+

| Criterion                | Assessment                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| **Feature completeness** | Excellent — plurals, context, namespaces, interpolation, formatting, lazy loading                   |
| **TypeScript support**   | Good — module augmentation via `CustomTypeOptions`, new selector API (`enableSelector`) in v25.4+   |
| **Performance**          | Good runtime, but type checking can cause OOM on large translation sets (known issue)               |
| **Ecosystem maturity**   | Best-in-class — 10+ years, largest ecosystem, extensive plugins                                     |
| **Learning curve**       | Moderate — different interpolation syntax (`{{key}}` vs ICU `{key}`)                                |
| **Migration complexity** | **HIGH** — requires rewriting all 1,262+ keys from ICU to i18next syntax, different plural handling |
| **ICU compatibility**    | **NO** — uses custom `{{key}}` interpolation, not ICU MessageFormat                                 |
| **Plural handling**      | Separate keys per plural form (`key_one`, `key_other`) — less translator-friendly                   |
| **Vite integration**     | Works via standard imports, no dedicated plugin                                                     |
| **TanStack Start**       | Compatible — framework-agnostic React library                                                       |

**Key concerns:**

- Interpolation syntax mismatch: current codebase uses ICU `{name}`, i18next uses `{{name}}`
- Plural syntax requires separate keys per language form, breaking current ICU plural structure
- Type checking with 1,262+ keys risks OOM errors (documented in i18next docs)
- Would require full translation key rewrite across all 5 locales

### 3.4 Lingui 6.x (Recommended)

| Criterion                | Assessment                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| **Feature completeness** | Excellent — ICU MessageFormat, plurals, select, context, rich-text formatting, macros            |
| **TypeScript support**   | Excellent — compile-time type generation via CLI `--typescript` flag, macro-based type inference |
| **Performance**          | Excellent — compile-time message compilation, tree-shakable, small bundle footprint              |
| **Ecosystem maturity**   | Strong — 8+ years, acquired by Crowdin (2026), active development                                |
| **Learning curve**       | Low-Moderate — macro-based API differs from current hooks, but ICU syntax is preserved           |
| **Migration complexity** | **MEDIUM** — ICU syntax preserved, but call site API changes from `useTranslations()` to macros  |
| **ICU compatibility**    | **YES** — native ICU MessageFormat, current messages are largely compatible                      |
| **Plural handling**      | ICU native — `{count, plural, one {...} other {...}}` — matches current format                   |
| **Vite integration**     | **YES** — dedicated `@lingui/vite-plugin` for compile-time macro transformation                  |
| **TanStack Start**       | Compatible — framework-agnostic, works with Vite + React + SSR                                   |

**Key advantages:**

- Native ICU MessageFormat — existing translation messages are structurally compatible
- Vite plugin — compiles macros at build time, zero runtime overhead for message parsing
- Framework-agnostic — works with TanStack Start, TanStack Router, Nitro SSR
- Crowdin integration — built-in TMS sync (relevant for future translation management)
- Active maintenance — v6.0 released April 2026
- Monorepo support — documented monorepo guide
- ESLint plugin — catches i18n issues at lint time

**Key concerns:**

- API paradigm shift: from `useTranslations(namespace)` hooks to `Trans`/`t` macros
- Message ID strategy decision: generated from source text vs. explicit dot-notation IDs
- Requires refactoring all 227+ React call sites

### 3.5 react-intl (FormatJS)

| Criterion                | Assessment                                                           |
| ------------------------ | -------------------------------------------------------------------- |
| **Feature completeness** | Excellent — reference ICU implementation, used at Meta/Shopify scale |
| **TypeScript support**   | Partial — format validation via CLI, no built-in key type generation |
| **Performance**          | Good — but heavier bundle size than Lingui                           |
| **Ecosystem maturity**   | Excellent — reference ICU implementation, industry standard          |
| **Learning curve**       | Moderate — `<FormattedMessage>` component pattern                    |
| **Migration complexity** | **MEDIUM-HIGH** — ICU syntax compatible, but different component API |
| **ICU compatibility**    | **YES** — reference implementation                                   |
| **Vite integration**     | Works via standard imports, no dedicated plugin                      |
| **TanStack Start**       | Compatible                                                           |

**Key concerns:**

- No built-in key type generation — would still need custom type script
- Heavier bundle size
- Less modern DX compared to Lingui (no macro support, more verbose API)
- Does not fully solve the "maintenance burden" problem since type generation remains custom

### 3.6 Comparative Scoring

| Criterion (Weight)                         | react-i18next | Lingui 6.x | react-intl |
| ------------------------------------------ | :-----------: | :--------: | :--------: |
| Framework compatibility (critical)         |      3/5      |    5/5     |    4/5     |
| ICU MessageFormat compatibility (critical) |      1/5      |    5/5     |    5/5     |
| TypeScript support (high)                  |      3/5      |    5/5     |    2/5     |
| Migration complexity (high)                |      2/5      |    3/5     |    3/5     |
| Ecosystem maturity (medium)                |      5/5      |    4/5     |    5/5     |
| Vite integration (medium)                  |      3/5      |    5/5     |    3/5     |
| Performance (medium)                       |      3/5      |    5/5     |    3/5     |
| TMS integration (low)                      |      3/5      |    5/5     |    3/5     |
| **Weighted score**                         |   **2.7/5**   | **4.5/5**  | **3.5/5**  |

---

## 4. Recommendation: Lingui 6.x

### 4.1 Justification

1. **ICU MessageFormat compatibility** — Existing translation messages use ICU syntax (`{name}`, `{count, plural, ...}`). Lingui uses ICU natively, meaning the JSON message content requires minimal transformation. This is the single biggest factor reducing migration complexity.

2. **Vite-native** — The project uses Vite v8. Lingui's `@lingui/vite-plugin` provides compile-time macro transformation, integrating seamlessly into the existing build pipeline.

3. **Framework-agnostic** — Works with TanStack Start, TanStack Router, and Nitro SSR without any framework-specific coupling.

4. **Type safety without custom scripts** — Lingui's CLI generates TypeScript types from message catalogs (`lingui compile --typescript`), eliminating the need to maintain `generate-types.ts`.

5. **Crowdin backing** — Acquired by Crowdin in 2026, with built-in TMS synchronization. This aligns with the project's need for professional translation management.

6. **Active development** — v6.0 released April 2026 with React 19 support.

### 4.2 Message ID Strategy

Lingui supports two approaches for message IDs:

| Approach                  | Example                                             | Pros                                                | Cons                                          |
| ------------------------- | --------------------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| **Generated from source** | `t\`Sign In\`` → ID auto-generated                  | No manual ID management, source text is the key     | Changing source text breaks translation links |
| **Explicit IDs**          | `t({ id: "auth.login.title", message: "Sign In" })` | Stable IDs, matches current dot-notation convention | Requires manual ID management                 |

**Recommendation: Explicit IDs** — The current codebase already uses dot-notation keys (`auth.login.title`). Using explicit IDs preserves the existing key structure, enables easier migration mapping, and maintains stable translation references.

---

## 5. Implementation Plan

### Phase 0: Preparation (Week 1)

**Objective:** Set up Lingui infrastructure without touching existing code.

#### 0.1 Install Dependencies

```bash
# In apps/frontend
pnpm add @lingui/core @lingui/react @lingui/cli @lingui/vite-plugin @lingui/macro
pnpm add -D babel-plugin-macros

# In packages/i18n (for shared locale loading utilities)
pnpm add @lingui/core @lingui/cli
```

#### 0.2 Configure Lingui

Create `apps/frontend/lingui.config.ts`:

```typescript
import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "en",
  locales: ["en", "ar", "fr", "es", "zh"],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src"],
    },
  ],
  format: "po", // or "json" to match current format
  compileNamespace: "ts",
});
```

#### 0.3 Integrate Vite Plugin

Update `apps/frontend/vite.config.ts`:

```typescript
import { lingui } from "@lingui/vite-plugin";

export default defineConfig({
  plugins: [
    lingui(),
    // ... existing plugins
  ],
});
```

#### 0.4 Add npm Scripts

```json
{
  "scripts": {
    "lingui:extract": "lingui extract",
    "lingui:compile": "lingui compile --typescript",
    "lingui:check": "lingui extract --clean && lingui compile --typescript"
  }
}
```

#### 0.5 Configure TypeScript

Add to `apps/frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "allowArbitraryExtensions": true
  }
}
```

#### 0.6 ESLint Integration

```bash
pnpm add -D @lingui/eslint-plugin
```

Add to ESLint config:

```typescript
import lingui from "@lingui/eslint-plugin";

export default [
  // ... existing configs
  {
    plugins: { lingui },
    rules: {
      "lingui/no-single-variables-to-translate": "error",
      "lingui/no-expression-in-message": "warn",
      "lingui/t-call-in-function": "error",
    },
  },
];
```

**Exit criteria:** Lingui installed, configured, and build pipeline integrates the Vite plugin without errors.

---

### Phase 1: Message Catalog Migration (Week 2)

**Objective:** Convert existing locale JSON files to Lingui-compatible format.

#### 1.1 Analyze ICU Compatibility

Audit existing `en.json` for ICU MessageFormat patterns:

```bash
# Check for ICU plural syntax
grep -r "plural" packages/i18n/src/locales/en.json

# Check for ICU select syntax
grep -r "select" packages/i18n/src/locales/en.json

# Check for nested objects vs flat keys
# Current: flattened dot-notation at load time
# Lingui: nested objects in PO/JSON catalogs
```

#### 1.2 Convert Locale Files

Current format (flat dot-notation):

```json
{
  "auth.login.title": "Sign In",
  "auth.login.submit": "Sign In",
  "dashboard.welcome": "Welcome, {name}"
}
```

Target Lingui format (nested):

```json
{
  "auth": {
    "login": {
      "title": "Sign In",
      "submit": "Sign In"
    }
  },
  "dashboard": {
    "welcome": "Welcome, {name}"
  }
}
```

**Conversion script** (one-time):

```typescript
// scripts/convert-to-lingui.ts
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const LOCALES = ["en", "ar", "fr", "es", "zh"];
const INPUT_DIR = "packages/i18n/src/locales";
const OUTPUT_DIR = "apps/frontend/src/locales";

function unflatten(obj: Record<string, string>) {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = current[parts[i]] || {};
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = obj[key];
  }
  return result;
}

for (const locale of LOCALES) {
  const input = JSON.parse(readFileSync(join(INPUT_DIR, `${locale}.json`), "utf-8"));
  const output = unflatten(input);
  writeFileSync(join(OUTPUT_DIR, `${locale}/messages.json`), JSON.stringify(output, null, 2));
}
```

#### 1.3 Validate ICU Message Compatibility

For each ICU plural/select pattern in existing messages, verify Lingui compatibility:

| Current Pattern                                   | Lingui Compatible? | Action      |
| ------------------------------------------------- | ------------------ | ----------- |
| `{name}`                                          | YES                | No change   |
| `{count, plural, one {...} other {...}}`          | YES                | No change   |
| `{status, select, active {...} inactive {...}}`   | YES                | No change   |
| `{count, plural, =0 {...} one {...} other {...}}` | YES                | No change   |
| Character arrays (`"0": "a", "1": "b"`)           | NO                 | Restructure |

#### 1.4 Extract and Compile

```bash
pnpm lingui:extract
pnpm lingui:compile
```

**Exit criteria:** All 5 locale catalogs converted, extracted, and compiled without errors. TypeScript types generated.

---

### Phase 2: Shared Package Migration (Week 3)

**Objective:** Migrate `packages/i18n` to use Lingui for non-React contexts (worker, CLI, notifications).

#### 2.1 Update I18nManager

Replace current `I18nManager.t()` implementation with Lingui core:

```typescript
// packages/i18n/src/i18n-manager.ts (new)
import { i18n } from "@lingui/core";
import { messages as enMessages } from "./locales/en/messages";
import { messages as arMessages } from "./locales/ar/messages";
// ... other locales

export class I18nManager {
  private locale: string;

  constructor(locale: string = "en") {
    this.locale = locale;
    i18n.load({
      en: enMessages,
      ar: arMessages,
      fr: frMessages,
      es: esMessages,
      zh: zhMessages,
    });
    i18n.activate(locale);
  }

  t(id: string, values?: Record<string, unknown>): string {
    return i18n._(id, values);
  }

  tDynamic(id: string, fallback: string, values?: Record<string, unknown>): string {
    try {
      return this.t(id, values);
    } catch {
      return fallback;
    }
  }

  setLocale(locale: string): void {
    this.locale = locale;
    i18n.activate(locale);
  }
}
```

#### 2.2 Preserve Non-i18n Utilities

The following utilities in `packages/i18n` are NOT i18n-library-specific and should be preserved:

- `formatters.ts` — `Intl`-based date/number/currency formatters
- `language-detection.ts` — Accept-Language parsing
- `locale-quality.ts` — Structural quality checks
- `translation-parity.ts` — Cross-locale key parity
- `rtl.ts`, `bidi.ts`, `document-direction.ts` — RTL/BiDi utilities
- `typography.ts` — Locale-aware font stacks
- `message-merge.ts` — Tenant override merging

#### 2.3 Update Package Exports

Update `packages/i18n/package.json` exports to include Lingui types:

```json
{
  "dependencies": {
    "@lingui/core": "^6.0.0",
    "@agenticverdict/config": "workspace:*",
    "@agenticverdict/types": "workspace:*"
  }
}
```

#### 2.4 Update Tests

Update `i18n-manager.test.ts` to use Lingui's API. Existing test patterns for loading, fallback, RTL, and locale switching remain valid.

**Exit criteria:** `I18nManager` passes all existing tests with Lingui backend. Non-i18n utilities unchanged.

---

### Phase 3: Frontend Component Migration (Weeks 4-6)

**Objective:** Migrate all 227+ React call sites from `useTranslations()` to Lingui macros.

#### 3.1 Migration Pattern

Current pattern:

```tsx
const t = useTranslations("auth");
<h1>{t("login.title")}</h1>
<p>{t("login.welcome", { name: user.name })}</p>
```

Target pattern (explicit IDs):

```tsx
import { Trans, useLingui } from "@lingui/react/macro";

function LoginForm() {
  const { t } = useLingui();
  return (
    <>
      <h1>
        <Trans id="auth.login.title">Sign In</Trans>
      </h1>
      <p>
        {t({ id: "auth.login.welcome", message: "Welcome, {name}", values: { name: user.name } })}
      </p>
    </>
  );
}
```

#### 3.2 Migration by Namespace Priority

Migrate in order of usage frequency (highest risk first):

| Priority | Namespace              | Call Sites | Complexity                       |
| -------- | ---------------------- | ---------- | -------------------------------- |
| 1        | `auth`                 | ~35        | Low — mostly static text         |
| 2        | `common`               | ~30        | Low — shared components          |
| 3        | `navigation`           | ~25        | Low — labels, links              |
| 4        | `dashboard`            | ~20        | Medium — dynamic data            |
| 5        | `reports` / `insights` | ~25        | Medium — plural/select patterns  |
| 6        | `connectors`           | ~20        | Medium — dynamic status messages |
| 7        | `errors`               | ~15        | Low — error messages             |
| 8        | `admin` / `agency`     | ~15        | Medium — complex forms           |
| 9        | `settings`             | ~15        | Medium — form labels             |
| 10       | Remaining              | ~27        | Varies                           |

#### 3.3 Automated Migration Script (Partial)

Create a codemod to handle simple cases:

```typescript
// scripts/codemod-use-translations.ts
// Uses jscodeshift to transform:
// const t = useTranslations("namespace");
// t("key.path")
// →
// import { Trans } from "@lingui/react/macro";
// <Trans id="namespace.key.path">Default Text</Trans>
```

#### 3.4 Manual Migration Cases

These patterns require manual migration:

- **Plural/select patterns** — Verify ICU syntax compatibility
- **Dynamic keys** — `t(\`errors.${code}\`)` → use explicit ID map or runtime lookup
- **Notification translations** — Non-React context in `notifications-i18n.ts`
- **Character array keys** — `reports.list.bulkActions.0` through `.15` need restructuring

#### 3.5 Update I18nProvider

Replace current custom `I18nProvider` with Lingui's:

```tsx
// apps/frontend/src/routes/$locale/route.tsx (updated)
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

// In route loader:
const messages = await loadMessages(locale);
i18n.load(locale, messages);
i18n.activate(locale);

// In route component:
return (
  <I18nProvider i18n={i18n}>
    <div lang={locale} dir={dir}>
      {/* ... */}
    </div>
  </I18nProvider>
);
```

#### 3.6 Remove Legacy Code

After migration is complete:

- Delete `apps/frontend/src/i18n/react.tsx` (replaced by Lingui)
- Delete `packages/i18n/src/scripts/generate-types.ts` (replaced by Lingui CLI)
- Delete `packages/i18n/src/types/generated.ts` (auto-generated by Lingui)
- Remove `intl-messageformat` dependency from `apps/frontend/package.json`
- Remove `@agenticverdict/i18n` dependency from `apps/frontend` (messages loaded directly)

**Exit criteria:** All 227+ call sites migrated, all tests passing, no references to legacy `useTranslations()`.

---

### Phase 4: Build Pipeline & CI Integration (Week 7)

**Objective:** Integrate Lingui into build pipeline and CI gates.

#### 4.1 Update Makefile

```makefile
.PHONY: i18n-extract i18n-compile i18n-check

i18n-extract:
	cd apps/frontend && pnpm lingui extract --clean

i18n-compile:
	cd apps/frontend && pnpm lingui compile --typescript
	cd packages/i18n && pnpm lingui compile --typescript

i18n-check: i18n-extract i18n-compile
	@echo "i18n extraction and compilation complete"
```

#### 4.2 Update package.json Scripts

```json
{
  "scripts": {
    "prebuild": "pnpm lingui:compile",
    "pretypecheck": "pnpm lingui:compile",
    "i18n:extract": "lingui extract --clean",
    "i18n:compile": "lingui compile --typescript",
    "i18n:check": "pnpm i18n:extract && pnpm i18n:compile"
  }
}
```

#### 4.3 CI Integration

Add i18n validation step to CI workflow:

```yaml
# .github/workflows/ci.yml
- name: i18n Validation
  run: |
    make i18n-check
    pnpm run test:unit -- --grep i18n
    # Verify no uncommitted changes after extraction
    git diff --exit-code -- '**/messages.*' || (echo "Run 'make i18n-extract' and commit changes" && exit 1)
```

#### 4.4 Preserve Existing Quality Checks

The following existing validation tools should be adapted to work with Lingui catalogs:

| Tool               | Current File                   | Adaptation                                         |
| ------------------ | ------------------------------ | -------------------------------------------------- |
| Translation parity | `translation-parity.test.ts`   | Update to read Lingui message catalogs             |
| Locale quality     | `locale-quality.test.ts`       | Update placeholder parity checks for Lingui format |
| Structural CI      | `locale-structural-ci.test.ts` | Update to use Lingui compiled catalogs             |

**Exit criteria:** CI pipeline includes i18n extraction/compilation check. All existing quality tests pass with Lingui catalogs.

---

### Phase 5: Testing & Validation (Week 8)

**Objective:** Comprehensive testing of migrated i18n system.

#### 5.1 Unit Tests

- Update all existing i18n tests in `packages/i18n/src/*.test.ts`
- Add tests for Lingui macro compilation
- Test ICU plural/select rendering for all 5 locales

#### 5.2 RTL Validation

- Verify Arabic (`ar`) RTL rendering with Lingui
- Test BiDi isolation for mixed-direction content
- Verify `dir="rtl"` on `<html>` element for Arabic locale

#### 5.3 Integration Tests

- Test locale switching via route (`/$locale`)
- Test locale detection and redirect (`/` → `/$locale`)
- Test SPA mode (`pnpm build:spa`) with Lingui
- Test SSR mode with Lingui message loading

#### 5.4 Visual Regression

- Screenshot comparison for all 5 locales on key pages
- Verify no layout shifts from translation length differences
- Test Arabic text rendering (connected script, RTL)

#### 5.5 Performance Benchmarks

| Metric             | Before (Custom)            | After (Lingui)        | Target            |
| ------------------ | -------------------------- | --------------------- | ----------------- |
| Bundle size (i18n) | `intl-messageformat` ~45KB | `@lingui/core` ~8KB   | < 15KB            |
| Type check time    | ~8s (large union types)    | ~5s (generated types) | < 10s             |
| First paint (SSR)  | Baseline                   | ≤ Baseline + 50ms     | ≤ Baseline + 50ms |

**Exit criteria:** All tests passing, performance benchmarks met, visual regression verified.

---

### Phase 6: Cleanup & Documentation (Week 9)

**Objective:** Remove legacy code, update documentation, finalize migration.

#### 6.1 Remove Legacy Files

```
# Delete
apps/frontend/src/i18n/react.tsx
apps/frontend/src/i18n/types.ts
packages/i18n/src/scripts/generate-types.ts
packages/i18n/src/scripts/find-dead-keys.ts
packages/i18n/src/types/generated.ts

# Keep (non-i18n utilities)
packages/i18n/src/formatters.ts
packages/i18n/src/language-detection.ts
packages/i18n/src/locale-quality.ts
packages/i18n/src/translation-parity.ts
packages/i18n/src/rtl.ts
packages/i18n/src/bidi.ts
packages/i18n/src/document-direction.ts
packages/i18n/src/typography.ts
packages/i18n/src/message-merge.ts
```

#### 6.2 Update Documentation

- Update `/docs/research/compile-time-i18n-validation.md` — mark as superseded
- Create new `/docs/research/i18n-architecture.md` — document Lingui setup
- Update `packages/i18n/README.md` — reflect new Lingui-based architecture
- Update `AGENTS.md` if i18n patterns are referenced

#### 6.3 Update Makefile

Remove references to unimplemented scripts (`i18n:extract`, `i18n:validate`) and replace with Lingui targets.

#### 6.4 Git Hygiene

- Commit each phase separately for easy rollback
- Include Lingui-generated files in `.gitignore` where appropriate
- Tag migration completion: `git tag i18n-migration-complete`

**Exit criteria:** No references to legacy i18n system. Documentation updated. Clean git history.

---

## 6. Risk Assessment & Mitigation

| Risk                                                   | Likelihood | Impact | Mitigation                                                                        |
| ------------------------------------------------------ | ---------- | ------ | --------------------------------------------------------------------------------- |
| ICU syntax incompatibility in edge cases               | Low        | Medium | Audit all ICU patterns in Phase 1.1; manual fix for edge cases                    |
| 227+ call site migration takes longer than estimated   | Medium     | High   | Phase 3 is 3 weeks; use codemod for simple cases, manual for complex              |
| TypeScript performance degradation with large catalogs | Low        | Medium | Lingui's compile-time approach avoids runtime type overhead; monitor tsc times    |
| Arabic RTL rendering regressions                       | Low        | High   | Dedicated RTL testing in Phase 5.2; visual regression screenshots                 |
| Breaking changes in Lingui API (post-v6)               | Low        | Low    | Pin to `^6.0.0`; monitor release notes; test on major version bumps               |
| Translation key loss during conversion                 | Low        | High   | Automated parity test before/after conversion; manual spot-check of all 5 locales |
| Worker/CLI contexts break with Lingui                  | Low        | Medium | Phase 2 tests `I18nManager` in isolation before frontend migration                |
| Bundle size increase                                   | Very Low   | Low    | Lingui compiles messages at build time; tree-shaking removes unused messages      |

---

## 7. Dependencies & Prerequisites

| Dependency              | Version | Purpose                        |
| ----------------------- | ------- | ------------------------------ |
| `@lingui/core`          | ^6.0.0  | Core i18n engine               |
| `@lingui/react`         | ^6.0.0  | React integration              |
| `@lingui/cli`           | ^6.0.0  | Message extraction/compilation |
| `@lingui/vite-plugin`   | ^6.0.0  | Vite build integration         |
| `@lingui/macro`         | ^6.0.0  | Compile-time macros            |
| `@lingui/eslint-plugin` | ^6.0.0  | Lint-time validation           |
| `babel-plugin-macros`   | ^3.1.0  | Macro runtime support          |

---

## 8. Migration Timeline

| Phase                   | Duration    | Start  | End    | Dependencies |
| ----------------------- | ----------- | ------ | ------ | ------------ |
| 0: Preparation          | 1 week      | Week 1 | Week 1 | None         |
| 1: Message Catalogs     | 1 week      | Week 2 | Week 2 | Phase 0      |
| 2: Shared Package       | 1 week      | Week 3 | Week 3 | Phase 1      |
| 3: Frontend Components  | 3 weeks     | Week 4 | Week 6 | Phase 2      |
| 4: Build & CI           | 1 week      | Week 7 | Week 7 | Phase 3      |
| 5: Testing & Validation | 1 week      | Week 8 | Week 8 | Phase 4      |
| 6: Cleanup & Docs       | 1 week      | Week 9 | Week 9 | Phase 5      |
| **Total**               | **9 weeks** |        |        |              |

---

## 9. Rollback Plan

If migration encounters critical blockers:

1. **Feature flag approach** — Keep legacy `useTranslations()` alongside Lingui during migration, gated by feature flag
2. **Per-namespace migration** — Migrate one namespace at a time; each namespace is independently testable
3. **Git branch isolation** — All migration work on `feat/i18n-lingui-migration` branch; main branch unaffected until merge
4. **Parallel catalog support** — During transition, both legacy JSON and Lingui catalogs coexist; loader chooses based on feature flag

---

## 10. Success Criteria

- [ ] All 227+ React call sites migrated to Lingui macros
- [ ] All 5 locale catalogs converted and validated (100% key parity with pre-migration state)
- [ ] `I18nManager` in worker/CLI contexts functional with Lingui core
- [ ] All existing i18n tests passing
- [ ] CI pipeline includes i18n extraction/compilation gate
- [ ] Bundle size for i18n reduced or maintained (target: ≤ current `intl-messageformat` footprint)
- [ ] Arabic RTL rendering verified with no regressions
- [ ] TypeScript compilation time not degraded
- [ ] No references to legacy `useTranslations()` or `intl-messageformat` in frontend
- [ ] Documentation updated to reflect Lingui architecture

---

## 11. References

- [Lingui Documentation](https://lingui.dev/)
- [Lingui v6.0 Release Notes](https://lingui.dev/blog/2026/04/22/announcing-lingui-6.0)
- [Lingui Vite Plugin](https://lingui.dev/ref/vite-plugin)
- [Lingui Monorepo Guide](https://lingui.dev/guides/monorepo)
- [Lingui vs i18next Comparison](https://lingui.dev/misc/i18next)
- [Lingui Explicit vs Generated IDs](https://lingui.dev/guides/explicit-vs-generated-ids)
- [ICU MessageFormat Specification](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [i18next TypeScript Documentation](https://www.i18next.com/overview/typescript)
- [next-intl Documentation](https://next-intl.dev/)
- [FormatJS Documentation](https://formatjs.io/)
- [Current i18n Research](./compile-time-i18n-validation.md)
