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

export { applyLangSmithTracingToProcess, buildSafeLlmRunnableConfig } from "./langsmith-tracing";
export { loadLlmEnvFromProcess, parseAgentLlmEnv, type AgentLlmEnv } from "./llm-env";
export { invokeMinimalMessageGraph } from "./minimal-agent-graph";
export { AgentFactory, type AgentFactoryDeps } from "./agent-factory";
export { ProviderFactory } from "./core";
export {
  agentConfigSchema,
  agentMemoryLimitsSchema,
  agentMemoryModeSchema,
  agentRoleSchema,
  agentRuntimeModeSchema,
  agentToolConfigSchema,
  extractVariablesFromTemplate,
  modelParamsSchema,
  outputFormatSchema,
  promptVariableSchema,
  retryConfigSchema,
  type AgentConfig,
  type AgentMemoryLimits,
  type AgentMemoryMode,
  type AgentRole,
  type AgentRuntimeMode,
  type AgentToolConfig,
  type ModelParams,
  type OutputFormat,
  type PromptVariable,
  type RetryConfig,
  parseAgentConfig,
  safeParseAgentConfig,
  substituteVariables,
} from "./agent-config";
export type { AgentExecutionContext, CreatedAgent } from "./agent-execution-context";
export {
  AgentTenantContextError,
  assertInvocationMatchesActiveTenant,
  buildFactoryTurnPromptLayers,
  type BuildFactoryTurnPromptInput,
} from "./agent-context-integration";
export {
  LlmInvocationCache,
  buildLlmInvocationCacheKey,
  factoryConfigCacheFingerprint,
  type BuildLlmInvocationCacheKeyInput,
  type LlmInvocationCacheOptions,
} from "./llm-invocation-cache";
export {
  computePercentile,
  pipelineTimingToLogFields,
  summarizeLatencyMs,
  type PipelineTimingLogFields,
} from "./agent-performance-metrics";
export {
  computeB2bMarketingKpis,
  type B2bLeadFunnelSnapshot,
  type B2bMarketingKpiResult,
} from "./b2b-marketing-kpis";
export {
  buildB2bFunnelSnapshotFromNormalizedSnapshots,
  computeB2bMarketingKpisFromNormalizedSnapshots,
} from "./b2b-funnel-from-snapshots";
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
export {
  defineTool,
  executeToolWithResult,
  ToolRegistry,
  type ToolDefinition,
  type ToolHandler,
  type ToolResult,
  type ToolResultError,
  type ToolResultErrorCode,
} from "./tools";
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
  createTenantContextTools,
  TenantScopedTtlCache,
  type TenantContextToolDeps,
  type TenantCacheOptions,
} from "./agent-tools/tenant-context-tools";
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
  TenantPromptContextOptions,
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
  buildTenantPromptContext,
  buildTenantPromptContextSections,
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
  applyVerdictPipelineContext,
  extractJsonObjectText,
  getVerdictParseFailureDetails,
  parseVerdictFromAgentText,
  resolveWorkflowAnalysisUuid,
  safeParseVerdictFromAgentText,
  type VerdictParseFailureDetails,
  type VerdictParseFailureKind,
} from "./agent-verdict-json";
export {
  buildVerdictFixture,
  buildMinimalVerdict,
  deterministicUuid,
  type BuildVerdictFixtureOptions,
} from "./test-utils/verdict-fixtures";
export {
  DataQualityService,
  ValidationService,
  type AnalysisResultValidationInput,
  type DataQualityValidator,
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
  pipelineStateToJson,
  runIntelligencePipeline,
  type PipelineStageRecord,
  type PipelineState,
  type PipelineStatus,
  type WorkflowProgressEvent,
  type RunPipelineOptions,
  type StructuredPipelineResults,
} from "./intelligence-pipeline";

export {
  type PipelineAgentKind,
  type CreatePipelineAgentOptions,
  createPipelineAgentConfig,
  createPipelineAgentTools,
} from "./agent-kinds";

export { AGENT_RUNTIME_PACKAGE_VERSION } from "./version";
export { OpenAIProvider } from "./providers/openai";
export { AnthropicProvider } from "./providers/anthropic";
export { UsageTracker } from "./services/usage-tracker";
export {
  BudgetAlertsService,
  type BudgetAlertConfig,
  type AlertCheckResult,
  type AlertNotification,
} from "./services/budget-alerts";
export { BillingHook, createBillingHook, type BillingHookConfig } from "./hooks/billing";
export {
  LangSmithTracingHook,
  createLangSmithTracingHook,
  type LangSmithHookConfig,
} from "./hooks/langsmith";
export {
  LangfuseTracingHook,
  createLangfuseTracingHook,
  type LangfuseHookConfig,
} from "./hooks/langfuse";
export {
  StructuredLoggingHook,
  createStructuredLoggingHook,
  type StructuredLoggingHookConfig,
} from "./hooks/structured-logging";
export {
  composeBeforeChatHooks,
  composeOnChatCompleteHooks,
  composeOnChatErrorHooks,
  createConditionalHook,
} from "./core/hook-composition";
export {
  recordRequest,
  recordLatency,
  recordError,
  recordTokenUsage,
  recordCost,
  recordStreamingDuration,
  incrementActiveStreams,
  decrementActiveStreams,
  setModelAvailability,
  recordCredentialRefresh,
  recordCacheHit,
  recordFailover,
  recordRateLimit,
  startLatencyTimer,
  type ProviderMetricLabels,
  type ErrorMetricLabels,
  type LatencyTimer,
} from "./metrics";
