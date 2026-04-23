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
  ResendEmailVerificationInput,
  ResendEmailVerificationOutput,
  RequestPasswordResetInput,
  RequestPasswordResetOutput,
  ConfirmPasswordResetInput,
  ConfirmPasswordResetOutput,
  AuthUserData,
  AuthErrorCode,
  AuthErrorResponse,
} from "./auth";
export {
  optionalAuthTenantIdSchema,
  loginInputSchema,
  loginOutputSchema,
  registerInputSchema,
  registerOutputSchema,
  logoutOutputSchema,
  getSessionOutputSchema,
  verifyEmailInputSchema,
  verifyEmailOutputSchema,
  resendEmailVerificationInputSchema,
  resendEmailVerificationOutputSchema,
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

export type { FeatureFlagAdminRow } from "./admin-feature-flags";
export { featureFlagAdminListOutputSchema, featureFlagAdminRowSchema } from "./admin-feature-flags";

export type {
  GetTenantBrandingInput,
  GetTenantBrandingOutput,
  ResolveTenantSlugInput,
  ResolveTenantSlugOutput,
} from "./tenant-public";
export {
  getTenantBrandingInputSchema,
  getTenantBrandingOutputSchema,
  resolveTenantSlugInputSchema,
  resolveTenantSlugOutputSchema,
  tenantBrandingTokensSchema,
} from "./tenant-public";

export type { TelemetryEnvelope } from "./telemetry";
export {
  TELEMETRY_ENVELOPE_VERSION,
  telemetryEnvelopeSchema,
  telemetryKindSchema,
} from "./telemetry";

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
