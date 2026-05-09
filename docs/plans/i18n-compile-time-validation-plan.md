# Implementation Plan: Compile-Time i18n Validation

> Date: 2026-05-15
> Status: Draft
> Related Research: `/docs/research/compile-time-i18n-validation.md`

---

## Overview

This plan implements compile-time localization validation for the AgenticVerdict monorepo by completing the existing (but unimplemented) type generation pipeline, wiring types into runtime APIs, and adding CI enforcement gates.

**Design principle:** Complete the existing skeleton rather than introduce new dependencies. The `types/generated.ts` file, `PlaceholderMap`, and documented scripts already define the target architecture.

---

## Phase 1: Type Generation Pipeline (Foundation)

**Goal:** Make `generate:types` functional and ensure `types/generated.ts` stays in sync with `en.json`.

### Task 1.1: Implement `generate:types` Script

**File:** `packages/i18n/src/scripts/generate-types.ts`

**Description:** TypeScript script that reads `src/locales/en.json`, flattens nested keys to dot-notation, extracts ICU placeholders, and generates `src/types/generated.ts`.

**Generated types:**

- `MessageKey` — Union of all valid dot-notation keys
- `NamespaceType` — Union of top-level namespaces
- `NamespaceKeys<N>` — Mapped type for keys within a namespace
- `PlaceholderMap` — ICU placeholder names per key

**Acceptance Criteria:**

- [ ] Script reads `en.json` and produces valid TypeScript
- [ ] Output matches the existing `types/generated.ts` format
- [ ] Script is idempotent (running twice produces identical output)
- [ ] Script handles nested JSON flattening correctly
- [ ] Script extracts ICU placeholders (`{name}`, `{count, plural, ...}`)
- [ ] `package.json` includes `"generate:types": "tsx src/scripts/generate-types.ts"`

**Dependencies:** None

**Estimated effort:** 2-3 hours

---

### Task 1.2: Wire `generate:types` into Package Scripts

**File:** `packages/i18n/package.json`

**Description:** Add the missing scripts documented in the README.

**Changes:**

```json
{
  "scripts": {
    "generate:types": "tsx src/scripts/generate-types.ts",
    "validate:dead-keys": "tsx src/scripts/find-dead-keys.ts",
    "pretypecheck": "pnpm generate:types",
    "prebuild": "pnpm generate:types"
  }
}
```

**Acceptance Criteria:**

- [ ] `pnpm --filter @agenticverdict/i18n generate:types` runs successfully
- [ ] `pnpm --filter @agenticverdict/i18n typecheck` auto-generates types first
- [ ] `pnpm --filter @agenticverdict/i18n build` auto-generates types first

**Dependencies:** Task 1.1

**Estimated effort:** 30 minutes

---

### Task 1.3: Add `@agenticverdict/i18n/types` Export

**File:** `packages/i18n/package.json` (exports field)

**Description:** Expose generated types via subpath export so downstream packages can import them.

**Changes:**

```json
{
  "exports": {
    "./types": "./src/types/generated.ts"
  }
}
```

**Acceptance Criteria:**

- [ ] `import type { MessageKey } from "@agenticverdict/i18n/types"` works in any package
- [ ] TypeScript resolves the subpath correctly

**Dependencies:** Task 1.1

**Estimated effort:** 15 minutes

---

## Phase 2: Type Enforcement at Call Sites

**Goal:** Constrain `t()` and `useTranslations()` to accept only valid keys, enabling compile-time errors for invalid keys.

### Task 2.1: Type-Safe `I18nManager.t()`

**File:** `packages/i18n/src/i18n-manager.ts`

**Description:** Change the `t()` method signature from `t(key: string)` to `t(key: MessageKey)` with an overload for dynamic keys.

**Implementation:**

```typescript
import type { MessageKey } from "./types/generated";

export class I18nManager {
  // Static key lookup — fully type-safe
  t(key: MessageKey, fallback?: string): string;
  // Dynamic key escape hatch — explicit opt-in
  tDynamic(key: string, fallback?: string): string;
}
```

**Acceptance Criteria:**

- [ ] `i18n.t("auth.login.title")` compiles and autocompletes
- [ ] `i18n.t("nonexistent.key")` produces a TypeScript error
- [ ] `i18n.tDynamic(dynamicKey)` compiles without error
- [ ] Existing code using `I18nManager` still compiles (may need `tDynamic` migration for dynamic cases)

**Dependencies:** Phase 1

**Estimated effort:** 1-2 hours

---

### Task 2.2: Type-Safe `useTranslations()`

**File:** `apps/frontend/src/i18n/react.tsx`

**Description:** Constrain the namespace parameter to `NamespaceType` and the key parameter to namespace-scoped keys.

**Implementation:**

```typescript
import type { NamespaceType, NamespaceKeys, PlaceholderMap } from "@agenticverdict/i18n/types";

// Typed namespace — only valid namespaces accepted
export function useTranslations<N extends NamespaceType>(namespace: N) {
  // Return typed translate function
  const translate = useCallback(
    <K extends Extract<NamespaceKeys<N>, string>>(
      key: K,
      values?: PlaceholderValues<K>
    ) => { ... },
    [locale, messages, namespace],
  );
  return translate;
}
```

**Key design decisions:**

- `NamespaceKeys<N>` extracts keys belonging to a specific namespace
- `PlaceholderValues<K>` (Phase 2.4) maps keys to their required interpolation values
- Backward compatibility: keep `TranslationNamespace = string` as fallback during migration

**Acceptance Criteria:**

- [ ] `useTranslations("auth")` compiles; `useTranslations("nonexistent")` errors
- [ ] `t("login.title")` compiles within `useTranslations("auth")` context
- [ ] `t("nonexistent.key")` produces TypeScript error
- [ ] Existing 227+ call sites still compile (gradual migration path)

**Dependencies:** Phase 1

**Estimated effort:** 2-3 hours

---

### Task 2.3: Migrate Existing Call Sites to Typed APIs

**Scope:** All files using `I18nManager.t()` and `useTranslations()`

**Description:** Systematically update call sites to use typed variants. Use `tDynamic()` only where keys are genuinely dynamic.

**Migration strategy:**

1. Run `pnpm typecheck` to identify all call sites with invalid keys
2. Fix invalid keys (typos, removed keys, etc.)
3. For genuinely dynamic keys, replace `t()` with `tDynamic()`
4. Verify no type errors remain

**Acceptance Criteria:**

- [ ] Zero TypeScript errors related to i18n keys across all packages
- [ ] All dynamic key usages use `tDynamic()` with documented justification
- [ ] `pnpm run typecheck` passes for the entire monorepo

**Dependencies:** Tasks 2.1, 2.2

**Estimated effort:** 4-6 hours (depends on number of invalid keys found)

---

### Task 2.4: ICU Placeholder Type Validation (Optional Enhancement)

**File:** `packages/i18n/src/types/generated.ts` and `i18n-manager.ts`

**Description:** Extend the type system to validate that `t()` calls provide the correct interpolation values matching `PlaceholderMap`.

**Implementation:**

```typescript
type PlaceholderValues<K extends MessageKey> = PlaceholderMap[K] extends never
  ? []
  : [values: { [P in PlaceholderMap[K]]: string | number }];

// Usage:
i18n.t("auth.forgotPassword.buttons.retryCountdown", { seconds: 30 }); // OK
i18n.t("auth.forgotPassword.buttons.retryCountdown", { minutes: 30 }); // Error
i18n.t("actions.save"); // No values needed
```

**Acceptance Criteria:**

- [ ] Keys with no placeholders accept no values argument
- [ ] Keys with placeholders require matching values object
- [ ] Extra or missing placeholder values produce TypeScript errors
- [ ] Plural/select ICU syntax is handled correctly

**Dependencies:** Tasks 2.1, 2.2

**Estimated effort:** 3-4 hours

**Risk:** Medium — complex conditional types may slow TypeScript compilation. Evaluate performance impact before enabling monorepo-wide.

---

## Phase 3: Dead Key Detection & Static Analysis

**Goal:** Identify translation keys defined in locale files but never used in code.

### Task 3.1: Implement `find-dead-keys` Script

**File:** `packages/i18n/src/scripts/find-dead-keys.ts`

**Description:** Script that scans all source files for i18n key usage patterns and compares against `MessageKey` to find unused keys.

**Approach:**

1. Parse all `.ts`, `.tsx` files using `ts-morph` or regex patterns
2. Extract all string literals matching i18n key patterns:
   - `i18n.t("...")`
   - `t("...")` within `useTranslations()` context
   - Template literals with i18n prefixes
3. Compare extracted keys against `MessageKey` union
4. Report keys in locale files that are never referenced

**Acceptance Criteria:**

- [ ] Script outputs a list of unused keys with file locations
- [ ] Script excludes keys used in dynamic patterns (documented exceptions)
- [ ] Script runs in <30 seconds for the full monorepo
- [ ] `package.json` includes `"validate:dead-keys": "tsx src/scripts/find-dead-keys.ts"`

**Dependencies:** Phase 1

**Estimated effort:** 3-4 hours

---

### Task 3.2: Implement Frontend Key Extraction

**File:** `apps/frontend/src/scripts/extract-i18n-keys.ts`

**Description:** Scan frontend source code to find all i18n key usages and generate a report.

**Output format:**

```json
{
  "totalKeys": 847,
  "namespaces": {
    "auth": 123,
    "dashboard": 89,
    ...
  },
  "dynamicKeys": 12,
  "files": {
    "src/features/auth/LoginPage.tsx": ["auth.login.title", "auth.login.emailLabel"],
    ...
  }
}
```

**Acceptance Criteria:**

- [ ] Script scans all frontend `.ts`/`.tsx` files
- [ ] Output includes namespace breakdown and file-level key references
- [ ] Dynamic keys are flagged separately
- [ ] Makefile target `frontend-i18n-extract` works

**Dependencies:** Task 3.1 (shared extraction logic)

**Estimated effort:** 2-3 hours

---

## Phase 4: CI Enforcement Gates

**Goal:** Prevent invalid i18n state from reaching production.

### Task 4.1: Type Freshness Gate

**File:** `.github/workflows/ci.yml` (or equivalent CI configuration)

**Description:** CI step that verifies `types/generated.ts` matches what `generate:types` would produce from the current `en.json`.

**Implementation:**

```yaml
- name: Verify i18n types are up to date
  run: |
    pnpm --filter @agenticverdict/i18n generate:types
    git diff --exit-code packages/i18n/src/types/generated.ts \
      || (echo "ERROR: types/generated.ts is stale. Run 'pnpm generate:types' and commit." && exit 1)
```

**Acceptance Criteria:**

- [ ] CI fails if `en.json` changes without regenerating types
- [ ] Error message tells developer exactly what command to run

**Dependencies:** Phase 1

**Estimated effort:** 30 minutes

---

### Task 4.2: Translation Parity Gate

**Description:** CI step that runs `assertAllLocalesHaveSameKeys()` to ensure all locale files have identical key sets.

**Implementation:**

```yaml
- name: Validate translation parity
  run: pnpm --filter @agenticverdict/i18n exec tsx -e "import { assertAllLocalesHaveSameKeys } from './src/translation-parity'; assertAllLocalesHaveSameKeys()"
```

**Acceptance Criteria:**

- [ ] CI fails if any locale is missing keys compared to `en.json`
- [ ] CI fails if any locale has extra keys not in `en.json`
- [ ] Error message lists missing/extra keys

**Dependencies:** None (existing `translation-parity.ts` already implements this)

**Estimated effort:** 15 minutes

---

### Task 4.3: Structural Quality Gate

**Description:** CI step that runs `assertStructuralLocaleQuality()` for each non-reference locale.

**Implementation:**

```yaml
- name: Validate locale structural quality
  run: pnpm --filter @agenticverdict/i18n exec tsx -e "
    import { assertStructuralLocaleQuality, targetLocales } from './src/locale-quality';
    for (const loc of targetLocales()) { assertStructuralLocaleQuality(loc); }
  "
```

**Acceptance Criteria:**

- [ ] CI fails on placeholder mismatches between locales
- [ ] CI flags likely untranslated strings (identical to English source)
- [ ] Error message includes issue code and affected keys

**Dependencies:** None (existing `locale-quality.ts` already implements this)

**Estimated effort:** 15 minutes

---

### Task 4.4: Dead Key Report (Informational)

**Description:** CI step that runs `validate:dead-keys` and outputs a report. This is informational — it should NOT fail the build.

**Implementation:**

```yaml
- name: Report unused i18n keys
  run: pnpm --filter @agenticverdict/i18n validate:dead-keys
  continue-on-error: true
```

**Acceptance Criteria:**

- [ ] CI outputs dead key report as artifact or log
- [ ] Build does not fail on dead keys (informational only)
- [ ] Report can be promoted to a hard gate in the future

**Dependencies:** Task 3.1

**Estimated effort:** 15 minutes

---

## Phase 5: Documentation & Developer Experience

**Goal:** Ensure developers understand the new workflow and can use it effectively.

### Task 5.1: Update i18n Package README

**File:** `packages/i18n/README.md`

**Description:** Update documentation to reflect implemented scripts, type safety patterns, and CI gates.

**Acceptance Criteria:**

- [ ] README accurately describes all implemented scripts
- [ ] Examples show typed usage patterns
- [ ] Migration guide for dynamic keys is included
- [ ] CI gate documentation is accurate

**Dependencies:** All previous phases

**Estimated effort:** 1-2 hours

---

### Task 5.2: Update AGENTS.md or Developer Onboarding Docs

**Description:** Add i18n workflow to developer onboarding materials.

**Acceptance Criteria:**

- [ ] New developers know to run `generate:types` after modifying `en.json`
- [ ] CI gate failure modes are documented
- [ ] Dead key cleanup process is described

**Dependencies:** All previous phases

**Estimated effort:** 30 minutes

---

## Dependency Graph

```
Phase 1: Type Generation Pipeline
├── 1.1 generate:types script
├── 1.2 Package script wiring          → 1.1
└── 1.3 Types subpath export           → 1.1

Phase 2: Type Enforcement
├── 2.1 Type-safe I18nManager.t()      → Phase 1
├── 2.2 Type-safe useTranslations()    → Phase 1
├── 2.3 Migrate call sites             → 2.1, 2.2
└── 2.4 ICU placeholder validation     → 2.1, 2.2 (optional)

Phase 3: Dead Key Detection
├── 3.1 find-dead-keys script          → Phase 1
└── 3.2 Frontend key extraction        → 3.1

Phase 4: CI Gates
├── 4.1 Type freshness gate            → Phase 1
├── 4.2 Translation parity gate        → (existing code)
├── 4.3 Structural quality gate        → (existing code)
└── 4.4 Dead key report                → 3.1

Phase 5: Documentation
└── 5.1, 5.2                           → All previous phases
```

---

## Phased Rollout Strategy

### Sprint 1: Foundation (Phase 1)

- Implement `generate:types` script
- Wire into package scripts
- Add types subpath export
- **Milestone:** `pnpm generate:types` produces correct output

### Sprint 2: Enforcement (Phase 2)

- Type-safe `I18nManager.t()` with `tDynamic()` escape hatch
- Type-safe `useTranslations()` with namespace scoping
- Migrate existing call sites
- **Milestone:** `pnpm typecheck` catches invalid i18n keys

### Sprint 3: Analysis (Phase 3)

- Dead key detection script
- Frontend key extraction
- **Milestone:** Dead key report generated successfully

### Sprint 4: CI Gates (Phase 4)

- Type freshness, parity, quality gates
- Dead key informational report
- **Milestone:** CI pipeline blocks invalid i18n state

### Sprint 5: Polish (Phase 5)

- Documentation updates
- Developer onboarding
- **Milestone:** All docs accurate and complete

---

## Risk Assessment

| Risk                                      | Likelihood | Impact | Mitigation                                                           |
| ----------------------------------------- | :--------: | :----: | -------------------------------------------------------------------- |
| Large `MessageKey` union slows TypeScript |   Medium   | Medium | Monitor compile times; split into per-namespace unions if needed     |
| Existing code has many invalid keys       |   Medium   |  Low   | Use `tDynamic()` escape hatch during migration; fix incrementally    |
| ICU placeholder types too complex         |    Low     | Medium | Make Phase 2.4 optional; enable only if compile times are acceptable |
| Dynamic key patterns break type safety    |    Low     |  Low   | `tDynamic()` escape hatch with dev-mode warnings                     |
| Lingui migration conflicts                |    Low     | Medium | Keep Lingui artifacts isolated; evaluate migration separately        |

---

## Success Metrics

1. **Zero runtime i18n key errors** in production (measured via error tracking)
2. **100% of `t()` calls** use typed keys (no `tDynamic()` without justification)
3. **CI gates catch 100%** of stale type, parity, and quality issues
4. **Dead key count** decreases over time (trend, not absolute target)
5. **Developer feedback** — i18n key autocomplete works in IDE

---

## Future Considerations

1. **Lingui migration** — Evaluate whether the incomplete Lingui artifacts in `src/locales/es/` indicate a planned migration. If so, coordinate this work with the Lingui team.
2. **Translation Management System (TMS) integration** — Consider integrating with Lokalise, Crowdin, or Phrase for automated translation workflows.
3. **Per-tenant overrides** — Extend type system to validate tenant-specific override files.
4. **ICU message syntax validation** — Add compile-time validation of ICU MessageFormat syntax in locale files.
