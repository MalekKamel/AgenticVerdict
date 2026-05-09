import { detectMetricValueOutliers } from "../validation/outliers";
import { computeDataQualityScore } from "../validation/scoring";
import type { OutlierFlag, ValidationIssue } from "@agenticverdict/types";
import {
  validateCrossFieldCtr,
  validateNormalizedSnapshot,
  validateSpendVersusCpcClicks,
} from "../validation/validators";
import {
  applySpendCurrencyConversion,
  normalizeCardinalityMetricValue,
  standardizeDimensions,
  type SpendCurrencyConversionOptions,
} from "./mappers";
import { parseNormalizedConnectorSnapshot } from "./schema";
import type {
  NormalizedMetricRecord,
  NormalizedConnectorSnapshot,
  SnapshotPipelineMetadata,
} from "./types";

export const NORMALIZATION_PIPELINE_VERSION = "1.0.0";

export interface NormalizationPipelineOptions {
  readonly convertSpendToUsd?: boolean;
  readonly spendCurrency?: SpendCurrencyConversionOptions;
  readonly standardizeDimensions?: boolean;
  readonly normalizeCountMetrics?: boolean;
  readonly detectOutliers?: boolean;
  readonly outlierIqrMultiplier?: number;
  readonly minGroupSizeForOutliers?: number;
}

export interface NormalizationPipelineResult {
  readonly snapshot: NormalizedConnectorSnapshot;
  readonly issues: ValidationIssue[];
  readonly outliers: OutlierFlag[];
  readonly qualityScore: number;
}

function cloneRecord(r: NormalizedMetricRecord): NormalizedMetricRecord {
  return {
    metricKey: r.metricKey,
    value: r.value,
    dimensions: r.dimensions === undefined ? undefined : { ...r.dimensions },
    capturedAt: r.capturedAt,
  };
}

function attachMetadata(meta: SnapshotPipelineMetadata): SnapshotPipelineMetadata {
  return { ...meta };
}

/**
 * End-to-end normalization pass: optional dimension standardization, FX conversion for spend-like
 * metrics, cardinality rounding, structural + semantic validation, outlier tagging, and quality score.
 */
export function runNormalizationPipeline(
  snapshot: NormalizedConnectorSnapshot,
  options: NormalizationPipelineOptions = {},
): NormalizationPipelineResult {
  const convertSpend = options.convertSpendToUsd ?? false;
  const stdDims = options.standardizeDimensions ?? true;
  const normCounts = options.normalizeCountMetrics ?? true;
  const doOutliers = options.detectOutliers ?? true;

  let records = snapshot.records.map(cloneRecord);

  if (stdDims) {
    records = records.map((r) => ({
      ...r,
      dimensions: standardizeDimensions(r.dimensions),
    }));
  }

  if (convertSpend) {
    records = applySpendCurrencyConversion(records, options.spendCurrency ?? {});
  }

  /** Range/timestamp checks run before cardinality clamping so negatives are not masked. */
  const semanticPre = validateNormalizedSnapshot({
    connector: snapshot.connector,
    dateRange: snapshot.dateRange,
    records,
  });

  if (normCounts) {
    records = records.map((r) => ({
      ...r,
      value: normalizeCardinalityMetricValue(r.metricKey, r.value),
    }));
  }

  const working: NormalizedConnectorSnapshot = {
    connector: snapshot.connector,
    dateRange: { ...snapshot.dateRange },
    records,
    metadata: attachMetadata({
      normalizedAt: new Date().toISOString(),
      pipelineVersion: NORMALIZATION_PIPELINE_VERSION,
      fxTableVersion: convertSpend ? "default-static-v1" : undefined,
    }),
  };

  const parsed = parseNormalizedConnectorSnapshot(working);
  const structural: ValidationIssue[] = parsed.success
    ? []
    : parsed.error.issues.map((i) => ({
        severity: "error" as const,
        code: "schema.invalid_snapshot",
        message: i.message,
        path: i.path.join("."),
      }));

  const ctr = parsed.success ? validateCrossFieldCtr(parsed.data) : [];
  const spend = parsed.success ? validateSpendVersusCpcClicks(parsed.data.records) : [];
  const issues = [...structural, ...semanticPre, ...ctr, ...spend];

  let outliers: OutlierFlag[] = [];
  if (doOutliers && parsed.success) {
    outliers = detectMetricValueOutliers(parsed.data.records, {
      iqrMultiplier: options.outlierIqrMultiplier ?? 1.5,
      minValuesPerMetricKey: options.minGroupSizeForOutliers ?? 4,
    });
  }

  const qualityScore = computeDataQualityScore({
    issues,
    outlierCount: outliers.length,
    recordCount: working.records.length,
  });

  return {
    snapshot: working,
    issues,
    outliers,
    qualityScore,
  };
}
