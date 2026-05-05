# Legacy Code Removal Checklist

**Change:** ai-providers  
**Task:** 3.2 - Create removal checklist  
**Created:** 2026-05-05

## Pre-Removal Validation (MUST COMPLETE FIRST)

### Prerequisites

- [ ] **Task 3.3 complete**: Validation tests written confirming new system covers all legacy use cases
- [ ] **Task 3.4 complete**: AST-based scan completed with full inventory
- [ ] **Blue-green deployment ready**: Traffic manager implemented (Task 3.5-3.10)
- [ ] **Parallel run validated**: Both systems running in parallel with result comparison (Task 3.17-3.21)
- [ ] **Traffic cutover tested**: Gradual migration from 10% → 50% → 100% successful (Task 3.22-3.28)
- [ ] **Zero rollback triggers**: No automatic rollbacks activated during 100% traffic phase
- [ ] **Full test suite passing**: All unit, integration, and E2E tests pass with new system

## Removal Sequence (CRITICAL ORDER)

### Phase 1: GLM Provider Migration

**Files to Modify/Delete:**

1. `packages/agent-runtime/src/glm-config.ts` - **DELETE**
2. `packages/agent-runtime/src/glm-config.test.ts` - **DELETE**
3. `packages/agent-runtime/src/chat-models.ts` - **REFACTOR**
4. `packages/agent-runtime/src/llm-env.ts` - **UPDATE**

**Steps:**

- [ ] Verify GLM provider implemented via `OpenAICompatibleProvider` (Task 2.12)
- [ ] Confirm tenant credential storage for GLM API keys (Task 1.14)
- [ ] Update all GLM config usages to use new provider factory
- [ ] Migrate environment variable parsing to tenant config schema
- [ ] **DELETE** `glm-config.ts`
- [ ] **DELETE** `glm-config.test.ts`
- [ ] Remove `ChatGlm` class from `chat-models.ts`
- [ ] Remove `DEFAULT_GLM_MODEL` constant
- [ ] Remove GLM-specific types from `AgentLlmCredentialEnv`
- [ ] Update `llm-env.ts` to remove GLM tracing references
- [ ] Run tests - confirm zero failures
- [ ] Run AST scan - confirm zero `glm-config` imports

**Validation:**

```bash
# Verify no imports remain
rg "from ['\"].*glm-config" packages/
rg "import.*glm-config" packages/

# Verify zero ChatGlm references
rg "ChatGlm" packages/ --include="*.ts"

# Run test suite
pnpm --filter @agenticverdict/agent-runtime test
```

---

### Phase 2: Configurable LLM Agent Removal

**Files to Modify/Delete:**

1. `packages/agent-runtime/src/configurable-llm-agent.ts` - **DELETE**
2. `packages/agent-runtime/src/agent-factory.ts` - **UPDATE**
3. `packages/agent-runtime/src/index.ts` - **UPDATE** (exports)

**Steps:**

- [ ] Verify new `AgentFactory` uses provider factory (Task 3.11)
- [ ] Confirm lifecycle hooks integrated (Task 3.13-3.15)
- [ ] Migrate all agent instantiations to new factory
- [ ] Update `createAgent()` to use new provider runtime
- [ ] Remove `invokeChatModelWithProviderFallback()` usage
- [ ] **DELETE** `configurable-llm-agent.ts`
- [ ] Remove exports from `index.ts`
- [ ] Update any test files importing configurable agent
- [ ] Run tests - confirm zero failures
- [ ] Run AST scan - confirm zero `configurable-llm-agent` imports

**Validation:**

```bash
# Verify no imports remain
rg "from ['\"].*configurable-llm-agent" packages/
rg "ConfigurableLlmAgent" packages/ --include="*.ts"

# Verify agent factory uses new runtime
grep -n "ProviderFactory" packages/agent-runtime/src/agent-factory.ts
```

---

### Phase 3: LangChain Provider Instantiation Removal

**Files to Modify:**

1. `packages/agent-runtime/src/chat-models.ts` - **REFACTOR HEAVILY**
2. `packages/agent-runtime/src/llm-env.ts` - **CLEANUP**
3. All provider implementation files - **VERIFY**

**Steps:**

- [ ] Remove direct `ChatOpenAI` instantiation
- [ ] Remove direct `ChatAnthropic` instantiation
- [ ] Remove direct `BaseChatModel` usage in provider code
- [ ] Refactor `createOpenAiChatModel()` to use provider factory
- [ ] Keep LangChain imports ONLY for:
  - LangGraph agent orchestration
  - Message types (if not replaced)
  - LangSmith tracing (via hooks only)
- [ ] Update provider implementations to use canonical error system
- [ ] Run tests - confirm zero failures
- [ ] Run AST scan - confirm only allowed LangChain imports remain

**Allowed LangChain Imports (Post-Removal):**

```typescript
// ✅ KEEP - Agent orchestration
import { StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai"; // ONLY in legacy compatibility layer during migration

// ✅ KEEP - Message types (if needed)
import { AIMessage, HumanMessage } from "@langchain/core/messages";

// ❌ REMOVE - Provider instantiation
import { ChatOpenAI } from "@langchain/openai"; // Use provider factory instead
import { ChatAnthropic } from "@langchain/anthropic"; // Use provider factory instead
```

**Validation:**

```bash
# Find all LangChain imports
rg "from ['\"]@langchain" packages/agent-runtime/src/ --include="*.ts"

# Categorize by purpose (allowed vs. must-remove)
# Allowed: langgraph, core/messages, core/tools
# Must-remove: openai, anthropic, core/language_models (for provider instantiation)
```

---

### Phase 4: Test File Cleanup

**Files to Modify/Delete:**

1. `packages/agent-runtime/src/langchain-integration.test.ts` - **DELETE or UPDATE**
2. `packages/agent-runtime/src/glm-config.test.ts` - **DELETE** (Phase 1)
3. Any other legacy test files - **IDENTIFY & REMOVE**

**Steps:**

- [ ] Review `langchain-integration.test.ts` - determine if testing legacy or new system
- [ ] If testing legacy code: **DELETE**
- [ ] If testing new system: **UPDATE** imports and assertions
- [ ] Remove all legacy test files
- [ ] Add new tests for provider factory pattern
- [ ] Run full test suite - confirm all pass
- [ ] Verify test coverage thresholds met (85% overall, 90% critical)

---

### Phase 5: Backward Compatibility Layer Removal

**Files to Check:**

- [ ] Scan for any compatibility wrappers
- [ ] Scan for deprecated function aliases
- [ ] Scan for feature flags enabling legacy code paths
- [ ] Remove all backward compatibility code
- [ ] Update documentation to reflect breaking changes

**Steps:**

- [ ] Search for "legacy", "deprecated", "compat" in codebase
- [ ] Remove any dual-path logic (if/else for old vs. new system)
- [ ] Remove feature flags for legacy system toggle
- [ ] Update CHANGELOG with breaking changes
- [ ] Update migration guide for external consumers

---

### Phase 6: Final Verification (Task 3.52)

**AST-Based Scan:**

```bash
# Install madge if not present
pnpm add -D madge

# Scan for legacy imports
pnpm exec madge --extensions ts --circular packages/agent-runtime/src/

# Custom AST scan for legacy patterns
# (Implement Task 3.4 AST scanner here)
```

**Checklist:**

- [ ] Zero `glm-config` imports in codebase
- [ ] Zero `ChatGlm` references
- [ ] Zero `configurable-llm-agent` imports
- [ ] Zero `ConfigurableLlmAgent` references
- [ ] Zero direct `ChatOpenAI` instantiation (except allowed cases)
- [ ] Zero direct `ChatAnthropic` instantiation (except allowed cases)
- [ ] Zero `invokeChatModelWithProviderFallback` references
- [ ] Zero hardcoded API keys in codebase
- [ ] All tenant credentials sourced from encrypted storage
- [ ] All provider instantiations via `ProviderFactory`

**Test Suite Validation:**

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Tenant isolation test suite passes (Task 4.19-4.25)
- [ ] Performance benchmarks meet targets (p95 <2s)
- [ ] Coverage thresholds met (85% overall, 90% critical)

**Security Validation:**

- [ ] Zero hardcoded credentials (Task 4.35)
- [ ] All credentials encrypted at rest
- [ ] Tenant isolation verified (no cross-tenant access)
- [ ] Security audit passed with zero critical findings (Task 1.28, 4.37)

---

## Rollback Plan (If Issues Discovered)

**If removal causes failures:**

1. **DO NOT** restore deleted files
2. **DO** fix issues in new system
3. **DO** run parallel validation (Task 3.17-3.21)
4. **DO** verify tenant isolation before re-enabling traffic

**Emergency rollback steps:**

1. Traffic Manager → set to 0% new system (automatic on threshold breach)
2. Hotfix new system implementation
3. Re-run validation tests
4. Gradual cutover: 10% → 50% → 100%
5. Resume removal only after stable at 100%

---

## Post-Removal Tasks

- [ ] Update documentation (Task 4.26-4.29)
- [ ] Update API reference guides
- [ ] Update migration guide for external developers
- [ ] Update CHANGELOG with breaking changes
- [ ] Announce removal in release notes
- [ ] Archive legacy code inventory document
- [ ] Celebrate! 🎉

---

## Sign-Off Required

**Before starting removal:**

- [ ] Platform Engineering lead approval
- [ ] Security team sign-off (post-audit)
- [ ] QA team validation (all tests passing)
- [ ] Product owner approval (breaking changes documented)

**After removal complete:**

- [ ] AST scan results reviewed
- [ ] Test suite results reviewed
- [ ] Performance benchmarks validated
- [ ] Security audit findings addressed
- [ ] Documentation updated

**Final approval:**

- [ ] CTO/VP Engineering sign-off (breaking changes)
- [ ] Merge to main branch
- [ ] Deploy to production with monitoring
- [ ] Verify zero errors in production logs

---

## References

- Legacy code inventory: `legacy-code-inventory.md`
- Design doc: `design.md`
- Tasks: `tasks.md` (Phase 3 tasks)
- Migration plan: `docs/plans/ai-provider-migration-plan.md`
