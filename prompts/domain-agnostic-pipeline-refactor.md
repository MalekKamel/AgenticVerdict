# Domain-Agnostic Intelligence Pipeline — Implementation Plan

**Date:** 2026-05-08
**Status:** Ready for Implementation
**Scope:** `packages/agent-runtime`, `packages/types`, `apps/worker`, `apps/api`, `packages/report-generator`

---

## 1. Current State Analysis

### 1.1 Marketing-Specific Couplings Identified

| Category                 | Location                              | Coupling                                                                              |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------- |
| **File naming**          | `marketing-pipeline.ts`               | Domain-specific filename                                                              |
| **Type naming**          | 15+ types with `Marketing` prefix     | `MarketingPipelineState`, `MarketingVerdict`, `MarketingPipelineStageName`, etc.      |
| **Agent kinds**          | `marketing-agents-migration.ts`       | Hardcoded: `cross_platform_analysis`, `marketing_insight_generation`, `media_verdict` |
| **System messages**      | `marketing-agents-migration.ts:33-46` | "You are a cross-platform **marketing** analysis agent"                               |
| **Tenant config access** | `marketing-pipeline.ts:162`           | `tenant.config.marketing.channels` — assumes marketing section exists                 |
| **Default platforms**    | `marketing-pipeline.ts:172`           | `"Meta, GA4, GSC, GBP, TikTok"` — hardcoded marketing platforms                       |
| **Provenance tags**      | `marketing-pipeline.ts:223,248,282`   | `type: "marketing_pipeline_stage"`                                                    |
| **Pipeline identifier**  | `marketing-pipeline.ts:157`           | `pipeline: "marketing_analysis_insights_verdict"`                                     |
| **Default policy**       | `agent-context-integration.ts:50`     | "You are a **marketing** analytics assistant"                                         |
| **Prompt section key**   | `prompts/tenant-injection.ts:27-34`   | `marketing_channels` section key                                                      |
| **Worker queue strings** | `report-queues.ts:161,209,299`        | "Pipeline-generated **marketing** insight", `marketing_verdict_unavailable`           |
| **API documentation**    | `openapi.ts:22`, `verdicts.ts:46`     | "Unified **MarketingVerdict** payloads"                                               |

### 1.2 Dependency Graph

```
packages/types/verdict.ts (marketingVerdictSchema, MarketingVerdict)
    ├── packages/types/analysis.ts (uses marketingVerdictSchema)
    ├── packages/types/index.ts (re-exports)
    ├── packages/agent-runtime/agent-verdict-json.ts (parses MarketingVerdict)
    ├── packages/agent-runtime/marketing-pipeline.ts (consumes MarketingVerdict)
    ├── packages/report-generator/phase2-report-model.ts
    └── apps/api/routes/v1/verdicts.ts, validation.ts

packages/agent-runtime/marketing-pipeline.ts
    ├── apps/worker/queues/report-queues.ts (imports runMarketingAgentPipeline)
    ├── scripts/live-llm-verdict.ts
    └── packages/agent-runtime/src/*.test.ts (3 test files)

packages/agent-runtime/marketing-agents-migration.ts
    └── packages/agent-runtime/marketing-pipeline.ts (creates agents)
```

### 1.3 Legitimate Domain Modules (NOT to be changed)

These are proper domain-specific modules that should remain as-is:

- `b2b-marketing-kpis.ts` — B2B marketing is a real business domain
- `marketing-metrics-store.ts` — Database table `marketing_metrics`
- `config.marketing` section — Tenant configuration for marketing channels/KPIs
- `dashboardDomainSlugSchema` — "marketing" is one of 6 valid domain slugs
- Database `marketingMetrics` table — Schema-level naming

---

## 2. Target Architecture

### 2.1 Domain-Agnostic Pipeline Design

```
┌─────────────────────────────────────────────────────────┐
│                    Intelligence Pipeline                 │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │ Analysis  │───▶│ Insights │───▶│  Verdict  │           │
│  │  Agent    │    │  Agent   │    │  Agent    │           │
│  └──────────┘    └──────────┘    └──────────┘           │
│                                                          │
│  Configured by: Insight.aiConfig (typed schema)          │
│  System messages: From insight config or templates       │
│  Agent selection: From insight config roles              │
│  Domain context: From TenantConfig.business.insights     │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Key Design Principles

1. **Pipeline stages are generic** — `analysis`, `insights`, `verdict` roles exist in `agentRoleSchema` already
2. **System messages are configurable** — Via `AgentConfig.systemMessage` or insight-level `aiConfig`
3. **Agent kinds are derived from config** — Not hardcoded; resolved from insight configuration
4. **Tenant context is domain-agnostic** — Uses `TenantConfig.business.insights` for domain metadata
5. **Backward compatible** — Legacy marketing pipeline behavior preserved via migration shim

---

## 3. Type System Changes

### 3.1 packages/types/verdict.ts

| Current                                | New                           | Rationale                   |
| -------------------------------------- | ----------------------------- | --------------------------- |
| `marketingVerdictSchema`               | `verdictSchema`               | Domain-agnostic schema name |
| `MarketingVerdict`                     | `Verdict`                     | Generic type name           |
| `marketingVerdictReportMetadataSchema` | `verdictReportMetadataSchema` | Consistent naming           |

**Note:** The schema content remains identical. Only names change.

### 3.2 packages/types/analysis.ts

| Current                                     | New                                |
| ------------------------------------------- | ---------------------------------- |
| `import { marketingVerdictSchema }`         | `import { verdictSchema }`         |
| `verdicts: z.array(marketingVerdictSchema)` | `verdicts: z.array(verdictSchema)` |

### 3.3 packages/types/index.ts

Update re-exports to use new names.

### 3.4 packages/agent-runtime/marketing-pipeline.ts → intelligence-pipeline.ts

| Current                                           | New                                              |
| ------------------------------------------------- | ------------------------------------------------ |
| `MarketingPipelineStageName`                      | `PipelineStageName`                              |
| `MarketingPipelineStageRecord`                    | `PipelineStageRecord`                            |
| `MarketingPipelineStatus`                         | `PipelineStatus`                                 |
| `MarketingPipelineState`                          | `PipelineState`                                  |
| `MarketingWorkflowProgressEvent`                  | `WorkflowProgressEvent`                          |
| `RunMarketingPipelineOptions`                     | `RunPipelineOptions`                             |
| `runMarketingAgentPipeline`                       | `runIntelligencePipeline`                        |
| `marketingPipelineStateToJson`                    | `pipelineStateToJson`                            |
| `marketingPipelineTimingToLogFields`              | `pipelineTimingToLogFields`                      |
| `PIPELINE_AGENT_NAMES`                            | `PIPELINE_AGENT_NAMES` (internal, values change) |
| `pipeline: "marketing_analysis_insights_verdict"` | `pipeline: "intelligence_pipeline"`              |
| `type: "marketing_pipeline_stage"`                | `type: "pipeline_stage"`                         |

### 3.5 packages/agent-runtime/marketing-agents-migration.ts → agent-kinds.ts

| Current                                  | New                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `SpecializedMarketingAgentKind`          | `PipelineAgentKind`                                                    |
| `CreateSpecializedMarketingAgentOptions` | `CreatePipelineAgentOptions`                                           |
| `convertLegacyOptionsToInsightConfig`    | `createPipelineAgentConfig`                                            |
| `createMarketingAgentTools`              | `createPipelineAgentTools`                                             |
| Agent kind literals                      | `"analysis"`, `"insights"`, `"verdict"` (align with `agentRoleSchema`) |
| System messages                          | Domain-agnostic: "You are a cross-platform analysis agent"             |

### 3.6 packages/agent-runtime/agent-verdict-json.ts

| Current                                  | New                             |
| ---------------------------------------- | ------------------------------- |
| `parseMarketingVerdictFromAgentText`     | `parseVerdictFromAgentText`     |
| `safeParseMarketingVerdictFromAgentText` | `safeParseVerdictFromAgentText` |
| `applyMarketingVerdictPipelineContext`   | `applyVerdictPipelineContext`   |
| `import type { MarketingVerdict }`       | `import type { Verdict }`       |
| `import { marketingVerdictSchema }`      | `import { verdictSchema }`      |

### 3.7 packages/agent-runtime/test-utils/marketing-verdict-fixtures.ts → verdict-fixtures.ts

| Current                               | New                          |
| ------------------------------------- | ---------------------------- |
| `BuildMarketingVerdictFixtureOptions` | `BuildVerdictFixtureOptions` |
| `buildMarketingVerdictFixture`        | `buildVerdictFixture`        |
| `buildMinimalMarketingVerdict`        | `buildMinimalVerdict`        |

---

## 4. Configuration Model

### 4.1 Insight-Level AI Configuration

The `insights.aiConfig` column (currently untyped JSONB) should drive pipeline behavior:

```typescript
interface InsightAIConfig {
  systemMessage?: string; // Override default system message
  providerId?: string; // AI provider override
  modelId?: string; // Model override
  qualityLevel?: "low" | "medium" | "high";
  detailLevel?: "brief" | "standard" | "detailed";
  stages?: PipelineStageConfig[]; // Per-stage configuration
}

interface PipelineStageConfig {
  role: "analysis" | "insights" | "verdict";
  systemMessage?: string;
  modelOverride?: string;
  enabled: boolean;
}
```

### 4.2 System Message Resolution Order

1. **Insight-level `aiConfig.systemMessage`** (highest priority)
2. **Insight-level stage config `systemMessage`** (per-stage override)
3. **TenantConfig.ai preferences** (tenant-level defaults)
4. **AgentFactory default policy** (fallback: domain-agnostic)
5. **Template library** (versioned prompt templates)

### 4.3 Tenant Context for Domain Metadata

Replace `tenant.config.marketing.channels` access with:

```typescript
// Current (marketing-specific):
const platforms = tenant.config.marketing.channels
  .filter((c) => c.enabled)
  .map((c) => c.label || c.platform);

// Target (domain-agnostic):
const connectors = insight.connectors; // From insight configuration
const platforms = connectors.map((c) => c.connectorType);
```

---

## 5. Migration Strategy

### Phase 1: Type Renaming (packages/types)

1. Rename `marketingVerdictSchema` → `verdictSchema` in `verdict.ts`
2. Rename `MarketingVerdict` → `Verdict` in `verdict.ts`
3. Rename `marketingVerdictReportMetadataSchema` → `verdictReportMetadataSchema`
4. Update `analysis.ts` imports
5. Update `index.ts` re-exports
6. **Keep deprecated aliases** for backward compatibility:
   ```typescript
   /** @deprecated Use verdictSchema */
   export const marketingVerdictSchema = verdictSchema;
   /** @deprecated Use Verdict */
   export type MarketingVerdict = Verdict;
   ```

### Phase 2: Core Pipeline Refactoring (packages/agent-runtime)

1. Rename `marketing-pipeline.ts` → `intelligence-pipeline.ts`
2. Rename all exported types and functions
3. Update internal constants (agent names, provenance tags, pipeline identifier)
4. Replace `tenant.config.marketing.channels` with insight connector access
5. Rename `marketing-agents-migration.ts` → `agent-kinds.ts`
6. Update agent kinds to align with `agentRoleSchema` roles
7. Update system messages to domain-agnostic text
8. Rename `agent-verdict-json.ts` functions
9. Rename `agent-performance-metrics.ts` function
10. Rename test utilities file and exports
11. Update `index.ts` barrel exports
12. **Keep deprecated aliases** for all renamed exports

### Phase 3: Downstream Consumer Updates

1. **apps/worker/queues/report-queues.ts** — Update imports, type names, log strings
2. **apps/api/routes/v1/verdicts.ts** — Update type imports, doc strings
3. **apps/api/routes/v1/validation.ts** — Update type imports, doc strings
4. **apps/api/openapi.ts** — Update doc strings
5. **apps/api/services/analysis-store.ts** — Update fixture imports
6. **packages/report-generator** — Update imports and function names
7. **scripts/live-llm-verdict.ts** — Update imports

### Phase 4: Hardcoded Marketing String Generalization

1. **agent-context-integration.ts** — Update default policy to domain-agnostic
2. **prompts/tenant-injection.ts** — Rename `marketing_channels` to `connectors` or `data_sources`
3. **provider-agent.ts** — Remove hardcoded `section: "marketing"` default
4. **report-queues.ts** — Update event names and workflow phase strings

### Phase 5: Test Updates

1. Update all test file imports
2. Update test fixture references
3. Verify all tests pass with new names

### Phase 6: Cleanup (Optional, future PR)

1. Remove deprecated aliases
2. Remove `marketing-agents-migration.ts` migration shim entirely
3. Update any remaining marketing references in documentation

---

## 6. Backward Compatibility

### 6.1 Deprecated Aliases Strategy

All renamed types/functions will have deprecated aliases in the same file:

```typescript
// New canonical export
export { verdictSchema, type Verdict };

// Deprecated aliases (for gradual migration)
/** @deprecated Use `verdictSchema` */
export const marketingVerdictSchema = verdictSchema;
/** @deprecated Use `Verdict` */
export type MarketingVerdict = Verdict;
```

### 6.2 Pipeline Function Compatibility

`runMarketingAgentPipeline` will be a thin wrapper around `runIntelligencePipeline`:

```typescript
/** @deprecated Use runIntelligencePipeline */
export const runMarketingAgentPipeline = runIntelligencePipeline;
```

### 6.3 Worker Queue Compatibility

Worker queue will accept both old and new event names during transition:

```typescript
// Accept both for backward compatibility
const isMarketingVerdict = kind === "marketing_verdict" || kind === "verdict";
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

| Test File                             | Changes Required                                    |
| ------------------------------------- | --------------------------------------------------- |
| `marketing-pipeline.test.ts`          | Rename file, update all imports and type references |
| `load-testing.test.ts`                | Update import from `runMarketingAgentPipeline`      |
| `phase8-performance-behavior.test.ts` | Update import                                       |
| `phase2-report-model.test.ts`         | Update fixture imports                              |

### 7.2 Integration Tests

- Worker queue processing tests — verify pipeline execution with new names
- API route tests — verify verdict endpoints with updated types
- Report generation tests — verify verdict mapping with new schema names

### 7.3 Test Coverage Requirements

- Pipeline execution: all 3 stages (analysis, insights, verdict)
- Verdict parsing: success, JSON failure, schema validation failure, degraded mode
- Tenant context propagation: verify tenant isolation preserved
- Backward compatibility: deprecated aliases work correctly

---

## 8. Risk Assessment

### 8.1 Breaking Changes

| Risk                                                      | Impact | Mitigation                                    |
| --------------------------------------------------------- | ------ | --------------------------------------------- |
| External API consumers using `MarketingVerdict` type name | Medium | Deprecated aliases preserve compatibility     |
| Worker queue processing during deployment                 | High   | Accept both old and new event names           |
| Database schema references to `marketingVerdict`          | Low    | Only type-level changes; no DB schema changes |
| Frontend components importing `MarketingVerdict`          | Medium | Deprecated aliases; search and update         |

### 8.2 Multi-Tenant Safety

- **Tenant isolation preserved** — `applyVerdictPipelineContext` still overwrites `tenantId` with server-side value
- **No hardcoded tenant logic** — All tenant behavior driven by config
- **AsyncLocalStorage propagation** — Unchanged; tenant context flows through pipeline
- **RLS compatibility** — No database access changes; only type renaming

### 8.3 Observability

- **Logging** — Structured log fields unchanged; only pipeline identifier string changes
- **Prometheus metrics** — Metric names unchanged; labels may reference new pipeline name
- **Sentry errors** — Error types unchanged; stack traces will reference new filenames
- **LangSmith traces** — Trace metadata will use new pipeline identifier

---

## 9. Implementation Order

```
1. packages/types/verdict.ts          (schema + type renames + deprecated aliases)
2. packages/types/analysis.ts         (import updates)
3. packages/types/index.ts            (re-export updates)
4. packages/agent-runtime/agent-verdict-json.ts    (function renames)
5. packages/agent-runtime/agent-performance-metrics.ts (function rename)
6. packages/agent-runtime/marketing-agents-migration.ts → agent-kinds.ts
7. packages/agent-runtime/marketing-pipeline.ts → intelligence-pipeline.ts
8. packages/agent-runtime/test-utils/marketing-verdict-fixtures.ts → verdict-fixtures.ts
9. packages/agent-runtime/index.ts    (barrel export updates)
10. apps/worker/queues/report-queues.ts
11. apps/api/routes/v1/verdicts.ts
12. apps/api/routes/v1/validation.ts
13. apps/api/openapi.ts
14. apps/api/services/analysis-store.ts
15. packages/report-generator/src/index.ts
16. packages/report-generator/src/integration/phase2-report-model.ts
17. scripts/live-llm-verdict.ts
18. packages/agent-runtime/src/agent-context-integration.ts
19. packages/agent-runtime/src/prompts/tenant-injection.ts
20. packages/agent-runtime/src/provider-agent.ts
21. Test files (4 files)
```

---

## 10. Success Criteria

- [ ] All `Marketing` prefixes removed from pipeline-related types/functions (except legitimate domain modules)
- [ ] Deprecated aliases in place for all renamed exports
- [ ] `typecheck` passes with zero errors
- [ ] `lint` passes with zero errors
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Worker queue processes jobs with new pipeline
- [ ] API endpoints return verdicts with updated types
- [ ] No hardcoded marketing assumptions in pipeline code
- [ ] System messages are domain-agnostic
- [ ] Tenant context propagation verified
- [ ] Observability outputs use new pipeline identifiers
