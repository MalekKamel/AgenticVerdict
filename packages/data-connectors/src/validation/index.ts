export { detectMetricValueOutliers, type OutlierDetectionOptions } from "./outliers";
export {
  countIssuesByCode,
  partitionIssuesBySeverity,
  summarizeValidationIssues,
} from "./reporting";
export {
  computeDataQualityScore,
  qualityScoreFromFlags,
  type DataQualityScoreInput,
} from "./scoring";
export type { OutlierFlag, ValidationIssue, ValidationSeverity } from "./types";
export {
  validateCrossFieldCtr,
  validateNormalizedSnapshot,
  validateSpendVersusCpcClicks,
} from "./validators";
