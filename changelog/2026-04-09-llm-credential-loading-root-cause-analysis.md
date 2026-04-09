# LLM Credential Loading Root Cause Analysis

**Date:** 2026-04-09
**Severity:** High
**Status:** Fixed

## Executive Summary

The marketing-analysis and verdict-generation workflows were using mock/test LLM models instead of production LLM APIs (GLM/Anthropic/OpenAI), even when valid API credentials were configured in the environment. This caused workflows to complete in milliseconds with generic placeholder responses instead of executing real AI inference.

## Root Cause Analysis

### The Problem

In `apps/worker/src/queues/report-queues.ts`, the `runPipelineWorkflow` function was:

1. Creating `AgentFactory` with an empty `llmEnv` object: `new AgentFactory({ llmEnv: {} })`
2. Not passing `useProductionModels` flag to `runMarketingAgentPipeline`

```typescript
// BEFORE (broken code)
async function runPipelineWorkflow(data: WorkflowTriggerJobData) {
  const factory = new AgentFactory({ llmEnv: {} }); // ❌ Empty credentials
  // ...
  await runMarketingAgentPipeline({
    factory,
    // ...
    // ❌ useProductionModels not set
  });
}
```

### Why This Happened

**Design Intent vs Implementation Gap:**

The codebase has proper LLM infrastructure:

- `loadLlmEnvFromProcess()` in `packages/agent-runtime/src/llm-env.ts`
- `AgentFactory` designed to receive `llmEnv` dependency
- `useProductionModels` flag to control mock vs production models

**However**, the worker implementation shortcutted this pattern:

- Empty `llmEnv` meant no credentials available
- No `useProductionModels` meant default to test/mock mode
- The pipeline has a fallback path when no production models are available

**The Silent Failure:**

The code didn't fail explicitly because:

1. `AgentFactory` accepts empty `llmEnv` (valid for test scenarios)
2. `createSpecializedMarketingTestAgent` is used when `useProductionModels` is falsy
3. Mock agents return deterministic responses quickly
4. The workflow completes "successfully" with degraded results

## The Fix Applied

### Code Changes

**File:** `apps/worker/src/queues/report-queues.ts`

```typescript
// Import the LLM environment loader
import { loadLlmEnvFromProcess } from "@agenticverdict/agent-runtime";

async function runPipelineWorkflow(data: WorkflowTriggerJobData) {
  // Load LLM credentials from environment
  const llmEnv = loadLlmEnvFromProcess();

  // Create AgentFactory with actual credentials
  const factory = new AgentFactory({ llmEnv });

  // Enable production models when credentials are available
  const useProductionModels = Boolean(
    llmEnv.anthropicApiKey || llmEnv.openAiApiKey || llmEnv.glmApiKey,
  );

  // Pass flag to pipeline
  await runMarketingAgentPipeline({
    factory,
    // ...
    useProductionModels, // ✅ Now uses real LLM when configured
  });
}
```

### Why This Fix Works

1. **`loadLlmEnvFromProcess()`**: Reads all LLM-related environment variables
2. **`AgentFactory({ llmEnv })`**: Injects credentials into the agent factory
3. **`useProductionModels`**: Tells pipeline to use production agents instead of test agents
4. **Graceful fallback**: If no credentials, still uses mock models (test scenarios)

## Complete LLM Credential Flow

### Environment Variables → LLM Usage

```
┌─────────────────────────────────────────────────────────────┐
│ Environment Variables                                       │
│ ├─ GLM_API_KEY                                            │
│ ├─ GLM_API_BASE_URL                                       │
│ ├─ GLM_MODEL                                              │
│ ├─ ANTHROPIC_API_KEY                                      │
│ └─ OPENAI_API_KEY                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ llm-env.ts: loadLlmEnvFromProcess()                         │
│ - Reads process.env                                         │
│ - Returns AgentLlmEnv                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ AgentFactory({ llmEnv })                                    │
│ - Stores LLM credentials                                    │
│ - Creates chat models via createPrimaryAndFallbackChatModels │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ createPrimaryAndFallbackChatModels()                        │
│ - Selects primary provider (GLM → Anthropic → OpenAI)       │
│ - Creates BaseChatModel instances                           │
│ - Configures fallback chain                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ ConfigurableLlmAgent                                        │
│ - Uses primary/fallback chat models                         │
│ - Executes LLM inference                                    │
└─────────────────────────────────────────────────────────────┘
```

### Agent Creation Flow

```
runMarketingAgentPipeline({ useProductionModels })
  │
  ├─ useProductionModels = true
  │   └─ createSpecializedMarketingProductionAgent()
  │       └─ factory.createAgentWithTools(cfg, tools)
  │           └─ factory.createAgent(cfg) with runtimeMode="production"
  │               └─ createPrimaryAndFallbackChatModels(role, llmEnv)
  │
  └─ useProductionModels = false/undefined
      └─ createSpecializedMarketingTestAgent()
          └─ factory.createAgentWithTools({ runtimeMode: "test" })
              └─ new AgentMockChatModel() (deterministic responses)
```

## Verification

### Before Fix

```
Duration: ~14ms
Response: "MOCK_GA4: Sessions and engaged sessions moved together."
Pipeline Status: degraded (mock models)
```

### After Fix

```
Duration: ~17,873ms (17.9 seconds)
Response: Detailed AI-generated marketing analysis with structured insights
Pipeline Status: degraded (platform data limitations, not LLM)
```

## Other Code Locations Verified

| Location                      | Status     | Notes                                                  |
| ----------------------------- | ---------- | ------------------------------------------------------ |
| `scripts/live-llm-verdict.ts` | ✅ Correct | Already uses `parseAgentLlmEnv(process.env)`           |
| Test files (`.test.ts`)       | ✅ Correct | Intentionally use `llmEnv: {}` for deterministic tests |
| API workflows routes          | ✅ Correct | Only validates/enqueues; no LLM usage in API           |
| `AgentFactory` class          | ✅ Correct | Properly designed for dependency injection             |

## Impact Assessment

### Affected Workflows

- ✅ **marketing-analysis**: Now uses production LLM
- ✅ **verdict-generation**: Now uses production LLM
- ✅ **report-generation**: Unaffected (uses production-flow PDF, not LLM)

### Affected Environments

- ✅ **Docker (dev override)**: Fixed - reads from host `.env`
- ✅ **Local `pnpm dev`**: Fixed - reads from `.env.local`
- ✅ **Production**: Unaffected - should have credentials via secrets

### Backward Compatibility

- ✅ No credentials → Falls back to mock models (test scenarios)
- ✅ Partial credentials → Uses available provider with fallback
- ✅ All existing tests pass (intentionally use mocks)

## Recommendations

1. **✅ Implemented**: Load LLM credentials in worker
2. **✅ Implemented**: Enable production models when credentials available
3. **Consider**: Add metrics for LLM vs mock usage
4. **Consider**: Add startup validation that warns when no LLM credentials configured
5. **Consider**: Document expected execution times in monitoring dashboards

## Lessons Learned

1. **Dependency Injection**: The `AgentFactory` was well-designed for DI, but the worker bypassed it
2. **Silent Failures**: Missing credentials should ideally log a warning, not silently use mocks
3. **Test vs Production**: The distinction between test and production code paths needs explicit flags
4. **Documentation**: The correct pattern (`loadLlmEnvFromProcess()`) exists but wasn't obvious

## Related Changelogs

- `changelog/2026-04-09-worker-llm-production-models-fix.md`
- `changelog/2026-04-09-manual-testing-execution-summary.md`
