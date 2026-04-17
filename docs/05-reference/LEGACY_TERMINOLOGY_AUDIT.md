# Legacy Terminology Audit Report

**Date:** 2026-04-11  
**Scope:** Complete codebase scan for legacy terminology from connector-centric refactoring  
**Status:** Research Complete

## Executive Summary

The **TypeScript codebase** has been successfully migrated to the new connector-centric architecture with **zero critical legacy terms** found in production code. However, **extensive documentation debt** remains across markdown files, with **100+ instances** of legacy terminology in historical documentation, changelogs, and reference materials.

**Key Findings:**

- ✅ **Production Code**: 0 instances of legacy terminology (PlatformAdapter, PlatformType, etc.)
- ⚠️ **Documentation**: 100+ instances of legacy package names, type names, and terminology
- ✅ **Package References**: All package.json files correctly reference `@agenticverdict/data-connectors`
- ⚠️ **PlatformError Classes**: Legacy `PlatformError` naming retained (architectural decision)

---

## 1. Critical Findings (Breaking Architecture)

**None Found.** All TypeScript code successfully migrated to connector-centric terminology.

### Verified Clean Terms

| Legacy Term                         | Modern Term                       | Status   | Notes                    |
| ----------------------------------- | --------------------------------- | -------- | ------------------------ |
| `PlatformAdapter`                   | `ConnectorAdapter`                | ✅ Clean | No instances in TS code  |
| `PlatformType`                      | `ConnectorType`                   | ✅ Clean | No instances in TS code  |
| `NormalizedPlatformSnapshot`        | `NormalizedConnectorSnapshot`     | ✅ Clean | No instances in TS code  |
| `PlatformCredentials`               | `ConnectorCredentials`            | ✅ Clean | No instances in TS code  |
| `PlatformDataNormalizer`            | `ConnectorDataNormalizer`         | ✅ Clean | No instances in TS code  |
| `BasePlatformAdapter`               | `BaseConnectorAdapter`            | ✅ Clean | No instances in TS code  |
| `createPlatformAdapter`             | `createConnectorAdapter`          | ✅ Clean | No instances in TS code  |
| `@agenticverdict/platform-adapters` | `@agenticverdict/data-connectors` | ✅ Clean | All package.json updated |

---

## 2. High Severity Findings (Confusing Terminology)

### 2.1 PlatformError Class Hierarchy (Architecture Decision)

**Location:** `packages/data-connectors/src/errors.ts`

**Finding:** The `PlatformError` class hierarchy was intentionally retained during refactoring.

```typescript
export class PlatformError extends Error {
  public readonly connector: ConnectorType;
  public readonly code: PlatformErrorCode;
  // ...
}

export class PlatformAuthError extends PlatformError {}
export class PlatformRateLimitError extends PlatformError {}
export class PlatformCircuitOpenError extends PlatformError {}
```

**Context:**

- Used throughout `packages/data-connectors/` (30+ references)
- Referenced in error classifier tests, Google HTTP client, GA4 quota tests
- Exported from `@agenticverdict/data-connectors` public API

**Severity:** Medium (Architectural Decision)
**Recommendation:** This appears to be intentional. Platform-facing errors (rate limits, auth failures) retain "Platform" terminology while connector interfaces use "Connector" terminology. Consider documenting this naming convention in architecture docs.

**Status:** No action required unless architectural consistency is prioritized over semantic precision.

---

### 2.2 PlatformFetchToolDeps Interface

**Location:** `packages/agent-runtime/src/agent-tools/platform-fetch-tools.ts`

**Finding:** Agent tool interfaces use "Platform" terminology consistently.

```typescript
export interface PlatformFetchToolDeps {
  getAdapter(platform: ConnectorType): ConnectorAdapter;
  authenticateAdapter(adapter: ConnectorAdapter): Promise<void>;
}

export async function fetchNormalizedSnapshotsForPlatformsParallel(
  platforms: readonly ConnectorType[],
  // ...
): Promise<ParallelNormalizedPlatformFetchResult[]>;
```

**Context:**

- Agent runtime package uses "platform" terminology consistently
- References to "platform snapshots" in comments and validation messages
- Used across agent tools, specialized marketing agents, and worker queues

**Severity:** Medium (Terminology Mixing)
**Recommendation:** Consider whether agent-runtime should align with connector terminology for consistency. However, "platform" may be semantically appropriate for agent-facing code (business domain vs technical implementation).

**Status:** Review required for architectural consistency decision.

---

### 2.3 Factory File Naming

**Location:** `apps/worker/src/platform-adapter-factory.ts`

**Finding:** Factory file uses legacy "platform-adapter" naming while implementing connector-centric code.

```typescript
// File: apps/worker/src/platform-adapter-factory.ts
import {
  createConnectorAdapter,
  connectorAdapterTypes /* ... */,
} from "@agenticverdict/data-connectors";

const PLATFORM_TYPE_SET = new Set<ConnectorType>(connectorAdapterTypes);

export function createWorkerPlatformFetchToolDeps(
  input: WorkerPlatformDepsInput,
): PlatformFetchToolDeps {
  // Creates ConnectorAdapter instances
  const getAdapter = (platform: ConnectorType): ConnectorAdapter => {
    /* ... */
  };
}
```

**Context:**

- File imported by `apps/worker/src/queues/report-queues.ts`
- Internal implementation correctly uses connector types
- Only filename is legacy

**Severity:** Low (File Naming)
**Recommendation:** Rename to `connector-factory.ts` for consistency.

**Status:** Cosmetic improvement opportunity.

---

## 3. Medium Severity Findings (Documentation Debt)

### 3.1 Package Name References in Documentation

**Scope:** 100+ instances across markdown files

**Primary Locations:**

| File Pattern                                  | Instance Count | Example References                                           |
| --------------------------------------------- | -------------- | ------------------------------------------------------------ |
| `changelog/*.md`                              | 50+            | Historical references to `@agenticverdict/platform-adapters` |
| `docs/04-project-management/*.md`             | 15+            | Requirements, roadmap, project charter                       |
| `specs/00-core/**/*.md`                       | 20+            | Phase documentation, acceptance criteria                     |
| `docs/05-reference/*.md`                      | 10+            | Architecture analysis, migration guides                      |
| `docs/03-technology-research/*.md`            | 8+             | Implementation plans, examples                               |
| `specs/00-core/01-connectors/operations/*.md` | 12+            | API reference, runbooks, usage examples                      |

**Examples:**

```markdown
# From changelog/2026-04-04-phase-01-platform-integration-meta-adapter.md

- `pnpm --filter @agenticverdict/platform-adapters test`
- `pnpm --filter @agenticverdict/platform-adapters lint`

# From docs/04-project-management/requirements.md

│ ├── platform-adapters/ # Platform API adapters (@agenticverdict/platform-adapters)
│ │ ├── adapter.ts # PlatformAdapter + BasePlatformAdapter

# From specs/00-core/01-connectors/operations/API-REFERENCE.md

This reference describes the public TypeScript API of @agenticverdict/platform-adapters.
```

**Severity:** Medium (Documentation Debt)
**Impact:**

- Confusing for new developers joining post-refactoring
- Search/replace operations may miss context-sensitive references
- Historical accuracy vs current implementation divergence

**Recommendation:**

1. Update all high-traffic documentation (Phase 01 operations docs, requirements.md, README.md)
2. Add migration notices to historical changelogs
3. Create terminology mapping guide for onboarding

**Status:** Documentation update required.

---

### 3.2 Legacy Type Names in Documentation

**Locations:**

- `CLAUDE.md` (line 305): `public platform: PlatformType,`
- `artifact-analysis-report.md` (line 100, 337-347): References to `PlatformAdapter`, platform adapters
- `docs/04-project-management/project-charter.md` (lines 196-197): Interface definitions with `PlatformAdapter`, `PlatformType`
- `specs/00-core/00-foundation/tasks.md` (lines 245-246, 252): Task definitions referencing `PlatformAdapter`, `BasePlatformAdapter`, `MockPlatformAdapter`
- `specs/00-core/04-production-hardening/overview.md` (line 111): `NormalizedPlatformSnapshot`

**Examples:**

```markdown
# From CLAUDE.md

class PlatformError extends Error {
constructor(
public platform: PlatformType,
public code: string,
message: string,
) {
super(message);
}
}

# From docs/04-project-management/project-charter.md

interface PlatformAdapter {
platform: PlatformType;
// ...
}
```

**Severity:** Medium (Documentation Confusion)
**Recommendation:** Update code examples in documentation to reflect current terminology. Consider adding version notices to historical planning documents.

**Status:** Documentation update required.

---

### 3.3 Mock Adapter Documentation

**Locations:**

- `docs/05-reference/mock-adapter-integration.md` (entire file)
- `docs/mock-adapter-configuration.md` (entire file)
- Multiple references to `MockPlatformAdapter`, `createSyntheticAdapter`, `useMockAdapter`

**Examples:**

```markdown
# From specs/00-core/00-foundation/POST-IMPLEMENTATION-GAP-ANALYSIS.md

- `MockPlatformAdapter`, `createSyntheticAdapter`, `useMockAdapter`

# From specs/00-core/00-foundation/tasks.md

| 0.71 | Create mock platform adapter for testing | Medium | 4 hours | 0.65 | Done |
```

**Severity:** Medium (Developer Confusion)
**Current State:** Mock adapters correctly use `MockConnectorAdapter` in code
**Recommendation:** Update documentation references from `MockPlatformAdapter` → `MockConnectorAdapter`

**Status:** Documentation update required.

---

## 4. Low Severity Findings (Cosmetic Issues)

### 4.1 Comment References

**Location:** `packages/data-connectors/src/adapter.ts` (line 23)

```typescript
* {@link NormalizedConnectorSnapshot} for downstream pipelines.
```

**Finding:** Single reference to "pipelines" in comment (marketing pipeline context)

**Severity:** Low (Comment accuracy)
**Context:** "Pipeline" terminology is appropriate for agent runtime (marketing analytics pipeline)
**Status:** No action required.

---

### 4.2 Test File Naming

**Location:** `tests/factories/platform-data-factory.ts`

**Finding:** Test factory uses "platform" naming consistently

```typescript
export class PlatformDataFactory {
  static generateMetaCampaigns(count: number, seed: number): MetaCampaign[] {}
  static generateGA4Sessions(count: number, seed: number): GA4Session[] {}
  // ...
}
```

**Severity:** Low (Test Code Organization)
**Context:** Test data factories generate platform-specific data; "platform" terminology is semantically appropriate
**Status:** No action required.

---

### 4.3 Variable Naming in Context

**Locations:** Multiple files use "platform" as a local variable name

```typescript
// apps/worker/src/platform-adapter-factory.ts
const getAdapter = (platform: ConnectorType): ConnectorAdapter => { }

// packages/agent-runtime/src/agent-tools/platform-fetch-tools.ts
getAdapter(platform: ConnectorType): ConnectorAdapter;
```

**Severity:** Low (Local Variable Naming)
**Context:** "platform" is semantically appropriate for business-domain variables
**Status:** No action required.

---

## 5. Database Schema Terminology

### 5.1 Pipeline vs Insights Table

**Finding:** Database correctly uses "insights" terminology per refactoring goals.

**Location:** `packages/database/src/schema/core/insights.ts` (line 18)

```typescript
/**
 * Business-facing insight configuration (successor to internal-only "pipeline" terminology).
 */
export const insightsTable = pgTable("insights", {
  /* ... */
});
```

**Severity:** None (Correctly Implemented)
**Status:** No action required.

---

## 6. Package Dependency Audit

### 6.1 package.json Files

**Finding:** All package.json files correctly reference `@agenticverdict/data-connectors`

**Verified Files:**

- ✅ `package.json` (root)
- ✅ `apps/worker/package.json`
- ✅ `apps/frontend/package.json`
- ✅ `apps/api/package.json`
- ✅ `packages/agent-runtime/package.json`
- ✅ `packages/mock-platform-server/package.json`
- ✅ `packages/testing/package.json`
- ✅ `tests/phase01-platform-integration/package.json`

**Severity:** None (Correctly Implemented)
**Status:** No action required.

---

## 7. Marketing Pipeline Terminology

### 7.1 Agent Runtime Package

**Finding:** "Marketing pipeline" terminology is used extensively in agent runtime.

**Scope:** 70+ references across files

**Key Files:**

- `packages/agent-runtime/src/marketing-pipeline.ts` (entire file)
- `packages/agent-runtime/src/marketing-pipeline.test.ts`
- `packages/agent-runtime/src/phase8-performance-behavior.test.ts`
- `apps/worker/src/queues/report-queues.ts` (imports and usage)
- `scripts/live-llm-verdict.ts` (script for manual pipeline execution)

**Examples:**

```typescript
// packages/agent-runtime/src/marketing-pipeline.ts
export interface MarketingPipelineState {}
export interface MarketingPipelineStageRecord {}
export async function runMarketingAgentPipeline(
  options: RunMarketingPipelineOptions,
): Promise<MarketingPipelineState>;
export function marketingPipelineStateToJson(state: MarketingPipelineState): string;

// apps/worker/src/queues/report-queues.ts
import {
  runMarketingAgentPipeline,
  type MarketingPipelineState,
} from "@agenticverdict/agent-runtime";
```

**Severity:** Low (Domain-Specific Terminology)
**Context:** "Pipeline" terminology is appropriate for:

1. Agent workflow orchestration (LangGraph)
2. Multi-stage processing (analysis → insights → verdict)
3. Distinct from data connectors (technical implementation vs business process)

**Recommendation:** Retain "marketing pipeline" terminology for agent runtime; this represents business process flow, not technical connector architecture.

**Status:** No action required.

---

## 8. Terminology Mapping Reference

### 8.1 Package and Type Names

| Legacy Term                         | Modern Term                       | Status      |
| ----------------------------------- | --------------------------------- | ----------- |
| `@agenticverdict/platform-adapters` | `@agenticverdict/data-connectors` | ✅ Migrated |
| `PlatformAdapter`                   | `ConnectorAdapter`                | ✅ Migrated |
| `PlatformType`                      | `ConnectorType`                   | ✅ Migrated |
| `NormalizedPlatformSnapshot`        | `NormalizedConnectorSnapshot`     | ✅ Migrated |
| `PlatformCredentials`               | `ConnectorCredentials`            | ✅ Migrated |
| `PlatformDataNormalizer`            | `ConnectorDataNormalizer`         | ✅ Migrated |
| `BasePlatformAdapter`               | `BaseConnectorAdapter`            | ✅ Migrated |
| `createPlatformAdapter`             | `createConnectorAdapter`          | ✅ Migrated |
| `MockPlatformAdapter`               | `MockConnectorAdapter`            | ✅ Migrated |

### 8.2 Retained Terminology (Intentional)

| Term                                 | Context        | Reason                                               |
| ------------------------------------ | -------------- | ---------------------------------------------------- |
| `PlatformError`, `PlatformErrorCode` | Error handling | Platform-facing errors (rate limits, auth failures)  |
| `PlatformFetchToolDeps`              | Agent tools    | Agent-domain terminology vs technical implementation |
| `MarketingPipeline`                  | Agent runtime  | Business process flow (multi-stage workflow)         |
| `PlatformDataFactory`                | Test utilities | Test data generation for platform-specific payloads  |
| `platform` (variable name)           | Local scope    | Semantically appropriate for business domain         |

---

## 9. Recommended Actions

### 9.1 High Priority

1. **Update High-Traffic Documentation**
   - `README.md` - Update repository overview
   - `CLAUDE.md` - Update project instructions examples
   - `docs/04-project-management/requirements.md` - Update requirements examples
   - `specs/00-core/01-connectors/operations/` - Update API reference and usage examples

2. **Rename Factory File**
   - `apps/worker/src/platform-adapter-factory.ts` → `apps/worker/src/connector-factory.ts`
   - Update import in `apps/worker/src/queues/report-queues.ts`

### 9.2 Medium Priority

3. **Update Reference Documentation**
   - Add terminology mapping section to architecture docs
   - Update `docs/05-reference/mock-adapter-integration.md` with current names
   - Add migration notices to historical changelogs

4. **Update Project Planning Docs**
   - `docs/04-project-management/project-charter.md` - Update interface examples
   - `specs/00-core/00-foundation/tasks.md` - Add version notices

### 9.3 Low Priority

5. **Create Onboarding Guide**
   - Document terminology evolution (platform-adapters → data-connectors)
   - Explain intentional terminology mixing (PlatformError, MarketingPipeline)
   - Provide mapping table for legacy code references

6. **Add Code Comments**
   - Document architectural decisions for retained terminology
   - Add JSDoc comments explaining PlatformError naming convention

---

## 10. Verification Commands

To verify no legacy terminology remains in production code:

```bash
# Search for legacy type names in TypeScript
rg 'PlatformAdapter|PlatformType|NormalizedPlatformSnapshot|PlatformCredentials|PlatformDataNormalizer|BasePlatformAdapter|createPlatformAdapter|MockPlatformAdapter' \
  --glob '*.{ts,tsx}' \
  packages/ apps/

# Search for legacy package name in TypeScript
rg '@agenticverdict/platform-adapters' \
  --glob '*.{ts,tsx}' \
  packages/ apps/

# Search in package.json files
rg 'platform-adapters' --glob 'package.json'

# Verify current terminology
rg 'ConnectorAdapter|ConnectorType|NormalizedConnectorSnapshot|ConnectorCredentials|ConnectorDataNormalizer|BaseConnectorAdapter|createConnectorAdapter|MockConnectorAdapter' \
  --glob '*.{ts,tsx}' \
  packages/ apps/
```

**Expected Results:**

- Legacy term searches: 0 matches in production TypeScript
- Current term searches: 100+ matches (correctly migrated)
- Documentation searches: Legacy terms acceptable in historical context

---

## 11. Summary

### ✅ Successfully Migrated

- All production TypeScript code
- All package.json dependencies
- Database schema (insights vs pipelines)
- Type definitions and interfaces

### ⚠️ Requires Attention

- 100+ documentation references to legacy terminology
- Factory file naming inconsistency
- Onboarding guidance for terminology evolution

### ℹ️ Intentionally Retained

- `PlatformError` class hierarchy (platform-facing errors)
- `MarketingPipeline` terminology (business process flow)
- `PlatformFetchToolDeps` (agent domain terminology)
- `platform` as local variable name (semantic clarity)

### 📊 Severity Breakdown

- **Critical:** 0 findings
- **High:** 3 findings (PlatformError classes, PlatformFetchToolDeps, factory naming)
- **Medium:** 100+ findings (documentation debt)
- **Low:** 10+ findings (cosmetic naming, comments)

---

**Audit Completed:** 2026-04-11  
**Next Review:** After documentation update batch  
**Responsible:** Development team lead for documentation triage
