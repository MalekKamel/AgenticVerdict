/**
 * Agent-facing types, tool registry, LangChain/LangGraph wiring, job runtime (Phase 2).
 */
export type {
  AgentInvocationContext,
  AgentRunContext,
  AgentRunInput,
  AgentRunResult,
  AgentToolCallRecord,
  IAgent,
  IMemory,
  ITool,
} from "./interfaces";
export {
  AgentJobError,
  type AgentJobErrorCode,
  type AgentJobScope,
  createAgentInvocationContext,
  type RunAgentJobOptions,
  runAgentJob,
} from "./agent-job";
export {
  checkAgentRuntimeHealth,
  type AgentRuntimeHealthCheck,
  type AgentRuntimeHealthReport,
  type AgentRuntimeHealthStatus,
} from "./agent-runtime-health";
export {
  AgentLifecycleController,
  type AgentLifecycle,
  type AgentLifecycleState,
} from "./lifecycle";
export {
  glmConfigToCredentialEnv,
  isGlmConfiguredInEnv,
  parseGlmConfigFromEnv,
  type GLMConfig,
  type GlmConfig,
} from "./glm-config";
export {
  buildRuleBasedDegradedAiMessage,
  ChatGlm,
  createAnthropicChatModel,
  createChatModelForPreference,
  createGlmChatModel,
  createOpenAiChatModel,
  createPrimaryAndFallbackChatModels,
  DEFAULT_AGENT_MODEL_PRESETS,
  DEFAULT_CLAUDE_3_5_SONNET_MODEL,
  DEFAULT_GLM_MODEL,
  DEFAULT_GPT_4_TURBO_MODEL,
  DEFAULT_PRODUCTION_LLM_RETRY_OPTIONS,
  invokeChatModelWithProviderFallback,
  isLlmProviderConfigured,
  isTransientLlmError,
  LlmConfigurationError,
  resolveProviderWithAvailableKeys,
  type AgentLlmCredentialEnv,
  type AgentLlmRole,
  type AgentTypeModelPreset,
  type CreateChatModelOptions,
  type InvokeChatModelResilienceOptions,
  type LlmPrimaryPreference,
  type LlmProviderFallbackEvent,
  type LlmRuleBasedFallbackEvent,
} from "./chat-models";
export { applyLangSmithTracingToProcess, buildSafeLlmRunnableConfig } from "./langsmith-tracing";
export {
  loadLlmEnvFromProcess,
  parseAgentLlmEnv,
  type AgentLlmEnv,
  type LlmProviderEnv,
} from "./llm-env";
export { invokeMinimalMessageGraph } from "./minimal-agent-graph";
export { AgentFactory, type AgentFactoryDeps } from "./agent-factory";
export {
  agentFactoryConfigSchema,
  agentFactoryMemoryLimitsSchema,
  agentMemoryModeSchema,
  agentRuntimeModeSchema,
  type AgentFactoryConfig,
  type AgentFactoryMemoryLimits,
  type AgentMemoryMode,
  type AgentRuntimeMode,
  parseAgentFactoryConfig,
  safeParseAgentFactoryConfig,
} from "./agent-config";
export {
  AgentTenantContextError,
  assertInvocationMatchesActiveTenant,
  buildFactoryTurnPromptLayers,
  type BuildFactoryTurnPromptInput,
} from "./agent-context-integration";
export { ConfigurableLlmAgent, type ConfigurableLlmAgentOptions } from "./configurable-llm-agent";
export {
  LlmInvocationCache,
  buildLlmInvocationCacheKey,
  factoryConfigCacheFingerprint,
  type BuildLlmInvocationCacheKeyInput,
  type LlmInvocationCacheOptions,
} from "./llm-invocation-cache";
export {
  computePercentile,
  marketingPipelineTimingToLogFields,
  summarizeLatencyMs,
  type PipelineTimingLogFields,
} from "./agent-performance-metrics";
export {
  assessVerdictHeuristicQuality,
  runVerdictQualityGate,
  validationDatasetCaseSchema,
  verdictConsistencyScore,
  type HeuristicQualityScores,
  type QualityGateResult,
  type ValidationDatasetCase,
} from "./agent-quality-validation";
export {
  VALIDATION_DATASET_CASES,
  VALIDATION_DATASET_CASE_COUNT,
  VALIDATION_DATASET_VERDICT_FIXTURES,
} from "./validation-dataset";
export {
  BoundedBufferMemory,
  CompositeAgentMemory,
  createAgentMemory,
  createMemoryForMode,
  InMemoryAgentMemory,
  NullAgentMemory,
} from "./memory";
export { createRuleBasedEchoAgent, type RuleBasedAgentOptions } from "./rule-based-agent";
export {
  computeRetryDelayMs,
  withPrimaryFallback,
  withRetries,
  type RetryAttemptInfo,
  type RetryOptions,
} from "./resilience";
export { defineTool, ToolRegistry, type ToolDefinition, type ToolHandler } from "./tools";
export { AgentToolError, type AgentToolErrorCode } from "./agent-tools/agent-tool-error";
export {
  analyzeTrendsInputSchema,
  calculateMetricsInputSchema,
  comparePeriodsInputSchema,
  dateRangeToolInputSchema,
  formatReportInputSchema,
  generateSummaryInputSchema,
  getConfigInputSchema,
  normalizeMetricsInputSchema,
  parseToolArgs,
  prepareChartDataInputSchema,
  queryHistoricalMetricsInputSchema,
  statisticalAnalysisInputSchema,
  type DateRangeToolInput,
} from "./agent-tools/agent-tool-schemas";
export {
  analyzeTrendsFromStore,
  comparePeriodsFromStore,
  createDrizzleMarketingMetricsStore,
  type MarketingMetricsRow,
  type MarketingMetricsStore,
  type PeriodCompareResult,
  type TrendAnalysisResult,
} from "./agent-tools/marketing-metrics-store";
export {
  createPlatformFetchTools,
  fetchNormalizedSnapshotsForPlatformsParallel,
  type ParallelNormalizedPlatformFetchResult,
  type PlatformFetchToolDeps,
} from "./agent-tools/platform-fetch-tools";
export {
  createDatabaseQueryTools,
  type DatabaseQueryToolDeps,
} from "./agent-tools/database-query-tools";
export { createReportPrepTools } from "./agent-tools/report-prep-tools";
export { createAnalysisTools } from "./agent-tools/analysis-tools";
export {
  createCompanyContextTools,
  TenantScopedTtlCache,
  type CompanyContextToolDeps,
  type TenantCacheOptions,
} from "./agent-tools/company-context-tools";
export {
  createPhase4ToolRegistry,
  createPhase4ToolRegistryWithDatabase,
  registerPhase4AgentTools,
  type Phase4AgentToolingDeps,
} from "./agent-tools/phase4-tool-registry";
export type {
  AbFixtureResultRow,
  AbInvokeHooks,
  AbLlmObservation,
  AbPromptVariant,
  AbTestFixture,
  AbVariantAggregate,
  AbWinner,
  AssembledPromptLayersInput,
  CompanyPromptContextOptions,
  PairedAbStatisticalSummary,
  PromptAbTestReport,
  PromptContextSection,
  PromptContextSectionKey,
  PromptTemplateMetadata,
  PromptTemplateRecord,
  PromptTemplateType,
} from "./prompts/index";
export {
  assemblePromptLayers,
  buildAbDecisionRecord,
  buildCompanyPromptContext,
  buildCompanyPromptContextSections,
  estimateApproximateTokenCount,
  getPromptTemplateHistory,
  listPromptTemplateIds,
  listPromptTemplatesByType,
  listTemplatePlaceholders,
  PRODUCTION_PROMPT_TEMPLATES,
  PRODUCTION_PROMPT_TEMPLATE_COUNT,
  PromptTemplateError,
  promptTemplateMetadataSchema,
  promptTemplateRecordSchema,
  promptTemplateTypeSchema,
  renderPromptTemplate,
  resolvePromptTemplate,
  runPairedPromptAbTest,
  selectPromptAbWinner,
} from "./prompts/index";
export {
  bindTenantContext,
  continueWithTenantContext,
  getTenantContext,
  requireTenantContext,
  runWithCapturedTenantContext,
  runWithTenantContext,
  type TenantContext,
} from "./tenant-runtime";
export {
  agentExecutionContextSchema,
  agentMessageSchema,
  agentMessageToLogFields,
  agentMessageTypeSchema,
  AgentMessageLogger,
  AgentProtocolError,
  createAgentMessage,
  type AgentExecutionContext,
  type AgentMessage,
  type AgentMessageType,
} from "./agent-protocol";
export {
  applyMarketingVerdictPipelineContext,
  extractJsonObjectText,
  getVerdictParseFailureDetails,
  parseMarketingVerdictFromAgentText,
  resolveWorkflowAnalysisUuid,
  safeParseMarketingVerdictFromAgentText,
  type VerdictParseFailureDetails,
  type VerdictParseFailureKind,
} from "./agent-verdict-json";
export { VerdictParseError } from "./verdict-schema";
export {
  buildMarketingVerdictFixture,
  buildMinimalMarketingVerdict,
  deterministicUuid,
  type BuildMarketingVerdictFixtureOptions,
} from "./test-utils/marketing-verdict-fixtures";
export {
  DataQualityService,
  ValidationService,
  type AnalysisResultValidationInput,
  type DataQualityValidator,
  type ValidationConfig,
  type ValidationError,
  type ValidationResult,
  type ValidationWarning,
} from "./validation/data-quality";
export {
  ProvenanceTracker,
  type ProvenanceRecordPayload,
  type ProvenanceTrackerState,
} from "./provenance/tracker";
export {
  buildSpecializedMarketingFactoryConfig,
  createSpecializedMarketingProductionAgent,
  createSpecializedMarketingTestAgent,
  type CreateSpecializedMarketingAgentOptions,
  type SpecializedMarketingAgentKind,
  type SpecializedMarketingAgentPromptVars,
} from "./specialized-marketing-agents";
export {
  marketingPipelineStateToJson,
  runMarketingAgentPipeline,
  type MarketingPipelineStageName,
  type MarketingPipelineStageRecord,
  type MarketingPipelineState,
  type MarketingPipelineStatus,
  type MarketingWorkflowProgressEvent,
  type RunMarketingPipelineOptions,
} from "./marketing-pipeline";

export { AGENT_RUNTIME_PACKAGE_VERSION } from "./version";
