export type { ConnectorType } from "./connector-types";

export type { DateRange, MetricReference } from "./common";
export { dateRangeSchema, metricReferenceSchema } from "./common";

// Auth types
export type {
  LoginInput,
  LoginOutput,
  RegisterInput,
  RegisterOutput,
  LogoutOutput,
  GetSessionOutput,
  VerifyEmailInput,
  VerifyEmailOutput,
  RequestPasswordResetInput,
  RequestPasswordResetOutput,
  ConfirmPasswordResetInput,
  ConfirmPasswordResetOutput,
  AuthUserData,
  AuthErrorCode,
  AuthErrorResponse,
} from "./auth";
export {
  loginInputSchema,
  loginOutputSchema,
  registerInputSchema,
  registerOutputSchema,
  logoutOutputSchema,
  getSessionOutputSchema,
  verifyEmailInputSchema,
  verifyEmailOutputSchema,
  requestPasswordResetInputSchema,
  requestPasswordResetOutputSchema,
  confirmPasswordResetInputSchema,
  confirmPasswordResetOutputSchema,
} from "./auth";

export type {
  AnalysisResultResponse,
  DataSourceProvenance,
  ProvenanceInfo,
  Transformation,
} from "./analysis";
export {
  analysisResultResponseSchema,
  dataSourceProvenanceSchema,
  provenanceInfoSchema,
  transformationSchema,
} from "./analysis";

export type { GeneratedInsight, InsightType } from "./insight";
export { generatedInsightSchema, insightTypeSchema } from "./insight";

export type {
  DataSourceInfo,
  HistoricalTrend,
  MarketingVerdict,
  MethodologyInfo,
  VerdictActionItem,
  VerdictEvidence,
  VerdictEvidenceSource,
  VerdictInsight,
  VerdictRecommendation,
  VerdictType,
  VerdictVisualization,
} from "./verdict";
export {
  dataSourceInfoSchema,
  dataSourcePlatformSchema,
  historicalTrendSchema,
  marketingVerdictReportMetadataSchema,
  marketingVerdictSchema,
  methodologyInfoSchema,
  verdictActionItemSchema,
  verdictEvidenceSchema,
  verdictEvidenceSourceSchema,
  verdictInsightSchema,
  verdictRecommendationSchema,
  verdictTypeSchema,
  verdictVisualizationSchema,
} from "./verdict";
