export {
  BUILD_CONFIG,
  API_VERSION,
  BUILD_TIMESTAMP,
  IS_PRODUCTION,
  NODE_ENV,
  type BuildConfig,
  isDevelopmentBuild,
  isProductionBuild,
  isTestBuild,
} from "./build-constants";
export {
  ConfigurationService,
  canEnableMocksViaEnv,
  config,
  isMockEnabledForPlatform,
} from "./configuration";
export { runtimeConfigSchema, type RuntimeConfig } from "./schemas/runtime-config";
export {
  clearCompanyConfigCache,
  ConfigManager,
  getDefaultConfigManager,
  loadCompanyConfig,
  resolveConfigDir,
  type ConfigManagerOptions,
  type LoadCompanyConfigOptions,
} from "./config-manager";
export { ConfigValidationError, configValidationErrorFromZod } from "./config-errors";
export {
  companyConfigMergeEnvKey,
  deepMergeConfig,
  readCompanyConfigMergeFromEnv,
  sanitizeCompanyIdForEnv,
} from "./env-merge";
export { watchCompanyConfigDirectory } from "./hot-reload";
export { assertValidCompanyConfig, parseCompanyConfigPayload } from "./middleware";
export { aiConfigSchema, type AiConfig } from "./schemas/ai";
export { companyConfigSchema, type CompanyConfig } from "./schemas/company";
export { featureFlagsConfigSchema, type FeatureFlagsConfig } from "./schemas/feature-flags";
export { localizationConfigSchema, type LocalizationConfig } from "./schemas/localization";
export {
  kpiConfigSchema,
  platformConfigSchema,
  type KpiConfig,
  type PlatformConfig,
} from "./schemas/platform";
export {
  b2bFunnelMetricMappingSchema,
  b2bKpiProfileSchema,
  b2bKpiTargetCpqlSchema,
  b2bKpiWeightsSchema,
  type B2bFunnelMetricMapping,
  type B2bKpiProfile,
  type B2bKpiWeights,
} from "./schemas/marketing-b2b";
export {
  defaultDesignTokens,
  designTokensSchema,
  designTokensToCssVariables,
  exportDesignTokensJsonSchema,
  mantineThemeFromDesignTokens,
  type DesignTokens,
} from "./schemas/branding";
export {
  exportTemplateConfigJsonSchema,
  templateComponentSpecSchema,
  templateConfigSchema,
  templateInheritanceSchema,
  templateSectionSchema,
  templateVariableSchema,
  type TemplateBranding,
  type TemplateComponentSpec,
  type TemplateConfig,
  type TemplateInheritance,
  type TemplateSection,
  type TemplateStyling,
  type TemplateValidation,
  type TemplateVariable,
} from "./schemas/template";
export {
  logLevelSchema,
  observabilityEnvSchema,
  resolveLogLevel,
  type LogLevel,
  type ObservabilityEnv,
} from "./schemas/observability";
