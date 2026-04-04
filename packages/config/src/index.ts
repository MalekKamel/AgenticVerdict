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
  defaultDesignTokens,
  designTokensSchema,
  designTokensToCssVariables,
  exportDesignTokensJsonSchema,
  mantineThemeFromDesignTokens,
  type DesignTokens,
} from "./schemas/branding";
export {
  exportTemplateConfigJsonSchema,
  templateConfigSchema,
  templateSectionSchema,
  templateVariableSchema,
  type TemplateBranding,
  type TemplateConfig,
  type TemplateSection,
  type TemplateStyling,
  type TemplateValidation,
  type TemplateVariable,
} from "./schemas/template";
