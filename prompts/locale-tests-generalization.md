# Refactor Arabic-Only Locale Tests to Cover All Locales

## Context

The following files currently contain tests scoped exclusively to the Arabic locale:

- `/packages/i18n/src/arabic-locale-quality.test.ts`
- `/packages/i18n/src/arabic-locale-quality.ts`
- `/packages/i18n/src/arabic-structural-ci.test.ts`

These tests validate locale quality and structural integrity but are hardcoded to Arabic, leaving all other locales untested.

## Objective

Refactor and generalize the existing Arabic-specific tests into a locale-agnostic test suite that validates **all available locales** with 100% coverage.

## Tasks

1. **Audit**: Identify all supported locales in the i18n package and catalog their configurations
2. **Rename**: Remove Arabic-specific naming from files, test suites, and helper functions (e.g., `arabic-locale-quality` → `locale-quality`)
3. **Parameterize**: Refactor test assertions to iterate over all available locales dynamically rather than targeting a single locale
4. **Extract Helpers**: Move any Arabic-specific logic into shared utilities that accept a locale parameter
5. **Validate**: Ensure every locale passes all quality and structural checks with zero failures

## Acceptance Criteria

- All files are renamed to reflect locale-agnostic scope
- Every supported locale is tested automatically without manual configuration
- Test coverage reaches 100% of available locales
- No locale-specific hardcoded assumptions remain in the test suite
- Existing CI pipelines continue to pass without modification

## Files to Modify

- `/packages/i18n/src/arabic-locale-quality.test.ts` → rename and refactor
- `/packages/i18n/src/arabic-locale-quality.ts` → rename and refactor
- `/packages/i18n/src/arabic-structural-ci.test.ts` → rename and refactor
