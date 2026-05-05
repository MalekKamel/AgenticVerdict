import type { AgentFactoryConfig } from "./agent-config";
import { createAnalysisTools } from "./agent-tools/analysis-tools";
import {
  createTenantContextTools,
  type TenantContextToolDeps,
} from "./agent-tools/tenant-context-tools";
import {
  createPlatformFetchTools,
  type PlatformFetchToolDeps,
} from "./agent-tools/platform-fetch-tools";
import { createReportPrepTools } from "./agent-tools/report-prep-tools";
import type { LlmInvocationCache } from "./llm-invocation-cache";
import { parseAgentFactoryConfig } from "./agent-config";
import { AgentFactory } from "./agent-factory";
import type { IAgent } from "./interfaces";
import { renderPromptTemplate, resolvePromptTemplate } from "./prompts/index";

type AgentLlmRole = "analysis" | "insights" | "verdict";

const JSON_VERDICT_SUFFIX = `

When the user asks for a structured verdict, reply with a single JSON object only (no markdown fences) matching the unified MarketingVerdict contract:
- Required top-level: "id" (UUID v4), "tenantId" (UUID v4), "analysisId" (UUID v4), "verdictType" ("budget_allocation"|"platform_performance"|"creative_effectiveness"|"overall_health"),
  "score" (0-100), "confidence" (number 0-1, not percentage), "sentiment" ("positive"|"neutral"|"negative"),
  score-sentiment mapping guidance: 0-49->"negative", 50-74->"neutral", 75-100->"positive",
  "summary" (10-500 chars), "reasoning" (string[], each line >=10 chars, min 1 line; e.g. "Meta CPC increased due to audience fatigue in KSA market"),
  "keyInsights" (min 1; each needs UUID v4 "id", "title", "detail", "impact" ("high"|"medium"|"low" lowercase only), "confidence" (number 0-1, not percentage)),
  "recommendations" (min 1; each needs UUID v4 "id", "title", "rationale", "priority" 1-5, "effort" "low"|"medium"|"high";
  optional "estimatedImpact": { "roas"?: number decimal multiplier (e.g. 1.4 for +40%, not "+40%"), "cost"?: number base currency value, "revenue"?: number }),
  "actionItems" (each: UUID v4 "id", "description", "ownerRole", "priority" 1-10; optional "dueDateHint"),
  "evidence" (each: UUID v4 "id", "label", "source" "meta"|"ga4"|"gsc"|"gbp"|"tiktok"|"internal"|"composite", "capturedAt" ISO-8601 e.g. "2024-10-24T00:00:00.000Z"; optional "value", "metric", etc.),
  "dataSources" (min 1; each: "platform" "meta"|"ga4"|"gsc"|"gbp"|"tiktok", "metrics" (non-empty strings), "dateRange" { "start","end" YYYY-MM-DD }, "freshness" ≥0, "qualityScore" 0-100),
  "platformsAnalyzed" (array of non-empty platform display names, e.g. ["Meta Ads","GA4"]), "dateRange" { "start","end" }, "generatedAt" ISO-8601, "generatedBy", "modelUsed".
Use the tenantId and analysisId values supplied in the user message exactly.
Generate new UUID v4 values for nested entities (keyInsights, recommendations, actionItems, evidence).
Do NOT use string patterns like "insight-001" or "rec-001".`;

export type SpecializedMarketingAgentKind =
  | "cross_platform_analysis"
  | "marketing_insight_generation"
  | "media_verdict";

const KIND_ROLE: Record<SpecializedMarketingAgentKind, AgentLlmRole> = {
  cross_platform_analysis: "analysis",
  marketing_insight_generation: "insights",
  media_verdict: "verdict",
};

const KIND_TEMPLATE_ID: Record<SpecializedMarketingAgentKind, string> = {
  cross_platform_analysis: "analysis.cross_platform_overview",
  marketing_insight_generation: "insight.anomaly_scan",
  media_verdict: "verdict.recommendation_synthesis",
};

export interface SpecializedMarketingAgentPromptVars {
  tenantName: string;
  dateRange?: string;
  platforms?: string;
  /** Reporting currency label for cross-platform analysis template (e.g. SAR, USD). */
  currency?: string;
  /** Passed to insight template as thresholdContext */
  thresholdContext?: string;
  goal?: string;
  constraints?: string;
  horizon?: string;
}

export interface CreateSpecializedMarketingAgentOptions {
  /** Display name for prompt rendering (never substitute real PII beyond tenant marketing name). */
  tenantName: string;
  promptVars?: Partial<SpecializedMarketingAgentPromptVars>;
  /** Pin a template semver; latest when omitted. */
  templateVersion?: string;
  /** Extra factory config merged after specialization defaults. */
  factoryConfig?: Partial<AgentFactoryConfig>;
  /** Shared across pipeline stages to dedupe identical LLM turns (tasks.md 6.6). */
  invocationCache?: LlmInvocationCache;
  /** Optional platform adapter dependency contract for fetch_* tools. */
  platformDeps?: PlatformFetchToolDeps;
  /** Optional cache/dependency controls for tenant context tools. */
  tenantContextDeps?: TenantContextToolDeps;
}

function renderBasePolicy(
  kind: SpecializedMarketingAgentKind,
  tenantName: string,
  vars: Partial<SpecializedMarketingAgentPromptVars>,
  templateVersion: string | undefined,
): string {
  const templateId = KIND_TEMPLATE_ID[kind];
  const record = resolvePromptTemplate(templateId, templateVersion);

  if (kind === "cross_platform_analysis") {
    return renderPromptTemplate(record, {
      tenantName,
      dateRange: vars.dateRange ?? "last 30 days",
      platforms: vars.platforms ?? "Meta, GA4, GSC, GBP, TikTok",
      currency: vars.currency ?? "USD",
    });
  }
  if (kind === "marketing_insight_generation") {
    return renderPromptTemplate(record, {
      thresholdContext: vars.thresholdContext ?? "prior period and channel baselines",
      dateRange: vars.dateRange ?? "last 30 days",
    });
  }
  return renderPromptTemplate(record, {
    goal: vars.goal ?? "Deliver an evidence-based media verdict with budget guidance.",
    constraints: vars.constraints ?? "Respect tenant-safe outputs; no credentials or raw PII.",
    horizon: vars.horizon ?? "next 30 days",
  });
}

function buildSpecializedSystemPolicy(
  kind: SpecializedMarketingAgentKind,
  tenantName: string,
  vars: Partial<SpecializedMarketingAgentPromptVars>,
  templateVersion: string | undefined,
): string {
  const base = renderBasePolicy(kind, tenantName, vars, templateVersion);
  const specialization =
    kind === "cross_platform_analysis"
      ? "\n\nSpecialization: cross-platform marketing analysis — correlate channels, call out data gaps, and summarize blended KPIs."
      : kind === "marketing_insight_generation"
        ? "\n\nSpecialization: marketing insight generation — prioritize anomalies and opportunities by business impact with explicit evidence."
        : "\n\nSpecialization: media verdict synthesis — executive tone, budget trade-offs, and accountable action items by role.";

  if (kind === "media_verdict") {
    return `${base}${specialization}${JSON_VERDICT_SUFFIX}`;
  }
  return `${base}${specialization}`;
}

/**
 * Builds validated {@link AgentFactoryConfig} for a Phase 7 specialized marketing agent.
 */
export function buildSpecializedMarketingFactoryConfig(
  kind: SpecializedMarketingAgentKind,
  options: CreateSpecializedMarketingAgentOptions,
): AgentFactoryConfig {
  const { tenantName, promptVars = {}, templateVersion, factoryConfig = {} } = options;
  const role = KIND_ROLE[kind];
  const systemPolicy = buildSpecializedSystemPolicy(kind, tenantName, promptVars, templateVersion);
  return parseAgentFactoryConfig({
    ...factoryConfig,
    role,
    systemPolicy,
    memoryMode: factoryConfig.memoryMode ?? "none",
  });
}

/**
 * Deterministic CI agent for a specialized marketing role (mock LLM unless overridden).
 */
export function createSpecializedMarketingTestAgent(
  factory: AgentFactory,
  kind: SpecializedMarketingAgentKind,
  options: CreateSpecializedMarketingAgentOptions,
): IAgent {
  const cfg = buildSpecializedMarketingFactoryConfig(kind, options);
  const sharedTools = [
    ...createTenantContextTools(options.tenantContextDeps),
    ...(options.platformDeps ? createPlatformFetchTools(options.platformDeps) : []),
    ...createAnalysisTools(),
    ...createReportPrepTools(),
  ];
  return factory.createAgentWithTools({ ...cfg, runtimeMode: "test" }, sharedTools, {
    invocationCache: options.invocationCache,
  }).agent;
}

/**
 * Production agent with real providers from the factory deps.
 */
export function createSpecializedMarketingProductionAgent(
  factory: AgentFactory,
  kind: SpecializedMarketingAgentKind,
  options: CreateSpecializedMarketingAgentOptions,
): IAgent {
  const cfg = buildSpecializedMarketingFactoryConfig(kind, options);
  const sharedTools = [
    ...createTenantContextTools(options.tenantContextDeps),
    ...(options.platformDeps ? createPlatformFetchTools(options.platformDeps) : []),
    ...createAnalysisTools(),
    ...createReportPrepTools(),
  ];
  return factory.createAgentWithTools(cfg, sharedTools, {
    invocationCache: options.invocationCache,
  }).agent;
}
