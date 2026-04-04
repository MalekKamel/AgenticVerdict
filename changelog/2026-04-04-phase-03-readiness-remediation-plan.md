# Remediation Plan: Phase 03 Readiness Gaps

**Date:** 2026-04-04
**Priority:** Non-Blocking Improvements
**Estimated Total Effort:** 4-6 hours

---

## Overview

This plan addresses minor gaps identified during Phase 03 readiness verification. All items are **non-blocking** but recommended for code quality and maintainability.

---

## Priority 1: Quick Fixes (< 30 minutes)

### R-15: Fix Config Lint Errors

**Status:** 🔴 Open
**Effort:** 5 minutes
**File:** `packages/config/src/schemas/branding.ts:183`

**Issue:**

```typescript
// Line 183 has unused variables n5 and n6
```

**Action:**
Remove unused variables or prefix with underscore:

```typescript
// Option 1: Remove if truly unused
// Option 2: Prefix with underscore if kept for future use
const _n5 = ...
const _n6 = ...
```

**Verification:**

```bash
pnpm --filter @agenticverdict/config lint
```

---

## Priority 2: Test Coverage Improvements (2-3 hours)

### R-16: Improve Data Quality Test Coverage

**Status:** 🔴 Open
**Effort:** 2-3 hours
**Current Coverage:** 40.74%
**Target Coverage:** 70%+

**File:** `packages/agent-runtime/src/validation/data-quality.test.ts`

**Missing Test Cases:**

1. `validateAnalysisResult` function - no tests exist
2. Error case testing (missing fields, invalid values)
3. Warning scenarios (low confidence, missing recommendations)
4. Edge cases (empty arrays, null values)
5. Validation scoring system

**Test Plan:**

```typescript
describe("validateAnalysisResult", () => {
  it("should validate complete analysis result", () => {
    // Test valid analysis with insights and verdicts
  });

  it("should return error for empty insights array", () => {
    // Test analysis with no insights
  });

  it("should return error for empty verdicts array", () => {
    // Test analysis with no verdicts
  });

  it("should aggregate quality scores correctly", () => {
    // Test score calculation
  });

  it("should handle missing required fields", () => {
    // Test schema validation errors
  });
});

describe("validateInsight - Edge Cases", () => {
  it("should warn on low confidence insights", () => {
    // Test confidence threshold warnings
  });

  it("should validate description length", () => {
    // Test min/max description length
  });

  it("should handle missing optional fields", () => {
    // Test with minimal valid insight
  });
});
```

**Verification:**

```bash
pnpm --filter @agenticverdict/agent-runtime exec vitest run --coverage src/validation/data-quality.test.ts
```

**Success Criteria:**

- Coverage ≥ 70%
- All functions tested
- Edge cases covered

---

### R-17: Add Config Schema Unit Tests

**Status:** 🔴 Open
**Effort:** 1-2 hours
**Files to Create:**

- `packages/config/src/schemas/template.test.ts`
- `packages/config/src/schemas/branding.test.ts`

**Test Plan for template.test.ts:**

```typescript
describe("templateConfigSchema", () => {
  it("should validate complete template config", () => {
    // Test full valid config
  });

  it("should require id and name", () => {
    // Test required fields
  });

  it("should validate section ordering", () => {
    // Test section order array
  });

  it("should export valid JSON schema", () => {
    // Test exportTemplateConfigJsonSchema
  });
});
```

**Test Plan for branding.test.ts:**

```typescript
describe("designTokensSchema", () => {
  it("should validate complete design tokens", () => {
    // Test full valid tokens
  });

  it("should generate valid CSS variables", () => {
    // Test designTokensToCssVariables
  });

  it("should generate valid Mantine theme", () => {
    // Test mantineThemeFromDesignTokens
  });

  it("should use default tokens for partial input", () => {
    // Test default merging
  });
});
```

---

## Priority 3: TypeScript Fixes (1-2 hours)

### R-18: Fix Platform-Adapters Test File Type Errors

**Status:** 🔴 Open
**Effort:** 1-2 hours
**Impact:** Unblocks full monorepo typecheck

**Files with Errors:**

1. `src/ga4/data-client.test.ts:71` - Tuple type issue
2. `src/ga4/ga4-adapter.test.ts:76,99` - fetch.mock type issues
3. `src/ga4/ga4.integration.test.ts:24` - Missing `expect` global
4. `src/gbp/gbp.integration.test.ts:28` - Missing `expect` global
5. `src/google/http.test.ts:34,40,46` - Error.code type issue
6. `src/gsc/gsc.integration.test.ts:25` - Missing `expect` global
7. `src/meta/meta-adapter.test.ts` - Multiple `RequestInfo` references (deprecated)
8. `src/tiktok/*.test.ts` - Multiple `RequestInfo` references

**Fix Strategy:**

1. **Add vitest globals to integration test files:**

```typescript
// Add to top of each *.integration.test.ts file
import { expect } from "vitest";
```

2. **Fix RequestInfo references:**

```typescript
// Before
mockResolvedValueOnce({} as Response);

// After - type fetch properly
const mockFetch = vi.fn() as ReturnType<typeof vi.fn>;
```

3. **Fix Error.code type issue:**

```typescript
// Before
expect(error.code).toBe("SOME_CODE");

// After - use type assertion or proper error type
const err = error as NodeJS.ErrnoException;
expect(err.code).toBe("SOME_CODE");
```

4. **Fix tuple type issue:**

```typescript
// Before - accessing index 0 of empty tuple
// Need to see actual code context

// Likely fix - use proper array typing or conditional check
```

**Verification:**

```bash
pnpm --filter @agenticverdict/platform-adapters typecheck
pnpm --filter @agenticverdict/platform-adapters test
```

---

## Execution Timeline

### Week 1 (Before Phase 03 Start)

| Day     | Task                                    | Effort    |
| ------- | --------------------------------------- | --------- |
| Day 1   | R-15: Fix config lint errors            | 5 min     |
| Day 1   | R-18: Fix platform-adapters type errors | 1-2 hours |
| Day 2-3 | R-16: Improve data quality tests        | 2-3 hours |
| Day 4-5 | R-17: Add config schema tests           | 1-2 hours |

### Week 1 (During Phase 03)

- Continue any incomplete remediation tasks
- Address any new issues discovered during Phase 03 setup

---

## Success Criteria

### Definition of Done

- [ ] All lint checks pass across all packages
- [ ] Type check passes for all packages (including platform-adapters)
- [ ] Test coverage ≥ 70% for all critical components
- [ ] All new tests pass
- [ ] No TypeScript errors in production code

### Verification Commands

```bash
# Full verification
pnpm exec turbo run lint
pnpm exec turbo run typecheck
pnpm exec turbo run test -- --coverage

# Individual package verification
pnpm --filter @agenticverdict/config lint
pnpm --filter @agenticverdict/platform-adapters typecheck
pnpm --filter @agenticverdict/agent-runtime test -- --coverage src/validation/
```

---

## Risk Assessment

| Risk                           | Probability | Impact | Mitigation                         |
| ------------------------------ | ----------- | ------ | ---------------------------------- |
| Test fixes uncover bugs        | Low         | Medium | Run tests before each fix          |
| Type fixes require refactoring | Low         | Low    | Focus on test files only           |
| Coverage targets not met       | Low         | Low    | Can accept 65%+ with justification |

---

## Notes

1. **All tasks are non-blocking** for Phase 03 start
2. **Priority order** is recommended but flexible based on team availability
3. **Platform-adapters tests** are not critical for Phase 03 (Phase 01 concern)
4. **Data quality tests** are most important as they validate Phase 02 functionality

---

## References

- Main Verification Report: `changelog/2026-04-04-phase-03-readiness-verification-report.md`
- Original Remediation Plan: `docs/03-development-phases/REMEDIATION_PLAN.md`
- Phase 03 Planning: `docs/03-development-phases/phase-03-report-generation/`
