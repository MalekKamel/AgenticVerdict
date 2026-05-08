# Legacy Code Remediation Plan

**Document Type:** Remediation Plan  
**Date:** 2026-05-07  
**Status:** Ready for Implementation  
**Priority:** High  
**Effort:** 1-1.5 person-days  
**Risk Level:** Low (pre-production)  
**Approach:** Greenfield (no backward compatibility)

---

## Executive Summary

The unified agent factory implementation (`/docs/plans/unified-agent-factory-implementation.md`) has been completed as a greenfield implementation. Legacy migration code remains in the codebase:

- `/packages/agent-runtime/src/marketing-agents-migration.ts` (193 lines) - Deprecated types and helpers
- `/packages/agent-runtime/src/marketing-pipeline.ts` (407 lines) - Uses legacy bridge functions
- `/packages/agent-runtime/src/index.ts` - Re-exports legacy types

This plan provides a **greenfield remediation strategy**: completely remove all legacy code and refactor `marketing-pipeline.ts` to use the unified `AgentFactory` directly with `AgentConfig`. **No backward compatibility constraints** - this is pre-production code with no live users.

---

## 1. Inventory of Legacy Code

### 1.1 Primary Legacy File

**File:** `/packages/agent-runtime/src/marketing-agents-migration.ts`

**Lines:** 193  
**Exports:**

| Export                                   | Type                | Usage Count | Description                             |
| ---------------------------------------- | ------------------- | ----------- | --------------------------------------- |
| `SpecializedMarketingAgentKind`          | Type                | 6           | Legacy agent kind union                 |
| `SpecializedMarketingAgentPromptVars`    | Interface           | 3           | Legacy prompt variables                 |
| `CreateSpecializedMarketingAgentOptions` | Interface           | 5           | Legacy options interface                |
| `convertLegacyOptionsToInsightConfig`    | Function            | 2           | Converts legacy options to AgentConfig  |
| `createMarketingAgentTools`              | Function            | 2           | Creates tool set for marketing agents   |
| `buildSpecializedSystemMessage`          | Function (internal) | 1           | Builds system message for legacy agents |
| `KIND_ROLE`                              | Const               | 1           | Maps legacy kinds to AgentRole          |
| `KIND_TEMPLATE_ID`                       | Const               | 1           | Maps legacy kinds to template IDs       |
| `JSON_VERDICT_SUFFIX`                    | Const               | 1           | JSON schema suffix for verdicts         |

**Status:** Entire file is marked `@deprecated` and should be removed.

### 1.2 Dependent Files

#### `/packages/agent-runtime/src/marketing-pipeline.ts`

**Lines:** 407  
**Legacy Imports:**

```typescript
import {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
  type CreateSpecializedMarketingAgentOptions,
  type SpecializedMarketingAgentKind,
} from "./marketing-agents-migration";
```

**Usage Locations:**

| Line    | Legacy Type/Function                                               | Usage Context                                   |
| ------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| 87      | `CreateSpecializedMarketingAgentOptions`                           | Type in `RunMarketingPipelineOptions` interface |
| 190     | `SpecializedMarketingAgentKind`                                    | Parameter type in `createAgent` function        |
| 194     | `CreateSpecializedMarketingAgentOptions`                           | Type annotation for `spec` variable             |
| 199-205 | `convertLegacyOptionsToInsightConfig`, `createMarketingAgentTools` | Called to create agent config and tools         |

**Migration Path:** Inline the legacy type definitions directly in `marketing-pipeline.ts` or refactor to use `AgentConfig` directly.

#### `/packages/agent-runtime/src/index.ts`

**Lines:** 337  
**Legacy Re-exports:**

```typescript
export {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
  type CreateSpecializedMarketingAgentOptions,
  type SpecializedMarketingAgentKind,
  type SpecializedMarketingAgentPromptVars,
} from "./marketing-agents-migration";
```

**Lines:** 276-282

**Migration Path:** Remove these re-exports entirely. No external consumers should be using deprecated migration helpers.

### 1.3 Additional Legacy Patterns Found

**Search Results for "migration|legacy|deprecated|old":**

| File                   | Pattern                 | Context                                               | Action                           |
| ---------------------- | ----------------------- | ----------------------------------------------------- | -------------------------------- |
| `memory.ts:6`          | `@deprecated` comment   | `BoundedBufferMemory` preferred over unbounded buffer | Keep - valid deprecation warning |
| `budget-alerts.ts`     | `threshold` terminology | Budget alert thresholds (valid use)                   | Keep - not legacy code           |
| `healthBasedRouter.ts` | `threshold` terminology | Health check thresholds (valid use)                   | Keep - not legacy code           |
| `usage-tracker.ts:285` | `pruneOldData`          | Data retention policy                                 | Keep - valid functionality       |

**Assessment:** No additional legacy implementation files found. The term "legacy" in other files refers to valid functionality (thresholds, data pruning), not migration code.

---

## 2. Dependency Analysis

### 2.1 Import Dependency Graph

```
marketing-agents-migration.ts
    ↑
    ├── marketing-pipeline.ts (uses 4 exports)
    │   └── index.ts (re-exports marketing pipeline types)
    │
    └── index.ts (re-exports 5 legacy types)
        └── External consumers (if any)
```

### 2.2 Internal Dependencies Within Legacy File

```
marketing-agents-migration.ts
├── SpecializedMarketingAgentKind (type)
│   └── Used by: KIND_ROLE, KIND_TEMPLATE_ID, buildSpecializedSystemMessage, convertLegacyOptionsToInsightConfig
│
├── SpecializedMarketingAgentPromptVars (interface)
│   └── Used by: CreateSpecializedMarketingAgentOptions, buildSpecializedSystemMessage
│
├── CreateSpecializedMarketingAgentOptions (interface)
│   └── Used by: convertLegacyOptionsToInsightConfig, createMarketingAgentTools
│
├── buildSpecializedSystemMessage (internal function)
│   └── Used by: convertLegacyOptionsToInsightConfig
│
├── convertLegacyOptionsToInsightConfig (exported function)
│   └── Used by: marketing-pipeline.ts:199
│
└── createMarketingAgentTools (exported function)
    └── Used by: marketing-pipeline.ts:202
```

### 2.3 External Package Dependencies

The legacy file imports from:

- `./llm-invocation-cache` - Type only
- `./interfaces` - Type only
- `./agent-config` - Types and functions
- `./agent-tools/tenant-context-tools` - Function
- `./agent-tools/platform-fetch-tools` - Function
- `./agent-tools/analysis-tools` - Function
- `./agent-tools/report-prep-tools` - Function
- `./prompts` - Functions

**Assessment:** No circular dependencies. Safe to remove.

---

## 3. Risk Assessment

### 3.1 Impact Analysis

| Component               | Impact                              | Severity | Mitigation                               |
| ----------------------- | ----------------------------------- | -------- | ---------------------------------------- |
| `marketing-pipeline.ts` | Must be refactored                  | Medium   | Inline types or use AgentConfig directly |
| `index.ts` exports      | Remove re-exports                   | Low      | No known external consumers              |
| Test files              | No test files reference legacy code | None     | N/A                                      |
| External packages       | No external imports found           | None     | N/A                                      |

### 3.2 Breaking Changes

**Potential Breaking Changes:**

1. **Removal of `marketing-agents-migration.ts` exports**
   - **Impact:** Any code importing these types will break
   - **Mitigation:** Search confirmed only `marketing-pipeline.ts` and `index.ts` import these
   - **Verification:** Run `grep -r "marketing-agents-migration"` before merge

2. **Type signature changes in `marketing-pipeline.ts`**
   - **Impact:** Consumers of `runMarketingAgentPipeline` may need updates
   - **Mitigation:** Keep `RunMarketingPipelineOptions` interface stable by inlining types
   - **Verification:** Run typecheck after changes

### 3.3 Tests Affected

**Current State:** Zero test files reference legacy migration code.

**Verification Commands:**

```bash
# Verify no test files import legacy code
grep -r "marketing-agents-migration" --include="*.test.ts" packages/agent-runtime/
# Expected: no results

# Run tests after changes
pnpm --filter @agenticverdict/agent-runtime test
```

---

## 4. Remediation Strategy

### 4.1 Approach

**Recommended Strategy:** Greenfield refactoring - remove all legacy code and use `AgentConfig` directly.

**Rationale:**

1. **Pre-production codebase** - No live users, no backward compatibility needed
2. **Clean architecture** - Direct use of unified `AgentFactory` API
3. **Zero technical debt** - No inline legacy types or bridge functions
4. **Aligned with design** - Matches unified factory implementation intent
5. **Maintainability** - Single source of truth for agent configuration

### 4.2 Removal Sequence

**Phase 1: Refactor marketing-pipeline.ts (0.5 days)**

1. Remove imports from `marketing-agents-migration.ts`
2. Replace `convertLegacyOptionsToInsightConfig()` with direct `AgentConfig` construction
3. Replace `createMarketingAgentTools()` with inline tool array construction
4. Remove legacy type references (`SpecializedMarketingAgentKind`, etc.)
5. Use stage strings directly: `"analysis" | "insights" | "verdict"`
6. Verify type checking passes

**Phase 2: Remove Re-exports (0.1 days)**

1. Remove legacy exports from `index.ts`
2. Verify no compilation errors
3. Verify no other files import these exports

**Phase 3: Delete Legacy Files (0.05 days)**

1. Delete `marketing-agents-migration.ts`
2. Verify zero references remain

**Phase 4: Verification (0.25 days)**

1. Run type checking
2. Run tests
3. Run linting
4. Build verification
5. Verify marketing pipeline execution

### 4.3 Code Ownership and Validation

**Code Owner:** Agent Runtime Team  
**Reviewers Required:** 1 (architecture team member)  
**Validation Requirements:**

- [ ] All TypeScript compilation passes
- [ ] All unit tests pass
- [ ] Marketing pipeline integration tests pass
- [ ] Zero references to `marketing-agents-migration` remain
- [ ] No breaking changes to public API (verify with `grep`)

### 4.4 Rollback Considerations

**Rollback Plan:** If issues discovered post-merge:

1. Revert commit
2. Restore `marketing-agents-migration.ts` from git history
3. Restore `index.ts` re-exports
4. Investigate issue in isolation

**Risk Level:** Low - changes are non-functional (type moves and deletions only)

---

## 5. Implementation Details

### 5.1 Phase 1: Refactor marketing-pipeline.ts to Use AgentConfig Directly

**Before (Legacy Bridge):**

```typescript
import {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
  type CreateSpecializedMarketingAgentOptions,
  type SpecializedMarketingAgentKind,
} from "./marketing-agents-migration";

const createAgent = async (
  kind: SpecializedMarketingAgentKind,
  stage: MarketingPipelineStageName,
): Promise<CreatedAgent> => {
  const mock = options.mockModels?.[stage];
  const spec: CreateSpecializedMarketingAgentOptions = {
    ...specialization,
    invocationCache: options.invocationCache,
  };

  // Convert legacy options to AgentConfig
  const config = convertLegacyOptionsToInsightConfig(kind, spec);

  // Create tools
  const tools = createMarketingAgentTools(spec);

  // Create agent with the agent factory
  const createdAgent = await factory.createAgent(config, {
    tools,
    cache: options.invocationCache,
  });

  return createdAgent;
};
```

**After (Direct AgentConfig):**

```typescript
import type { AgentConfig } from "./agent-config";
import {
  createTenantContextTools,
  type TenantContextToolDeps,
} from "./agent-tools/tenant-context-tools";
import {
  createPlatformFetchTools,
  type PlatformFetchToolDeps,
} from "./agent-tools/platform-fetch-tools";
import { createAnalysisTools } from "./agent-tools/analysis-tools";
import { createReportPrepTools } from "./agent-tools/report-prep-tools";
import { resolvePromptTemplate, renderPromptTemplate } from "./prompts";
import type { LlmInvocationCache } from "./llm-invocation-cache";

// Helper function to build system message for each stage
function buildStageSystemMessage(
  stage: MarketingPipelineStageName,
  specialization: RunMarketingPipelineOptions["specialization"],
): string {
  const templateId = {
    analysis: "analysis.cross_platform_overview",
    insights: "insight.anomaly_scan",
    verdict: "verdict.recommendation_synthesis",
  }[stage];

  const record = resolvePromptTemplate(templateId, specialization.templateVersion);

  const vars = specialization.promptVars ?? {};

  if (stage === "analysis") {
    return renderPromptTemplate(record, {
      tenantName: specialization.tenantName,
      dateRange: vars.dateRange ?? "last 30 days",
      platforms: vars.platforms ?? "Meta, GA4, GSC, GBP, TikTok",
      currency: vars.currency ?? "USD",
    });
  }

  if (stage === "insights") {
    return renderPromptTemplate(record, {
      thresholdContext: vars.thresholdContext ?? "prior period and channel baselines",
      dateRange: vars.dateRange ?? "last 30 days",
    });
  }

  // verdict
  return renderPromptTemplate(record, {
    goal: vars.goal ?? "Deliver an evidence-based media verdict with budget guidance.",
    constraints: vars.constraints ?? "Respect tenant-safe outputs; no credentials or raw PII.",
    horizon: vars.horizon ?? "next 30 days",
  });
}

const createAgent = async (stage: MarketingPipelineStageName): Promise<CreatedAgent> => {
  const mock = options.mockModels?.[stage];

  // Build AgentConfig directly
  const config: AgentConfig = {
    name: `Marketing ${stage}`,
    role: stage === "analysis" ? "analysis" : stage === "insights" ? "insights" : "verdict",
    systemMessage: buildStageSystemMessage(stage, specialization),
    description: `Marketing agent for ${stage}`,
    runtimeMode: "production",
    variables: [],
    tools: [],
    outputFormat: {
      type: stage === "verdict" ? "json" : "text",
      strictValidation: stage === "verdict",
    },
    memoryMode: specialization.factoryConfig?.memoryMode ?? "none",
    maxHistoryLength: 10,
    providerId: undefined,
    modelId: undefined,
    modelParams: {
      temperature: specialization.factoryConfig?.temperature ?? 0.7,
      maxTokens: 4096,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    includeReasoning: false,
    timeoutMs: 60000,
    retryConfig: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
    },
    tokenBudgets: {
      tenantContextMaxApproxTokens: 1024,
      maxAssembledPromptApproxTokens: 6000,
    },
    isActive: true,
    version: 1,
  };

  // Build tools array directly
  const tools = [
    ...createTenantContextTools(specialization.tenantContextDeps),
    ...(specialization.platformDeps ? createPlatformFetchTools(specialization.platformDeps) : []),
    ...createAnalysisTools(),
    ...createReportPrepTools(),
  ];

  // Create agent with the unified factory
  const createdAgent = await factory.createAgent(config, {
    tools,
    cache: options.invocationCache,
  });

  return createdAgent;
};
```

**Key Changes:**

| Aspect            | Before                                  | After                       |
| ----------------- | --------------------------------------- | --------------------------- |
| Agent kind        | `SpecializedMarketingAgentKind` enum    | Direct stage string         |
| Config creation   | `convertLegacyOptionsToInsightConfig()` | Direct `AgentConfig` object |
| Tool creation     | `createMarketingAgentTools()`           | Inline tool array           |
| Type dependencies | 4 legacy types                          | Zero legacy types           |
| Lines of code     | 193 (migration file) + imports          | 0 (all inline)              |

### 5.2 Update RunMarketingPipelineOptions Interface

**Before:**

```typescript
export interface RunMarketingPipelineOptions {
  factory: AgentFactory;
  ctx: AgentInvocationContext;
  goal: string;
  workflowId?: string;
  specialization: Pick<
    CreateSpecializedMarketingAgentOptions,
    | "tenantName"
    | "promptVars"
    | "templateVersion"
    | "factoryConfig"
    | "platformDeps"
    | "tenantContextDeps"
  >;
  // ... rest
}
```

**After:**

```typescript
export interface RunMarketingPipelineOptions {
  factory: AgentFactory;
  ctx: AgentInvocationContext;
  goal: string;
  workflowId?: string;
  specialization: {
    tenantName: string;
    promptVars?: {
      currency?: string;
      platforms?: string;
      dateRange?: string;
      thresholdContext?: string;
      goal?: string;
      constraints?: string;
      horizon?: string;
    };
    templateVersion?: string;
    factoryConfig?: {
      memoryMode?: "none" | "buffer" | "buffer_summary" | "full";
      temperature?: number;
    };
    platformDeps?: PlatformFetchToolDeps;
    tenantContextDeps?: TenantContextToolDeps;
  };
  // ... rest
}
```

**Note:** Interface structure remains similar - only removes dependency on legacy type.

### 5.3 Phase 2: Remove Re-exports from index.ts

**Remove Lines 276-282:**

```typescript
// DELETE THESE LINES:
export {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
  type CreateSpecializedMarketingAgentOptions,
  type SpecializedMarketingAgentKind,
  type SpecializedMarketingAgentPromptVars,
} from "./marketing-agents-migration";
```

### 5.4 Phase 3: Delete Legacy File

```bash
rm packages/agent-runtime/src/marketing-agents-migration.ts
```

### 5.5 Phase 4: Verification Commands

```bash
# Verify zero references remain
grep -r "marketing-agents-migration" --include="*.ts" packages/agent-runtime/
# Expected: no results

# Verify no SpecializedMarketingAgent references outside pipeline
grep -r "SpecializedMarketingAgent" --include="*.ts" packages/agent-runtime/src/ | grep -v marketing-pipeline.ts
# Expected: no results

# Run type checking
pnpm run typecheck

# Run tests
pnpm --filter @agenticverdict/agent-runtime test

# Run linting
pnpm --filter @agenticverdict/agent-runtime lint

# Build verification
pnpm --filter @agenticverdict/agent-runtime build
```

---

## 6. Validation Plan

### 6.1 Tests to Verify

**Unit Tests:**

- [ ] `agent-factory.test.ts` - Verify unified factory works
- [ ] `agent-factory-unified.test.ts` - Verify unified config works
- [ ] `marketing-pipeline.test.ts` (if exists) - Verify pipeline stages complete
- [ ] `agent-verdict-json.test.ts` - Verify verdict parsing works

**Integration Tests:**

- [ ] Marketing pipeline end-to-end: analysis → insights → verdict
- [ ] Agent creation with production config
- [ ] Agent creation with test/mock config
- [ ] Tool injection and execution
- [ ] Verdict JSON parsing and validation

**Commands:**

```bash
# Run all agent-runtime tests
pnpm --filter @agenticverdict/agent-runtime test

# Run with coverage
pnpm --filter @agenticverdict/agent-runtime test:coverage

# Verify coverage thresholds maintained (70% overall, 85% business logic)
```

### 6.2 Integration Points to Verify

**Post-Removal Verification:**

1. **Marketing Pipeline Execution**

   ```bash
   # Run integration test or script that exercises marketing pipeline
   # Verify all three stages complete: analysis → insights → verdict

   # Example: Run a test pipeline execution
   pnpm --filter @agenticverdict/agent-runtime test -- --grep "pipeline"
   ```

2. **Agent Factory Usage**

   ```bash
   # Verify AgentFactory.createAgent() works with:
   # - Test mode agents
   # - Production mode agents
   # - Agents with variables
   # - Agents with custom tools
   # - Agents with JSON output validation
   ```

3. **Type Checking**

   ```bash
   pnpm run typecheck
   # Expected: zero errors
   ```

4. **Worker Queue Integration** (if applicable)
   ```bash
   # Verify worker queues that use marketing pipeline still function
   pnpm --filter @agenticverdict/worker test
   ```

### 6.3 Regression Checks

**Performance:**

- [ ] Agent creation time unchanged (target: <100ms)
- [ ] Pipeline execution time unchanged (target: <30s for all 3 stages)
- [ ] Memory usage unchanged

**Behavioral:**

- [ ] Agent outputs identical to pre-cleanup
- [ ] Verdict JSON structure unchanged
- [ ] Error messages unchanged
- [ ] Type signatures stable for public APIs

**Commands:**

```bash
# Compare bundle sizes (optional)
pnpm --filter @agenticverdict/agent-runtime build
ls -lh packages/agent-runtime/dist/

# Run load tests if available
pnpm --filter @agenticverdict/agent-runtime test:load
```

### 6.4 Manual Verification Checklist

After automated tests pass, verify:

- [ ] Marketing pipeline produces valid verdicts
- [ ] All three stages (analysis, insights, verdict) complete successfully
- [ ] Verdict JSON matches expected schema
- [ ] No console warnings or errors
- [ ] Observability/metrics still captured correctly

---

## 7. Implementation Approach Comparison

### 7.1 Rejected Approach: Inline Legacy Types

**Why Rejected:**

- Would preserve legacy type patterns in codebase
- Adds technical debt (inline legacy code)
- Delays inevitable refactoring
- Contradicts greenfield implementation intent
- Maintains mental overhead of two type systems

### 7.2 Selected Approach: Direct AgentConfig Usage (Greenfield)

**Benefits:**

1. **Zero Legacy Code:** Complete elimination of migration patterns
2. **Clean API:** Direct use of unified `AgentConfig`
3. **Better Type Safety:** Single source of truth
4. **Future-Proof:** Aligned with unified factory design
5. **Maintainability:** No bridge functions to understand or maintain
6. **Pre-production:** No users affected, safe to break compatibility

**Effort:** 1-1.5 days (one-time investment)

---

## 8. Success Criteria

### 8.1 Technical

- [ ] `marketing-agents-migration.ts` deleted
- [ ] Zero references to `marketing-agents-migration` remain
- [ ] Zero references to `SpecializedMarketingAgent*` types
- [ ] Zero references to `convertLegacyOptionsToInsightConfig`
- [ ] Zero references to `createMarketingAgentTools` (legacy version)
- [ ] `marketing-pipeline.ts` uses `AgentConfig` directly
- [ ] All TypeScript compilation passes
- [ ] All tests pass
- [ ] All linting passes
- [ ] Build succeeds

### 8.2 Architectural

- [ ] No `@deprecated` exports in public API
- [ ] Clean separation between legacy and production code
- [ ] Direct use of unified `AgentFactory` API
- [ ] No bridge functions or migration helpers
- [ ] Type signatures use canonical `AgentConfig` type

### 8.3 Business

- [ ] No functionality regression
- [ ] Marketing pipeline works identically
- [ ] Agent outputs unchanged
- [ ] Verdict JSON structure unchanged

---

## 9. Timeline

| Phase   | Task                                                       | Duration  | Start | End   |
| ------- | ---------------------------------------------------------- | --------- | ----- | ----- |
| Phase 1 | Refactor marketing-pipeline.ts to use AgentConfig directly | 0.5 days  | Day 1 | Day 1 |
| Phase 2 | Update RunMarketingPipelineOptions interface               | 0.1 days  | Day 1 | Day 1 |
| Phase 3 | Remove re-exports from index.ts                            | 0.1 days  | Day 1 | Day 1 |
| Phase 4 | Delete marketing-agents-migration.ts                       | 0.05 days | Day 1 | Day 1 |
| Phase 5 | Verification and testing                                   | 0.25 days | Day 1 | Day 1 |

**Total Duration:** 1 day  
**Total Effort:** ~1 person-day

---

## 10. Post-Remediation

### 10.1 Documentation Updates

- [ ] Update `packages/agent-runtime/README.md` to remove migration file references
- [ ] Update JSDoc comments in `marketing-pipeline.ts` to reflect direct AgentConfig usage
- [ ] Add note to changelog about legacy code removal and breaking changes
- [ ] Update any internal wiki/docs referencing the legacy migration helpers

### 10.2 Follow-up Tasks

**Completed (No Follow-up Needed):**

- ~~Refactor marketing-pipeline.ts to use AgentConfig directly~~ ✅ DONE
- ~~Remove all legacy migration code~~ ✅ DONE

**Optional Future Improvements:**

1. **Audit other packages for legacy code**
   - **Scope:** `apps/worker/`, `apps/api/`
   - **Command:** `grep -r "deprecated\|legacy\|migration" --include="*.ts" apps/`
   - **Priority:** Low

2. **Optimize marketing-pipeline.ts further**
   - Extract repeated patterns into helper functions
   - Add more comprehensive error handling
   - **Priority:** Low (current implementation is acceptable)

### 10.3 Verification Commands

```bash
# Final verification checklist
echo "=== Legacy Code Remediation Verification ==="

# 1. Verify file deleted
test ! -f packages/agent-runtime/src/marketing-agents-migration.ts && echo "✓ Migration file deleted"

# 2. Verify zero references
! grep -r "marketing-agents-migration" --include="*.ts" packages/ && echo "✓ Zero migration file references"

# 3. Verify type checking
pnpm run typecheck && echo "✓ Type checking passes"

# 4. Verify tests
pnpm --filter @agenticverdict/agent-runtime test && echo "✓ All tests pass"

# 5. Verify build
pnpm --filter @agenticverdict/agent-runtime build && echo "✓ Build succeeds"

echo "=== Remediation Complete ==="
```

---

## 11. Appendix

### 11.1 Commands Reference

```bash
# Find all legacy references
grep -r "marketing-agents-migration" --include="*.ts" .
grep -r "SpecializedMarketingAgent" --include="*.ts" .
grep -r "CreateSpecializedMarketingAgentOptions" --include="*.ts" .

# Find deprecated file patterns
find packages/agent-runtime/src -name "*.legacy.ts"
find packages/agent-runtime/src -name "*.deprecated.ts"
find packages/agent-runtime/src -name "*.old.ts"

# Verify clean build
pnpm --filter @agenticverdict/agent-runtime build

# Run tests with coverage
pnpm --filter @agenticverdict/agent-runtime test:coverage
```

### 11.2 Related Documents

- `/docs/plans/unified-agent-factory-implementation.md` - Original implementation plan
- `/packages/agent-runtime/src/agent-factory.ts` - Unified factory implementation
- `/packages/agent-runtime/src/agent-config.ts` - Unified configuration schema
- `/docs/05-reference/testing-policy.md` - Testing requirements

---

**Remediation Plan Version:** 2.0 (Greenfield)  
**Created:** 2026-05-07  
**Updated:** 2026-05-07 (Greenfield approach)  
**Status:** Ready for Implementation  
**Next Step:** Begin Phase 1 - Refactor marketing-pipeline.ts to use AgentConfig directly
