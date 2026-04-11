# Changelog entry: Phase 01 — Normalization and validation framework (Execution Phase 6)

**Date:** 2026-04-04  
**Scope:** Phase 1 (Platform Integration) — [Execution Phase 6 — Data normalization and validation framework](specs/00-core/01-connectors/EXECUTION-PLAN.md) (`tasks.md` Work Stream 3: Tasks 3.1 and 3.2).

This entry adds a cross-platform normalization pipeline and validation layer on top of existing per-adapter transformers: Zod-backed structural schema for `NormalizedPlatformSnapshot`, dimension standardization, optional static FX conversion of spend-like metrics to USD, cardinality rounding for count-like keys, semantic and cross-field checks, IQR outlier tagging, a 0–100 data quality score, and reporting helpers for metrics/logging. It does **not** replace per-platform `normalize*RawMetrics` implementations, add browser OAuth, wire automated load/chaos CI (Execution Phase 7), or publish standalone schema documentation outside this changelog.

---

## Summary

- Introduced **`src/normalization/`** with **`types`** (including optional **`metadata`** on snapshots after pipeline runs), **`schema`** (**`normalizedPlatformSnapshotSchema`**, **`parseNormalizedPlatformSnapshot`**), **`mappers`** (**`standardizeDimensions`**, **`convertAmountToUsd`** / **`DEFAULT_FX_RATES_TO_USD`**, **`applySpendCurrencyConversion`**, **`normalizeCardinalityMetricValue`**), and **`pipeline`** (**`runNormalizationPipeline`**, **`NORMALIZATION_PIPELINE_VERSION`**).
- Introduced **`src/validation/`** with **`validators`** (finite value, negative count/spend, timestamp parse warnings, **CTR** consistency, **spend vs cpc×clicks**), **`outliers`** (**`detectMetricValueOutliers`**, IQR with configurable multiplier and minimum group size), **`scoring`** (**`computeDataQualityScore`**, **`qualityScoreFromFlags`**), and **`reporting`** (**`partitionIssuesBySeverity`**, **`countIssuesByCode`**, **`summarizeValidationIssues`**).
- **Cardinality validation order:** semantic range checks run **before** count rounding so negative impressions are not masked by clamping to zero.
- Added **`zod`** as a direct dependency of **`@agenticverdict/platform-adapters`** and re-exported the public surface from **`packages/platform-adapters/src/index.ts`**.
- Added **`normalization-pipeline.integration.test.ts`** exercising **Meta, GA4, GSC, GBP, and TikTok** fixtures through **`runNormalizationPipeline`**, plus focused unit tests under **`normalization/`** and **`validation/`**.
- Retired the monolithic **`src/normalization.ts`** in favor of **`src/normalization/index.ts`** (imports **`from "./normalization"`** / **`from "../normalization"`** keep working).

---

## Added

### `packages/platform-adapters`

- **`normalization/types.ts`** — Core snapshot/record types, optional **`SnapshotPipelineMetadata`**, **`PlatformDataNormalizer`**.
- **`normalization/schema.ts`** — Zod schemas and **`parseNormalizedPlatformSnapshot`**.
- **`normalization/mappers.ts`** — Dimension, FX, spend conversion, cardinality helpers.
- **`normalization/pipeline.ts`** — **`runNormalizationPipeline`** orchestration.
- **`normalization/index.ts`** — Barrel exports.
- **`validation/types.ts`** — **`ValidationIssue`**, **`OutlierFlag`**, severities.
- **`validation/validators.ts`** — Field/range/cross-field rules.
- **`validation/outliers.ts`** — Per-metric-key IQR outlier detection.
- **`validation/scoring.ts`** — Quality score 0–100.
- **`validation/reporting.ts`** — Aggregation helpers for observability.
- **`validation/index.ts`** — Barrel exports.
- **Tests** — `normalization/*.test.ts`, `validation/*.test.ts`, **`normalization-pipeline.integration.test.ts`**.

---

## Changed

- **`package.json`** — Dependency **`zod`**.
- **`src/index.ts`** — Exports normalization + validation API.
- **`vitest.config.ts`** — Coverage excludes updated for the new layout (**`normalization/index.ts`**, **`normalization/types.ts`**, **`validation/index.ts`**, **`validation/types.ts`**); removed obsolete **`src/normalization.ts`** exclude.

---

## Removed

- **`src/normalization.ts`** — Replaced by the **`normalization/`** module directory.

---

## Verification (local)

Commands run successfully after the changes:

- `pnpm install`
- `pnpm test` (Turbo workspace tests)
- `pnpm --filter @agenticverdict/web typecheck`
- `pnpm exec vitest run --coverage` from **`packages/platform-adapters`** (meets package coverage thresholds)

---

## Known follow-ups (not in this change set)

- **Live FX** — **`DEFAULT_FX_RATES_TO_USD`** is illustrative; production should inject refreshed rates into **`SpendCurrencyConversionOptions.rates`**.
- **Alerting** — Task 3.2 “validation metrics and alerting” is partially addressed via **`countIssuesByCode`** / **`summarizeValidationIssues`**; no Prometheus/Datadog wiring yet.
- **Execution Phase 7** — Mock API servers, load/chaos tests, and CI performance gates remain the next bundle in the execution plan.
- **Execution Phase 8** — Dedicated schema/validation documentation site or OpenAPI for this layer is out of scope here.

---

## Related documentation

- [`specs/00-core/01-connectors/EXECUTION-PLAN.md`](specs/00-core/01-connectors/EXECUTION-PLAN.md) — Execution Phase 6 definition and verification.
- [`specs/00-core/01-connectors/tasks.md`](specs/00-core/01-connectors/tasks.md) — Tasks 3.1–3.2.
- [`specs/00-core/01-connectors/acceptance-criteria.md`](specs/00-core/01-connectors/acceptance-criteria.md) — §1.2 Data normalization and validation (AC-1.6.1–AC-1.6.6).
