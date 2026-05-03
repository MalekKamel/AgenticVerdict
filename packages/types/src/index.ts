export type { ConnectorType } from "./connector-types";
export type {
  ConnectorStatus,
  ConnectorListItem,
  ConnectorListInput,
  ConnectorListOutput,
  SyncStatus,
  SyncHistoryEntry,
  ConnectorDetailOutput,
  ConnectorCreateInput,
  ConnectorCreateOutput,
  ConnectorUpdateInput,
  ConnectorUpdateOutput,
  ConnectorDeleteInput,
  ConnectorDeleteOutput,
  ConnectorSyncInput,
  ConnectorSyncOutput,
  PlatformInfo,
  ConnectorTestInput,
  ConnectorTestOutput,
  AffectedInsight,
  ConnectorRemovalPreview,
} from "./connector-types";
export {
  connectorStatusSchema,
  connectorTypeSchema,
  connectorListInputSchema,
  connectorListOutputSchema,
  connectorDetailOutputSchema,
  connectorCreateInputSchema,
  connectorCreateOutputSchema,
  connectorUpdateInputSchema,
  connectorUpdateOutputSchema,
  connectorDeleteInputSchema,
  connectorDeleteOutputSchema,
  connectorSyncInputSchema,
  connectorSyncOutputSchema,
  platformInfoSchema,
  connectorTestInputSchema,
  connectorTestOutputSchema,
  connectorRemovalPreviewSchema,
  syncStatusSchema,
  syncHistoryEntrySchema,
} from "./connector-types";

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

// Tenant types
export type {
  Tenant,
  TenantType,
  TenantStatus,
  TenantLocalization,
  TenantFeatures,
  TenantAIConfig,
  TenantCapabilities,
  AgencyPartner,
  AgencyPartnerTier,
} from "./tenant";
export {
  tenantTypeSchema,
  tenantStatusSchema,
  tenantSchema,
  tenantLocalizationSchema,
  tenantFeaturesSchema,
  tenantAIConfigSchema,
  tenantCapabilitiesSchema,
  agencyPartnerSchema,
  agencyPartnerTierSchema,
} from "./tenant";

export type { GeneratedInsight, InsightType, InsightDTO, InsightAttributes } from "./insight";
export {
  generatedInsightSchema,
  insightTypeSchema,
  insightDtoSchema,
  insightAttributesSchema,
} from "./insight";

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

// RBAC types
export type {
  Permission,
  Role,
  SystemRole,
  CustomRole,
  UserRole,
  RolePermission,
  RoleDb,
  PermissionDb,
} from "./rbac";
export {
  PERMISSIONS,
  roleDbSchema,
  permissionDbSchema,
  userRoleSchema,
  rolePermissionSchema,
} from "./rbac";

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

// Dashboard types
export type {
  DashboardDomainSlug,
  DashboardDatePreset,
  DashboardViewMode,
  DashboardKpiMetric,
  DashboardInsightSummary,
  DashboardConnectorHealth,
  DashboardHomeSummary,
  DashboardDomainSummary,
  DashboardAgencyClientRow,
  DashboardAgencyOverview,
  DashboardWidgetId,
  DashboardLayoutState,
} from "./dashboard";
export {
  dashboardDomainSlugSchema,
  dashboardDatePresetSchema,
  dashboardViewModeSchema,
  dashboardKpiMetricSchema,
  dashboardInsightSummarySchema,
  dashboardConnectorHealthSchema,
  dashboardHomeSummarySchema,
  dashboardDomainSummarySchema,
  dashboardAgencyClientRowSchema,
  dashboardAgencyOverviewSchema,
  dashboardWidgetIdSchema,
  dashboardLayoutStateSchema,
} from "./dashboard";
