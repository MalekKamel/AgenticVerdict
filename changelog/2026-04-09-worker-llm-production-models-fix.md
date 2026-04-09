# Fix: Worker LLM Production Models Not Enabled

**Date:** 2026-04-09
**Affected Component:** `apps/worker/src/queues/report-queues.ts`

## Issue

The `marketing-analysis` and `verdict-generation` workflows were using mock/test LLM models instead of production models, even when GLM/Anthropic/OpenAI API keys were configured. This resulted in:

- Fast execution times (<20ms)
- Generic placeholder insights ("MOCK_GA4: Sessions and engaged sessions moved together.")
- No actual AI-generated content

## Root Cause

In `runPipelineWorkflow()`:

1. `AgentFactory` was created with `llmEnv: {}` instead of loading LLM credentials from environment
2. `useProductionModels` flag was not passed to `runMarketingAgentPipeline()`

## Fix

```typescript
// Before
const factory = new AgentFactory({ llmEnv: {} });
// ...
runMarketingAgentPipeline({
  factory,
  // ...
});

// After
const llmEnv = loadLlmEnvFromProcess();
const factory = new AgentFactory({ llmEnv });
const useProductionModels = Boolean(
  llmEnv.anthropicApiKey || llmEnv.openAiApiKey || llmEnv.glmApiKey,
);
// ...
runMarketingAgentPipeline({
  factory,
  // ...
  useProductionModels,
});
```

## Changes

1. Import `loadLlmEnvFromProcess` from `@agenticverdict/agent-runtime`
2. Load LLM environment before creating `AgentFactory`
3. Enable production models when any LLM credentials are available

## Verification

After fix:

- S4 (marketing-analysis): 17873ms duration, detailed AI-generated insights
- S12 (verdict-generation): 14729ms duration, detailed AI-generated insights

## Testing Notes

- GLM API key must be set in environment (`GLM_API_KEY`, `GLM_API_BASE_URL`)
- Docker Compose dev override passes these from host `.env` file
- For local testing, add to `.env.local`

## Related Files

- `apps/worker/src/queues/report-queues.ts`
- `packages/agent-runtime/src/llm-env.ts`
- `packages/agent-runtime/src/marketing-pipeline.ts`
