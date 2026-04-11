# Mock Adapter Pipeline Remediation Plan

**Date:** 2026-04-09  
**Severity:** High  
**Status:** Implemented (Approach A phases completed)  
**Related Documents:**

- `/test-output/manual-testing-execution-report-2026-04-09.md`
- `/changelog/2026-04-09-llm-credential-loading-root-cause-analysis.md`

---

## Executive Summary

The AgenticVerdict marketing analysis and verdict-generation pipelines operate in a **degraded** state when using mock adapters, even though the system completes successfully. This degradation prevents the AI agents from accessing platform data, resulting in generic "no data sources available" responses instead of meaningful cross-platform analysis.

**Root Cause:** Specialized marketing agents lack platform fetch tools and the worker does not provide platform adapter dependencies to the pipeline.

**Impact:** High — Cannot perform end-to-end testing of marketing workflows without production credentials.

**Estimated Remediation Effort:** 3-5 days

**Architecture Note:** See `/docs/06-reference/agent-architecture-consolidation-analysis.md` for the unified `AgentSystem` architecture that consolidates the fragmented agent initialization patterns identified during this analysis.

---

## Implementation Closure (2026-04-09)

The incremental remediation plan (Approach A) has been implemented across Phases 1-5.

### Completed by Phase

- **Phase 1 - Platform Tool Integration:** Completed in `agent-runtime` (specialized agent options, platform tool wiring, auto-tool registration updates, and targeted tests).
- **Phase 2 - Worker Adapter Factory:** Completed in `worker` (`connector-factory.ts`, tenant connector gating, pipeline dependency injection).
- **Phase 3 - Mock Adapter Data Enhancement:** Completed in `packages/data-connectors` with deterministic `realistic` scenario and platform-native metric keys (`meta.*`, `ga4.*`, `gsc.*`, `gbp.*`, `tiktok.*`).
- **Phase 4 - Dynamic Platform Discovery:** Completed via runtime platform derivation from tenant channels and propagation to pipeline prompt variables.
- **Phase 5 - Error Handling and Validation:** Completed via platform request validation (invalid/disabled platform handling with early failure metadata).

### Verification Evidence

The following targeted validations were executed successfully during implementation:

```bash
pnpm --filter @agenticverdict/data-connectors test -- mock-static-data.test.ts mock-adapter-factory.test.ts mock-adapter-metrics.integration.test.ts
pnpm --filter @agenticverdict/data-connectors typecheck
pnpm --filter @agenticverdict/worker typecheck
pnpm --filter @agenticverdict/worker test -- src/queues/report-queues.test.ts
pnpm --filter @agenticverdict/agent-runtime test -- src/specialized-marketing-agents.test.ts src/marketing-pipeline.test.ts
```

Benchmark-oriented repetition (mock marketing-analysis path):

```bash
for i in 1 2 3 4 5; do
  pnpm --filter @agenticverdict/worker test -- src/queues/report-queues.test.ts -t "runs marketing-analysis through pipeline workflow processor"
done
```

Observed timings in this pass:

- `report-queues.test.ts` file runtime remained in a tight band: **451ms-543ms**
- Focused `marketing-analysis` test invocation (when emitted by Vitest) remained around **312ms-355ms**
- No degradation indicators were observed versus prior remediation-session runs.

### Notes

- The recommended unified `AgentSystem` architecture (Approach B) remains a future consolidation path and is not required for this remediation to function.
- End-to-end manual execution in Docker should be run as a post-closure operational validation (see `tests/docs/manual-testing-guide.md`).

---

## Table of Contents

1. [Root Cause Analysis](#root-cause-analysis)
2. [Detailed Findings](#detailed-findings)
3. [Remediation Approaches](#remediation-approaches)
   - [Approach A: Incremental Fixes (Original)](#approach-a-incremental-fixes-original)
   - [Approach B: Unified AgentSystem Architecture (Recommended)](#approach-b-unified-agentsystem-architecture-recommended)
4. [Implementation Guidance](#implementation-guidance)
5. [Testing Strategy](#testing-strategy)
6. [Risk Assessment](#risk-assessment)

---

## Root Cause Analysis

### Primary Issue: Missing Platform Fetch Tools in Marketing Agents

**Location:** `packages/agent-runtime/src/specialized-marketing-agents.ts`

**Current Implementation (BROKEN):**

```typescript
export function createSpecializedMarketingProductionAgent(
  factory: AgentFactory,
  kind: SpecializedMarketingAgentKind,
  options: CreateSpecializedMarketingAgentOptions,
): IAgent {
  const cfg = buildSpecializedMarketingFactoryConfig(kind, options);
  const sharedTools = [
    ...createCompanyContextTools(),
    ...createAnalysisTools(),
    ...createReportPrepTools(),
    // ❌ MISSING: Platform fetch tools!
  ];
  return factory.createAgentWithTools(cfg, sharedTools, {
    invocationCache: options.invocationCache,
  }).agent;
}
```

**Problem:** The agents are created without access to `fetch_meta_metrics`, `fetch_ga4_metrics`, `fetch_gsc_metrics`, etc. When the analysis agent runs, it has no tools to retrieve platform data.

---

### Secondary Issue: No Platform Adapter Factory in Worker

**Location:** `apps/worker/src/queues/report-queues.ts`

**Current Implementation (INCOMPLETE):**

```typescript
async function runPipelineWorkflow(
  data: WorkflowTriggerJobData,
): Promise<WorkflowTriggerJobResult> {
  const llmEnv = loadLlmEnvFromProcess();
  const factory = new AgentFactory({ llmEnv });
  // ❌ No platform adapter factory or dependencies created
  const pipelineState = await runAgentJob({ tenant, runId }, async (scope) =>
    runMarketingAgentPipeline({
      factory,
      ctx: scope.invocation,
      workflowId,
      // ... other options
      // ❌ No platform deps passed
    }),
  );
}
```

**Problem:** The worker doesn't create platform adapters or pass `PlatformFetchToolDeps` to the pipeline.

---

### Tertiary Issue: Static Platform List vs Dynamic Configuration

**Location:** `packages/agent-runtime/src/specialized-marketing-agents.ts:89`

```typescript
platforms: vars.platforms ?? "Meta, GA4, GSC, GBP, TikTok",
```

**Problem:** The analysis template uses a hardcoded platform list instead of dynamically listing enabled platforms from company configuration.

---

### Quaternary Issue: Mock Adapter Data Limitations

**Location:** `packages/data-connectors/src/mock-adapter.ts`

**Current Mock Implementation:**

```typescript
normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedConnectorSnapshot {
  if (this.records) {
    return { platform: this.platform, dateRange, records: [...this.records] };
  }
  const payload = rawData as { records?: NormalizedMetricRecord[] };
  return {
    platform: this.platform,
    dateRange,
    records: payload.records ?? [],  // ❌ Often empty!
  };
}
```

**Problem:** Mock adapters return minimal or empty data unless explicitly configured with `records` override. Real adapters return complex nested structures with rich metadata.

---

## Detailed Findings

### Finding 1: Agent Tool Registration Gap

**Severity:** Critical  
**Location:** `packages/agent-runtime/src/specialized-marketing-agents.ts`

The Phase 4 agent tool ecosystem includes **18 tools** organized into categories:

- Platform fetch tools (5): `fetch_meta_metrics`, `fetch_ga4_metrics`, etc.
- Database query tools (3): `query_historical_metrics`, etc.
- Analysis tools (3): `calculate_metrics`, `analyze_trends`, etc.
- Company context tools (2): `get_company_profile`, etc.
- B2B KPI tools (2): `compute_b2b_kpis_from_snapshots`, etc.
- Report prep tools (3): `generate_summary`, etc.

**Current State:** Specialized marketing agents only register tools from 3 categories (company context, analysis, report prep), completely missing platform fetch tools.

**Expected State:** All Phase 4 tools should be available to marketing agents, especially platform fetch tools.

---

### Finding 2: Platform Adapter Dependency Chain

**Severity:** High  
**Location:** `apps/worker/src/queues/report-queues.ts`

**Required Dependency Flow:**

```
Worker (report-queues.ts)
  ↓ creates
Platform Adapter Factory (needs tenant config + cache + circuit breaker)
  ↓ provides
PlatformFetchToolDeps {
  getAdapter: (platform) => ConnectorAdapter,
  authenticateAdapter?: (adapter) => Promise<void>
}
  ↓ passed to
Marketing Pipeline (runMarketingAgentPipeline)
  ↓ used by
Platform Fetch Tools (fetch_meta_metrics, etc.)
  ↓ called by
Marketing Agents (analysis, insights, verdict)
```

**Current State:** Chain broken at step 1 — worker doesn't create platform adapter factory.

---

### Finding 3: Mock Adapter Data Structure Gaps

**Severity:** Medium  
**Location:** `packages/data-connectors/src/mock-adapter.ts`

**What Real Adapters Return:**

| Platform | Raw Payload Structure                                                                | Key Metric Examples                                                 |
| -------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Meta     | `{ adAccountId, campaigns, adSets, ads, insights, fetchedAt }`                       | `meta.impressions`, `meta.spend`, `meta.clicks`, `meta.conversions` |
| GA4      | `{ propertyId, eventReport, trafficReport, realtimeReport, sampling, dataApiCalls }` | `ga4.event.sessions`, `ga4.event.users`, `ga4.traffic.bounceRate`   |
| GSC      | `{ siteUrl, searchAnalytics[], sitemaps, urlInspection }`                            | `gsc.search.clicks`, `gsc.search.impressions`, `gsc.search.ctr`     |

**What Mock Adapters Return:**

- Default: `{ mock: true, platform }` → normalizes to empty records array
- With `records` override: Only the provided records, no nested structures

**Missing Elements:**

1. Complex nested raw data structures
2. Pagination support (GSC)
3. Sampling metadata (GA4)
4. API call counts
5. Platform-specific metric hierarchies
6. Realistic dimension combinations

---

### Finding 4: Configuration Gaps

**Severity:** Medium  
**Locations:** Multiple

**Issues:**

1. **No Platform Validation:** System doesn't validate if enabled platforms have proper credentials
2. **Static Platform List:** Analysis template uses hardcoded list instead of `tenant.config.marketing.channels`
3. **No Platform Discovery:** No mechanism to detect which platforms are available
4. **Mock/Production Disconnect:** When mock adapters are enabled via environment but system expects production credentials

---

## Remediation Approaches

Based on the comprehensive architecture analysis in `/docs/06-reference/agent-architecture-consolidation-analysis.md`, there are two approaches to remediation:

### Approach A: Incremental Fixes (Original)

The following sections (Phase 1-5) describe the original incremental approach of fixing individual issues without addressing the underlying architectural fragmentation.

**Pros:**

- Lower risk per change
- Can be implemented incrementally
- Familiar patterns maintained

**Cons:**

- Doesn't address root architectural fragmentation
- Leaves 7+ dependency interfaces scattered
- AgentFactory duplication remains
- Technical debt accumulates

### Approach B: Unified AgentSystem Architecture (Recommended)

**Replace Phases 1-2 with this unified approach:**

Create a single `AgentSystem` class that serves as the single source of truth for all agent initialization:

```typescript
// packages/agent-runtime/src/agent-system.ts

export interface AgentSystemConfig {
  // LLM Configuration
  llmEnv?: AgentLlmCredentialEnv;

  // Tool Dependencies (unified)
  metricsStore?: MarketingMetricsStore;
  platformAdapterGetter?: (platform: ConnectorType) => ConnectorAdapter;
  configCache?: TenantScopedTtlCache<unknown>;

  // Tool Selection (feature flags)
  enablePlatformTools?: boolean;
  enableDatabaseTools?: boolean;
  enableB2bKpiTools?: boolean;

  // Caching
  invocationCache?: LlmInvocationCache;
}

export class AgentSystem {
  private readonly factory: AgentFactory;
  private readonly toolRegistry: ToolRegistry;

  constructor(config: AgentSystemConfig) {
    const llmEnv = config.llmEnv ?? loadLlmEnvFromProcess();
    this.factory = new AgentFactory({ llmEnv });
    this.toolRegistry = this.buildToolRegistry(config);
  }

  async runMarketingPipeline(
    tenant: TenantContext,
    goal: string,
    options?: Partial<RunMarketingPipelineOptions>,
  ): Promise<MarketingPipelineState> {
    return runAgentJob({ tenant }, async (scope) =>
      runMarketingAgentPipeline({
        factory: this.factory,
        ctx: scope.invocation,
        goal,
        toolRegistry: this.toolRegistry,
        ...options,
      }),
    );
  }

  private buildToolRegistry(config: AgentSystemConfig): ToolRegistry {
    const tools: ITool[] = [
      ...createAnalysisTools(),
      ...createCompanyContextTools({ configCache: config.configCache }),
      ...createReportPrepTools(),
    ];

    if (config.enablePlatformTools && config.platformAdapterGetter) {
      tools.push(
        ...createPlatformFetchTools({
          getAdapter: config.platformAdapterGetter,
        }),
      );
    }

    if (config.enableDatabaseTools && config.metricsStore) {
      tools.push(
        ...createDatabaseQueryTools({
          metricsStore: config.metricsStore,
        }),
      );
    }

    if (config.enableB2bKpiTools) {
      tools.push(...createB2bKpiTools());
    }

    return this.factory.createToolRegistry(tools);
  }
}
```

**Worker Usage:**

```typescript
// apps/worker/src/agent-system-singleton.ts

let agentSystem: AgentSystem | null = null;

export function getAgentSystem(): AgentSystem {
  if (!agentSystem) {
    agentSystem = new AgentSystem({
      llmEnv: loadLlmEnvFromProcess(),
      enablePlatformTools: true,
      enableDatabaseTools: true,
      enableB2bKpiTools: true,
      platformAdapterGetter: (platform) => {
        const tenant = requireTenantContext();
        return createConnectorAdapter({ platform, tenantId: tenant.tenantId });
      },
      metricsStore: createDrizzleMarketingMetricsStore(getDb()),
    });
  }
  return agentSystem;
}
```

**Workflow Simplification:**

```typescript
// apps/worker/src/queues/report-queues.ts

async function runPipelineWorkflow(data: WorkflowTriggerJobData) {
  const agentSystem = getAgentSystem();
  const tenant = await loadTenantContext(data.tenantId, data.requestId);

  const pipelineState = await agentSystem.runMarketingPipeline(
    tenant,
    `Workflow ${data.workflowId}`,
    {
      workflowId: randomUUID(),
      useProductionModels: true,
      tolerateVerdictParseFailure: true,
    },
  );

  return buildWorkflowResult(data, pipelineState);
}
```

**Benefits of Approach B:**

- ✅ Single source of truth for agent initialization
- ✅ All 18 tools available when configured
- ✅ Unified dependency injection (1 interface vs 7)
- ✅ Worker code reduced by ~50%
- ✅ Addresses root architectural fragmentation
- ✅ Easier to extend with new tools/agents

**Recommendation:** Implement Approach B (Unified AgentSystem) as it addresses the root cause identified in the architecture consolidation analysis while also fixing the immediate platform tool issues.

---

## Remediation Plan (Approach A: Incremental)

_Note: This section preserves the original incremental remediation plan. For the recommended unified approach, see Approach B above._

### Phase 1: Fix Platform Tool Integration (Priority: P0 - Critical)

**Estimated Effort:** 1-2 days

#### Step 1.1: Update Marketing Agent Factory Signatures

**File:** `packages/agent-runtime/src/specialized-marketing-agents.ts`

```typescript
// Add new import
import type { PlatformFetchToolDeps } from "./agent-tools/platform-fetch-tools";
import { createPlatformFetchTools } from "./agent-tools/platform-fetch-tools";
import type { CompanyContextToolDeps } from "./agent-tools/company-context-tools";

// Update interface
export interface CreateSpecializedMarketingAgentOptions {
  companyName: string;
  promptVars?: Partial<SpecializedMarketingAgentPromptVars>;
  templateVersion?: string;
  factoryConfig?: Partial<AgentFactoryConfig>;
  mockLlm?: BaseChatModel;
  invocationCache?: LlmInvocationCache;
  // ✅ NEW: Platform and company context dependencies
  platformDeps?: PlatformFetchToolDeps;
  companyContextDeps?: CompanyContextToolDeps;
}
```

#### Step 1.2: Update Agent Creation Functions

**File:** `packages/agent-runtime/src/specialized-marketing-agents.ts`

```typescript
export function createSpecializedMarketingProductionAgent(
  factory: AgentFactory,
  kind: SpecializedMarketingAgentKind,
  options: CreateSpecializedMarketingAgentOptions,
): IAgent {
  const cfg = buildSpecializedMarketingFactoryConfig(kind, options);

  // ✅ Build comprehensive tool list
  const sharedTools = [
    // Platform fetch tools (NEW!)
    ...(options.platformDeps ? createPlatformFetchTools(options.platformDeps) : []),
    // Database query tools (should be added)
    // ...(options.metricsStore ? createDatabaseQueryTools({ metricsStore: options.metricsStore }) : []),
    // Existing tools
    ...createCompanyContextTools(options.companyContextDeps),
    ...createAnalysisTools(),
    ...createReportPrepTools(),
  ];

  return factory.createAgentWithTools(cfg, sharedTools, {
    invocationCache: options.invocationCache,
  }).agent;
}

// Same changes for createSpecializedMarketingTestAgent
```

#### Step 1.3: Update Marketing Pipeline Signature

**File:** `packages/agent-runtime/src/marketing-pipeline.ts`

```typescript
import type { PlatformFetchToolDeps } from "./agent-tools/platform-fetch-tools";
import type { CompanyContextToolDeps } from "./agent-tools/company-context-tools";

export interface RunMarketingPipelineOptions {
  factory: AgentFactory;
  ctx: AgentInvocationContext;
  goal: string;
  workflowId?: string;
  specialization: Pick<
    CreateSpecializedMarketingAgentOptions,
    "companyName" | "promptVars" | "templateVersion" | "factoryConfig"
  >;
  useProductionModels?: boolean;
  mockModels?: Partial<Record<MarketingPipelineStageName, BaseChatModel>>;
  onProgress?: (event: MarketingWorkflowProgressEvent) => void;
  onMessage?: (message: AgentMessage) => void;
  tolerateVerdictParseFailure?: boolean;
  invocationCache?: LlmInvocationCache;
  onPipelineTiming?: (fields: ReturnType<typeof marketingPipelineTimingToLogFields>) => void;
  // ✅ NEW: Platform and company context dependencies
  platformDeps?: PlatformFetchToolDeps;
  companyContextDeps?: CompanyContextToolDeps;
}
```

#### Step 1.4: Pass Dependencies to Agent Creation

**File:** `packages/agent-runtime/src/marketing-pipeline.ts` (inside `runMarketingAgentPipeline`)

```typescript
const createAgent = (
  kind: SpecializedMarketingAgentKind,
  stage: MarketingPipelineStageName,
): IAgent => {
  const mock = options.mockModels?.[stage];
  const spec: CreateSpecializedMarketingAgentOptions = {
    ...specialization,
    mockLlm: mock,
    invocationCache: options.invocationCache,
    // ✅ Pass platform and company context dependencies
    platformDeps: options.platformDeps,
    companyContextDeps: options.companyContextDeps,
  };
  if (options.useProductionModels) {
    return createSpecializedMarketingProductionAgent(options.factory, kind, spec);
  }
  return createSpecializedMarketingTestAgent(options.factory, kind, spec);
};
```

---

### Phase 2: Implement Platform Adapter Factory in Worker (Priority: P0 - Critical)

**Estimated Effort:** 1-2 days

#### Step 2.1: Worker connector factory (canonical implementation)

**File:** `apps/worker/src/connector-factory.ts`

The worker exposes **`createWorkerPlatformFetchToolDeps`**, which builds **`PlatformFetchToolDeps`** for `runMarketingAgentPipeline` by delegating to **`createConnectorAdapter`** (`@agenticverdict/data-connectors`) for each tenant-enabled channel. Refer to the source file for the exact constructor options (mock scenario, seed, tenant gating).

#### Step 2.2: Integrate Platform Adapter Factory into Worker

**File:** `apps/worker/src/queues/report-queues.ts`

```typescript
// Add import
import { createWorkerPlatformFetchToolDeps } from "../connector-factory";
import { requireTenantContext } from "@agenticverdict/core";

async function runPipelineWorkflow(
  data: WorkflowTriggerJobData,
): Promise<WorkflowTriggerJobResult> {
  const validatedData = workflowTriggerJobDataSchema.parse(data);
  const llmEnv = loadLlmEnvFromProcess();
  const factory = new AgentFactory({ llmEnv });

  // ✅ Get tenant context from the job scope
  const tenant = requireTenantContext();

  const workflowId = randomUUID();
  const useProductionModels = Boolean(
    llmEnv.anthropicApiKey || llmEnv.openAiApiKey || llmEnv.glmApiKey,
  );

  // ✅ Create platform adapter dependencies
  const platformDeps = createWorkerPlatformFetchToolDeps({ tenant });

  // ✅ Create company context dependencies
  const companyContextDeps = {
    loadCompanyConfig: async (tenantId: string) => tenant.config,
  };

  const pipelineState = await runAgentJob({ tenant, runId: `run-${workflowId}` }, async (scope) =>
    runMarketingAgentPipeline({
      factory,
      ctx: scope.invocation,
      workflowId,
      goal: `Workflow ${validatedData.workflowId} for tenant ${validatedData.tenantId}`,
      specialization: { companyName: tenant.config.companyName },
      tolerateVerdictParseFailure: true,
      useProductionModels,
      // ✅ Pass platform and company context dependencies
      platformDeps,
      companyContextDeps,
    }),
  );

  // ... rest of function
}
```

---

### Phase 3: Enhance Mock Adapter Data (Priority: P1 - High)

**Estimated Effort:** 1 day

#### Step 3.1: Create Realistic Mock Data Scenarios

**File:** `packages/data-connectors/src/mock-static-data.ts` (ENHANCE)

```typescript
export interface MockAdapterScenario {
  // Existing: "normal", "error"
  // ✅ NEW: "realistic" scenario with rich data
}

/**
 * Builds realistic mock metric records for a platform.
 */
export function buildRealisticMockRecords(
  platform: ConnectorType,
  dateRange: DateRangeIso,
): NormalizedMetricRecord[] {
  const records: NormalizedMetricRecord[] = [];
  const days = eachDayOfInterval(
    parseISO(dateRange.startInclusive),
    parseISO(dateRange.endInclusive),
  );

  switch (platform) {
    case "meta":
      for (const day of days) {
        const impressions = randomInRange(5000, 15000);
        const clicks = Math.round(impressions * randomInRange(0.02, 0.05));
        const spend = clicks * randomInRange(0.5, 2.0);
        const conversions = Math.round(clicks * randomInRange(0.05, 0.15));

        records.push(
          {
            metricKey: "meta.impressions",
            value: impressions,
            capturedAt: day.toISOString(),
          },
          {
            metricKey: "meta.clicks",
            value: clicks,
            capturedAt: day.toISOString(),
          },
          {
            metricKey: "meta.spend",
            value: Number(spend.toFixed(2)),
            dimensions: { currency: "USD" },
            capturedAt: day.toISOString(),
          },
          {
            metricKey: "meta.conversions",
            value: conversions,
            capturedAt: day.toISOString(),
          },
          // Add more metrics...
        );
      }
      break;

    case "ga4":
      for (const day of days) {
        const sessions = randomInRange(100, 500);
        const users = Math.round(sessions * randomInRange(0.6, 0.9));
        const bounceRate = randomInRange(0.3, 0.7);

        records.push(
          {
            metricKey: "ga4.event.sessions",
            value: sessions,
            capturedAt: day.toISOString(),
          },
          {
            metricKey: "ga4.event.users",
            value: users,
            capturedAt: day.toISOString(),
          },
          {
            metricKey: "ga4.traffic.bounceRate",
            value: Number(bounceRate.toFixed(3)),
            capturedAt: day.toISOString(),
          },
          // Add more metrics...
        );
      }
      break;

    // Similar for gsc, gbp, tiktok...
  }

  return records;
}
```

#### Step 3.2: Update Mock Adapter Factory

**File:** `packages/data-connectors/src/mock-adapter-factory.ts`

```typescript
import { buildRealisticMockRecords } from "./mock-static-data";

export class MockAdapterFactory {
  static create(options: MockConnectorAdapterOptions): MockConnectorAdapter {
    const { platform, scenario = "normal", ...rest } = options;

    // ✅ Use realistic records by default
    const records =
      options.records ??
      (scenario === "realistic" ? buildRealisticMockRecords(platform, defaultDateRange) : []);

    return new MockConnectorAdapter(platform, {
      ...rest,
      records,
      // ... other options
    });
  }
}
```

---

### Phase 4: Dynamic Platform Discovery (Priority: P1 - High)

**Estimated Effort:** 0.5 day

#### Step 4.1: Update Analysis Template to Use Dynamic Platform List

**File:** `packages/agent-runtime/src/specialized-marketing-agents.ts`

```typescript
function renderBasePolicy(
  kind: SpecializedMarketingAgentKind,
  companyName: string,
  vars: Partial<SpecializedMarketingAgentPromptVars>,
  templateVersion: string | undefined,
): string {
  const templateId = KIND_TEMPLATE_ID[kind];
  const record = resolvePromptTemplate(templateId, templateVersion);

  if (kind === "cross_platform_analysis") {
    // ✅ Use platform list from company config
    const tenant = requireTenantContext();
    const enabledPlatforms =
      tenant.config.marketing.channels
        .filter((ch) => ch.enabled)
        .map((ch) => ch.label ?? ch.platform.toUpperCase())
        .join(", ") || "No platforms enabled";

    return renderPromptTemplate(record, {
      companyName,
      dateRange: vars.dateRange ?? "last 30 days",
      platforms: vars.platforms ?? enabledPlatforms, // ✅ Dynamic!
      currency: vars.currency ?? "USD",
    });
  }
  // ... rest of function
}
```

**Note:** This requires that `requireTenantContext()` is available at template render time, which may require restructuring when templates are resolved.

---

### Phase 5: Error Handling and Validation (Priority: P2 - Medium)

**Estimated Effort:** 0.5 day

#### Step 5.1: Add Platform Availability Validation

**File:** `apps/worker/src/queues/report-queues.ts`

```typescript
async function runPipelineWorkflow(
  data: WorkflowTriggerJobData,
): Promise<WorkflowTriggerJobResult> {
  const validatedData = workflowTriggerJobDataSchema.parse(data);
  const tenant = requireTenantContext();

  // ✅ Validate platform availability
  const requestedPlatforms = validatedData.config.platforms ?? ["meta", "ga4", "gsc"];
  const enabledPlatforms = tenant.config.marketing.channels
    .filter((ch) => ch.enabled)
    .map((ch) => ch.platform);

  const missingPlatforms = requestedPlatforms.filter((p) => !enabledPlatforms.includes(p as any));
  if (missingPlatforms.length > 0) {
    const errorCode = "platforms_not_enabled";
    const errorMessage = `Requested platforms not enabled: ${missingPlatforms.join(", ")}`;

    return {
      workflowId: validatedData.workflowId,
      tenantId: validatedData.tenantId,
      testMode: validatedData.testMode,
      phase:
        validatedData.workflowId === "marketing-analysis"
          ? "marketing-analysis"
          : "verdict-generation",
      message: `${validatedData.workflowId}_failed`,
      processingMetadata: {
        durationMs: 0,
        stagesCompleted: 0,
        pipelineStatus: "failed",
        platformsAnalyzed: requestedPlatforms,
        errorCode,
      },
    };
  }

  // ... continue with pipeline execution
}
```

---

## Implementation Guidance

### Code Changes Summary

| Phase     | Files Modified | Lines Added | Lines Changed | New Files |
| --------- | -------------- | ----------- | ------------- | --------- |
| 1         | 3              | ~80         | ~20           | 0         |
| 2         | 2              | ~120        | ~30           | 1         |
| 3         | 2              | ~150        | ~20           | 0         |
| 4         | 1              | ~10         | ~5            | 0         |
| 5         | 1              | ~20         | ~5            | 0         |
| **Total** | **9**          | **~380**    | **~80**       | **1**     |

### Implementation Order

**Week 1:**

1. Day 1-2: Phase 1 (Platform Tool Integration) — Critical path
2. Day 3-4: Phase 2 (Platform Adapter Factory) — Depends on Phase 1
3. Day 5: Phase 3 (Enhance Mock Data) — Can be done in parallel with Phase 2

**Week 2:**

1. Day 1: Phase 4 (Dynamic Platform Discovery) — Depends on Phase 2
2. Day 2: Phase 5 (Error Handling) — Can be done anytime
3. Day 3-5: Testing and validation

### Dependency Graph

```
Phase 1 (Tool Integration)
  ↓
Phase 2 (Adapter Factory) ─┐
  ↓                        │
Phase 4 (Discovery) ◄──────┘
  ↓
Phase 5 (Validation)

Phase 3 (Mock Data) — Independent, can be done anytime
```

---

## Testing Strategy

### Unit Tests

**File:** `packages/agent-runtime/src/specialized-marketing-agents.test.ts` (NEW)

```typescript
describe("Specialized Marketing Agents with Platform Tools", () => {
  it("production agent includes platform fetch tools when platformDeps provided", () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const platformDeps = {
      getAdapter: (p) => new MockConnectorAdapter(p, { tenantId: testAdapterTenantId }),
      authenticateAdapter: async (a) => await a.authenticate({}),
    };

    const agent = createSpecializedMarketingProductionAgent(factory, "cross_platform_analysis", {
      companyName: "Test Co",
      platformDeps,
    });

    expect(agent.tools).toContainEqual(
      expect.objectContaining({
        name: "fetch_meta_metrics",
      }),
    );
    expect(agent.tools).toContainEqual(
      expect.objectContaining({
        name: "fetch_ga4_metrics",
      }),
    );
  });

  it("production agent excludes platform fetch tools when platformDeps omitted", () => {
    const factory = new AgentFactory({ llmEnv: {} });
    const agent = createSpecializedMarketingProductionAgent(factory, "cross_platform_analysis", {
      companyName: "Test Co",
    });

    expect(agent.tools).not.toContainEqual(
      expect.objectContaining({
        name: "fetch_meta_metrics",
      }),
    );
  });
});
```

### Integration Tests

**File:** `apps/worker/src/queues/report-queues.test.ts` (ENHANCE)

```typescript
describe("runPipelineWorkflow with mock adapters", () => {
  it("executes marketing-analysis pipeline with realistic mock data", async () => {
    const result = await runPipelineWorkflow({
      workflowId: "marketing-analysis",
      tenantId: testTenantId,
      testMode: true,
      config: {
        platforms: ["meta", "ga4"],
        dateRange: {
          start: "2024-01-01T00:00:00.000Z",
          end: "2024-01-07T00:00:00.000Z",
        },
      },
    });

    expect(result.status).toBe("completed");
    expect(result.processingMetadata.pipelineStatus).not.toBe("degraded");
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].description).not.toContain("Data Unavailable");
  });
});
```

### Manual Testing Scenarios

**Update to:** `tests/docs/manual-testing-guide.md`

**New Section:** §4.4 Marketing Analysis with Mock Adapters

```markdown
#### S4a: Marketing Analysis with Enhanced Mock Adapters

**Preconditions:**

- All services running with mock adapters enabled
- At least one platform enabled in tenant configuration
- Valid JWT token

**Procedure:**

1. Trigger marketing-analysis workflow
2. Verify pipeline status is "completed" (not "degraded")
3. Verify insights contain actual metrics, not "Data Unavailable"
4. Verify platform fetch tools were called (check logs)

**Expected Results:**

- Pipeline completes without platform_fetch_failed error
- Insights mention specific metrics (e.g., "impressions", "clicks", "spend")
- Analysis references enabled platforms by name
```

---

## Risk Assessment

### Technical Risks

| Risk                                                         | Probability | Impact | Mitigation                                                 |
| ------------------------------------------------------------ | ----------- | ------ | ---------------------------------------------------------- |
| Breaking existing tests that rely on current agent signature | Medium      | Low    | Add optional parameters with defaults; run full test suite |
| Mock adapter data doesn't match real adapter complexity      | High        | Medium | Iteratively enhance mocks based on real adapter responses  |
| Platform adapter factory causes circular dependencies        | Low         | High   | Keep factory in worker package; use dependency injection   |
| Tenant context not available at template render time         | Medium      | Medium | Restructure template rendering to pass tenant context      |

### Operational Risks

| Risk                                                               | Probability | Impact | Mitigation                                                               |
| ------------------------------------------------------------------ | ----------- | ------ | ------------------------------------------------------------------------ |
| Production credentials required for testing (loses mock advantage) | Low         | High   | Ensure mock mode continues to work without credentials                   |
| Pipeline execution time increases significantly                    | Medium      | Low    | Monitor performance; optimize mock data generation                       |
| Error handling becomes too restrictive                             | Medium      | Medium | Allow degraded mode for missing platforms; fail only for critical errors |

### Rollback Plan

If issues arise:

1. **Phase 1-2:** Revert agent signature changes; restore previous versions
2. **Phase 3:** Mock data enhancements are additive; safe to keep
3. **Phase 4:** Dynamic platform list can be disabled via config flag
4. **Phase 5:** Additional validation can be made non-blocking

---

## Success Criteria

### Functional Requirements

- [x] Marketing agents can call `fetch_meta_metrics`, `fetch_ga4_metrics`, etc.
- [x] Worker creates platform adapters for enabled platforms
- [x] Mock adapters return realistic metric data
- [x] Platform list in analysis template reflects enabled platforms
- [x] Pipeline completes with "completed" status (not "degraded")
- [x] Insights contain actual metrics, not "Data Unavailable"

### Non-Functional Requirements

- [x] No performance regression (>10% increase in pipeline execution time)
- [x] All existing tests pass
- [x] New tests added for platform tool integration
- [x] Documentation updated with new behavior
- [x] Error messages are clear and actionable

### Test Execution Validation

**After Remediation:**

```bash
# Run marketing-analysis with mock adapters
curl -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "marketing-analysis",
    "testMode": true,
    "tenantId": "22222222-2222-4228-8222-222222222222",
    "config": {
      "platforms": ["meta", "ga4"],
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      }
    }
  }'

# Expected response
{
  "status": "completed",
  "result": {
    "processingMetadata": {
      "pipelineStatus": "completed",  // ✅ Not "degraded"
      "platformsAnalyzed": ["meta", "ga4"]
    },
    "insights": [{
      "description": "Meta impressions increased by 15%..."  // ✅ Not "Data Unavailable"
    }]
  }
}
```

---

## Appendix A: Related Documentation

### Architecture Documentation

- `docs/02-planning-and-methodology/testing-strategy.md`
- `docs/03-development-phases/phases-02-03-execution-plan.md`
- `docs/04-technology-research/docker-mock-adapter-solution-summary.md`

### Implementation Changelogs

- `changelog/2026-04-08-layered-runtime-config-docker-mock-adapters.md`
- `changelog/2026-04-09-runtime-config-greenfield-cleanup.md`
- `changelog/2026-04-09-llm-credential-loading-root-cause-analysis.md`

### Testing Documentation

- `tests/docs/manual-testing-guide.md`
- `test-output/manual-testing-execution-report-2026-04-09.md`

---

## Appendix B: Quick Reference

### Key Files to Modify

| File                                                         | Purpose                      | Phase |
| ------------------------------------------------------------ | ---------------------------- | ----- |
| `packages/agent-runtime/src/specialized-marketing-agents.ts` | Add platform tools to agents | 1     |
| `packages/agent-runtime/src/marketing-pipeline.ts`           | Pass deps to agents          | 1     |
| `apps/worker/src/connector-factory.ts`                       | Worker connector wiring      | 2     |
| `apps/worker/src/queues/report-queues.ts`                    | Use platform factory         | 2     |
| `packages/data-connectors/src/mock-static-data.ts`           | Enhance mock data            | 3     |
| `packages/agent-runtime/src/specialized-marketing-agents.ts` | Dynamic platform list        | 4     |

### Key Interfaces

```typescript
// Platform fetch tool dependencies
interface PlatformFetchToolDeps {
  getAdapter(platform: ConnectorType): ConnectorAdapter;
  authenticateAdapter?: (adapter: ConnectorAdapter) => Promise<void>;
}

// Marketing pipeline options (updated)
interface RunMarketingPipelineOptions {
  // ... existing fields
  platformDeps?: PlatformFetchToolDeps;
  companyContextDeps?: CompanyContextToolDeps;
}

// Agent creation options (updated)
interface CreateSpecializedMarketingAgentOptions {
  // ... existing fields
  platformDeps?: PlatformFetchToolDeps;
  companyContextDeps?: CompanyContextToolDeps;
}
```

---

**Document Version:** 1.2  
**Last Updated:** 2026-04-09  
**Author:** Root Cause Analysis based on manual testing execution report
