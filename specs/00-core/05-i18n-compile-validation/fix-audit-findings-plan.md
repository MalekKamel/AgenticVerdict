# Fix Audit Findings - Zero Localization Issues

## Problem Statement

The i18n compile-time validation implementation found **38 pre-existing frontend type errors** caused by invalid namespace references in frontend code that don't exist in `en.json`. These fall into two categories:

1. **Missing namespaces in en.json** - Keys referenced by frontend code under namespaces like `components.*`, `settings.*`, `admin.*`, `billing.*`, `models.*`, `integrations.*`, `reports.*`, `monitoring.*`, `playground.*`, `apiKeys.*`, `auditLogs.*`, `dataRetention.*`, `knowledgeBase.*`, `legal.*`, `workspaces.*`, `auth.*` (sub-keys), `common.*` (sub-keys) that aren't defined in the canonical locale file
2. **Orphaned locale keys** - Keys in `en.json` that are never referenced in frontend code (82 dead keys found by the detection script)

## Goals

- Zero TypeScript errors from i18n namespace/key mismatches
- All frontend `useTranslations()` calls use valid namespaces
- All `i18n.t()` calls use valid `MessageKey` types
- No dead keys in `en.json` (or documented exceptions with justification)
- Complete translation parity across all 5 locales (en, ar, es, fr, zh)

## Audit Findings Breakdown

### Category A: Missing Namespaces (38 errors)

Based on the audit, these namespaces are used in frontend code but missing from `en.json`:

| Namespace | Approx. Errors | Source Files |
|-----------|---------------|--------------|
| `components.*` | ~8 | Various component files |
| `settings.*` | ~6 | Settings pages |
| `admin.*` | ~4 | Admin panel |
| `billing.*` | ~3 | Billing pages |
| `models.*` | ~3 | Model management |
| `integrations.*` | ~3 | Integration settings |
| `reports.*` | ~2 | Report pages |
| `monitoring.*` | ~2 | Monitoring dashboard |
| `playground.*` | ~2 | AI playground |
| `apiKeys.*` | ~1 | API key management |
| `auditLogs.*` | ~1 | Audit log viewer |
| `dataRetention.*` | ~1 | Data retention settings |
| `knowledgeBase.*` | ~1 | Knowledge base |
| `legal.*` | ~1 | Legal pages |
| `workspaces.*` | ~1 | Workspace settings |
| `auth.*` (missing sub-keys) | ~2 | Auth flows |
| `common.*` (missing sub-keys) | ~2 | Shared components |

### Category B: Dead Keys (82 keys)

Keys defined in `en.json` but never used in code. These need to be either:
- Removed (if truly unused)
- Kept with documented justification (if used dynamically)
- Wired up to actual code (if intended but not yet connected)

### Category C: Translation Parity Gaps

Keys that exist in `en.json` but are missing or have different structure in other locales (ar, es, fr, zh).

## Implementation Plan

### Phase 1: Audit & Inventory (Discovery)

#### T001: Generate Complete Frontend Key Usage Report
- Run `extract-i18n-keys.ts` to get definitive list of all keys used in frontend
- Output to `apps/frontend/.i18n-reports/usage-report.json` with file:line mappings
- **Acceptance**: JSON file with all keys, their namespaces, and source locations

#### T002: Generate Complete en.json Key Inventory
- Parse `en.json` to get all keys with their full paths
- Cross-reference with usage report to identify:
  - Keys in code but NOT in en.json (38 errors)
  - Keys in en.json but NOT in code (82 dead keys)
  - Keys in both (healthy)
- **Acceptance**: Cross-reference report with three categories

#### T003: Generate Per-Locale Parity Report
- For each locale (ar, es, fr, zh), compare structure against en.json
- Identify missing keys, extra keys, and placeholder mismatches
- **Acceptance**: Parity report per locale

#### T004: Categorize Missing Namespaces by Priority
- Group missing namespaces by:
  - **P0**: Actively used in production routes (auth, common, settings)
  - **P1**: Used in feature pages (admin, billing, models, integrations)
  - **P2**: Used in secondary features (reports, monitoring, playground)
  - **P3**: Used in edge cases (apiKeys, auditLogs, dataRetention, knowledgeBase, legal, workspaces)
- **Acceptance**: Prioritized list with file counts per namespace

### Phase 2: Fix Missing Namespaces (P0 - Critical)

#### T005: Add `common.*` Missing Sub-keys
- Identify which `common.*` keys are used but missing
- Add them to `en.json` with proper translations
- Add to all other locales (ar, es, fr, zh)
- **Acceptance**: Zero type errors for `common.*` namespace

#### T006: Add `auth.*` Missing Sub-keys
- Identify which `auth.*` keys are used but missing
- Add them to `en.json` with proper translations
- Add to all other locales
- **Acceptance**: Zero type errors for `auth.*` namespace

#### T007: Add `components.*` Namespace
- Identify all `components.*` keys used in frontend
- Add namespace to `en.json` with all referenced keys
- Add to all other locales
- **Acceptance**: Zero type errors for `components.*` namespace

#### T008: Add `settings.*` Namespace
- Identify all `settings.*` keys used in frontend
- Add namespace to `en.json`
- Add to all other locales
- **Acceptance**: Zero type errors for `settings.*` namespace

### Phase 3: Fix Missing Namespaces (P1 - High Priority)

#### T009: Add `admin.*` Namespace
- Identify all `admin.*` keys used in frontend
- Add namespace to `en.json` and all locales
- **Acceptance**: Zero type errors for `admin.*` namespace

#### T010: Add `billing.*` Namespace
- Identify all `billing.*` keys used in frontend
- Add namespace to `en.json` and all locales
- **Acceptance**: Zero type errors for `billing.*` namespace

#### T011: Add `models.*` Namespace
- Identify all `models.*` keys used in frontend
- Add namespace to `en.json` and all locales
- **Acceptance**: Zero type errors for `models.*` namespace

#### T012: Add `integrations.*` Namespace
- Identify all `integrations.*` keys used in frontend
- Add namespace to `en.json` and all locales
- **Acceptance**: Zero type errors for `integrations.*` namespace

### Phase 4: Fix Missing Namespaces (P2 - Medium Priority)

#### T013: Add `reports.*` Namespace
- Identify all `reports.*` keys used in frontend
- Add namespace to `en.json` and all locales
- **Acceptance**: Zero type errors for `reports.*` namespace

#### T014: Add `monitoring.*` Namespace
- Identify all `monitoring.*` keys used in frontend
- Add namespace to `en.json` and all locales
- **Acceptance**: Zero type errors for `monitoring.*` namespace

#### T015: Add `playground.*` Namespace
- Identify all `playground.*` keys used in frontend
- Add namespace to `en.json` and all locales
- **Acceptance**: Zero type errors for `playground.*` namespace

### Phase 5: Fix Missing Namespaces (P3 - Low Priority)

#### T016: Add Remaining Namespaces
- `apiKeys.*`
- `auditLogs.*`
- `dataRetention.*`
- `knowledgeBase.*`
- `legal.*`
- `workspaces.*`
- Add each to `en.json` and all locales
- **Acceptance**: Zero type errors for all remaining namespaces

### Phase 6: Resolve Dead Keys

#### T017: Classify Dead Keys
For each of the 82 dead keys, classify as:
- **Remove**: Truly unused, safe to delete
- **Keep-Dynamic**: Used via dynamic key construction (document the usage location)
- **Wire-Up**: Intended for future feature, create tracking issue

#### T018: Remove Confirmed Dead Keys
- Delete all keys classified as "Remove" from:
  - `en.json`
  - `ar.json`
  - `es.json`
  - `fr.json`
  - `zh.json`
- Regenerate types
- **Acceptance**: Dead key count reduced to zero (or only documented dynamic keys)

#### T019: Document Dynamic Key Usage
- For keys kept due to dynamic usage, add code comments at usage site:
  ```ts
  // i18n-dead-key: key is used dynamically via tDynamic()
  ```
- Create `packages/i18n/docs/dead-keys-justification.md` listing each kept key and why
- **Acceptance**: Every remaining dead key has documented justification

### Phase 7: Translation Parity

#### T020: Fill Missing Keys in ar.json
- Add all keys from en.json that are missing in ar.json
- Use placeholder translation (English text) if Arabic translation not available
- **Acceptance**: ar.json has same key structure as en.json

#### T021: Fill Missing Keys in es.json
- Add all keys from en.json that are missing in es.json
- **Acceptance**: es.json has same key structure as en.json

#### T022: Fill Missing Keys in fr.json
- Add all keys from en.json that are missing in fr.json
- **Acceptance**: fr.json has same key structure as en.json

#### T023: Fill Missing Keys in zh.json
- Add all keys from en.json that are missing in zh.json
- **Acceptance**: zh.json has same key structure as en.json

### Phase 8: Verification & Cleanup

#### T024: Run Full Type Check
- Run `pnpm --filter @agenticverdict/frontend typecheck`
- Verify zero i18n-related type errors
- **Acceptance**: Clean typecheck output

#### T025: Run Dead Key Detection
- Run `pnpm --filter @agenticverdict/i18n validate:dead-keys`
- Verify zero dead keys (or only documented exceptions)
- **Acceptance**: Clean dead key report

#### T026: Run Translation Parity Check
- Run `pnpm --filter @agenticverdict/i18n test -- translation-parity`
- Verify all locales match en.json structure
- **Acceptance**: All parity tests pass

#### T027: Run Full Test Suite
- Run `pnpm test` across all packages
- **Acceptance**: All tests pass, no regressions

#### T028: Run CI Gates Locally
- Run all CI i18n gates locally:
  ```bash
  pnpm --filter @agenticverdict/i18n generate:types && git diff --exit-code
  pnpm --filter @agenticverdict/i18n validate:dead-keys
  pnpm --filter @agenticverdict/i18n test
  pnpm --filter @agenticverdict/frontend i18n:extract
  ```
- **Acceptance**: All gates pass

## Execution Order

```
Phase 1 (T001-T004) → Discovery
     ↓
Phase 2 (T005-T008) → P0 Critical fixes
     ↓
Phase 3 (T009-T012) → P1 High priority fixes
     ↓
Phase 4 (T013-T015) → P2 Medium priority fixes
     ↓
Phase 5 (T016)      → P3 Low priority fixes
     ↓
Phase 6 (T017-T019) → Dead key resolution
     ↓
Phase 7 (T020-T023) → Translation parity
     ↓
Phase 8 (T024-T028) → Verification
```

## Parallel Execution Opportunities

- T001, T002, T003 can run in parallel (independent reports)
- T005-T008 can run in parallel (independent namespaces)
- T009-T012 can run in parallel
- T013-T015 can run in parallel
- T020-T023 can run in parallel (independent locales)

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Missing translations for non-English locales | Use English placeholder text, mark with `// TODO: translate` comment |
| Dynamic key usage broken by type enforcement | Use `tDynamic()` escape hatch, document usage |
| Large PR difficult to review | Split into multiple PRs by phase |
| Breaking existing functionality | Run full test suite after each phase |

## Success Criteria

1. ✅ Zero TypeScript errors from i18n namespaces/keys
2. ✅ Zero dead keys (or all documented with justification)
3. ✅ 100% translation parity across all 5 locales
4. ✅ All CI i18n gates passing
5. ✅ All tests passing (93+ tests)
6. ✅ Documentation updated with any exceptions

## Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | T001-T004 | 30 min |
| Phase 2 | T005-T008 | 1-2 hours |
| Phase 3 | T009-T012 | 1-2 hours |
| Phase 4 | T013-T015 | 1 hour |
| Phase 5 | T016 | 30 min |
| Phase 6 | T017-T019 | 1 hour |
| Phase 7 | T020-T023 | 1-2 hours |
| Phase 8 | T024-T028 | 30 min |
| **Total** | **28 tasks** | **6-9 hours** |

## Notes

- This plan assumes the 38 type errors and 82 dead keys identified in the audit are accurate
- Actual numbers may vary after running the discovery phase
- Translation quality is out of scope; this plan focuses on structural completeness
- For non-English translations, English placeholder text is acceptable as a temporary measure
