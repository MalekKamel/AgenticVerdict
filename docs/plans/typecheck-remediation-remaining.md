# TypeScript Typecheck Remediation Plan - Remaining Issues

**Created:** 2026-05-07  
**Updated:** 2026-05-07  
**Status:** Phase 1-2 Complete, Phase 3 In Progress  
**Priority:** High  
**Owner:** Engineering Team

---

## Executive Summary

Following completion of **Phases 1-2** (critical production fixes and provider SDK compatibility), **138 typecheck errors remain** in the `@agenticverdict/agent-runtime` package. These are primarily **database schema mismatches** and **service integration issues** requiring systematic alignment between service code and current database repositories.

### Progress Summary

| Phase                               | Status           | Errors Fixed | Errors Remaining |
| ----------------------------------- | ---------------- | ------------ | ---------------- |
| Phase 1: Critical Production Fixes  | ✅ Complete      | 7            | 0                |
| Phase 2: Provider SDK Compatibility | ✅ Complete      | 14           | 0                |
| Phase 3: Service Schema Alignment   | 🔄 In Progress   | 0            | 61 (production)  |
| Phase 4: Test File Cleanup          | ⏳ Pending       | 0            | 77 (test files)  |
| **Total**                           | **50% Complete** | **21**       | **138**          |

---

## Current Error Distribution

### By Package

| Package                         | Errors | Severity    | Effort |
| ------------------------------- | ------ | ----------- | ------ |
| `@agenticverdict/agent-runtime` | 138    | Medium-High | 8-12h  |
| `@agenticverdict/api`           | 100+   | Medium      | 6-8h   |
| `@agenticverdict/frontend`      | 20+    | Low         | 2-3h   |

### By File (Agent Runtime - Production Files Only)

| File                               | Errors | Category           | Priority |
| ---------------------------------- | ------ | ------------------ | -------- |
| `src/services/budget-alerts.ts`    | 23     | Schema Mismatch    | High     |
| `src/services/usage-tracker.ts`    | 16     | Schema Mismatch    | High     |
| `src/utils/credentials.ts`         | 12     | Database API       | High     |
| `src/core/HookExecutor.ts`         | 5      | Type Narrowing     | Medium   |
| `src/deployment/trafficManager.ts` | 5      | Import/Types       | Medium   |
| `src/deployment/parallelRunner.ts` | 2      | Missing Properties | Low      |

### By File (Agent Runtime - Test Files)

| File                                            | Errors | Priority |
| ----------------------------------------------- | ------ | -------- |
| `src/providers/openai-compatible/index.test.ts` | 17     | Low      |
| `src/utils/tenant-context.test.ts`              | 16     | Low      |
| `src/services/usage-tracker.test.ts`            | 15     | Low      |
| `src/hooks/langfuse.test.ts`                    | 9      | Low      |
| `src/utils/credentials.test.ts`                 | 2      | Low      |
| Other test files                                | 18     | Low      |

---

## Error Categories & Remediation

### Category 2A: Budget Alerts Service Schema Mismatch (23 errors)

**Root Cause:** Service code uses outdated database schema field names. Database schema evolved to use nested `notificationSettings` and different field structure.

**Affected File:** `packages/agent-runtime/src/services/budget-alerts.ts`

#### Missing Properties on `BudgetAlert` Type

| Old Field                          | New Field (Schema)                      | Location                |
| ---------------------------------- | --------------------------------------- | ----------------------- |
| `emailEnabled`                     | `notificationSettings.email.enabled`    | Line 344                |
| `emailRecipients`                  | `notificationSettings.email.recipients` | Line 344-345            |
| `webhookEnabled`                   | `notificationSettings.webhook.enabled`  | Line 380                |
| `webhookUrls`                      | `notificationSettings.webhook.urls`     | Line 380-381            |
| `budgetAmount`                     | `threshold.amount` or similar           | Line 390, 434, 441      |
| `currency`                         | `threshold.currency` or similar         | Line 392, 440, 441, 443 |
| `alertId` (in `AlertNotification`) | `id` or removed                         | Line 356, 367, 399, 410 |

#### Action Items

1. **Audit database schema** (`packages/database/src/schema/budget-alerts.ts`)
   - Identify current field structure
   - Document nested objects (`notificationSettings`, `threshold`, etc.)

2. **Update service types** to match schema

   ```typescript
   // Example fix pattern
   // BEFORE
   if (alert.emailEnabled && alert.emailRecipients?.length) {
     await sendEmail(alert.emailRecipients, {...});
   }

   // AFTER (schema-compliant)
   if (alert.notificationSettings?.email?.enabled &&
       alert.notificationSettings?.email?.recipients?.length) {
     await sendEmail(alert.notificationSettings.email.recipients, {...});
   }
   ```

3. **Update `AlertNotification` type**
   - Remove or rename `alertId` property
   - Align with actual notification payload structure

4. **Add type guards** for nullable fields
   ```typescript
   function hasEmailSettings(alert: BudgetAlert): alert is BudgetAlert & {
     notificationSettings: { email: { enabled: true; recipients: string[] } };
   } {
     return (
       alert.notificationSettings?.email?.enabled === true &&
       alert.notificationSettings.email.recipients?.length > 0
     );
   }
   ```

**Estimated Effort:** 2-3 hours  
**Risk:** Medium - requires schema verification  
**Testing:** Update service unit tests after fixes

---

### Category 2B: Usage Tracker Service Issues (16 errors)

**Root Cause:** Missing repository module exports and nullable database field handling.

**Affected File:** `packages/agent-runtime/src/services/usage-tracker.ts`

#### Specific Issues

| Line    | Error                                                               | Fix Strategy                                   |
| ------- | ------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| 1       | Cannot find module `@agenticverdict/database/repositories/ai-usage` | Verify repository exists, check barrel exports |
| 91-101  | `null` vs `undefined` type mismatches                               | Add null coalescing operators                  |
| 97      | `number                                                             | null`not assignable to`number`                 | Provide default value: `row.inputTokens ?? 0` |
| 114     | Array type incompatibility                                          | Map nullable fields to undefined or defaults   |
| 207-211 | Implicit `any` types in array callbacks                             | Add explicit type annotations                  |

#### Action Items

1. **Verify repository path**

   ```bash
   # Check if repository exists
   ls packages/database/src/repositories/ai-usage*

   # Check barrel exports
   cat packages/database/src/repositories/index.ts
   ```

2. **Update import path** if needed

   ```typescript
   // BEFORE (may be incorrect)
   import { aiUsageRepository } from "@agenticverdict/database/repositories/ai-usage";

   // AFTER (verify correct path)
   import { aiUsageRepository } from "@agenticverdict/database/repositories";
   // OR
   import { AiUsageRepository } from "@agenticverdict/database/repositories/ai-usage-repository";
   ```

3. **Add null coalescing for nullable DB fields**

   ```typescript
   // BEFORE
   inputTokens: row.inputTokens,

   // AFTER
   inputTokens: row.inputTokens ?? 0,
   outputTokens: row.outputTokens ?? 0,
   totalTokens: row.totalTokens ?? 0,
   ```

4. **Add explicit type annotations**

   ```typescript
   // BEFORE
   const totals = reports.reduce((sum, r) => sum + r.inputTokens, 0);

   // AFTER
   const totals = reports.reduce((sum: number, r: AiUsageReport) => sum + r.inputTokens, 0);
   ```

**Estimated Effort:** 1-2 hours  
**Risk:** Low - straightforward type fixes  
**Testing:** Verify with usage tracker unit tests

---

### Category 2C: Credentials Utility Database API Changes (12 errors)

**Root Cause:** Database repository API changed (Drizzle ORM updates), but utility code still uses old method signatures.

**Affected File:** `packages/agent-runtime/src/utils/credentials.ts`

#### Specific Issues

| Line               | Error                                         | Fix Strategy                              |
| ------------------ | --------------------------------------------- | ----------------------------------------- |
| 270, 296, 325, 340 | Expected 2 arguments, but got 0               | Repository methods now require parameters |
| 276, 300, 329, 344 | Property does not exist on `Promise<unknown>` | Await promise, then access methods        |
| 304, 333, 335, 345 | Implicit `any` types                          | Add explicit type annotations             |

#### Action Items

1. **Review repository API changes**

   ```typescript
   // Check current repository interface
   cat packages/database/src/repositories/connector-credentials.ts
   ```

2. **Update method calls** to match new API

   ```typescript
   // BEFORE (old Drizzle API)
   const repo = getCredentialsRepository();
   repo.insert({ ... });

   // AFTER (new API - verify actual signature)
   const repo = getCredentialsRepository();
   await repo.insert(db, { ... });
   // OR
   await insertCredentials(db, { ... });
   ```

3. **Add proper async/await handling**

   ```typescript
   // BEFORE
   const repo = getRepository();
   repo.select(...);

   // AFTER
   const repo = await getRepository();
   const results = await repo.select(...);
   ```

4. **Add explicit type annotations**

   ```typescript
   // BEFORE
   .select((fields) => ({ ... }))

   // AFTER
   .select((fields: typeof credentialsTable) => ({ ... }))
   ```

**Estimated Effort:** 1-2 hours  
**Risk:** Medium - requires understanding new repository API  
**Testing:** Test credential CRUD operations

---

### Category 3A: HookExecutor Type Narrowing (5 errors)

**Root Cause:** Array filtering returns `unknown[]` type, needs proper type guard.

**Affected File:** `packages/agent-runtime/src/core/HookExecutor.ts`

#### Specific Issues

| Line     | Error                                      | Fix Strategy                |
| -------- | ------------------------------------------ | --------------------------- | ------------------ |
| 203, 221 | `unknown` not assignable to `ChatHook      | ConditionalHook<ChatHook>`  | Add type predicate |
| 204, 222 | Type `unknown` does not satisfy constraint | Use type assertion or guard |

#### Action Items

1. **Add type predicate function**

   ```typescript
   function isChatHookOrConditional(hook: unknown): hook is ChatHook | ConditionalHook<ChatHook> {
     return typeof hook === "object" && hook !== null && ("hook" in hook || "execute" in hook);
   }
   ```

2. **Use type guard in filtering**

   ```typescript
   // BEFORE
   const hooks = this.config.hooks.filter(h => /* some condition */);
   for (const hook of hooks) {
     // hook is unknown
   }

   // AFTER
   const hooks = this.config.hooks.filter(
     (h): h is ChatHook | ConditionalHook<ChatHook> => /* type guard */
   );
   for (const hook of hooks) {
     // hook is properly typed
   }
   ```

**Estimated Effort:** 30 minutes  
**Risk:** Low - pure type safety fix  
**Testing:** Verify hook execution still works

---

### Category 3B: Traffic Manager Issues (5 errors)

**Root Cause:** Missing `ioredis` dependency and type assertion needs.

**Affected File:** `packages/agent-runtime/src/deployment/trafficManager.ts`

#### Specific Issues

| Line | Error                                                                | Fix Strategy                                     |
| ---- | -------------------------------------------------------------------- | ------------------------------------------------ |
| 2    | Cannot find module `ioredis`                                         | Install dependency or use different Redis client |
| 5    | Invalid service name `"TrafficManager"`                              | Change to `"agent-runtime"`                      |
| 119  | `Map<string, string>` not assignable to `Map<string, TrafficTarget>` | Add type assertion or fix map population         |
| 126  | `unknown` not assignable to `string`                                 | Add type guard                                   |
| 465  | Private property `asyncLocalStorage` not accessible                  | Use public method or refactor                    |

#### Action Items

1. **Install ioredis dependency** (if needed)

   ```bash
   pnpm add ioredis
   pnpm add -D @types/ioredis
   ```

   OR use existing Redis client from `@agenticverdict/observability`

2. **Fix service name** (already done in previous pass, verify)

   ```typescript
   const logger = createPinoLogger("agent-runtime");
   ```

3. **Add type assertions for Map**

   ```typescript
   // BEFORE
   const targets = new Map<string, string>();

   // AFTER
   const targets = new Map<string, TrafficTarget>();
   ```

4. **Add type guards**

   ```typescript
   // BEFORE
   const value = someUnknown;
   this.process(value);

   // AFTER
   if (typeof someUnknown === "string") {
     this.process(someUnknown);
   }
   ```

5. **Refactor asyncLocalStorage access**

   ```typescript
   // BEFORE
   this.asyncLocalStorage.someMethod();

   // AFTER
   // Option 1: Make property public
   public asyncLocalStorage: AsyncLocalStorage<T>;

   // Option 2: Add public getter
   get storage() {
     return this.asyncLocalStorage;
   }

   // Option 3: Use existing context method
   const ctx = this.getContext();
   ```

**Estimated Effort:** 1 hour  
**Risk:** Medium - may require dependency management  
**Testing:** Test traffic management features

---

### Category 3C: Parallel Runner Metrics Mismatch (2 errors)

**Root Cause:** `ParallelRunMetrics` type updated with new required properties.

**Affected File:** `packages/agent-runtime/src/deployment/parallelRunner.ts`

#### Specific Issues

| Line | Error                                        | Fix Strategy                     |
| ---- | -------------------------------------------- | -------------------------------- |
| 94   | Missing `legacyCount`, `newCount` properties | Add properties to metrics object |

#### Action Items

1. **Add missing properties**

   ```typescript
   // BEFORE
   const metrics: ParallelRunMetrics = {
     totalRequests: ...,
     matchedRequests: ...,
     // ... other properties
   };

   // AFTER
   const metrics: ParallelRunMetrics = {
     totalRequests: ...,
     matchedRequests: ...,
     legacyCount: legacyResults.length,
     newCount: newResults.length,
     // ... other properties
   };
   ```

**Estimated Effort:** 15 minutes  
**Risk:** Low - simple property addition  
**Testing:** Verify metrics reporting

---

### Category 4: Test File Issues (77 errors - Low Priority)

**Strategy:** Fix only if tests are failing. Otherwise, address during test refactoring sprints.

#### Files Affected

- `src/providers/openai-compatible/index.test.ts` (17 errors)
- `src/utils/tenant-context.test.ts` (16 errors)
- `src/services/usage-tracker.test.ts` (15 errors)
- `src/hooks/langfuse.test.ts` (9 errors)
- `src/utils/credentials.test.ts` (2 errors)
- Other test files (18 errors)

#### Common Issues

- Missing `startedAt` properties in mock context objects
- Incomplete mock objects
- Error handling type mismatches
- Module import paths
- Missing type exports

**Estimated Effort:** 2-3 hours (optional)  
**Priority:** Low  
**Recommendation:** Defer until test refactoring sprint

---

## API Package Errors (100+ errors)

The `@agenticverdict/api` package has 100+ additional errors primarily related to:

1. **Missing database repository exports** (40 errors)
   - `@agenticverdict/database/repositories/business-domains`
   - `@agenticverdict/database/repositories/ai-provider`
   - `@agenticverdict/database/repositories/ai-templates`
   - `@agenticverdict/database/repositories/budget-alerts`

2. **Missing core schema exports** (30 errors)
   - `@agenticverdict/core/schemas/ai-provider`

3. **Tenant context property access** (30 errors)
   - `tenantId` does not exist on context type
   - `userId` does not exist on context type

These errors are **separate from the agent-runtime remediation** and may require:

- Database repository barrel file updates
- Core schema export fixes
- Tenant context type updates

**Recommendation:** Create separate remediation plan for API package after agent-runtime is complete.

---

## Implementation Plan

### Phase 3A: Critical Service Fixes (Priority: High)

**Goal:** Fix all service files with schema mismatches

**Tasks:**

1. **Budget Alerts Service** (2-3h)
   - [ ] Audit database schema
   - [ ] Update all property accesses
   - [ ] Fix `AlertNotification` type
   - [ ] Add type guards for nullable fields

2. **Usage Tracker Service** (1-2h)
   - [ ] Verify repository import path
   - [ ] Add null coalescing operators
   - [ ] Add explicit type annotations

3. **Credentials Utility** (1-2h)
   - [ ] Review repository API changes
   - [ ] Update method signatures
   - [ ] Fix async/await handling

**Success Criteria:**

- ✅ Zero errors in service files
- ✅ Service unit tests pass
- ✅ No schema drift between DB and services

### Phase 3B: Core & Deployment Fixes (Priority: Medium)

**Goal:** Fix remaining production file errors

**Tasks:**

1. **HookExecutor** (30m)
   - [ ] Add type predicate function
   - [ ] Update filtering logic

2. **Traffic Manager** (1h)
   - [ ] Resolve ioredis dependency
   - [ ] Fix type assertions
   - [ ] Refactor asyncLocalStorage access

3. **Parallel Runner** (15m)
   - [ ] Add missing metrics properties

**Success Criteria:**

- ✅ Zero errors in core/deployment files
- ✅ No runtime type errors

### Phase 3C: API Package Remediation (Priority: Medium)

**Goal:** Fix API package typecheck errors

**Tasks:**

1. **Database Repository Exports** (2h)
   - [ ] Verify all repository barrel exports
   - [ ] Add missing exports
   - [ ] Update import paths in API services

2. **Core Schema Exports** (1h)
   - [ ] Add missing schema exports
   - [ ] Verify import paths

3. **Tenant Context Types** (2h)
   - [ ] Update context type definitions
   - [ ] Add missing properties
   - [ ] Verify tRPC router context

**Success Criteria:**

- ✅ Zero errors in API package
- ✅ API service tests pass

### Phase 4: Test File Cleanup (Priority: Low - Optional)

**Goal:** Improve test code type safety

**Tasks:**

1. Fix all test file type errors (2-3h)
2. Add complete mock objects
3. Fix import paths
4. Add explicit type annotations

**Success Criteria:**

- ✅ <10 typecheck errors in test files
- ✅ All tests still pass

---

## Risk Assessment

| Risk                            | Likelihood | Impact | Mitigation                                              |
| ------------------------------- | ---------- | ------ | ------------------------------------------------------- |
| Database schema changed again   | Low        | High   | Verify schema before fixes, add schema validation tests |
| Repository API breaking changes | Medium     | Medium | Review repository interfaces, add integration tests     |
| Test failures after fixes       | Medium     | Low    | Run full test suite after each phase                    |
| Regression in service logic     | Low        | High   | Manual QA testing of affected services                  |
| ioredis dependency conflicts    | Medium     | Low    | Use existing Redis client if available                  |

---

## Verification Steps

After each phase, run:

```bash
# Agent runtime typecheck
pnpm --filter @agenticverdict/agent-runtime typecheck

# API typecheck
pnpm --filter @agenticverdict/api typecheck

# Run unit tests
pnpm run test:unit

# Run integration tests
pnpm run test:integration

# Build production bundles
pnpm run build

# Verify production bundle
pnpm run verify:production-bundle
```

---

## Timeline

| Phase               | Duration | Dependencies          | Owner          |
| ------------------- | -------- | --------------------- | -------------- |
| 3A: Service Fixes   | 4-7h     | Database schema audit | Backend Team   |
| 3B: Core/Deployment | 2h       | Phase 3A complete     | AI Team        |
| 3C: API Package     | 5h       | Phase 3A complete     | Backend Team   |
| 4: Test Cleanup     | 2-3h     | Optional              | QA/Engineering |

**Total Estimated Effort:** 11-14 hours (Phases 3A-3C)

---

## Success Metrics

- ✅ **Zero typecheck errors** in agent-runtime production code
- ✅ **Zero typecheck errors** in API production code
- ✅ **<10 typecheck errors** in test files (optional)
- ✅ **All unit tests passing** (`pnpm run test:unit`)
- ✅ **All integration tests passing** (`pnpm run test:integration`)
- ✅ **Production build succeeds** (`pnpm run build`)

---

## Appendix: Quick Reference Commands

```bash
# Run typecheck on specific package
pnpm --filter @agenticverdict/agent-runtime typecheck

# Watch mode for development
pnpm --filter @agenticverdict/agent-runtime typecheck -- --watch

# Find all errors in production files only
pnpm run typecheck 2>&1 | grep -v "test.ts" | grep "error"

# Count errors by package
pnpm run typecheck 2>&1 | grep -E "^@.*typecheck:.*error" | cut -d: -f1 | sort | uniq -c

# Find errors by file
pnpm run typecheck 2>&1 | grep "src/services/budget-alerts.ts"

# Check database schema
cat packages/database/src/schema/budget-alerts.ts

# Check repository exports
cat packages/database/src/repositories/index.ts
```

---

## Related Documentation

- [`/docs/plans/typecheck-remediation-plan.md`](./typecheck-remediation-plan.md) - Original plan
- [`/docs/05-reference/backend-patterns.md`](../05-reference/backend-patterns.md)
- [`/docs/05-reference/testing-policy.md`](../05-reference/testing-policy.md)
- [`/packages/database/src/schema/`](../../packages/database/src/schema/) - Database schema source of truth
- [`/packages/database/src/repositories/`](../../packages/database/src/repositories/) - Repository implementations

---

## Change Log

### 2026-05-07 - Initial Document

- Created comprehensive remediation plan for remaining 138 errors
- Documented Phase 1-2 completion (34+ errors fixed)
- Categorized remaining errors by type and priority
- Added detailed action items for each category
- Estimated effort and timeline for completion

### Next Steps

1. **Immediate:** Complete Phase 3A (Service Fixes) - highest impact
2. **Short-term:** Complete Phase 3B (Core/Deployment) - quick wins
3. **Medium-term:** Complete Phase 3C (API Package) - separate track
4. **Optional:** Phase 4 (Test Cleanup) - during test refactoring sprint
