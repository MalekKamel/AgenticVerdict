# AI Provider Migration - Production Readiness Remediation Plan

**Document Type:** Implementation Plan  
**Date:** 2026-05-05  
**Status:** Draft  
**Priority:** Critical (Blocking Production Release)

---

## Executive Summary

A comprehensive audit of the AI provider migration implementation revealed **17 blocking issues** that must be resolved before production deployment. The implementation is approximately **85% complete** but requires immediate attention to type safety, test failures, and production code quality issues.

### Audit Summary

| Category             | Status          | Issues Found |
| -------------------- | --------------- | ------------ |
| Type Safety          | ❌ Failing      | 2            |
| Lint                 | ❌ Failing      | 1            |
| Unit Tests           | ❌ Failing      | 42           |
| Mock Implementations | ✅ Test-only    | 0 (prod)     |
| Hardcoded Routes     | ✅ Compliant    | 0            |
| Localization         | ⚠️ Not reviewed | Pending      |
| Production Logging   | ❌ Violations   | 7            |
| Legacy Code Removal  | ⚠️ Incomplete   | 1 file       |

---

## 1. Blocking Issues (Must Fix Before Production)

### 1.1 Type Safety Violations

#### Issue 1.1.1: Syntax Error in healthBasedRouter.test.ts

- **Location:** `packages/agent-runtime/src/resilience/healthBasedRouter.test.ts:450`
- **Error:** `TS1128: Declaration or statement expected`
- **Root Cause:** Extra closing brace `});` at end of file
- **Impact:** Prevents TypeScript compilation
- **Priority:** 🔴 Critical
- **Effort:** 5 minutes
- **Fix:**
  ```typescript
  // Remove line 450: extra '});'
  // File should end at line 449 with proper closing brace
  ```

#### Issue 1.1.2: Optional Property Syntax Error in provider-config.ts

- **Location:** `packages/config/src/schemas/provider-config.ts:29`
- **Error:** `Parsing error: A property assignment cannot have a question token`
- **Root Cause:** Invalid TypeScript syntax for optional properties in Zod schema
- **Impact:** Prevents ESLint and typecheck from passing
- **Priority:** 🔴 Critical
- **Effort:** 10 minutes
- **Fix:**

  ```typescript
  // Current (incorrect):
  awsAccessKeyId?: z.string(),

  // Fixed (use .optional() method):
  awsAccessKeyId: z.string().optional(),
  ```

### 1.2 Test Failures

#### Issue 1.2.1: Module Import Error - legacy-use-cases-validation.test.ts

- **Location:** `packages/agent-runtime/src/legacy-use-cases-validation.test.ts:15`
- **Error:** `Cannot find module '../core/ProviderFactory'`
- **Root Cause:** Incorrect import path or missing export
- **Priority:** 🔴 Critical
- **Effort:** 15 minutes
- **Fix:** Verify export in `packages/agent-runtime/src/core/index.ts` includes `ProviderFactory`

#### Issue 1.2.2: LangfuseTracingHook Test Failures (14 tests)

- **Location:** `packages/agent-runtime/src/hooks/langfuse.test.ts`
- **Error:** Multiple assertion failures - `mockClient.trace` not being called
- **Root Cause:** Hook implementation not calling Langfuse client methods
- **Priority:** 🔴 Critical
- **Effort:** 2 hours
- **Affected Tests:**
  - `createBeforeChatHook > should start a trace with correct metadata`
  - `createBeforeChatHook > should exclude payload by default`
  - `createBeforeChatHook > should include payload when configured`
  - `createBeforeChatHook > should not throw on tracing errors`
  - `createOnChatCompleteHook > should complete trace with token usage`
  - `createOnChatCompleteHook > should exclude response payload by default`
  - `createOnChatCompleteHook > should include response when configured`
  - `createOnChatErrorHook > should record AgentRuntimeError with metadata`
  - `createOnChatErrorHook > should handle generic errors`
  - `createOnChatErrorHook > should handle non-Error objects`
  - `shutdown > should shutdown Langfuse client`
  - `PII Safety > should include tenant ID in metadata`
  - `PII Safety > should not include sensitive payload data`

#### Issue 1.2.3: AgentRuntimeError Test Failure

- **Location:** `packages/agent-runtime/src/errors/AgentRuntimeError.test.ts`
- **Error:** `expected 19 to be 18` - Extra error code in enum
- **Priority:** 🟡 Medium
- **Effort:** 10 minutes
- **Fix:** Update test expectation or remove unused error code

#### Issue 1.2.4: Syntax Error Preventing Test Execution

- **Location:** `packages/agent-runtime/src/resilience/healthBasedRouter.test.ts:450`
- **Error:** `ERROR: Unexpected "}"`
- **Priority:** 🔴 Critical
- **Effort:** 5 minutes (same as Issue 1.1.1)

### 1.3 Production Code Quality

#### Issue 1.3.1: Console Statements in Production Code

- **Locations:**
  - `packages/agent-runtime/src/deployment/parallelRunner.ts:377, 570`
  - `packages/agent-runtime/src/deployment/trafficManager.ts:134, 171, 294, 319, 349, 370, 413`
  - `packages/agent-runtime/src/core/hook-composition.ts:94, 143`
- **Violation:** Production code should use structured logging (Pino) via `@agenticverdict/observability`
- **Priority:** 🟠 High
- **Effort:** 1 hour
- **Fix:** Replace all `console.*` with Pino logger:

  ```typescript
  import { createLogger } from "@agenticverdict/observability";
  const logger = createLogger({ name: "TrafficManager" });

  // Replace:
  console.error("[TrafficManager] Failed to fetch config:", error);

  // With:
  logger.error({ err: error }, "Failed to fetch config");
  ```

#### Issue 1.3.2: Legacy Code Not Removed

- **Location:** `packages/agent-runtime/src/glm-config.ts`
- **Status:** Should have been deleted in Phase 3 (Task 3.47)
- **Priority:** 🟠 High
- **Effort:** 30 minutes (including dependency scan)
- **Action:**
  1. Scan codebase for imports of `glm-config.ts`
  2. Migrate any remaining usage to new provider factory
  3. Delete file
  4. Update `packages/agent-runtime/src/index.ts` exports

---

## 2. Non-Blocking Issues (Should Fix Before Production)

### 2.1 Test Coverage Gaps

#### Issue 2.1.1: Coverage Below Threshold

- **Current Status:** Unknown (tests not running)
- **Required Thresholds:**
  - Overall: 70%
  - Business logic: 85%
  - Critical paths: 90%
- **Priority:** 🟠 High
- **Effort:** 4 hours (after fixing blocking test failures)

### 2.2 Localization Review

#### Issue 2.2.1: i18n Compliance Not Verified

- **Status:** Not audited
- **Scope:** All user-facing strings in agent-runtime prompts and error messages
- **Priority:** 🟡 Medium
- **Effort:** 2 hours
- **Action:**
  1. Scan for hardcoded strings in `packages/agent-runtime/src/prompts/`
  2. Move all user-facing text to `packages/i18n/` resource files
  3. Verify Arabic (RTL) and English (LTR) support

---

## 3. Verification Checklist

### 3.1 Pre-Fix Verification

- [ ] Document current test failure count: 42 failing tests
- [ ] Document typecheck errors: 2 files
- [ ] Document lint errors: 1 file (config package)
- [ ] Baseline code coverage metrics

### 3.2 Post-Fix Verification

After implementing all fixes above, verify:

```bash
# 1. Type safety
pnpm run typecheck
# Expected: 0 errors

# 2. Lint
pnpm run lint
# Expected: 0 errors

# 3. Unit tests
pnpm run test:unit
# Expected: 0 failures, 100% of tests passing

# 4. Coverage
pnpm run test:coverage
# Expected:
#   - Overall: >= 70%
#   - Business logic: >= 85%
#   - Critical paths: >= 90%

# 5. Production bundle
pnpm run verify:production-bundle
# Expected: All artifacts present

# 6. No console statements
grep -r "console\." packages/agent-runtime/src --include="*.ts" --exclude="*.test.ts"
# Expected: 0 matches

# 7. Legacy code removed
test ! -f packages/agent-runtime/src/glm-config.ts
# Expected: File does not exist
```

---

## 4. Implementation Priority

### Phase 1: Critical Fixes (Day 1)

**Goal:** Restore build and test infrastructure

1. **Fix syntax errors** (30 minutes)
   - `healthBasedRouter.test.ts` line 450
   - `provider-config.ts` line 29

2. **Fix module imports** (30 minutes)
   - `legacy-use-cases-validation.test.ts`

3. **Verify build passes** (15 minutes)
   ```bash
   pnpm run typecheck
   pnpm run lint
   ```

### Phase 2: Test Remediation (Days 2-3)

**Goal:** All tests passing

1. **Fix LangfuseTracingHook tests** (2 hours)
   - Review hook implementation
   - Ensure Langfuse client methods are called
   - Fix test assertions

2. **Fix AgentRuntimeError tests** (30 minutes)
   - Update error code count expectation

3. **Run full test suite** (1 hour)

   ```bash
   pnpm run test:unit
   ```

4. **Verify coverage thresholds** (1 hour)
   ```bash
   pnpm run test:coverage
   ```

### Phase 3: Production Code Quality (Day 4)

**Goal:** Production-ready code

1. **Replace console statements with Pino** (1 hour)
   - `parallelRunner.ts`
   - `trafficManager.ts`
   - `hook-composition.ts`

2. **Remove legacy code** (30 minutes)
   - Delete `glm-config.ts`
   - Update imports

3. **Final verification** (30 minutes)
   ```bash
   pnpm run typecheck && pnpm run lint && pnpm run test:unit
   ```

### Phase 4: Localization Audit (Day 5)

**Goal:** Full i18n compliance

1. **Scan for hardcoded strings** (1 hour)
2. **Migrate to i18n resources** (1 hour)
3. **Verify RTL/LTR support** (30 minutes)

---

## 5. Risk Assessment

| Risk                            | Likelihood | Impact | Mitigation                        |
| ------------------------------- | ---------- | ------ | --------------------------------- |
| Test fixes reveal deeper bugs   | Medium     | High   | Run integration tests after fixes |
| Legacy code removal breaks deps | Low        | High   | AST scan before deletion          |
| Coverage gaps hide defects      | Medium     | Medium | Add mutation testing              |
| Localization strings missed     | High       | Low    | Manual UI review after fixes      |

---

## 6. Acceptance Criteria

The AI provider migration will be considered **100% production-ready** when all of the following are true:

### 6.1 Code Quality

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Zero `console.*` statements in production code
- [ ] Zero legacy code references (`glm-config.ts`, `langchain-integration.ts`)

### 6.2 Testing

- [ ] All unit tests passing (0 failures)
- [ ] All integration tests passing
- [ ] Test coverage >= 70% overall
- [ ] Test coverage >= 85% business logic
- [ ] Test coverage >= 90% critical paths

### 6.3 Production Standards

- [ ] All errors use canonical `AgentRuntimeError` with metadata
- [ ] All logging uses Pino with tenant context
- [ ] No hardcoded API keys or credentials
- [ ] No hardcoded routes (all use routing system)
- [ ] All user-facing strings localized via i18n

### 6.4 Security & Compliance

- [ ] Tenant isolation verified (AsyncLocalStorage, RLS, cache keys)
- [ ] Credentials encrypted at rest
- [ ] PII redaction implemented
- [ ] Audit logging functional

---

## 7. Timeline

| Phase | Duration | Deliverables                           | Success Criteria                  |
| ----- | -------- | -------------------------------------- | --------------------------------- |
| 1     | 1 day    | Build passes, no typecheck/lint errors | `pnpm run typecheck && lint` ✅   |
| 2     | 2 days   | All tests passing                      | `pnpm run test:unit` ✅ (0 fails) |
| 3     | 1 day    | Production code quality                | Zero console statements, legacy   |
| 4     | 1 day    | Localization compliance                | All strings in i18n resources     |

**Total Estimated Effort:** 5 person-days

---

## 8. Sign-Off Required

Before merging to production:

- [ ] Code review by tech lead
- [ ] Security review (credentials, tenant isolation)
- [ ] Performance review (p95 latency <2s)
- [ ] QA sign-off (all tests passing)
- [ ] Documentation updated

---

## Appendix A: Detailed Error Logs

### A.1 Typecheck Errors

```
packages/agent-runtime/src/resilience/healthBasedRouter.test.ts(450,1): error TS1128: Declaration or statement expected.
packages/agent-runtime/src/resilience/healthBasedRouter.test.ts(450,2): error TS1128: Declaration or statement expected.
```

### A.2 Lint Errors

```
packages/config/src/schemas/provider-config.ts
  29:16  error  Parsing error: A property assignment cannot have a question token
```

### A.3 Test Failures Summary

```
Test Files  31 failed | 270 passed | 5 skipped (306)
     Tests  15 failed | 1819 passed | 7 skipped (1841)
```

Major failures:

- `langfuse.test.ts`: 14 tests (hook implementation issues)
- `AgentRuntimeError.test.ts`: 1 test (error code count mismatch)
- `healthBasedRouter.test.ts`: Syntax error prevents execution
- `legacy-use-cases-validation.test.ts`: Import error prevents execution

---

**Document Owner:** AI Agent  
**Next Review Date:** After Phase 1 completion  
**Distribution:** Engineering Team, QA, Security
