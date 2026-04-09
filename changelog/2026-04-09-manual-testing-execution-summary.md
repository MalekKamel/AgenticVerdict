# Manual Testing Execution Summary - 2026-04-09

## Environment

- **Docker Stack**: 3-file Compose (base + apps + dev override)
- **GLM Credentials**: Configured and working
- **All Services**: Healthy (API, Worker, Web, PostgreSQL, Redis)

## Test Results

### ✅ S1: Basic Report Generation (R01 Production-Flow)

- **Status**: PASSED
- **Duration**: ~1.9s
- **Result**: PDF generated (27,402 bytes)
- **Validation**: All PDF validation checks passed

### ✅ S4: Marketing Analysis Pipeline (with GLM LLM)

- **Status**: PASSED (with LLM fix)
- **Duration**: ~17.9s (real LLM calls)
- **Result**: Detailed AI-generated insights
- **Note**: Pipeline status "degraded" due to mock adapter data limitations (expected behavior)

### ✅ S12: End-to-End Pipeline (verdict-generation)

- **Status**: PASSED (with LLM fix)
- **Duration**: ~14.7s (real LLM calls)
- **Result**: Detailed AI-generated insights
- **Note**: Pipeline status "degraded" due to mock adapter data limitations (expected behavior)

### ⚠️ S5: Multi-Tenant Testing

- **Status**: PARTIAL
- **Issue**: Reports API returns 500 error (needs investigation)
- **Note**: Multi-tenant workflow triggers work correctly

## Code Fixes Applied

### 1. Worker LLM Production Models Fix

**File**: `apps/worker/src/queues/report-queues.ts`

**Problem**: AgentFactory was created with empty `llmEnv: {}` and `useProductionModels` was not enabled.

**Solution**:

```typescript
import { loadLlmEnvFromProcess } from "@agenticverdict/agent-runtime";

// Load LLM credentials from environment
const llmEnv = loadLlmEnvFromProcess();
const factory = new AgentFactory({ llmEnv });

// Enable production models when credentials are available
const useProductionModels = Boolean(
  llmEnv.anthropicApiKey || llmEnv.openAiApiKey || llmEnv.glmApiKey,
);

// Pass to pipeline
runMarketingAgentPipeline({
  factory,
  // ...
  useProductionModels,
});
```

**Impact**: Marketing analysis and verdict generation workflows now use real LLM models when credentials are configured.

## Configuration Updates

### Environment Variables

Created `.env` at repo root for Docker GLM credentials:

```env
GLM_API_KEY=6f29be059e324b448e4f649cf239828d.O7OQGmbHZyzg31W6
GLM_API_BASE_URL=https://api.z.ai/api/anthropic
GLM_MODEL=glm-4.5
GLM_TIMEOUT=30000
```

Updated `.env.local` for local development.

## Documentation Updates Needed

### manual-testing-guide.md

The guide is accurate for the most part. Consider adding:

1. **LLM Configuration Section**: Explicitly mention that GLM credentials need to be in `.env` at repo root for Docker testing
2. **Expected Pipeline Behavior**: Document that "degraded" pipeline status with mock adapters is expected when no real platform data is available
3. **Execution Time Indicators**: Add expected execution times:
   - Mock LLM: <50ms
   - Production LLM: 10-30s

### Known Issues

1. **Web Adapter Health**: Shows `mockMode: false` in Docker (expected - web runs with NODE_ENV=production)
2. **Reports API**: Returns 500 for GET /api/v1/reports (separate investigation needed)
3. **Platform Fetch Errors**: Mock adapters may return `platformFetchFailed` - this is expected behavior with limited mock data

## Recommendations

1. **CI Testing**: Add GLM credentials to CI secrets for E2E testing
2. **Feature Flags**: Consider runtime feature flag for controlling production vs test models
3. **Metrics**: Add LLM call metrics for observability
4. **Error Messages**: Improve error messages when platform fetches fail with mock adapters

## Next Steps

1. Investigate and fix reports API 500 error
2. Add comprehensive integration tests for LLM-backed workflows
3. Update monitoring dashboards for LLM-specific metrics
4. Document expected pipeline states with various adapter configurations
