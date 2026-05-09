# Tasks: Compile-Time i18n Validation

**Input**: `/docs/plans/i18n-compile-time-validation-plan.md`, `/docs/research/compile-time-i18n-validation.md`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md

**Tests**: This phase includes unit tests for the type generation script and dead key detection. Tests are MANDATORY for the generation pipeline to ensure correctness.

**Organization**: Tasks are grouped by implementation phase to enable incremental delivery and validation at each checkpoint.

## Format: `[ID] [P?] [Phase] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Phase]**: Which phase this task belongs to (P1, P2, P3, P4, P5)
- Include exact file paths in descriptions

## Path Conventions

- **i18n package**: `packages/i18n/src/` for source, `packages/i18n/src/scripts/` for tooling scripts
- **Frontend app**: `apps/frontend/src/i18n/` for React hooks and adapters
- **CI config**: `.github/workflows/` or equivalent pipeline configuration

---

## Phase 1: Type Generation Pipeline (Foundation)

**Purpose**: Make `generate:types` functional and ensure `types/generated.ts` stays in sync with `en.json`.

**⚠️ CRITICAL**: No type enforcement work can begin until this phase is complete.

### Tests for Phase 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T001 [P] [P1] Unit test for JSON flattening logic in packages/i18n/src/scripts/generate-types.test.ts
- [ ] T002 [P] [P1] Unit test for ICU placeholder extraction in packages/i18n/src/scripts/generate-types.test.ts
- [ ] T003 [P] [P1] Integration test for end-to-end type generation output in packages/i18n/src/scripts/generate-types.test.ts

### Implementation for Phase 1

- [ ] T004 Create `generate-types.ts` script in packages/i18n/src/scripts/generate-types.ts
  - Read `packages/i18n/src/locales/en.json`
  - Flatten nested JSON to dot-notation keys
  - Extract ICU placeholders (`{name}`, `{count, plural, ...}`)
  - Generate `MessageKey` union type
  - Generate `NamespaceType` union type
  - Generate `NamespaceKeys<N>` mapped type
  - Generate `PlaceholderMap` type mapping
  - Write output to `packages/i18n/src/types/generated.ts`
- [ ] T005 [P] [P1] Add `generate:types` script to packages/i18n/package.json
- [ ] T006 [P] [P1] Add `validate:dead-keys` placeholder script to packages/i18n/package.json
- [ ] T007 [P] [P1] Add `pretypecheck` hook to packages/i18n/package.json (runs `generate:types`)
- [ ] T008 [P] [P1] Add `prebuild` hook to packages/i18n/package.json (runs `generate:types`)
- [ ] T009 Add `@agenticverdict/i18n/types` subpath export to packages/i18n/package.json exports field
- [ ] T010 Run `pnpm --filter @agenticverdict/i18n generate:types` and verify output matches existing `types/generated.ts` format
- [ ] T011 [P] [P1] Add `tsx` dev dependency to packages/i18n/package.json if not present

**Checkpoint**: `pnpm generate:types` produces correct, up-to-date TypeScript types from `en.json`

---

## Phase 2: Type Enforcement at Call Sites

**Purpose**: Constrain `t()` and `useTranslations()` to accept only valid keys, enabling compile-time errors for invalid keys.

### Tests for Phase 2 (MANDATORY) ⚠️

- [ ] T012 [P] [P2] Unit test for type-safe `I18nManager.t()` in packages/i18n/src/i18n-manager.test.ts
- [ ] T013 [P] [P2] Type-level test: invalid key produces TypeScript error in packages/i18n/src/types/type-tests.ts

### Implementation for Phase 2

- [ ] T014 Update `I18nManager.t()` signature in packages/i18n/src/i18n-manager.ts
  - Import `MessageKey` from `./types/generated`
  - Add overloaded `t(key: MessageKey, fallback?: string): string` signature
  - Add `tDynamic(key: string, fallback?: string): string` escape hatch method
  - Preserve runtime behavior (fallback to key if missing)
- [ ] T015 Update `useTranslations()` signature in apps/frontend/src/i18n/react.tsx
  - Import `NamespaceType`, `NamespaceKeys` from `@agenticverdict/i18n/types`
  - Constrain `namespace` parameter to `NamespaceType`
  - Constrain `key` parameter to `Extract<NamespaceKeys<N>, string>`
  - Preserve `returnNull` and `defaultValue` option overloads
- [ ] T016 [P] [P2] Export typed `useNamespacedTranslations<N>()` hook from apps/frontend/src/i18n/react.tsx
- [ ] T017 Audit all `I18nManager.t()` call sites across packages (report-generator, api, worker, desktop)
- [ ] T018 Audit all `useTranslations()` call sites across apps/frontend/src/
- [ ] T019 Fix invalid keys found during audit (typos, removed keys, renamed keys)
- [ ] T020 Replace genuinely dynamic key usages with `tDynamic()` escape hatch
- [ ] T021 Run `pnpm run typecheck` across full monorepo and resolve all i18n type errors
- [ ] T022 [P] [P2] Add TypeScript type tests in packages/i18n/src/types/type-tests.ts to verify compile-time errors work

**Checkpoint**: `pnpm typecheck` catches invalid i18n keys; IDE autocomplete works for all `t()` calls

---

## Phase 2.5: ICU Placeholder Type Validation (Optional Enhancement)

**Purpose**: Extend type system to validate that `t()` calls provide correct interpolation values.

**Note**: Only implement if Phase 2 compile times are acceptable. Evaluate performance impact first.

- [ ] T023 [P] [P2.5] Define `PlaceholderValues<K>` conditional type in packages/i18n/src/types/generated.ts
- [ ] T024 Update `I18nManager.t()` to accept optional `values` parameter typed by `PlaceholderValues<K>`
- [ ] T025 Update `useTranslations()` return type to require values for keys with placeholders
- [ ] T026 Verify plural/select ICU syntax is handled correctly in type definitions
- [ ] T027 Measure TypeScript compile time impact; revert if >20% slowdown

**Checkpoint**: Keys with placeholders require matching values; extra/missing values produce errors

---

## Phase 3: Dead Key Detection & Static Analysis

**Purpose**: Identify translation keys defined in locale files but never used in code.

### Tests for Phase 3 (MANDATORY) ⚠️

- [ ] T028 [P] [P3] Unit test for dead key detection logic in packages/i18n/src/scripts/find-dead-keys.test.ts
- [ ] T029 [P] [P3] Unit test for frontend key extraction in apps/frontend/src/scripts/extract-i18n-keys.test.ts

### Implementation for Phase 3

- [ ] T030 Create `find-dead-keys.ts` script in packages/i18n/src/scripts/find-dead-keys.ts
  - Scan all `.ts`, `.tsx` files for `i18n.t("...")` and `t("...")` patterns
  - Extract all referenced keys (static string literals only)
  - Compare against `MessageKey` union from `types/generated.ts`
  - Report keys in locale files never referenced in code
  - Output: list of unused keys with namespace grouping
- [ ] T031 Update `validate:dead-keys` script in packages/i18n/package.json to run `find-dead-keys.ts`
- [ ] T032 [P] [P3] Create `extract-i18n-keys.ts` script in apps/frontend/src/scripts/extract-i18n-keys.ts
  - Scan all frontend `.ts`/`.tsx` files
  - Extract all i18n key usages with file locations
  - Generate JSON report with namespace breakdown, dynamic key count, file references
- [ ] T033 [P] [P3] Add `i18n:extract` script to apps/frontend/package.json
- [ ] T034 Update Makefile `frontend-i18n-extract` target to call new extraction script
- [ ] T035 [P] [P3] Add `i18n:validate` script to apps/frontend/package.json for key parity check
- [ ] T036 Update Makefile `frontend-i18n-validate` target to call new validation script
- [ ] T037 Run dead key detection and document findings (informational, not blocking)

**Checkpoint**: Dead key report generated; frontend key extraction produces accurate usage report

---

## Phase 4: CI Enforcement Gates

**Purpose**: Prevent invalid i18n state from reaching production.

- [ ] T038 [P] [P4] Add type freshness CI gate to `.github/workflows/ci.yml` (or equivalent)
  - Run `pnpm generate:types`
  - `git diff --exit-code` on `packages/i18n/src/types/generated.ts`
  - Fail build with clear error message if stale
- [ ] T039 [P] [P4] Add translation parity CI gate to `.github/workflows/ci.yml`
  - Run `assertAllLocalesHaveSameKeys()` from existing `translation-parity.ts`
  - Fail build if any locale is missing/extra keys vs `en.json`
- [ ] T040 [P] [P4] Add structural quality CI gate to `.github/workflows/ci.yml`
  - Run `assertStructuralLocaleQuality()` for each non-reference locale
  - Fail build on placeholder mismatches or likely untranslated strings
- [ ] T041 [P] [P4] Add dead key informational report to `.github/workflows/ci.yml`
  - Run `validate:dead-keys` with `continue-on-error: true`
  - Output as CI artifact or log (does NOT fail build)
- [ ] T042 Verify all CI gates work correctly by simulating failures (stale types, missing keys, etc.)

**Checkpoint**: CI pipeline blocks invalid i18n state; dead key report runs informatively

---

## Phase 5: Documentation & Developer Experience

**Purpose**: Ensure developers understand the new workflow and can use it effectively.

- [ ] T043 Update `packages/i18n/README.md`
  - Document all implemented scripts (`generate:types`, `validate:dead-keys`)
  - Show typed usage examples for `I18nManager.t()` and `useTranslations()`
  - Include migration guide for dynamic keys (`t()` → `tDynamic()`)
  - Document CI gate failure modes and resolution steps
  - Update directory structure to reflect actual file locations
- [ ] T044 [P] [P5] Update `AGENTS.md` or developer onboarding docs
  - Add i18n workflow to "Development Workflow" section
  - Document: "After modifying `en.json`, run `pnpm generate:types`"
  - Document CI gate failure resolution
  - Document dead key cleanup process
- [ ] T045 [P] [P5] Create `packages/i18n/docs/i18n-workflow.md` (if not in README)
  - Step-by-step guide for adding new translation keys
  - Step-by-step guide for removing unused keys
  - Troubleshooting common type errors
- [ ] T046 Run end-to-end validation: add a new key to `en.json`, regenerate types, use in frontend, verify CI passes

**Checkpoint**: All documentation accurate; new developer can follow workflow without guidance

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Type Generation)**: No dependencies — can start immediately. BLOCKS all subsequent phases.
- **Phase 2 (Type Enforcement)**: Depends on Phase 1 completion. BLOCKS Phase 2.5 and Phase 3.
- **Phase 2.5 (ICU Placeholders)**: Depends on Phase 2. Optional — skip if compile time impact is too high.
- **Phase 3 (Dead Key Detection)**: Depends on Phase 1 (needs generated types). Can run in parallel with Phase 2.
- **Phase 4 (CI Gates)**: Depends on Phase 1 (type freshness), Phase 3 (dead key report). Parity/quality gates use existing code.
- **Phase 5 (Documentation)**: Depends on all previous phases.

### Execution Strategy

```
Phase 1 (Foundation)
├── T001-T003: Tests [P] ──────────────────────────┐
├── T004: generate-types script                     │
├── T005-T011: Package wiring [P] ──────────────────┤ → Checkpoint 1
└── T010: Verify output                             │
                                                    │
Phase 2 (Enforcement)                               │
├── T012-T013: Tests [P] ───────────────────────────┤
├── T014: Type-safe I18nManager.t()                 │
├── T015-T016: Type-safe useTranslations() [P]      │
├── T017-T018: Audit call sites                     │
├── T019-T021: Fix & verify                         │ → Checkpoint 2
└── T022: Type tests [P]                            │
                                                    │
Phase 3 (Dead Keys)                                 │
├── T028-T029: Tests [P] ───────────────────────────┤
├── T030: find-dead-keys script                     │
├── T031: Wire validate:dead-keys                   │
├── T032-T036: Frontend extraction [P] ─────────────┤ → Checkpoint 3
└── T037: Run and document findings                 │
                                                    │
Phase 4 (CI Gates)                                  │
├── T038: Type freshness gate [P] ──────────────────┤
├── T039: Parity gate [P] ──────────────────────────┤
├── T040: Quality gate [P] ─────────────────────────┤ → Checkpoint 4
├── T041: Dead key report [P] ──────────────────────┤
└── T042: Verify all gates                          │
                                                    │
Phase 5 (Documentation)                             │
├── T043: Update README                             │
├── T044-T045: Onboarding docs [P] ─────────────────┤ → Checkpoint 5
└── T046: End-to-end validation                     │
```

### Parallel Opportunities

- All test tasks within a phase marked [P] can run in parallel
- Phase 1 package wiring tasks (T005-T011) can run in parallel after T004
- Phase 2 audit tasks (T017, T018) can run in parallel
- Phase 3 frontend extraction tasks (T032-T036) can run in parallel
- Phase 4 CI gate tasks (T038-T041) can all run in parallel
- Phase 5 documentation tasks (T044, T045) can run in parallel after T043
- Phase 3 can start as soon as Phase 1 completes (does not need Phase 2)

---

## Implementation Strategy

### Phase 1 Only (MVP)

1. Complete T001-T011 (Type Generation Pipeline)
2. **STOP and VALIDATE**: Run `pnpm generate:types`, verify output
3. Commit generated types
4. At this point: types are fresh, but NOT yet enforced at call sites

### Incremental Delivery

1. Complete Phase 1 → Types generated and fresh
2. Complete Phase 2 → Compile-time errors for invalid keys
3. Complete Phase 3 → Dead key detection and frontend extraction
4. Complete Phase 4 → CI gates prevent regressions
5. Complete Phase 5 → Documentation complete
6. Each phase adds value without breaking previous phases

### Parallel Team Strategy

With multiple developers:

1. Developer A: Phase 1 (Type Generation Pipeline)
2. Once Phase 1 completes:
   - Developer A: Phase 2 (Type Enforcement)
   - Developer B: Phase 3 (Dead Key Detection) — can start after Phase 1
3. Once Phase 2 and 3 complete:
   - Developer A: Phase 4 (CI Gates)
   - Developer B: Phase 5 (Documentation)
4. Phase 4 CI gates can be implemented in parallel

---

## Acceptance Criteria Summary

| Phase | Acceptance Criteria |
|-------|-------------------|
| **P1** | `pnpm generate:types` produces correct TypeScript from `en.json` |
| **P2** | `pnpm typecheck` catches invalid i18n keys; IDE autocomplete works |
| **P2.5** | Placeholder values are type-checked (optional) |
| **P3** | Dead key report generated; frontend key extraction works |
| **P4** | CI gates block stale types, missing keys, quality issues |
| **P5** | Documentation accurate; end-to-end workflow validated |

---

## Notes

- [P] tasks = different files, no dependencies
- [Phase] label maps task to specific phase for traceability
- Each phase should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate phase independently
- Avoid: vague tasks, same file conflicts, cross-phase dependencies that break independence
- **Type generation must be idempotent**: running twice produces identical output
- **Large union types warning**: If `MessageKey` exceeds ~2,000 entries, monitor TypeScript compile times and consider splitting into per-namespace unions
- **Dynamic key escape hatch**: `tDynamic()` should log a warning in development mode to encourage migration to typed keys
