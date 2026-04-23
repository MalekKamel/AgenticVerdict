# Artifact Verification Analysis Report

**Date**: 2026-04-09
**Tenant**: 22222222-2222-4222-8222-222222222222
**Analysis Type**: Comprehensive Gap Analysis
**Status**: CRITICAL ISSUES IDENTIFIED

---

## Executive Summary

The verification of test artifacts revealed **2 critical gaps**, **3 medium-priority issues**, and **2 low-priority improvements**. Root causes have been identified across configuration, data transformation, and implementation completeness layers.

### Key Metrics

| Metric               | Expected    | Actual      | Variance    |
| -------------------- | ----------- | ----------- | ----------- |
| Platforms Analyzed   | 5           | 2           | -60%        |
| Metrics Data Quality | Actual keys | ["unknown"] | Placeholder |
| Verdicts Generated   | ≥1          | 0           | -100%       |
| Data Quality Score   | ≥80         | 60          | -25%        |

---

## Critical Issues

### Issue #1: Missing Platform Data (GSC, GBP, TikTok)

**Severity**: CRITICAL
**Category**: Data Completeness Gap
**Location**: `configs/tenants/22222222-2222-4222-8222-222222222222.json:10-15`

#### Observation

```json
"platformsAnalyzed": ["meta", "ga4"]
```

Expected: `["meta", "ga4", "gsc", "gbp", "tiktok"]`

#### Root Cause

The demo tenant configuration only enables `meta` and `ga4` platforms:

```json
{
  "marketing": {
    "channels": [
      { "platform": "meta", "enabled": true, "label": "Paid social" },
      { "platform": "ga4", "enabled": true },
      { "platform": "tiktok", "enabled": false }
      // ❌ gsc and gbp are completely absent
    ]
  }
}
```

#### Evidence

1. **Workflow Hardcode** (`apps/worker/src/queues/report-queues.ts:137-143`): All platforms hardcoded as enabled
2. **Tenant Config File**: Only meta/ga4 enabled, tiktok disabled
3. **Result**: Configuration mismatch causes 3 platforms to be skipped

#### Impact

- 60% of expected platform data is missing
- Cross-platform analysis cannot be validated
- Test coverage for GSC, GBP, and TikTok adapters is ineffective

---

### Issue #2: "unknown" Metrics Placeholder

**Severity**: CRITICAL
**Category**: Data Quality Bug
**Location**: `apps/api/src/services/analysis-store.ts:332`

#### Observation

```json
{
  "platform": "meta",
  "metrics": ["unknown"],
  "dateRange": { "start": "2026-04-09", "end": "2026-04-09" },
  "freshnessHours": 0,
  "qualityScore": 75
}
```

Expected: `["spend", "impressions", "clicks", "conversions", "cpa", "roas"]`

#### Root Cause

Hardcoded placeholder that was never replaced with actual implementation:

```typescript
// apps/api/src/services/analysis-store.ts:329-337
dataSources: (workflowResult.processingMetadata?.platformsAnalyzed ?? ["meta"]).map(
  (platform) => ({
    platform: platform as PlatformType,
    metrics: ["unknown"],  // ← PLACEHOLDER
    dateRange: period,
    freshnessHours: 0,
    qualityScore: 75,
  }),
),
```

#### Expected Implementation

```typescript
function extractMetricKeys(snapshot: PlatformSnapshot): string[] {
  return Array.from(new Set(snapshot.records.map((r) => r.metricKey)));
}

// Should produce: ["meta.spend", "meta.impressions", "meta.conversions", ...]
```

#### Impact

- Provenance tracking is completely broken
- Cannot determine which metrics were analyzed
- Data lineage cannot be audited
- Monitoring and alerting cannot function correctly

---

## Medium-Priority Issues

### Issue #3: Empty Verdicts Array

**Severity**: MEDIUM
**Category**: Functional Gap
**Location**: `apps/worker/src/queues/report-queues.ts:217`

#### Observation

```json
"verdicts": []
```

#### Root Cause

The workflow tolerates verdict parse failures without retry or fallback:

```typescript
runMarketingAgentPipeline({
  // ...
  tolerateVerdictParseFailure: true, // Silent failure
  useProductionModels,
});
```

#### Impact

- Reports lack AI-generated verdicts
- Business value of analysis is significantly reduced
- No structured logging when verdict synthesis fails

#### Recommendation

1. Add structured logging for verdict failures
2. Implement retry logic with exponential backoff
3. Consider making verdict generation required for `verdict-generation` workflow

---

### Issue #4: Binary Data Quality Scoring

**Severity**: MEDIUM
**Category**: Measurement Gap
**Location**: `apps/api/src/services/analysis-store.ts:322`

#### Observation

```json
"dataQualityScore": 60  // Only two possible values: 60 or 80
```

#### Root Cause

```typescript
dataQualityScore: maybeVerdict.success ? 80 : 60;
```

#### Impact

- Low granularity in quality measurement
- False alarms in monitoring systems
- Cannot track incremental improvements

#### Recommended Scoring Model

```typescript
function calculateDataQualityScore(result: WorkflowResult): number {
  let score = 100;

  // Verdict success: +0/-20
  if (!result.verdict) score -= 20;

  // Platform coverage: -5 per missing platform
  const expectedPlatforms = 5;
  const actualPlatforms = result.processingMetadata.platformsAnalyzed.length;
  score -= (expectedPlatforms - actualPlatforms) * 5;

  // Insight quality: -10 for low confidence
  const avgConfidence = average(result.insights.map((i) => i.confidence));
  if (avgConfidence < 0.6) score -= 10;

  return Math.max(0, Math.min(100, score));
}
```

---

### Issue #5: Tenant Configuration Mismatch

**Severity**: MEDIUM
**Category**: Configuration Management
**Locations**:

- `apps/worker/src/queues/report-queues.ts:137-143`
- `configs/tenants/22222222-2222-4222-8222-222222222222.json`

#### Observation

Two sources define platform enablement inconsistently:

1. **Workflow Code** (hardcoded):

```typescript
tenantConfig: {
  marketing: {
    channels: [
      { platform: "meta", enabled: true },
      { platform: "ga4", enabled: true },
      { platform: "gsc", enabled: true },
      { platform: "gbp", enabled: true },
      { platform: "tiktok", enabled: true },
    ],
  },
}
```

2. **Config File** (actual):

```json
{
  "marketing": {
    "channels": [
      { "platform": "meta", "enabled": true },
      { "platform": "ga4", "enabled": true },
      { "platform": "tiktok", "enabled": false }
    ]
  }
}
```

#### Impact

- Development confusion
- Inconsistent behavior between test and production
- Hidden configuration bugs

#### Recommendation

Remove hardcoding, always load from config file, add validation warnings.

---

## Low-Priority Improvements

### Issue #6: No Platform Coverage Validation

**Severity**: LOW
**Category**: Test Coverage

#### Observation

The verification script checks that artifacts exist but doesn't validate platform coverage.

#### Recommendation

Add assertions in `tests/scripts/verify-artifacts.sh`:

```bash
# Verify expected platforms are present
expected_platforms=("meta" "ga4" "gsc" "gbp" "tiktok")
for platform in "${expected_platforms[@]}"; do
  if ! jq -e ".platformsAnalyzed[] | select(. == \"$platform\")" <<< "$analysis_result"; then
    log_error "Platform $platform missing from analysis"
    exit 1
  fi
done
```

---

### Issue #7: Missing Mock Adapter Documentation

**Severity**: LOW
**Category**: Documentation

#### Observation

No clear documentation on:

- How to enable mock adapters per platform
- Environment variable configuration
- Test tenant setup procedures

#### Recommendation

Create `docs/mock-adapter-configuration.md` with examples:

```bash
# Enable all mock adapters
export AGENTICVERDICT_USE_MOCK_ADAPTERS=1

# Enable specific platforms
export AGENTICVERDICT_MOCK_META=1
export AGENTICVERDICT_MOCK_GSC=1
export AGENTICVERDICT_MOCK_GBP=1
export AGENTICVERDICT_MOCK_TIKTOK=1
```

---

## Detailed Component Analysis

### Platform Adapter Layer ✅

**Status**: WORKING CORRECTLY

**Evidence**:

- All 5 platform adapters implemented and tested
- Mock adapter factory generates proper normalized data
- Metric keys correctly populated (e.g., `meta.spend`, `ga4.event.sessions`)
- Circuit breaker and rate limiting implemented

**Files**:

- `packages/platform-adapters/src/mock-adapter-factory.ts`
- `packages/platform-adapters/src/mock-static-data.ts`

**No changes required.**

---

### Configuration Layer ❌

**Status**: INCOMPLETE

**Issues**:

1. Demo tenant config missing gsc and gbp entries
2. TikTok explicitly disabled
3. Test config defaults to ga4 only with `enabled: false`

**Files**:

- `configs/tenants/22222222-2222-4222-8222-222222222222.json`
- `packages/testing/src/create-test-tenant-config.ts`

**Changes required.**

---

### Agent Runtime Layer ⚠️

**Status**: PARTIAL

**Working**:

- Marketing pipeline executes successfully
- Platform filtering logic is correct
- Insights generation produces valid output

**Issues**:

- Verdict generation tolerated but failing silently
- No retry or fallback mechanism

**Files**:

- `apps/worker/src/queues/report-queues.ts`
- `packages/agent-runtime/src/`

**Changes recommended.**

---

### Data Persistence Layer ❌

**Status**: BUG PRESENT

**Issues**:

- `persistWorkflowResultForTenant` uses placeholder metrics
- Provenance tracking incomplete
- No metric extraction from normalized records

**Files**:

- `apps/api/src/services/analysis-store.ts`

**Changes required.**

---

## Action Plan

### Phase 1: Critical Fixes (Immediate)

| Priority | Task                                       | File                                                        | Est. Effort |
| -------- | ------------------------------------------ | ----------------------------------------------------------- | ----------- |
| P0       | Enable all platforms in demo tenant config | `configs/tenants/22222222-2222-4222-8222-222222222222.json` | 5 min       |
| P0       | Implement metrics extraction               | `apps/api/src/services/analysis-store.ts`                   | 30 min      |

### Phase 2: High-Priority (This Sprint)

| Priority | Task                           | File                                      | Est. Effort |
| -------- | ------------------------------ | ----------------------------------------- | ----------- |
| P1       | Add verdict failure logging    | `apps/worker/src/queues/report-queues.ts` | 20 min      |
| P1       | Implement multi-factor scoring | `apps/api/src/services/analysis-store.ts` | 45 min      |
| P1       | Remove platform hardcoding     | `apps/worker/src/queues/report-queues.ts` | 15 min      |

### Phase 3: Technical Debt (Next Sprint)

| Priority | Task                              | File                                 | Est. Effort |
| -------- | --------------------------------- | ------------------------------------ | ----------- |
| P2       | Add platform coverage validation  | `tests/scripts/verify-artifacts.sh`  | 30 min      |
| P2       | Create mock adapter documentation | `docs/mock-adapter-configuration.md` | 45 min      |

---

## Success Criteria

Resolution is complete when:

1. ✅ All 5 platforms appear in `platformsAnalyzed` array
2. ✅ Each data source has actual metric keys (not "unknown")
3. ✅ At least one verdict in the verdicts array
4. ✅ Data quality score reflects actual quality (≥80)
5. ✅ No configuration mismatches between code and config files
6. ✅ Verification script passes all new assertions

---

## Artifact Files Analyzed

```
tests/test-output/archive/latest/
├── artifacts/
│   ├── verdict-analysis-results.json  ❌ Missing 3 platforms, "unknown" metrics
│   └── marketing-analysis-results.json  ❌ Missing 3 platforms, "unknown" metrics
└── artifact-analysis-report.md  ✅ This file
```

---

## References

**Files Referenced**:

- `tests/scripts/verify-artifacts.sh` - Verification script
- `apps/worker/src/queues/report-queues.ts` - Workflow processing
- `apps/api/src/services/analysis-store.ts` - Result persistence
- `configs/tenants/22222222-2222-4222-8222-222222222222.json` - Tenant config
- `packages/platform-adapters/src/mock-adapter-factory.ts` - Mock adapters

**Related Documentation**:

- `/docs/06-reference/mock-adapter-pipeline-remediation-plan.md`
- `/specs/00-core/02-intelligence/EXECUTION-PLAN.md`
- `/changelog/2026-04-09-mock-adapter-pipeline-remediation-closure.md`

---

**Report Generated**: 2026-04-09
**Analyst**: Claude Code (AgenticVerdict Analysis Agent)
**Next Review**: After P0 fixes implemented
