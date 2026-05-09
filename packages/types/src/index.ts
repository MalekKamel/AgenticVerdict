export { CONNECTOR_PLATFORMS, type ConnectorType } from "./connector-types";
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
  SyncFrequency,
  ConnectorConfig,
  ConnectorNotifications,
  ConnectorAdvancedOptions,
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
  SYNC_FREQUENCIES,
  syncFrequencySchema,
  connectorConfigSchema,
  connectorNotificationsSchema,
  connectorAdvancedOptionsSchema,
} from "./connector-types";

export type {
  DateRange,
  DateRangeIso,
  MetricReference,
  TextDirection,
  SortDirection,
} from "./common";
export {
  dateRangeSchema,
  metricReferenceSchema,
  textDirectionSchema,
  SORT_DIRECTIONS,
  sortDirectionSchema,
} from "./common";

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
  AuthPayload,
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
  SimpleTenantAIConfig,
  TenantCapabilities,
  AgencyPartner,
  AgencyPartnerTier,
  ProviderModelConfig,
  RoleBasedModelConfig,
  BudgetConfig,
  FailoverConfig,
  CircuitBreakerConfig,
  FailoverChainConfig,
  FailoverEvent,
  FailoverCircuitBreakerOptions,
} from "./tenant";
export {
  tenantTypeSchema,
  tenantStatusSchema,
  tenantSchema,
  tenantLocalizationSchema,
  tenantFeaturesSchema,
  tenantAIConfigSchema,
  simpleTenantAIConfigSchema,
  tenantCapabilitiesSchema,
  agencyPartnerSchema,
  agencyPartnerTierSchema,
  providerModelConfigSchema,
  roleBasedModelConfigSchema,
  budgetConfigSchema,
  failoverConfigSchema,
  circuitBreakerConfigSchema,
} from "./tenant";

export type {
  GeneratedInsight,
  InsightType,
  InsightDTO,
  InsightAttributes,
  DetailLevel,
} from "./insight";
export {
  INSIGHT_TYPES,
  INSIGHT_STATUSES,
  DB_RUN_STATUSES,
  DETAIL_LEVELS,
  generatedInsightSchema,
  insightTypeSchema,
  insightDtoSchema,
  insightAttributesSchema,
  insightDeliverySchema,
  insightAiConfigSchema,
  insightStatusSchema,
  insightDbRunStatusSchema,
  detailLevelSchema,
  type InsightDelivery,
  type InsightAiConfig,
  type InsightStatus,
  type InsightDbRunStatus,
  type InsightConnector,
  type InsightCreateInput,
  type InsightUpdateInput,
  type InsightListInput,
  type InsightOutput,
  type InsightListOutput,
  insightConnectorSchema,
  insightCreateSchema,
  insightUpdateSchema,
  insightListInputSchema,
  insightOutputSchema,
  insightListOutputSchema,
  isInsightAiConfig,
  isInsightDelivery,
  isInsightConnector,
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
  Verdict,
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
  historicalTrendSchema,
  verdictSchema,
  verdictReportMetadataSchema,
  methodologyInfoSchema,
  verdictActionItemSchema,
  verdictEvidenceSchema,
  verdictEvidenceSourceSchema,
  verdictInsightSchema,
  verdictRecommendationSchema,
  verdictTypeSchema,
  verdictVisualizationSchema,
  VerdictParseError,
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

// AI Provider types
export type {
  AiProviderType,
  BusinessDomain,
  BusinessDomainWithProviders,
  AiProviderDetail,
  AiProviderDetailItem,
  AiModel,
  AiTemplate,
  Connector,
  AiProviderConfig,
  ResolvedConfig,
  CustomPricing,
  ProviderMetadata,
  ProviderCapabilities,
  ProviderFailoverConfig,
  CreateProviderConfig,
  UpdateProviderConfig,
  ProviderCredentials,
  ProviderHealth,
  ResolvedConfigType,
  ResolveConfigInput,
} from "./ai-providers";
export {
  COST_TIER,
  CONFIG_SCOPES,
  AI_PROVIDER_STATUSES,
  AI_PROVIDER_TYPES,
  costTierSchema,
  aiProviderTypeSchema,
  aiProviderStatusSchema,
  providerIdSchema,
  modelIdSchema,
  customPricingSchema,
  providerMetadataSchema,
  providerCapabilitiesSchema,
  providerFailoverConfigSchema,
  aiModelConfigSchema,
  createProviderConfigSchema,
  updateProviderConfigSchema,
  providerCredentialsSchema,
  providerHealthSchema,
  configScopeSchema,
  resolvedConfigSchema,
  resolveConfigInputSchema,
} from "./ai-providers";
export type { CostTier, ConfigScope, AiProviderStatus } from "./ai-providers";

// Budget Alerts
export type {
  AlertType,
  AlertThresholdType,
  AlertStatus,
  NotificationType,
  NotificationChannel,
  BudgetAlertMetadata,
  BudgetAlert,
  CreateBudgetAlert,
  UpdateBudgetAlert,
  BudgetAlertConfig,
  AlertCheckResult,
  AlertNotification,
} from "./budget-alerts";
export {
  alertTypeSchema,
  alertThresholdTypeSchema,
  alertStatusSchema,
  notificationTypeSchema,
  notificationChannelSchema,
  budgetAlertMetadataSchema,
  createBudgetAlertSchema,
  updateBudgetAlertSchema,
  alertTriggerSchema,
} from "./budget-alerts";

// Business Domains
export type {
  DomainProviderConfig,
  DomainMetadata,
  DomainHierarchyNode,
  CreateDomain,
  UpdateDomain,
} from "./business-domains";
export {
  domainProviderConfigSchema,
  domainMetadataSchema,
  domainIdSchema,
  createDomainSchema,
  updateDomainSchema,
  assignConnectorToDomainSchema,
  domainHierarchyNodeSchema,
} from "./business-domains";

// AI Templates
export type {
  TemplateVariable,
  TemplateMetadata,
  CreateTemplate,
  UpdateTemplate,
  DeployTemplate,
} from "./ai-templates";
export {
  templateVariableSchema,
  templateMetadataSchema,
  templateTypeSchema,
  createTemplateSchema,
  updateTemplateSchema,
  deployTemplateSchema,
} from "./ai-templates";

// AI Usage
export type {
  AiUsageReport,
  AiUsageSummary,
  ProviderUsageBreakdown,
  DomainUsageBreakdown,
  ModelUsageBreakdown,
  UsageReport,
  UsageQueryFilters,
  UsageSummary,
  UsageTrackOptions,
  UsageMetrics,
} from "./ai-usage";
export {
  usageReportSchema,
  usageQueryFiltersSchema,
  usageSummarySchema,
  usageQueryInputSchema,
  recordUsageInputSchema,
  usageSummaryOutputSchema,
} from "./ai-usage";

// Common (pagination)
export type { PaginationInput } from "./common";
export {
  paginationSchema,
  paginatedResponseSchema,
  successResponseSchema,
  errorResponseSchema,
} from "./common";

// Reports
export type {
  ReportMetadata,
  ReportListItem,
  ReportListResponse,
  ReportDetail,
  Report,
  ReportContent,
  ShareLink,
  CreateShareLinkResponse,
  ReportFormat,
  ReportCreateBody,
  ReportDeliveryBody,
  DeliveryWebhookBody,
  ResendWebhookBody,
  SendgridWebhookBody,
  ReportShareBody,
  ReportCompareVersionsBody,
  ReportRetentionBody,
  ReportDeliveryEvent,
  ReportDeliveryProvider,
  ReportDeliveryStatusCode,
  ReportReadRole,
  ReportWriteRole,
  ReportShareRole,
} from "./reports";
export {
  reportMetadataSchema,
  reportListInputSchema,
  reportOutputSchema,
  reportListOutputSchema,
  REPORT_FORMATS,
  reportCreateBodySchema,
  reportDeliveryBodySchema,
  deliveryWebhookBodySchema,
  resendWebhookBodySchema,
  sendgridWebhookBodySchema,
  reportShareBodySchema,
  reportCompareVersionsBodySchema,
  reportRetentionBodySchema,
  REPORT_DELIVERY_EVENTS,
  REPORT_DELIVERY_PROVIDERS,
  REPORT_DELIVERY_STATUS_CODES,
  REPORT_READ_ROLES,
  REPORT_WRITE_ROLES,
  REPORT_SHARE_ROLES,
} from "./reports";

// Audit event types
export {
  AuditEventType,
  AUDIT_EVENT_TYPE_LABELS,
  AUDIT_EVENT_TYPE_VALUES,
} from "./audit-event-types";

// Pipeline execution status types
export type {
  PipelineExecutionStatus,
  JobStatusPayload,
  InsightRunStatus,
  PipelineStatus,
  PipelineState,
} from "./pipeline-execution";
export { PIPELINE_STATUSES, pipelineStatusSchema } from "./pipeline-execution";

// Pipeline data types (structured results)
export type {
  MetricDataPoint,
  PlatformSummary,
  CrossPlatformComparison,
  AnalysisResult,
  InsightItem,
  InsightsResult,
} from "./pipeline-data";

// Branding types
export type { BrandTokens, DesignTokens } from "./branding";
export { brandTokensSchema, designTokensSchema } from "./branding";

// Template config types (distinct from AI Templates)
export type {
  TemplateSection,
  TemplateComponentSpec,
  TemplateStyling,
  TemplateValidation,
  TemplateInheritance,
  TemplateConfig,
  TemplateKind,
  TemplateDefinition,
  TemplateBranding,
} from "./templates";
export {
  templateSectionSchema,
  templateComponentSpecSchema,
  templateStylingSchema,
  templateValidationSchema,
  templateInheritanceSchema,
  templateConfigSchema,
  templateKindSchema,
  templateDefinitionSchema,
  templateBrandingSchema,
} from "./templates";

// Validation types
export type {
  ValidationSeverity,
  ValidationIssue,
  OutlierFlag,
  ValidationError,
  ValidationWarning,
  ValidationResult,
  ValidationConfig,
} from "./validation";
export {
  validationSeveritySchema,
  validationIssueSchema,
  outlierFlagSchema,
  validationErrorSchema,
  validationWarningSchema,
  validationResultSchema,
} from "./validation";

// Resilience types
export type {
  RetryOptions,
  RetryAttemptInfo,
  ExponentialBackoffOptions,
  ExponentialBackoffTelemetry,
} from "./resilience";
export {
  retryOptionsSchema,
  retryAttemptInfoSchema,
  exponentialBackoffOptionsSchema,
} from "./resilience";

// Insight Templates
export type {
  ScheduleFrequency,
  InsightTemplate,
  InsightTemplateSummary,
  AppliedTemplateConfig,
  TemplateValidationResult,
  ListInsightTemplatesInput,
  GetInsightTemplateInput,
  ApplyInsightTemplateInput,
  ValidateInsightTemplateInput,
} from "./insight-templates";
export {
  SCHEDULE_FREQUENCIES,
  scheduleFrequencySchema,
  insightTemplateSchema,
  insightTemplateSummarySchema,
  appliedTemplateConfigSchema,
  templateValidationResultSchema,
  listInsightTemplatesInput,
  getInsightTemplateInput,
  applyInsightTemplateInput,
  validateInsightTemplateInput,
} from "./insight-templates";

// Unified Schedules
export type {
  ScheduleEntityType,
  ScheduleExecutionStatus,
  ScheduleRecord,
  ScheduleExecutionRecord,
  ScheduleCreateInput,
  ScheduleUpdateInput,
  ScheduleValidationInput,
  ScheduleValidationOutput,
  ScheduleConflict,
  ScheduleExecutionHistoryInput,
  ScheduleExecutionHistoryOutput,
  InsightScheduleTickJobData,
} from "./schedule";
export {
  scheduleEntityTypeSchema,
  scheduleExecutionStatusSchema,
  scheduleRecordSchema,
  scheduleExecutionRecordSchema,
  scheduleCreateSchema,
  scheduleUpdateSchema,
  scheduleValidationSchema,
  scheduleValidationOutputSchema,
  scheduleConflictSchema,
  scheduleExecutionHistoryInputSchema,
  scheduleExecutionHistoryOutputSchema,
} from "./schedule";

// Queue job types
export type {
  WorkflowTriggerWorkflowId,
  ProductionFlowScenarioId,
  ProductionFlowPdfScenarioId,
  WorkflowTriggerPhase,
  WorkflowTriggerJobConfig,
  WorkflowJobErrorCode,
  WorkflowTriggerJobResult,
  WorkflowTriggerPdfValidation,
  WorkflowTriggerJobData,
  ReportGenerationJobData,
  ReportDeliveryJobData,
  ReportScheduleJobData,
  InsightExecutionJobData,
  InsightExecutionJobResult,
} from "./queue-job-types";
export {
  PRODUCTION_FLOW_SCENARIO_IDS,
  isProductionFlowScenarioId,
  workflowTriggerJobConfigSchema,
  workflowTriggerJobResultSchema,
  workflowTriggerJobDataSchema,
  insightExecutionJobDataSchema,
  insightExecutionJobResultSchema,
  reportGenerationJobDataSchema,
  reportScheduleJobDataSchema,
} from "./queue-job-types";

// Delivery analytics
export type { DeliveryEventType, DeliveryEvent, DeliveryMetricsSummary } from "./delivery";
export {
  deliveryEventTypeSchema,
  deliveryEventSchema,
  deliveryMetricsSummarySchema,
} from "./delivery";

// Audit
export type { ReportAuditAction, ReportAuditEvent, AuditTrailEvent } from "./audit";
export { reportAuditActionSchema, reportAuditEventSchema, auditTrailEventSchema } from "./audit";

// Agent protocol
export type {
  AgentMessageType,
  AgentMessageContext,
  AgentMessage,
  CreateAgentMessageInput,
} from "./agent-protocol";
export {
  agentMessageTypeSchema,
  agentExecutionContextSchema,
  agentMessageSchema,
  AgentProtocolError,
  createAgentMessage,
  agentMessageToLogFields,
  AgentMessageLogger,
} from "./agent-protocol";

// Webhook types
export type {
  WebhookPayloadDepth,
  WebhookMetricSummary,
  WebhookReportUrls,
  WebhookPayload,
  WebhookDeliveryEvent,
  WebhookDeliveryStatus,
} from "./webhook";
export {
  webhookPayloadDepthSchema,
  webhookMetricSummarySchema,
  webhookReportUrlsSchema,
  webhookPayloadSchema,
  webhookDeliveryEventSchema,
  WEBHOOK_DELIVERY_STATUSES,
  webhookDeliveryStatusSchema,
} from "./webhook";

// Connector health
export type {
  InfrastructureHealthOptions,
  ComponentHealth,
  ConnectorHealthReport,
  AggregatedInfrastructureHealth,
} from "./connector-health";
