# Legacy Marketing Agents Migration Guide

## Overview

This document describes the migration from `specialized-marketing-agents.ts` to the new `InsightAgentFactory` architecture.

## Current Status

**Phase:** Migration Planning (Task 8.1 Complete)

### Consumers Identified

1. **`marketing-pipeline.ts`** (Primary consumer)
   - Uses `createSpecializedMarketingProductionAgent` and `createSpecializedMarketingTestAgent`
   - Creates agents for three pipeline stages: analysis, insights, verdict
   - Located: `packages/agent-runtime/src/marketing-pipeline.ts`

2. **`index.ts`** (Export re-export)
   - Re-exports specialized agent functions and types
   - Located: `packages/agent-runtime/src/index.ts`

### Migration Approach

#### Option A: Direct Migration (Recommended)

Migrate `marketing-pipeline.ts` to use `InsightAgentFactory` directly:

```typescript
// Before
import { createSpecializedMarketingProductionAgent } from "./specialized-marketing-agents";

const agent = createSpecializedMarketingProductionAgent(factory, kind, options);

// After
import { createInsightAgentFactory } from "./configurable-agents/InsightAgentFactory";
import type { InsightAgentConfig } from "./configurable-agents/InsightAgentConfig";

const insightFactory = createInsightAgentFactory(invocationCache);

const config: InsightAgentConfig = {
  name: "Marketing Analysis Agent",
  role: "analysis",
  systemMessage: "...",
  variables: [],
  tools: [...],
  outputFormat: { type: "text" },
  memoryMode: "none",
  maxHistoryLength: 10,
  modelParams: { temperature: 0.7, maxTokens: 4096, ... },
  includeReasoning: false,
  timeoutMs: 60000,
  retryConfig: { maxRetries: 3, ... },
  isActive: true,
  version: 1,
};

const { agent } = await insightFactory.createAgent(config);
```

#### Option B: Adapter Layer (Temporary)

Use the adapter in `InsightAgentFactory.adapter.ts` which maintains the legacy API while using `InsightAgentFactory` internally.

**Note:** The adapter currently throws an error and requires completion of the tool injection implementation.

## Migration Tasks

### Task 8.2: Migrate Consumers

**Steps:**

1. **Update `marketing-pipeline.ts`**
   - Replace imports from `specialized-marketing-agents` to `InsightAgentFactory`
   - Create `InsightAgentConfig` for each pipeline stage
   - Update agent creation calls
   - Ensure tool injection works correctly

2. **Update `index.ts`**
   - Remove exports from `specialized-marketing-agents`
   - Add exports for `InsightAgentFactory` and related types
   - Maintain backward compatibility if needed (with deprecation warnings)

3. **Update tests**
   - Update `marketing-pipeline.test.ts` (if exists)
   - Ensure all tests pass with new implementation

### Task 8.3: Delete Legacy Code

After all consumers are migrated:

1. Delete `specialized-marketing-agents.ts`
2. Delete `specialized-marketing-agents.test.ts`
3. Remove from `index.ts` exports
4. Update any documentation references

### Task 8.4-8.6: AST Scanning

Create and run AST scanning to detect hardcoded provider references:

```typescript
// Example scan script
import * as ts from "typescript";

// Scan for hardcoded provider IDs like "openai", "anthropic", etc.
// Report findings for remediation
```

## Configuration Mapping

### Legacy → New Config

| Legacy Field   | New Field                 | Notes                      |
| -------------- | ------------------------- | -------------------------- |
| `role`         | `role`                    | Direct mapping             |
| `systemPolicy` | `systemMessage`           | Renamed                    |
| `memoryMode`   | `memoryMode`              | Direct mapping             |
| `temperature`  | `modelParams.temperature` | Nested                     |
| N/A            | `variables`               | New feature                |
| N/A            | `outputFormat`            | New feature                |
| N/A            | `tools`                   | New configuration approach |

## Tool Migration

Legacy approach:

```typescript
const tools = [
  ...createTenantContextTools(deps),
  ...createPlatformFetchTools(deps),
  ...createAnalysisTools(),
  ...createReportPrepTools(),
];
```

New approach (InsightAgentFactory):

```typescript
const config: InsightAgentConfig = {
  tools: [
    { name: "fetch_meta_metrics", enabled: true },
    { name: "fetch_ga4_metrics", enabled: true },
    // ...
  ],
};
```

**Note:** The new approach uses tool configuration rather than direct tool injection. This requires the tools to be registered in a tool registry first.

## Testing Strategy

1. **Unit tests** for `InsightAgentFactory` (already complete - 19 tests)
2. **Integration tests** with mock configurations (already complete - 14 tests)
3. **Pipeline tests** to ensure end-to-end functionality
4. **Regression tests** to verify behavior matches legacy implementation

## Rollback Plan

If migration issues occur:

1. Keep `specialized-marketing-agents.ts` until migration is verified
2. Use feature flag to switch between old and new implementation
3. Monitor error rates and performance metrics

## Timeline

- **Task 8.1:** ✓ Complete (Consumers identified)
- **Task 8.2:** In Progress (Migration implementation)
- **Task 8.3:** Pending (Delete legacy code)
- **Task 8.4-8.6:** Pending (AST scanning)

## References

- `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts`
- `packages/agent-runtime/src/configurable-agents/InsightAgentConfig.ts`
- `packages/agent-runtime/src/specialized-marketing-agents.ts`
- `packages/agent-runtime/src/marketing-pipeline.ts`
