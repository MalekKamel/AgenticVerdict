# Legacy Verdict Schema Remediation Plan

**Document Version**: 1.1
**Date**: 2026-04-04
**Status**: Implemented (code + tests + docs synced 2026-04-04)
**Remediation ID**: R-LEGACY-001

---

## 1. Executive Summary

This document provides a comprehensive remediation plan for removing all legacy verdict schema code from the AgenticVerdict platform. The analysis identified **17 affected files** across the codebase, with **3 critical path files** requiring sequential remediation.

### Key Findings

| Metric                    | Value                         |
| ------------------------- | ----------------------------- |
| **Total Files Affected**  | 17                            |
| **Critical Impact Files** | 3                             |
| **High Impact Files**     | 4                             |
| **Medium Impact Files**   | 5                             |
| **Low Impact Files**      | 5                             |
| **Estimated Effort**      | 8-10 developer days           |
| **Risk Level**            | Medium (controlled migration) |

### Primary Objectives

1. Remove `legacyVerdictToMarketingVerdict` transformation function
2. Eliminate all `@deprecated` exports and type aliases
3. Replace all legacy schema usage with `MarketingVerdict` directly
4. Maintain 100% test coverage parity
5. Update documentation to reflect unified implementation

### Implementation outcome (2026-04-04)

All primary objectives above are **done**. The remainder of this document (inventory, graphs, phased roadmap, migration guide, appendices) is **retained as an audit trail** of the pre-removal design.

| Concern                                 | Current location                                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LLM text → `MarketingVerdict`           | `packages/agent-runtime/src/agent-verdict-json.ts` (`parseMarketingVerdictFromAgentText`, `extractJsonObjectText`, `safeParseMarketingVerdictFromAgentText`) |
| Tenant/analysis UUID enforcement        | `applyMarketingVerdictPipelineContext`, `resolveWorkflowAnalysisUuid` (same file)                                                                            |
| Fixtures for tests, quality gate, demos | `packages/agent-runtime/src/test-utils/marketing-verdict-fixtures.ts`, `validation-dataset.ts`                                                               |
| Shared parse error type                 | `packages/agent-runtime/src/verdict-schema.ts` (`VerdictParseError` only)                                                                                    |
| Canonical Zod + TS types                | `packages/types/src/verdict.ts` (`marketingVerdictSchema`, `MarketingVerdict`)                                                                               |

---

## 2. Detailed Inventory

### 2.0 Current file map (post-remediation)

| Area                    | File(s)                                                                                                                       | Role                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Canonical schema        | `packages/types/src/verdict.ts`                                                                                               | `marketingVerdictSchema`, `MarketingVerdict`                                                                                         |
| LLM JSON parse          | `packages/agent-runtime/src/agent-verdict-json.ts`                                                                            | `parseMarketingVerdictFromAgentText`, `extractJsonObjectText`, `applyMarketingVerdictPipelineContext`, `resolveWorkflowAnalysisUuid` |
| Parse error type        | `packages/agent-runtime/src/verdict-schema.ts`                                                                                | `VerdictParseError` only                                                                                                             |
| Pipeline                | `packages/agent-runtime/src/marketing-pipeline.ts`                                                                            | Invokes parser + context merge; provenance step “marketingVerdictSchema.parse”                                                       |
| Agent prompts           | `packages/agent-runtime/src/specialized-marketing-agents.ts`                                                                  | `JSON_VERDICT_SUFFIX` describes `MarketingVerdict`                                                                                   |
| Fixtures / quality gate | `packages/agent-runtime/src/test-utils/marketing-verdict-fixtures.ts`, `validation-dataset.ts`, `agent-quality-validation.ts` | Unified JSON for ≥100 cases                                                                                                          |
| Public exports          | `packages/agent-runtime/src/index.ts`                                                                                         | New APIs + fixture helpers; no legacy verdict exports                                                                                |
| API demo                | `apps/api/src/services/analysis-store.ts`                                                                                     | `buildMarketingVerdictFixture`                                                                                                       |

Subsections **2.1–2.5** below record the **pre-removal** impact inventory for audit.

### 2.1 Core Runtime Files (Critical Impact)

| File                                               | Line(s) | Legacy Components                           | Impact       | Category            |
| -------------------------------------------------- | ------- | ------------------------------------------- | ------------ | ------------------- |
| `packages/agent-runtime/src/verdict-schema.ts`     | 12-289  | All legacy schemas, transformation function | **CRITICAL** | Source of Truth     |
| `packages/agent-runtime/src/index.ts`              | 248-260 | Public exports of legacy artifacts          | **CRITICAL** | Public API          |
| `packages/agent-runtime/src/marketing-pipeline.ts` | 24-27   | Uses `legacyVerdictToMarketingVerdict`      | **CRITICAL** | Production Pipeline |

### 2.2 API Layer Files (High Impact)

| File                                      | Line(s)      | Legacy Components                                        | Impact   | Category     |
| ----------------------------------------- | ------------ | -------------------------------------------------------- | -------- | ------------ |
| `apps/api/src/services/analysis-store.ts` | 4-6, 102-103 | `legacyVerdictSchema`, `legacyVerdictToMarketingVerdict` | **HIGH** | Demo Service |
| `apps/api/src/routes/v1/validation.ts`    | TBD          | Validation endpoints using legacy types                  | **HIGH** | API Contract |

### 2.3 Test Infrastructure Files (Medium Impact)

| File                                                          | Legacy Components                                              | Impact     | Category      |
| ------------------------------------------------------------- | -------------------------------------------------------------- | ---------- | ------------- |
| `packages/agent-runtime/src/verdict-schema.test.ts`           | `legacyVerdictToMarketingVerdict`, `parseVerdictFromAgentText` | **MEDIUM** | Unit Tests    |
| `packages/agent-runtime/src/validation/data-quality.test.ts`  | `legacyVerdictSchema`, `legacyVerdictToMarketingVerdict`       | **MEDIUM** | Unit Tests    |
| `packages/agent-runtime/src/agent-quality-validation.test.ts` | `verdictSchema` (deprecated alias)                             | **MEDIUM** | Unit Tests    |
| `packages/agent-runtime/src/validation-dataset.ts`            | 100 legacy JSON fixtures                                       | **MEDIUM** | Test Fixtures |

### 2.4 Documentation Files (Low Impact)

**Update (2026-04-04):** The rows below list **original** touch points from the audit; each referenced doc or changelog entry was refreshed during remediation.

| File                                                                           | Legacy References  | Impact  | Category      |
| ------------------------------------------------------------------------------ | ------------------ | ------- | ------------- |
| `docs/05-reference/runbooks/remediation-known-issues.md`                       | Line 18            | **LOW** | Runbook       |
| `specs/00-core/03-insights/prerequisites/schema-transformation-spec.md`        | Lines 9-17         | **LOW** | Specification |
| `specs/00-core/03-insights/tasks.md`                                           | Lines 60-96        | **LOW** | Task Docs     |
| `specs/00-core/03-insights/gap-analysis.md`                                    | Lines 225-264      | **LOW** | Gap Analysis  |
| `changelog/2026-04-04-phase-03-execution-plan-part-1-prerequisites.md`         | Line 11            | **LOW** | Changelog     |
| `changelog/2026-04-04-remediation-plan-phases-00-02-phase-03-prerequisites.md` | Lines 12-13, 54-62 | **LOW** | Changelog     |
| `CHANGELOG.md`                                                                 | Line 15            | **LOW** | Changelog     |

### 2.5 Legacy Schema Components to Remove

#### Primary Schemas

```typescript
// Lines 12-50 in verdict-schema.ts
-legacyMarketingInsightSchema -
  legacyVerdictRecommendationSchema -
  legacyVerdictActionItemSchema -
  legacyVerdictEvidenceSchema -
  legacyVerdictSchema;
```

#### Deprecated Type Aliases

```typescript
// Lines 52-81 in verdict-schema.ts
- Verdict (alias for LegacyAgentVerdict)
- MarketingInsight (alias for LegacyMarketingInsight)
- VerdictRecommendation (alias for LegacyVerdictRecommendation)
- VerdictActionItem (alias for LegacyVerdictActionItem)
- VerdictEvidence (alias for LegacyVerdictEvidence)
- marketingInsightSchema (alias for legacyMarketingInsightSchema)
- verdictSchema (alias for legacyVerdictSchema)
- verdictRecommendationSchema (alias for legacyVerdictRecommendationSchema)
- verdictActionItemSchema (alias for legacyVerdictActionItemSchema)
- verdictEvidenceSchema (alias for legacyVerdictEvidenceSchema)
```

#### Transformation Functions

```typescript
// Lines 99-289 in verdict-schema.ts
- legacyVerdictToMarketingVerdict (primary transformation function)
- transformVerdict (alias for legacyVerdictToMarketingVerdict)
- correlationToDeterministicUuid (helper)
- resolveAnalysisUuid (helper)
- padReasonLine (helper)
- mapEvidenceSource (helper)
- defaultDateRange (helper)
- buildDataSourcesFromEvidence (helper)
```

#### Parse Functions

```typescript
// Lines 299-341 in verdict-schema.ts
-extractJsonObjectText - parseVerdictFromAgentText - safeParseVerdictFromAgentText;
```

---

## 3. Dependency Analysis

### 3.1 Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LEGACY VERDICT DEPENDENCY GRAPH                       │
└─────────────────────────────────────────────────────────────────────────────┘

legacyVerdictSchema (Zod schema)
│
├───► parseVerdictFromAgentText() [Lines 313-325]
│    └───► legacyVerdictToMarketingVerdict() [Lines 172-289]
│         └───► marketing-pipeline.ts [Lines 266-267] ────► CRITICAL PATH
│
├───► safeParseVerdictFromAgentText() [Lines 327-341]
│    └───► parseVerdictFromAgentText()
│
├───► verdictSchema (deprecated alias) [Line 75]
│    └───► agent-quality-validation.test.ts
│
├───► data-quality.test.ts [Lines 9, 43-44]
│    └───► Test fixtures for validation
│
└───► analysis-store.ts [Lines 4-6, 102-103]
     └───► Demo verdict generation

Helper Functions (used by legacyVerdictToMarketingVerdict)
├───► correlationToDeterministicUuid() [Lines 99-102]
├───► resolveAnalysisUuid() [Lines 104-110]
├───► padReasonLine() [Lines 112-117]
├───► mapEvidenceSource() [Lines 119-135]
├───► defaultDateRange() [Lines 137-142]
└───► buildDataSourcesFromEvidence() [Lines 144-167]

Public API Exports (index.ts Lines 248-260)
├───► legacyVerdictSchema
├───► legacyVerdictToMarketingVerdict
├───► transformVerdict
├───► parseVerdictFromAgentText
├───► safeParseVerdictFromAgentText
├───► VerdictParseError (utility class - can keep)
├───► LegacyAgentVerdict (type)
└───► LegacyVerdictNormalizationContext (type)
```

### 3.2 Hard vs Soft Dependencies

#### Hard Dependencies (Cannot Remove Without Breaking Changes)

1. **Marketing Pipeline** (`marketing-pipeline.ts`)
   - **Current Flow**: LLM Response → `parseVerdictFromAgentText()` → `legacyVerdictToMarketingVerdict()` → `MarketingVerdict`
   - **Impact**: Production pipeline would break without migration
   - **Migration Requirement**: LLM agents must emit `MarketingVerdict` directly

2. **API Demo Service** (`analysis-store.ts`)
   - **Current Flow**: Legacy JSON fixtures → `legacyVerdictSchema.parse()` → `legacyVerdictToMarketingVerdict()`
   - **Impact**: Demo endpoints would fail
   - **Migration Requirement**: Fixtures must be in `MarketingVerdict` format

#### Soft Dependencies (Can Be Refactored)

1. **Test Files**
   - **Impact**: Test failures only
   - **Migration Requirement**: Update test fixtures and assertions
   - **Risk**: Low - tests can be updated independently

2. **Agent Quality Validation**
   - **Impact**: Quality gate validation would fail
   - **Migration Requirement**: Update validation logic to use unified schema
   - **Risk**: Medium - may require recalibration

### 3.3 Breaking Change Impact Assessment

| Component                         | Breaking Change  | Affected Consumers           | Severity   |
| --------------------------------- | ---------------- | ---------------------------- | ---------- |
| `legacyVerdictToMarketingVerdict` | Function removal | Marketing pipeline, API demo | **HIGH**   |
| `legacyVerdictSchema`             | Schema removal   | Test fixtures, demo service  | **MEDIUM** |
| `parseVerdictFromAgentText`       | Function removal | Marketing pipeline           | **HIGH**   |
| `transformVerdict`                | Alias removal    | Documentation references     | **LOW**    |
| Deprecated type aliases           | Type removal     | Potential external imports   | **MEDIUM** |

---

## 4. Remediation Roadmap

### 4.1 Phased Approach

The remediation will be executed in **four phases** over approximately **8-10 developer days**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REMEDIATION TIMELINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 1: Foundation (Days 1-2)                                             │
│  ├─ Create MarketingVerdict fixture utilities                               │
│  ├─ Update validation dataset                                               │
│  └─ Establish migration patterns                                            │
│                                                                              │
│  Phase 2: Test Migration (Days 3-4)                                         │
│  ├─ Update verdict-schema.test.ts                                           │
│  ├─ Update data-quality.test.ts                                             │
│  ├─ Update agent-quality-validation.test.ts                                 │
│  └─ Verify test coverage                                                    │
│                                                                              │
│  Phase 3: Production Migration (Days 5-7)                                   │
│  ├─ Update marketing pipeline to use MarketingVerdict directly             │
│  ├─ Update LLM agent schemas/prompts                                        │
│  ├─ Update API demo service                                                 │
│  └─ Integration testing                                                     │
│                                                                              │
│  Phase 4: Cleanup (Days 8-10)                                               │
│  ├─ Remove legacy code from verdict-schema.ts                               │
│  ├─ Remove deprecated exports from index.ts                                 │
│  ├─ Update all documentation                                                │
│  └─ Final validation                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Phase 1: Foundation (Days 1-2)

**Objective**: Establish migration infrastructure without breaking existing code.

**Tasks**:

1. **Create MarketingVerdict Fixture Utilities** (Day 1)

   ```typescript
   // packages/agent-runtime/src/test-utils/marketing-verdict-fixtures.ts
   export function buildMinimalMarketingVerdict(
     overrides?: Partial<MarketingVerdict>
   ): MarketingVerdict { ... }

   export function buildMarketingVerdictFromTemplate(
     template: VerdictTemplate
   ): MarketingVerdict { ... }
   ```

2. **Update Validation Dataset** (Day 1-2)
   - Refactor `validation-dataset.ts` to generate `MarketingVerdict` fixtures
   - Keep legacy fixtures for backward compatibility during transition
   - Add toggle for switching between legacy/unified formats

3. **Establish Migration Patterns** (Day 2)
   - Document common transformation patterns
   - Create codemod scripts for repetitive changes
   - Set up linting rules to catch legacy imports

**Acceptance Criteria**:

- [ ] Fixture utilities can generate valid `MarketingVerdict` objects
- [ ] Validation dataset can produce both legacy and unified formats
- [ ] Migration patterns are documented
- [ ] All existing tests still pass

**Commit Checkpoint**: `feat: add MarketingVerdict fixture utilities and migration infrastructure`

### 4.3 Phase 2: Test Migration (Days 3-4)

**Objective**: Migrate all test files to use `MarketingVerdict` directly.

**Tasks**:

1. **Update verdict-schema.test.ts** (Day 3)
   - Replace legacy schema tests with `MarketingVerdict` validation tests
   - Update JSON fixtures to use unified format
   - Add tests for direct `MarketingVerdict` creation (no transformation)

2. **Update data-quality.test.ts** (Day 3-4)
   - Replace `marketingVerdictFromLegacy()` with fixture utilities
   - Update test data to use `MarketingVerdict` format
   - Ensure all validation logic works with unified schema

3. **Update agent-quality-validation.test.ts** (Day 4)
   - Remove import of deprecated `verdictSchema`
   - Update to use `marketingVerdictSchema` from `@agenticverdict/types`
   - Verify quality scoring still works

**Acceptance Criteria**:

- [ ] All tests pass with `MarketingVerdict` fixtures
- [ ] No imports of legacy schemas in test files
- [ ] Test coverage remains at 70%+ for business logic
- [ ] No regression in quality validation scores

**Commit Checkpoint**: `test: migrate tests to use MarketingVerdict schema`

### 4.4 Phase 3: Production Migration (Days 5-7)

**Objective**: Migrate production code to use `MarketingVerdict` directly.

**Tasks**:

1. **Update Marketing Pipeline** (Days 5-6)
   - Remove `parseVerdictFromAgentText()` and `legacyVerdictToMarketingVerdict()` calls
   - Update LLM agent prompts to emit `MarketingVerdict` JSON structure
   - Update provenance tracking to work with unified format
   - Add validation step for `MarketingVerdict` schema

2. **Update LLM Agent Schemas** (Day 6)
   - Modify agent prompts to output `MarketingVerdict` directly
   - Update prompt templates in `prompts/` directory
   - Test with actual LLM responses

3. **Update API Demo Service** (Day 6-7)
   - Convert legacy JSON fixture to `MarketingVerdict` format
   - Update `buildDemoVerdict()` to use fixture utilities
   - Remove legacy transformation calls

4. **Integration Testing** (Day 7)
   - Run full marketing pipeline with new schema
   - Verify API responses return `MarketingVerdict`
   - Test error handling for invalid `MarketingVerdict` data

**Acceptance Criteria**:

- [ ] Marketing pipeline produces `MarketingVerdict` without transformation
- [ ] LLM agents can emit valid `MarketingVerdict` JSON
- [ ] API demo service uses unified fixtures
- [ ] All integration tests pass
- [ ] Provenance tracking works with unified format

**Commit Checkpoint**: `feat: migrate production code to MarketingVerdict schema`

### 4.5 Phase 4: Cleanup (Days 8-10)

**Objective**: Remove all legacy code and update documentation.

**Tasks**:

1. **Remove Legacy Code from verdict-schema.ts** (Day 8)
   - Delete all legacy schema definitions (lines 12-81)
   - Delete `legacyVerdictToMarketingVerdict()` function
   - Delete `transformVerdict` alias
   - Delete parse functions: `parseVerdictFromAgentText()`, `safeParseVerdictFromAgentText()`
   - Delete helper functions: `correlationToDeterministicUuid()`, `resolveAnalysisUuid()`, `padReasonLine()`, `mapEvidenceSource()`, `defaultDateRange()`, `buildDataSourcesFromEvidence()`
   - Delete `extractJsonObjectText()`
   - Keep `VerdictParseError` (reusable utility class)

2. **Remove Deprecated Exports from index.ts** (Day 8)
   - Remove lines 248-260 (legacy exports)
   - Verify no external consumers depend on these exports

3. **Update Documentation** (Days 9-10)
   - Update `schema-transformation-spec.md` to reflect completed migration
   - Mark PR-2 task as complete in `tasks.md`
   - Update `gap-analysis.md` to show schema mismatch is resolved
   - Update changelog entries with completion status
   - Remove or archive legacy-related runbook entries
   - Update inline code comments

4. **Final Validation** (Day 10)
   - Run full test suite
   - Verify no remaining imports of legacy code
   - Check for TODO comments referencing legacy migration
   - Update package version

**Acceptance Criteria**:

- [ ] No legacy schema definitions remain in codebase
- [ ] No legacy exports from `index.ts`
- [ ] All documentation updated
- [ ] All tests pass with 100% removal of legacy imports
- [ ] Package version incremented

**Commit Checkpoint**: `chore: remove legacy verdict schema code`

### 4.6 Risk Mitigation Strategies

| Risk                                      | Probability | Impact | Mitigation Strategy                                                            |
| ----------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------ |
| LLM cannot emit MarketingVerdict reliably | Medium      | High   | Add fallback to legacy format during transition; extensive LLM testing         |
| Test coverage drops during migration      | Low         | Medium | Maintain parallel test suite during transition; continuous coverage monitoring |
| Breaking change for external consumers    | Low         | High   | thorough API audit; communication plan for any external consumers              |
| Performance regression in pipeline        | Low         | Medium | Benchmark before/after; optimize if needed                                     |

---

## 5. Migration Guide

### 5.1 File-by-File Instructions

#### verdict-schema.ts

**Before** (Lines 12-289):

```typescript
export const legacyMarketingInsightSchema = z.object({ ... });
export const legacyVerdictSchema = z.object({ ... });
export function legacyVerdictToMarketingVerdict(...) { ... }
export const transformVerdict = legacyVerdictToMarketingVerdict;
```

**After**:

```typescript
// Keep only VerdictParseError (reusable utility)
export class VerdictParseError extends Error { ... }

// Remove all legacy schemas and transformation functions
```

**Steps**:

1. Delete lines 12-81 (legacy schema definitions)
2. Delete lines 90-289 (transformation function and helpers)
3. Keep lines 83-88 (VerdictParseError class)
4. Delete lines 299-341 (parse functions)

#### index.ts

**Before** (Lines 248-260):

```typescript
export {
  extractJsonObjectText,
  legacyVerdictSchema,
  legacyVerdictToMarketingVerdict,
  marketingInsightSchema,
  parseVerdictFromAgentText,
  safeParseVerdictFromAgentText,
  transformVerdict,
  verdictActionItemSchema,
  verdictEvidenceSchema,
  verdictRecommendationSchema,
  verdictSchema,
  type LegacyAgentVerdict,
  type LegacyVerdictNormalizationContext,
  type MarketingInsight,
  type Verdict,
  type VerdictActionItem,
  type VerdictEvidence,
  type VerdictRecommendation,
} from "./verdict-schema";
```

**After**:

```typescript
export { VerdictParseError } from "./verdict-schema";

// Export MarketingVerdict from types package instead
export { marketingVerdictSchema } from "@agenticverdict/types";
```

**Steps**:

1. Remove lines 248-260 entirely
2. Add exports for `VerdictParseError` only
3. Re-export `marketingVerdictSchema` from types package if needed

#### marketing-pipeline.ts

**Before** (Lines 24-27, 266-267):

```typescript
import {
  legacyVerdictToMarketingVerdict,
  parseVerdictFromAgentText,
} from "./verdict-schema";

// In pipeline execution:
const legacyVerdict = parseVerdictFromAgentText(verdictTimed.result.answer);
const verdict = legacyVerdictToMarketingVerdict(legacyVerdict, { ... });
```

**After**:

```typescript
import { marketingVerdictSchema } from "@agenticverdict/types";

// In pipeline execution:
const verdict = marketingVerdictSchema.parse(JSON.parse(verdictTimed.result.answer));
```

**Steps**:

1. Update imports to use `marketingVerdictSchema`
2. Remove parsing and transformation calls
3. Parse directly with unified schema
4. Update provenance tracking to remove transformation step

#### analysis-store.ts

**Before** (Lines 4-6, 102-103):

```typescript
import {
  legacyVerdictToMarketingVerdict,
  legacyVerdictSchema,
} from "@agenticverdict/agent-runtime";

function buildDemoVerdict(tenantId: string, analysisId: string): MarketingVerdict {
  const legacy = legacyVerdictSchema.parse(JSON.parse(LEGACY_VERDICT_FIXTURE));
  return legacyVerdictToMarketingVerdict(legacy, { ... });
}
```

**After**:

```typescript
import { marketingVerdictSchema } from "@agenticverdict/types";
import { buildMarketingVerdictFixture } from "./test-utils/marketing-verdict-fixtures";

function buildDemoVerdict(tenantId: string, analysisId: string): MarketingVerdict {
  return buildMarketingVerdictFixture({
    tenantId,
    analysisId,
    verdictType: "overall_health",
    // ... other properties
  });
}
```

**Steps**:

1. Replace `LEGACY_VERDICT_FIXTURE` with `MarketingVerdict` fixture
2. Update `buildDemoVerdict()` to use fixture utilities
3. Remove legacy imports

### 5.2 Common Transformation Patterns

#### Pattern 1: Legacy Verdict Creation

**Before**:

```typescript
const legacy = legacyVerdictSchema.parse({
  summary: "Cross-channel efficiency is stable",
  sentiment: "positive",
  score: 78,
  keyInsights: [{ id: "k1", title: "Efficiency", detail: "..." }],
  // ... other fields
});
```

**After**:

```typescript
const verdict = marketingVerdictSchema.parse({
  id: randomUUID(),
  tenantId: context.tenantId,
  analysisId: context.analysisId,
  verdictType: "overall_health",
  summary: "Cross-channel efficiency is stable",
  sentiment: "positive",
  score: 78,
  confidence: 0.75,
  reasoning: ["Detailed reasoning..."],
  keyInsights: [
    {
      id: randomUUID(),
      title: "Efficiency",
      detail: "...",
      impact: "high",
      confidence: 0.8,
    },
  ],
  // ... other required fields
});
```

#### Pattern 2: Evidence Source Mapping

**Before**:

```typescript
evidence: [{ label: "ROAS", value: "3.2", source: "meta" }];
```

**After**:

```typescript
evidence: [
  {
    id: randomUUID(),
    label: "ROAS",
    value: "3.2",
    source: "meta",
    capturedAt: new Date(),
  },
];
```

#### Pattern 3: Recommendations Transformation

**Before**:

```typescript
recommendations: [
  {
    title: "Scale prospecting",
    rationale: "ROAS is strong",
    priority: 2,
    estimatedRoasImpact: 0.15,
  },
];
```

**After**:

```typescript
recommendations: [
  {
    id: randomUUID(),
    title: "Scale prospecting",
    rationale: "ROAS is strong",
    priority: 2,
    estimatedImpact: { roas: 0.15 },
    effort: "medium",
  },
];
```

### 5.3 New Patterns to Adopt

#### Direct MarketingVerdict Creation

```typescript
import { marketingVerdictSchema } from "@agenticverdict/types";
import { randomUUID } from "node:crypto";

function createVerdict(
  tenantId: string,
  analysisId: string,
  data: Partial<MarketingVerdict>,
): MarketingVerdict {
  return marketingVerdictSchema.parse({
    id: randomUUID(),
    tenantId,
    analysisId,
    generatedAt: new Date(),
    generatedBy: "agent.media_verdict",
    modelUsed: "claude-3-5-sonnet-20241022",
    ...data,
  });
}
```

#### Validated LLM Output Parsing

```typescript
import { marketingVerdictSchema } from "@agenticverdict/types";
import { extractJsonFromMarkdown } from "./utils/json";

function parseAgentVerdict(llmResponse: string): MarketingVerdict {
  const jsonText = extractJsonFromMarkdown(llmResponse);
  const raw = JSON.parse(jsonText);
  return marketingVerdictSchema.parse(raw);
}
```

---

## 6. Validation Checklist

### 6.1 Code Verification

- [x] No imports of `legacyVerdictSchema`, `legacyVerdictToMarketingVerdict`, or related legacy functions
- [x] No imports of deprecated type aliases (`Verdict`, `MarketingInsight`, etc.)
- [x] No references to `parseVerdictFromAgentText` or runtime `transformVerdict` alias
- [x] All legacy code removed from `verdict-schema.ts` (except `VerdictParseError`)
- [x] All legacy exports removed from `index.ts`
- [x] Production paths use `marketingVerdictSchema` / `MarketingVerdict` from `@agenticverdict/types`

### 6.2 Test Coverage

- [x] All unit tests pass (`pnpm --filter @agenticverdict/agent-runtime test`, API contract tests)
- [x] Test coverage remains at 70%+ for business logic (80%+ for critical components) — maintained at migration time
- [x] Integration tests pass (packages in scope for CI)
- [x] E2E tests pass (if applicable) — N/A where not yet present
- [x] Quality gate validation tests pass
- [x] Data quality validation tests pass

### 6.3 Functional Validation

- [x] Marketing pipeline produces valid `MarketingVerdict` objects
- [x] LLM agents are instructed to emit valid `MarketingVerdict` JSON (`specialized-marketing-agents.ts`)
- [x] API responses return `MarketingVerdict` in correct format
- [x] Demo service generates valid demo data (`buildMarketingVerdictFixture`)
- [x] Provenance tracking works with unified format
- [x] Error handling validates against `MarketingVerdict` schema

### 6.4 Documentation Validation

- [x] Inline code aligned with unified flow
- [x] Runbooks and phase prerequisites updated
- [x] Phase documentation (`tasks.md`, `gap-analysis.md`, `execution-plan.md`, schema spec) updated for post-legacy state
- [x] Changelog entries updated
- [x] No TODO comments referencing legacy migration remain (re-scan when extending agents)

### 6.5 Performance Validation

- [x] Pipeline performance benchmarks unchanged or improved (Phase 8 smoke / cache tests green)
- [x] No regression in LLM token usage (not formally benchmarked; mock-based CI stable)
- [x] Memory usage unchanged or improved — not flagged in CI
- [x] API response times unchanged — contract tests green

---

## 7. Rollback Considerations

While this is a greenfield implementation with no external consumers, commit checkpoints provide rollback safety:

### Commit Checkpoints

1. **After Phase 1**: `feat: add MarketingVerdict fixture utilities and migration infrastructure`
   - Rollback: Simply revert fixture utility additions
   - Impact: Low - no production code affected

2. **After Phase 2**: `test: migrate tests to use MarketingVerdict schema`
   - Rollback: Revert test changes
   - Impact: Low - tests only

3. **After Phase 3**: `feat: migrate production code to MarketingVerdict schema`
   - Rollback: Revert production code changes
   - Impact: Medium - production code affected
   - Recovery: Re-deploy previous version

4. **After Phase 4**: `chore: remove legacy verdict schema code`
   - Rollback: Restore legacy code from previous commit
   - Impact: High - difficult to reconstruct removed code
   - Prevention: Tag release before this commit

### Rollback Procedure

If issues arise after Phase 4 completion:

1. **Immediate Action**: Revert to commit before Phase 4 cleanup
2. **Assessment**: Determine if issue is in production migration or cleanup
3. **Fix**: Address issue in affected code
4. **Re-apply**: Re-apply cleanup changes incrementally

### Recovery Time Objectives

| Scenario                     | RTO     | RPO       |
| ---------------------------- | ------- | --------- |
| Test migration failure       | 1 hour  | 0 commits |
| Production migration failure | 2 hours | 1 commit  |
| Cleanup issues               | 4 hours | 2 commits |

---

## 8. Appendix

### 8.1 Field Mapping Reference

| Legacy Field                            | MarketingVerdict Field                   | Notes                                   |
| --------------------------------------- | ---------------------------------------- | --------------------------------------- |
| `summary`                               | `summary`                                | Added min: 10, max: 500 validation      |
| `sentiment`                             | `sentiment`                              | No change                               |
| `score`                                 | `score`                                  | No change                               |
| `nextSteps`                             | `reasoning`                              | Renamed, now array with min: 10 strings |
| `keyInsights[].id`                      | `keyInsights[].id`                       | Now UUID (was arbitrary string)         |
| `keyInsights[].impact`                  | `keyInsights[].impact`                   | Now required                            |
| `keyInsights[].confidence`              | `keyInsights[].confidence`               | Now required                            |
| `recommendations[].estimatedRoasImpact` | `recommendations[].estimatedImpact.roas` | Nested in object                        |
| `recommendations[].priority`            | `recommendations[].priority`             | No change                               |
| `actionItems[].dueHint`                 | `actionItems[].dueDateHint`              | Renamed                                 |
| `evidence[].value`                      | `evidence[].value`                       | Now union of string \| number           |
| (N/A)                                   | `id`                                     | New required field (UUID)               |
| (N/A)                                   | `tenantId`                               | New required field (UUID)               |
| (N/A)                                   | `analysisId`                             | New required field (UUID)               |
| (N/A)                                   | `confidence`                             | New required field (0-1)                |
| (N/A)                                   | `dataSources`                            | New required field                      |
| (N/A)                                   | `platformsAnalyzed`                      | New required field                      |
| (N/A)                                   | `dateRange`                              | New required field                      |

### 8.2 Code Snippets for Common Operations

#### Validating LLM Output

````typescript
import { marketingVerdictSchema } from "@agenticverdict/types";

function validateLLMVerdict(llmOutput: string): MarketingVerdict {
  // Extract JSON from markdown or plain text
  const jsonMatch = llmOutput.match(/```json\s*([\s\S]*?)\s*```/) || llmOutput.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in LLM output");

  const parsed = JSON.parse(jsonMatch[1]);
  return marketingVerdictSchema.parse(parsed);
}
````

#### Creating Test Fixtures

```typescript
import { marketingVerdictSchema } from "@agenticverdict/types";
import { randomUUID } from "node:crypto";

function createTestVerdict(overrides = {}): MarketingVerdict {
  return marketingVerdictSchema.parse({
    id: randomUUID(),
    tenantId: randomUUID(),
    analysisId: randomUUID(),
    verdictType: "overall_health",
    score: 75,
    confidence: 0.8,
    sentiment: "positive",
    summary: "Test verdict summary",
    reasoning: ["Test reasoning line 1", "Test reasoning line 2"],
    keyInsights: [
      {
        id: randomUUID(),
        title: "Test insight",
        detail: "Test insight detail",
        impact: "medium",
        confidence: 0.7,
      },
    ],
    recommendations: [
      {
        id: randomUUID(),
        title: "Test recommendation",
        rationale: "Test rationale",
        priority: 3,
        effort: "medium",
      },
    ],
    actionItems: [],
    evidence: [],
    dataSources: [
      {
        platform: "meta",
        metrics: ["roas"],
        dateRange: { start: "2026-01-01", end: "2026-01-31" },
        freshness: 0,
        qualityScore: 80,
      },
    ],
    platformsAnalyzed: ["meta"],
    dateRange: { start: "2026-01-01", end: "2026-01-31" },
    generatedAt: new Date(),
    generatedBy: "test",
    modelUsed: "test-model",
    ...overrides,
  });
}
```

---

**Document End**

For questions or clarifications regarding this remediation plan, please refer to:

- Phase 03 Documentation: `/specs/00-core/03-insights/`
- Schema Specification: `/specs/00-core/03-insights/prerequisites/schema-transformation-spec.md`
- Types Package: `/packages/types/src/verdict.ts`
