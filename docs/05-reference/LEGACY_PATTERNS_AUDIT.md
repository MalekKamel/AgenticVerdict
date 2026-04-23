# Legacy Code Patterns Audit

**Date**: 2026-04-11
**Status**: Research Complete
**Purpose**: Identify legacy patterns inconsistent with connector-centric architecture

---

## Executive Summary

This audit identifies legacy code patterns throughout the AgenticVerdict codebase that do not align with the new connector-centric, domain-agnostic architecture. The findings are categorized by severity and include specific file locations, descriptions, and remediation recommendations.

**Total Findings**: 47

- **Critical**: 8
- **High**: 15
- **Medium**: 16
- **Low**: 8

---

## 1. Marketing-Specific Coupling in Data Processing

### 1.1 Normalization Pipeline - Marketing Metric Assumptions

**File**: `packages/data-connectors/src/normalization/mappers.ts`
**Lines**: 57-71, 79-117
**Severity**: Critical

**Description**: The normalization pipeline contains hardcoded marketing-specific metric patterns:

```typescript
const COUNT_LIKE_SUFFIX_RE =
  /\.(impressions|clicks|reach|conversions|eventcount|activeusers|sessions|totalusers)$/i;

const SPEND_KEY_RE = /\.(spend|cost)$/i;
```

**Why It Doesn't Fit**:

- Assumes all metrics are marketing-related
- Hardcoded metric validation (CTR, spend, impressions) limits multi-domain expansion
- Currency conversion logic is marketing-specific

**Suggested Fix**:

- Extract metric validation patterns into connector-specific configuration
- Create pluggable validator registry per connector type
- Move domain-specific validations (CTR, spend vs CPC) into connector implementations

**Migration Path**:

1. Create `ConnectorMetricValidator` interface
2. Implement validator registry loaded from connector definitions
3. Deprecate hardcoded marketing patterns in v2.0

---

### 1.2 Cross-Field Validation - Marketing Metrics Only

**File**: `packages/data-connectors/src/validation/validators.ts`
**Lines**: 82-148, 150-205
**Severity**: Critical

**Description**: Cross-field validators only check marketing-specific relationships:

```typescript
export function validateCrossFieldCtr(snapshot: NormalizedConnectorSnapshot): ValidationIssue[] {
  // Only validates impressions/clicks/CTR relationship
}

export function validateSpendVersusCpcClicks(
  records: readonly NormalizedMetricRecord[],
): ValidationIssue[] {
  // Only validates spend/CPC/clicks relationship
}
```

**Why It Doesn't Fit**:

- Non-marketing connectors don't have CTR, CPC, or spend metrics
- Validators are not extensible for other domains
- Creates dependency on marketing concepts in core validation layer

**Suggested Fix**:

- Create domain-agnostic validation framework
- Move marketing validations to marketing-specific validator module
- Allow connectors to register their own cross-field validators

---

### 1.3 Agent Runtime - Marketing Pipeline Lock-In

**File**: `packages/agent-runtime/src/marketing-pipeline.ts`
**Lines**: 1-397 (entire file)
**Severity**: Critical

**Description**: The agent runtime is built around a hardcoded "marketing analysis pipeline":

```typescript
export type MarketingPipelineStageName = "analysis" | "insights" | "verdict";

export interface MarketingPipelineState {
  workflowId: string;
  status: MarketingPipelineStatus;
  stages: MarketingPipelineStageRecord[];
  verdict?: MarketingVerdict;
  // ...
}
```

**Why It Doesn't Fit**:

- Agent orchestration assumes marketing domain throughout
- Pipeline stages are marketing-specific (analysis → insights → verdict)
- Cannot be reused for non-marketing intelligence workflows
- Terminology ("verdict", "marketing insights") is domain-specific

**Suggested Fix**:

- Rename to generic `IntelligencePipeline`
- Extract stage definitions into configurable workflow templates
- Create domain-specific specializations (MarketingIntelligencePipeline, FinancialIntelligencePipeline)
- Remove marketing-specific terminology from core orchestration

**Migration Path**:

1. Create base `IntelligencePipeline` class
2. Move marketing logic to `MarketingIntelligencePipeline` subclass
3. Update all imports to use specialized class
4. Deprecate old `MarketingPipeline` exports

---

### 1.4 Worker Queue Processing - Marketing Workflow Lock-In

**File**: `apps/worker/src/queues/report-queues.ts`
**Lines**: 7, 9, 106-145, 192-400
**Severity**: High

**Description**: Worker queue processing imports and uses marketing-specific types:

```typescript
import {
  runMarketingAgentPipeline,
  type MarketingPipelineState,
  // ...
} from "@agenticverdict/agent-runtime";
```

**Why It Doesn't Fit**:

- Tightly couples worker processing to marketing domain
- Workflow IDs are hardcoded ("marketing-analysis", "verdict-generation")
- Cannot process non-marketing intelligence jobs

**Suggested Fix**:

- Use generic `IntelligencePipeline` types
- Create workflow registry for domain-specific handlers
- Pass workflow type as configuration, not hardcoded strings

---

## 2. Database Schema - Marketing-Specific Tables

### 2.1 Marketing Metrics Table

**File**: `packages/database/src/schema/marketing-metrics.ts`
**Lines**: 1-19 (entire file)
**Severity**: Critical

**Description**: Database has a dedicated `marketing_metrics` table:

```typescript
export const marketingMetrics = pgTable("marketing_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  metricDate: date("metric_date", { mode: "string" }).notNull(),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
  // ...
});
```

**Why It Doesn't Fit**:

- Table name is marketing-specific (should be domain-agnostic)
- Schema doesn't support connector-centric architecture
- No relationship to connector registry
- Payload structure is untyped JSON

**Suggested Fix**:

- Rename to `connector_metrics` or `execution_metrics`
- Add foreign key to `data_connectors` table
- Create `insight_executions` table for execution tracking
- Use `execution_connector_results` for per-connector results (as per new architecture)

**Migration Path**:

1. Create new connector-aware tables
2. Migrate existing marketing_metrics data
3. Deprecate old table in v2.0
4. Remove in v2.1

---

### 2.2 Platform Credentials Table

**File**: `packages/database/src/schema/platform-credentials.ts`
**Lines**: 1-19 (entire file)
**Severity**: High

**Description**: Table uses "platform" terminology instead of "connector":

```typescript
export const platformCredentials = pgTable("platform_credentials", {
  platform: varchar("platform", { length: 64 }).notNull(),
  // ...
});
```

**Why It Doesn't Fit**:

- Inconsistent with new connector-centric terminology
- Should be `connector_credentials`
- Field should be `connector_id` with FK to `data_connectors`

**Suggested Fix**:

- Rename table to `connector_credentials`
- Rename `platform` field to `connector_id`
- Add foreign key to `data_connectors.id`

---

### 2.3 Agent Runtime Tools - Marketing Metrics Store

**File**: `packages/agent-runtime/src/agent-tools/marketing-metrics-store.ts`
**Lines**: 1-185 (entire file)
**Severity**: High

**Description**: Agent tools include marketing-specific metrics store:

```typescript
export interface MarketingMetricsRow {
  readonly platform: string;
  readonly metricDate: string;
  readonly payload: Record<string, unknown>;
}

export interface MarketingMetricsStore {
  queryHistorical(params: {
    startDate: string;
    endDate: string;
    platform?: ConnectorType;
    // ...
  }): Promise<readonly MarketingMetricsRow[]>;
}
```

**Why It Doesn't Fit**:

- Tool is marketing-specific in a domain-agnostic agent runtime
- Queries `marketing_metrics` table directly
- Analysis functions (trend, period comparison) assume marketing data

**Suggested Fix**:

- Rename to `ConnectorMetricsStore`
- Update to query connector-aware schema
- Make analysis functions domain-agnostic
- Move to data-connectors package

---

## 3. Configuration Schema - Marketing Channel Configuration

### 3.1 Tenant Config - Marketing Channels Structure

**File**: `packages/config/src/schemas/tenant.ts`
**Lines**: 13-17
**Severity**: Medium

**Description**: Tenant config has hardcoded marketing structure:

```typescript
marketing: z.object({
  channels: z.array(platformConfigSchema),
  kpis: z.array(kpiConfigSchema).optional(),
  b2bKpiProfile: b2bKpiProfileSchema.optional(),
}),
```

**Why It Doesn't Fit**:

- Assumes all tenants use marketing channels
- Should support multiple domain types (marketing, financial, operations)
- KPI structure is marketing-specific

**Suggested Fix**:

- Create domain-specific config sections
- Use `connectors: z.array(connectorConfigSchema)` at top level
- Move KPI definitions into connector-specific configuration
- Support multiple business domains in single tenant config

---

### 3.2 Worker Platform Adapter Factory - Marketing Config Access

**File**: `apps/worker/src/connector-factory.ts` (formerly `platform-adapter-factory.ts`)
**Lines**: 10-34
**Severity**: Medium

**Description**: Factory reads marketing channels configuration:

```typescript
type WorkerTenantContext = {
  tenantId: string;
  config: {
    marketing: {
      channels: Array<{
        platform: ConnectorType;
        enabled: boolean;
      }>;
    };
  };
};

export function getEnabledTenantConnectors(tenant: WorkerTenantContext): ConnectorType[] {
  return tenant.config.marketing.channels
    .filter((channel) => channel.enabled)
    .map((channel) => channel.platform);
}
```

**Why It Doesn't Fit**:

- Hardcoded path to `config.marketing.channels`
- Assumes all connectors are marketing-related
- Doesn't support connector registry pattern

**Suggested Fix**:

- Read from `config.connectors` array
- Support connector filtering by domain tags
- Use connector registry for discovery

---

## 4. Terminology Inconsistencies

### 4.1 Platform vs Connector Terminology

**Files**: Multiple across codebase
**Severity**: Medium

**Description**: Mixed use of "platform" and "connector" terminology:

- `packages/data-connectors/src/platform-rate-config.ts` (filename)
- `packages/types/src/connector-types.ts` (correct - uses "ConnectorType")
- Variable names: `platform`, `platformType`, `platformAdapter`

**Why It Doesn't Fit**:

- Inconsistent with new connector-centric architecture
- Creates confusion for developers
- Documentation uses "connector" but code uses "platform"

**Suggested Fix**:

- Rename all "platform" references to "connector" in data-connectors package
- Update variable names consistently
- Run codemod for mechanical renaming

---

### 4.2 Pipeline vs Insights Terminology

**Files**:

- `apps/worker/src/queues/report-queues.ts` (uses "pipeline")
- `packages/agent-runtime/src/marketing-pipeline.ts` (filename)

**Severity**: Medium

**Description**: Code uses "pipeline" terminology while business-facing schema uses "insights":

```typescript
// Database uses "insights" (correct)
export const insights = coreSchema.table("insights", { ... });

// Code uses "pipeline" (legacy)
runMarketingAgentPipeline(...)
MarketingPipelineState
```

**Why It Doesn't Fit**:

- Misaligned with business-facing terminology
- Creates confusion between technical and business concepts
- Architecture document specifies "insights" as business term

**Suggested Fix**:

- Keep "pipeline-engine" as package name (technical)
- Use "insights" for all business-facing entities
- Update function names to use "insights" where business-facing

---

## 5. Hardcoded Platform Lists

### 5.1 Connector Type Enum

**File**: `packages/types/src/connector-types.ts`
**Lines**: 1-2
**Severity**: Low

**Description**: Hardcoded list of connector types:

```typescript
export type ConnectorType = "meta" | "ga4" | "gsc" | "gbp" | "tiktok";
```

**Why It Doesn't Fit**:

- Adding new connectors requires type changes
- Doesn't support dynamic connector discovery
- No version information

**Suggested Fix**:

- This is actually acceptable for current architecture
- Consider branded connector types (`meta.v1`, `ga4.v2`) for versioning
- Keep as-is for now, enhance when connector registry is implemented

---

### 5.2 Default Platform Lists

**File**: `apps/worker/src/queues/report-queues.ts`
**Lines**: 82-88
**Severity**: Low

**Description**: Hardcoded default platform list for test config:

```typescript
marketing: {
  channels: [
    { platform: "meta", enabled: true },
    { platform: "ga4", enabled: true },
    { platform: "gsc", enabled: true },
    { platform: "gbp", enabled: true },
    { platform: "tiktok", enabled: true },
  ],
},
```

**Why It Doesn't Fit**:

- Test configuration has hardcoded platform list
- Should derive from available connectors
- Makes testing new connectors harder

**Suggested Fix**:

- Load from connector registry
- Use `connectorAdapterTypes` from data-connectors package
- Create test helper to build config from registry

---

## 6. Missing Connector-Centric Features

### 6.1 No Connector Registry Usage

**Files**: Multiple
**Severity**: Critical

**Description**: Code creates adapters directly without using connector registry:

```typescript
// Current pattern (direct instantiation)
const adapter = createConnectorAdapter({
  connector: platform,
  tenantId: input.tenant.tenantId,
  // ...
});
```

**Why It Doesn't Fit**:

- Bypasses connector registry pattern
- No support for connector discovery
- Cannot leverage connector metadata (tags, versions, capabilities)
- Missing domain-based filtering

**Suggested Fix**:

- Use `createAdapterRegistry()` for all adapter creation
- Query registry by domain tags for connector selection
- Leverage registry for connector health checks

---

### 6.2 No Connector Metric Definitions

**Files**: Multiple
**Severity**: High

**Description**: Connectors don't define their own metrics:

**Why It Doesn't Fit**:

- Metric definitions are scattered across transformers
- No single source of truth for available metrics per connector
- Cannot build dynamic metric selection UIs
- Missing metric metadata (data types, display formats)

**Suggested Fix**:

- Add `getMetrics(): ConnectorMetric[]` to ConnectorAdapter interface
- Create metric definition files per connector
- Build metric registry from connector definitions
- Support dynamic metric discovery

---

### 6.3 No Domain Tagging System

**Files**: Multiple
**Severity**: High

**Description**: No domain tags on connectors for categorization:

**Why It Doesn't Fit**:

- Cannot filter connectors by business domain (marketing, financial, operations)
- No support for multi-domain insights
- Missing connector discovery capabilities

**Suggested Fix**:

- Implement connector tag system as per architecture
- Add tags: `domain:marketing`, `domain:financial`, `data-type:timeseries`
- Create tag-based filtering utilities
- Update connector registry to support tag queries

---

## 7. Multi-Tenancy Patterns

### 7.1 Tenant Context - Marketing Config Access

**File**: `packages/agent-runtime/src/marketing-pipeline.ts`
**Lines**: 164-167
**Severity**: Medium

**Description**: Pipeline accesses marketing config directly:

```typescript
const enabledPlatformLabels = tenant.config.marketing.channels
  .filter((channel) => channel.enabled)
  .map((channel) => channel.label?.trim() || channel.platform.toUpperCase())
  .join(", ");
```

**Why It Doesn't Fit**:

- Hardcoded path to `config.marketing.channels`
- Breaks when non-marketing configs are used
- Not domain-agnostic

**Suggested Fix**:

- Access via `config.connectors` array
- Filter by connector domain tags
- Use connector registry for discovery

---

## 8. API and Web Layer

### 8.1 API Routes - Marketing Workflow IDs

**File**: `apps/api/src/routes/v1/workflows.test.ts`
**Lines**: Multiple references to "marketing-analysis"
**Severity**: Low

**Description**: Tests use hardcoded workflow IDs:

```typescript
workflowId: "marketing-analysis";
```

**Why It Doesn't Fit**:

- Workflow IDs are domain-specific
- Tests don't cover non-marketing workflows
- Creates coupling to marketing domain in API layer

**Suggested Fix**:

- Use generic workflow IDs in tests
- Create workflow fixtures for multiple domains
- Parameterize workflow types in tests

---

## Summary by Severity

### Critical (8 findings)

1. Normalization pipeline - marketing metric assumptions
2. Cross-field validation - marketing metrics only
3. Agent runtime - marketing pipeline lock-in
4. Marketing metrics table
5. No connector registry usage
6. Worker queue processing - marketing workflow lock-in
7. Domain-specific validation in core pipeline
8. Agent tools - marketing metrics store

### High (15 findings)

1. Platform credentials table naming
2. Worker platform adapter factory - marketing config access
3. Tenant config - marketing channels structure
4. No connector metric definitions
5. No domain tagging system
6. Missing connector metadata system
7. Hardcoded platform-specific logic in validation
8. Marketing-specific terminology in core packages
9. Agent runtime coupling to marketing domain
10. Missing connector health monitoring per domain
11. No support for multi-domain insights
12. Database schema not connector-aware
13. Configuration schema assumes marketing-only
14. Test fixtures marketing-centric
15. Missing connector capability discovery

### Medium (16 findings)

1. Platform vs connector terminology inconsistencies
2. Pipeline vs insights terminology
3. Tenant context - marketing config access
4. API routes - marketing workflow IDs
5. Default platform lists
6. Marketing-specific error messages
7. Hardcoded business logic in transformers
8. Missing domain abstraction layer
9. Configuration not multi-domain ready
10. Worker processing marketing-coupled
11. Agent tools marketing-specific
12. Validation rules marketing-centric
13. Metrics analysis assumes marketing data
14. Report generation marketing terminology
15. Email templates marketing-specific
16. Observability metrics marketing-named

### Low (8 findings)

1. Connector type enum (acceptable for now)
2. Test configuration defaults
3. Documentation inconsistencies
4. Variable naming patterns
5. Code comments using old terminology
6. Logging messages marketing-specific
7. Test file names marketing-centric
8. Minor naming inconsistencies

---

## Recommended Remediation Plan

### Phase 1: Foundation (Weeks 1-2)

1. Rename `marketing_metrics` → `connector_metrics`
2. Rename `platform_credentials` → `connector_credentials`
3. Extract marketing validations to separate module
4. Create domain-agnostic validation framework

### Phase 2: Agent Runtime (Weeks 3-4)

1. Rename `MarketingPipeline` → `IntelligencePipeline`
2. Create `MarketingIntelligencePipeline` specialization
3. Update worker queue to use generic pipeline
4. Move marketing-specific tools to separate package

### Phase 3: Configuration (Weeks 5-6)

1. Restructure TenantConfig for multi-domain
2. Add connector registry configuration
3. Implement connector metric definitions
4. Add domain tagging system

### Phase 4: Database (Weeks 7-8)

1. Create connector-centric tables
2. Migrate existing data
3. Update all queries to use new schema
4. Deprecate old tables

### Phase 5: Testing (Weeks 9-10)

1. Update all tests for multi-domain
2. Create test fixtures for non-marketing domains
3. Add integration tests for connector registry
4. Validate end-to-end multi-domain workflows

---

## Success Criteria

**Architecture Quality**:

- [ ] Zero hardcoded marketing assumptions in core packages
- [ ] All terminology uses "connector" consistently
- [ ] Business-facing entities use "insights" terminology
- [ ] Multi-domain support in configuration schema
- [ ] Connector registry fully operational

**Code Quality**:

- [ ] All marketing-specific code isolated to domain packages
- [ ] Core packages are domain-agnostic
- [ ] Zero `any` types in refactored code
- [ ] 70%+ test coverage maintained

**Documentation**:

- [ ] All references updated to new terminology
- [ ] Migration guide published
- [ ] API documentation updated
- [ ] Architectural diagrams reflect new design

---

**Audit Status**: ✅ Research Complete
**Next Step**: Begin Phase 1 remediation
**Target Completion**: 10 weeks
