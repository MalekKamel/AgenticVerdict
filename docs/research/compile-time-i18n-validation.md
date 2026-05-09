# Compile-Time i18n Validation: Research Findings

> Date: 2026-05-15
> Scope: AgenticVerdict monorepo — `/packages/i18n/` and `apps/frontend/`

---

## 1. Current State Analysis

### 1.1 Architecture Summary

| Aspect                    | Current Implementation                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Locale format**         | Nested JSON (`src/locales/{locale}.json`), flattened to dot-notation at load time                         |
| **Supported locales**     | `en`, `ar`, `es`, `fr`, `zh` (5 total)                                                                    |
| **Key count**             | ~1,262 keys in `types/generated.ts`                                                                       |
| **Runtime interpolation** | `intl-messageformat` (frontend only); `I18nManager.t()` returns raw strings                               |
| **Type definitions**      | `MessageKey`, `NamespaceType`, `NamespaceKeys<N>`, `PlaceholderMap` in `types/generated.ts`               |
| **Type enforcement**      | **None** — `I18nManager.t(key: string)` and `useTranslations(namespace: string)` accept arbitrary strings |
| **Generation script**     | Documented in README but **not implemented** (`generate:types` missing from `package.json`)               |
| **Dead key detection**    | Documented but **not implemented** (`validate:dead-keys` missing from `package.json`)                     |
| **CI gates**              | Documented but **not implemented**                                                                        |

### 1.2 Key Pain Points

1. **Types exist but are not wired** — `MessageKey` union type is generated but `t()` accepts `string`, so TypeScript cannot catch invalid keys.
2. **No generation pipeline** — `types/generated.ts` is stale; adding keys to `en.json` does not auto-update types.
3. **No dead key detection** — Removed/renamed keys in code leave orphan entries in locale files.
4. **No frontend extraction** — `i18n:extract` and `i18n:validate` Makefile targets reference scripts that do not exist.
5. **Namespace typing is `string`** — `TranslationNamespace = string` provides zero compile-time safety.

---

## 2. Industry Standards & Best Practices

### 2.1 Type-Safe i18n Patterns

The industry has converged on three primary approaches for compile-time i18n validation:

#### Approach A: Generated Type Unions (Most Common)

Generate a TypeScript union type from the reference locale file, then constrain the `t()` function signature to accept only valid keys.

**Examples:**

- **next-intl**: Uses `getTranslations()` with typed namespaces and keys derived from JSON messages
- **react-i18next**: `useTranslation()` with `CustomTypeOptions` to override key types
- **FormatJS/IntlMessageFormat**: TypeScript plugin for type-checking ICU message syntax

**Pros:**

- Zero runtime overhead
- Full IDE autocomplete support
- Works with any JSON-based locale format
- Easy to understand and maintain

**Cons:**

- Requires regeneration step when locale files change
- Large union types can slow TypeScript compilation (>2,000 keys)
- Dynamic keys require explicit escape hatches (`as MessageKey` or `tDynamic()`)

#### Approach B: Template Literal Types (Advanced)

Use TypeScript's template literal types to create nested key paths from the JSON structure, enabling autocomplete at each level of the key hierarchy.

**Examples:**

- **typesafe-i18n**: Generates nested type maps from locale files
- **i18next-ts**: Uses recursive conditional types for nested key access

**Pros:**

- Hierarchical autocomplete (`t("auth").("login").("title")`)
- No flat key enumeration needed
- Better DX for deeply nested keys

**Cons:**

- Significantly higher TypeScript compilation cost
- Complex type definitions are harder to debug
- Not compatible with dot-notation key patterns without flattening

#### Approach C: Static Analysis + ESLint (CI-Focused)

Use AST-based linting to scan source code for translation key usage and compare against locale files.

**Examples:**

- **i18next-parser**: Extracts keys from source code via Babel/TypeScript parsers
- **eslint-plugin-i18next**: Lints for missing keys, unused keys, and hardcoded strings
- **custom AST scanners**: Project-specific scripts using `ts-morph` or `@typescript-eslint`

**Pros:**

- No type system overhead
- Can detect unused keys across the entire codebase
- Works with dynamic key patterns (via regex/AST analysis)
- CI-friendly with clear pass/fail output

**Cons:**

- No IDE autocomplete (unless paired with type generation)
- Slower than type-checking (full AST parse required)
- False positives with dynamic/concatenated keys

---

### 2.2 Tooling Evaluation

| Tool                       |    Type Safety     |  Key Extraction   | ICU Support | Monorepo Ready | DX Score |
| -------------------------- | :----------------: | :---------------: | :---------: | :------------: | :------: |
| **Custom type generation** |     Excellent      |   Manual script   |   Partial   |      Yes       |   High   |
| **i18next-parser**         | Good (with plugin) |     Automatic     |    Full     |      Yes       |   High   |
| **typescript-i18n-plugin** |        Good        |  N/A (IDE only)   |    None     |    Limited     |  Medium  |
| **Lingui**                 |     Excellent      | Automatic (macro) |    Full     |      Yes       |   High   |
| **FormatJS CLI**           |        Good        |     Automatic     |    Full     |      Yes       |  Medium  |
| **typesafe-i18n**          |     Excellent      |     Automatic     |    Full     |      Yes       |  Medium  |
| **eslint-plugin-i18next**  |        None        |     Automatic     |   Partial   |      Yes       |  Medium  |

#### Detailed Analysis

**1. Custom Type Generation (Recommended for AgenticVerdict)**

The AgenticVerdict codebase already has the skeleton for this approach (`types/generated.ts` with `MessageKey`, `NamespaceType`, `PlaceholderMap`). Completing this pipeline is the lowest-risk path.

- **Implementation effort**: Low (scripts documented but not written)
- **Migration cost**: Zero (existing types are compatible)
- **Runtime overhead**: None
- **CI integration**: Simple `tsc --noEmit` + diff check

**2. i18next-parser**

Extracts translation keys from source code using Babel or TypeScript parsers. Can generate locale file skeletons and detect missing keys.

- **Fit for AgenticVerdict**: Moderate — the codebase uses a custom `useTranslations` pattern, not i18next's `useTranslation`
- **Would require**: Adapter layer or custom pattern configuration
- **Best use case**: If migrating to i18next in the future

**3. typescript-i18n-plugin**

A TypeScript language service plugin that provides IDE autocomplete for i18n keys.

- **Fit for AgenticVerdict**: Low — requires `tsconfig.json` plugin configuration, incompatible with some build tools
- **Limitation**: IDE-only; no CI enforcement
- **Best use case**: Supplement to type generation, not a replacement

**4. Lingui**

Full-featured i18n framework with compile-time extraction via Babel macros.

- **Fit for AgenticVerdict**: Low — would require replacing the entire i18n runtime
- **Already present**: Lingui artifacts exist in `src/locales/es/` (incomplete migration)
- **Best use case**: If doing a full i18n framework migration

**5. FormatJS CLI**

Part of the FormatJS ecosystem (same team as `intl-messageformat` which AgenticVerdict already uses).

- **Fit for AgenticVerdict**: Moderate — compatible with ICU MessageFormat
- **Would require**: Adopting FormatJS's message extraction patterns
- **Best use case**: If standardizing on FormatJS ecosystem

**6. typesafe-i18n**

Zero-runtime-overhead type-safe i18n library with automatic type generation.

- **Fit for AgenticVerdict**: Low — would require replacing the runtime API
- **Best use case**: Greenfield projects or full i18n rewrites

**7. eslint-plugin-i18next**

ESLint plugin for detecting i18n issues.

- **Fit for AgenticVerdict**: Low — designed for i18next-specific patterns
- **Alternative**: Custom ESLint rule or `ts-morph`-based scanner

---

## 3. Trade-Off Analysis

### 3.1 Type-Safe Key Generation vs. Static Analysis Linting vs. CI Validation

| Dimension                  |      Type Generation       | Static Analysis (ESLint) | CI Pipeline |
| -------------------------- | :------------------------: | :----------------------: | :---------: |
| **Catch missing keys**     |      At compile time       |       At lint time       | At CI time  |
| **Catch unused keys**      | No (needs separate script) |           Yes            |     Yes     |
| **IDE autocomplete**       |            Yes             |            No            |     No      |
| **Runtime overhead**       |            None            |           None           |    None     |
| **Setup complexity**       |            Low             |          Medium          |     Low     |
| **Dynamic key support**    |    Escape hatch needed     |     Pattern matching     |     N/A     |
| **False positive rate**    |          Very low          |          Medium          |     Low     |
| **Monorepo compatibility** |         Excellent          |           Good           |  Excellent  |

### 3.2 Recommended Hybrid Approach

For AgenticVerdict, the optimal strategy combines all three:

1. **Type generation** (primary) — Wire existing `MessageKey` types into `t()` and `useTranslations()` for compile-time validation and IDE autocomplete.
2. **Static analysis** (secondary) — Implement dead key detection script to find unused translation keys.
3. **CI validation** (enforcement) — Add pipeline gates for type freshness, translation parity, and structural quality.

---

## 4. Dynamic Key Interpolation Safety

### 4.1 Current Patterns in Codebase

The AgenticVerdict codebase uses these dynamic key patterns:

1. **Static keys (preferred)**: `t("auth.login.title")` — fully typeable
2. **Namespace + dynamic sub-key**: `useTranslations("auth")` then `t("login.title")` — namespace can be typed, sub-key can be typed
3. **Fully dynamic keys**: `t(dynamicKey)` — requires escape hatch

### 4.2 Safe Handling Strategies

| Pattern                          | Strategy                          |   Type Safety    |
| -------------------------------- | --------------------------------- | :--------------: |
| `t("static.key.path")`           | Constrain to `MessageKey`         |       Full       |
| `t(\`dynamic.\${segment}.key\`)` | Template literal type narrowing   |     Partial      |
| `t(dynamicVariable)`             | `tDynamic()` with runtime warning | None (by design) |
| `t("key", { returnNull: true })` | Overloaded typed signature        |       Full       |

### 4.3 ICU Placeholder Validation

The existing `PlaceholderMap` type maps each key to its expected placeholder variables. This can be extended to validate that `t()` calls provide the correct values:

```typescript
// Current (not enforced):
t("auth.forgotPassword.buttons.retryCountdown", { seconds: 30 });

// Future (type-enforced):
t("auth.forgotPassword.buttons.retryCountdown", { seconds: 30 }); // OK
t("auth.forgotPassword.buttons.retryCountdown", { minutes: 30 }); // Error: 'minutes' not in PlaceholderMap
```

This requires conditional type mapping that pairs each `MessageKey` with its `PlaceholderMap` entry — feasible but adds complexity. Recommended for Phase 2.

---

## 5. Monorepo-Specific Considerations

### 5.1 Package Boundaries

| Package                     |  i18n Usage   |   Type Source   |
| --------------------------- | :-----------: | :-------------: |
| `packages/i18n`             | Core library  | Generates types |
| `apps/frontend`             |  React hooks  | Consumes types  |
| `packages/report-generator` | `I18nManager` | Consumes types  |
| `apps/api`                  |  Server-side  | Consumes types  |
| `apps/worker`               |  Server-side  | Consumes types  |
| `apps/desktop`              | Electron app  | Consumes types  |

### 5.2 Type Distribution Strategy

Types generated in `packages/i18n` must be consumable by all downstream packages:

1. **Export from `@agenticverdict/i18n/types`** — Already documented in README, needs implementation
2. **Re-export from `@agenticverdict/i18n`** — Add to main `index.ts`
3. **Frontend adapter** — `apps/frontend/src/i18n/` should re-export typed variants

### 5.3 Build Order

```
packages/i18n (generate types) → packages/report-generator → apps/frontend → apps/api → apps/worker
```

Type generation must run before any dependent package's typecheck step.

---

## 6. Relevant Precedents

### 6.1 Open Source Projects

- **Vercel's next-intl**: Uses JSON-based message files with automatic type inference. Types are derived at build time from message files.
- **Shopify's Polaris**: Generates TypeScript types from translation JSON files, constrains all translation calls to valid keys.
- **GitLab's i18n**: Uses `i18next-parser` for key extraction, custom scripts for dead key detection, CI gates for parity.

### 6.2 Enterprise Patterns

- **Stripe**: Custom type generation from YAML locale files, strict type enforcement at all call sites, no dynamic keys allowed in production code.
- **Airbnb**: Uses FormatJS with compile-time extraction, ICU placeholder validation, and CI-based dead key reporting.

---

## 7. Summary of Recommendations

| Priority | Recommendation                                                   | Rationale                                                                   |
| -------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **P0**   | Implement `generate:types` script                                | Types already exist; wiring them up is lowest-effort, highest-impact change |
| **P0**   | Wire `MessageKey` into `I18nManager.t()` and `useTranslations()` | Enables compile-time validation with zero runtime cost                      |
| **P1**   | Implement `validate:dead-keys` script                            | Catches unused keys, reduces locale file bloat                              |
| **P1**   | Add CI gates for type freshness and parity                       | Prevents stale types from reaching production                               |
| **P2**   | ICU placeholder type validation                                  | Catches mismatched interpolation variables                                  |
| **P2**   | Frontend key extraction script                                   | Detects keys used in code but missing from locale files                     |
| **P3**   | Consider Lingui migration evaluation                             | Lingui artifacts already exist; evaluate if full migration is worthwhile    |
