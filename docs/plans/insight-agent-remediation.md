# InsightAgent Remediation Plan

**Document Type:** Remediation Plan  
**Date:** 2026-05-06  
**Status:** Ready for Implementation  
**Related Analysis:** `/docs/analysis/insight-agent-architecture-review.md`  
**Original Plan:** `/docs/plans/ai-provider/agent-architecture-remediation.md`

---

## Executive Summary

The `InsightAgentConfig` and `InsightAgentFactory` implementation successfully achieves the configurable agent architecture goals. However, `marketing-agents-migration.ts` introduces unnecessary complexity that contradicts the approved destructive replacement approach.

**Recommendation:** Delete the migration layer and use `InsightAgentFactory` directly.

**Effort:** 2-3 days  
**Risk:** Low (pre-production, no live users)  
**Impact:** Cleaner architecture, reduced technical debt

---

## 1. Current State

### 1.1 What Works Well

- ✅ `InsightAgentConfig` schema is comprehensive and well-tested
- ✅ `InsightAgentFactory` creates agents from configuration
- ✅ Variable substitution and output validation implemented
- ✅ Tenant context propagation working correctly
- ✅ Legacy `specialized-marketing-agents.ts` already deleted
- ✅ Test coverage is comprehensive (unit + integration)

### 1.2 What Needs Remediation

- ❌ `marketing-agents-migration.ts` re-introduces hardcoded patterns
- ❌ Legacy types exported in public API (`index.ts`)
- ❌ Migration layer contradicts destructive replacement approach
- ⚠️ `createToolFromConfig()` is placeholder implementation

---

## 2. Remediation Tasks

### Phase 1: Audit and Preparation (0.5 days)

#### Task 1.1: Find All Migration Layer Usages

**Command:**

```bash
grep -r "marketing-agents-migration" --include="*.ts" --include="*.tsx"
grep -r "SpecializedMarketingAgent" --include="*.ts" --include="*.tsx"
grep -r "convertLegacyOptionsToInsightConfig" --include="*.ts" --include="*.tsx"
grep -r "createMarketingAgentTools" --include="*.ts" --include="*.tsx"
```

**Acceptance Criteria:**

- [ ] Complete list of all files importing from migration module
- [ ] Document which consumers need updates
- [ ] Verify no production code depends on migration layer

#### Task 1.2: Review marketing-pipeline.ts Dependencies

**File:** `packages/agent-runtime/src/marketing-pipeline.ts`

**Action:** Check how migration helpers are used:

```typescript
import {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
} from "./marketing-agents-migration";
```

**Acceptance Criteria:**

- [ ] Understand how pipeline uses migration helpers
- [ ] Plan alternative using `InsightAgentFactory` directly
- [ ] Document required changes

---

### Phase 2: Implementation (1-1.5 days)

#### Task 2.1: Update marketing-pipeline.ts

**File:** `packages/agent-runtime/src/marketing-pipeline.ts`

**Current Code:**

```typescript
import {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
} from "./marketing-agents-migration";
```

**Target Code:**

```typescript
import { createInsightAgentFactory } from "./configurable-agents/InsightAgentFactory";
import type { InsightAgentConfig } from "./configurable-agents/InsightAgentConfig";

// Create agent config directly instead of using migration helper
const config: InsightAgentConfig = {
  name: `Marketing ${stageName}`,
  role: stageRole,
  systemMessage: await buildSystemMessage(stageName, context),
  // ... other properties
};

const factory = createInsightAgentFactory();
const { agent } = await factory.createAgent(config, {
  variables: context.variables,
  tools: await buildTools(context),
});
```

**Acceptance Criteria:**

- [ ] Remove all imports from `marketing-agents-migration`
- [ ] Use `InsightAgentFactory` directly
- [ ] All pipeline tests pass
- [ ] No regression in functionality

#### Task 2.2: Delete marketing-agents-migration.ts

**File:** `packages/agent-runtime/src/marketing-agents-migration.ts`

**Action:** Delete the file

**Acceptance Criteria:**

- [ ] File deleted
- [ ] No compilation errors
- [ ] All tests pass

#### Task 2.3: Update index.ts Exports

**File:** `packages/agent-runtime/src/index.ts`

**Remove Lines 262-266:**

```typescript
export {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
  type CreateSpecializedMarketingAgentOptions,
  type SpecializedMarketingAgentKind,
  type SpecializedMarketingAgentPromptVars,
} from "./marketing-agents-migration";
```

**Acceptance Criteria:**

- [ ] Legacy exports removed
- [ ] No compilation errors in dependent packages
- [ ] Update any external documentation referencing these exports

#### Task 2.4: Complete Tool Implementation (Optional, 0.5 days)

**File:** `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts`

**Current Code (lines 266-272):**

```typescript
private createToolFromConfig(config: AgentToolConfig): ITool | null {
  // This is a placeholder - in a full implementation, this would
  // instantiate tools from a tool registry based on tool name
  // For now, we skip tools that don't have implementations
  return null;
}
```

**Target Implementation:**

```typescript
private createToolFromConfig(config: AgentToolConfig): ITool | null {
  // Try to instantiate tool from built-in registry
  const tool = BuiltinTools.get(config.name);
  if (!tool) {
    return null;
  }

  // Apply configuration overrides
  if (config.description) {
    tool.description = config.description;
  }

  return tool;
}
```

**Acceptance Criteria:**

- [ ] Tools can be instantiated by name from config
- [ ] Configuration overrides applied correctly
- [ ] Tests for tool creation from config

---

### Phase 3: Testing & Validation (0.5-1 day)

#### Task 3.1: Run Full Test Suite

**Command:**

```bash
pnpm run test:unit
pnpm run test:integration
```

**Acceptance Criteria:**

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No new test failures introduced

#### Task 3.2: Verify Marketing Pipeline

**Command:**

```bash
pnpm --filter @agenticverdict/agent-runtime test marketing-pipeline
```

**Acceptance Criteria:**

- [ ] Marketing pipeline tests pass
- [ ] End-to-end workflow functional
- [ ] No regression in agent output quality

#### Task 3.3: Verify Type Checking

**Command:**

```bash
pnpm run typecheck
```

**Acceptance Criteria:**

- [ ] No TypeScript errors
- [ ] No unused imports
- [ ] Strict mode passes

#### Task 3.4: Verify Linting

**Command:**

```bash
pnpm run lint
```

**Acceptance Criteria:**

- [ ] No ESLint errors
- [ ] No unused exports
- [ ] Code style consistent

---

### Phase 4: Documentation Updates (0.5 days)

#### Task 4.1: Update Remediation Plan Status

**File:** `/docs/plans/ai-provider/agent-architecture-remediation.md`

**Update Section 6 (Implementation Tasks):**

- Mark Phase 5 tasks as complete
- Add note about migration layer deletion
- Update success criteria

**Acceptance Criteria:**

- [ ] Document reflects current implementation status
- [ ] Migration layer deletion documented
- [ ] Future maintainers understand the decision

#### Task 4.2: Update Agent Runtime Documentation

**File:** `packages/agent-runtime/README.md` (if exists)

**Add Section:** Configurable Agent Architecture

````markdown
## Configurable Agent Architecture

Use `InsightAgentFactory` to create agents from insight configurations:

```typescript
import { createInsightAgentFactory } from "@agenticverdict/agent-runtime";
import type { InsightAgentConfig } from "@agenticverdict/agent-runtime";

const factory = createInsightAgentFactory();

const config: InsightAgentConfig = {
  name: "Custom Analysis Agent",
  role: "analysis",
  systemMessage: "You are a helpful analyst...",
  // ... other configuration
};

const { agent } = await factory.createAgent(config, {
  variables: { tenantName: "Acme Corp" },
  tools: [myCustomTool],
});
```
````

**Deprecated:** The `marketing-agents-migration` module has been removed. Use `InsightAgentFactory` directly.

```

**Acceptance Criteria:**
- [ ] Documentation includes usage examples
- [ ] Deprecation notice clear
- [ ] Migration path documented

---

## 3. Implementation Checklist

### Pre-Implementation
- [ ] Review analysis document (`/docs/analysis/insight-agent-architecture-review.md`)
- [ ] Create feature branch: `git checkout -b feature/remove-marketing-migration`
- [ ] Run full test suite to establish baseline

### Implementation
- [ ] Task 1.1: Find all migration layer usages
- [ ] Task 1.2: Review marketing-pipeline.ts dependencies
- [ ] Task 2.1: Update marketing-pipeline.ts
- [ ] Task 2.2: Delete marketing-agents-migration.ts
- [ ] Task 2.3: Update index.ts exports
- [ ] Task 2.4: Complete tool implementation (optional)

### Post-Implementation
- [ ] Task 3.1: Run full test suite
- [ ] Task 3.2: Verify marketing pipeline
- [ ] Task 3.3: Verify type checking
- [ ] Task 3.4: Verify linting
- [ ] Task 4.1: Update remediation plan status
- [ ] Task 4.2: Update agent runtime documentation

### Cleanup
- [ ] Commit changes with clear message
- [ ] Create pull request
- [ ] Request architecture review
- [ ] Merge after approval

---

## 4. Risk Mitigation

### Risk: Breaking Changes

**Mitigation:**
- Search for all usages before deletion
- Update all consumers in same PR
- Run full test suite before merging

### Risk: Missing Edge Cases

**Mitigation:**
- Review marketing-pipeline.ts carefully
- Test all pipeline stages
- Verify agent output quality unchanged

### Risk: Development Disruption

**Mitigation:**
- Pre-production codebase (no live users)
- Clear documentation of changes
- Architecture team review

---

## 5. Success Criteria

### Technical Success
- [ ] `marketing-agents-migration.ts` deleted
- [ ] Zero references to legacy types in codebase
- [ ] All tests passing
- [ ] Type checking passes
- [ ] Linting passes

### Architectural Success
- [ ] No hardcoded agent behaviors
- [ ] All agent behavior config-driven
- [ ] Clean public API (no legacy exports)
- [ ] Documentation updated

### Business Success
- [ ] No functionality regression
- [ ] Marketing pipeline still works
- [ ] Agent output quality unchanged
- [ ] Reduced technical debt

---

## 6. Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Audit | 0.5 days | Day 1 | Day 1 |
| Phase 2: Implementation | 1-1.5 days | Day 1 | Day 2 |
| Phase 3: Testing | 0.5-1 day | Day 2 | Day 3 |
| Phase 4: Documentation | 0.5 days | Day 3 | Day 3 |

**Total Duration:** 2.5-3.5 days
**Total Effort:** ~3 person-days

---

## 7. Related Documents

- [Analysis Document](/docs/analysis/insight-agent-architecture-review.md)
- [Original Remediation Plan](/docs/plans/ai-provider/agent-architecture-remediation.md)
- [InsightAgentConfig Source](/packages/agent-runtime/src/configurable-agents/InsightAgentConfig.ts)
- [InsightAgentFactory Source](/packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts)

---

**Document Version:** 1.0
**Author:** AI Agent
**Review Date:** Upon implementation completion
**Maintainer:** Architecture Team
```
