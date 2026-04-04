import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

import type { AgentFactoryConfig } from "./agent-config";
import type { LlmInvocationCache } from "./llm-invocation-cache";
import { parseAgentFactoryConfig } from "./agent-config";
import { AgentFactory } from "./agent-factory";
import type { AgentLlmRole } from "./chat-models";
import type { IAgent } from "./interfaces";
import { renderPromptTemplate, resolvePromptTemplate } from "./prompts/index";

const JSON_VERDICT_SUFFIX = `

When the user asks for a structured verdict, reply with a single JSON object only (no markdown fences) matching this shape:
{
  "summary": string,
  "sentiment": "positive" | "neutral" | "negative",
  "score": number (0-100),
  "keyInsights": [{ "id": string, "title": string, "detail": string, "impact"?: "high"|"medium"|"low", "confidence"?: number }],
  "recommendations": [{ "title": string, "rationale": string, "priority"?: number, "estimatedRoasImpact"?: number }],
  "actionItems": [{ "description": string, "ownerRole": string, "dueHint"?: string }],
  "evidence": [{ "label": string, "metric"?: string, "value"?: string, "source"?: string }],
  "nextSteps": string[]
}`;

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
  companyName: string;
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
  /** Display name for prompt rendering (never substitute real PII beyond company marketing name). */
  companyName: string;
  promptVars?: Partial<SpecializedMarketingAgentPromptVars>;
  /** Pin a template semver; latest when omitted. */
  templateVersion?: string;
  /** Extra factory config merged after specialization defaults. */
  factoryConfig?: Partial<AgentFactoryConfig>;
  mockLlm?: BaseChatModel;
  /** Shared across pipeline stages to dedupe identical LLM turns (tasks.md 6.6). */
  invocationCache?: LlmInvocationCache;
}

function renderBasePolicy(
  kind: SpecializedMarketingAgentKind,
  companyName: string,
  vars: Partial<SpecializedMarketingAgentPromptVars>,
  templateVersion: string | undefined,
): string {
  const templateId = KIND_TEMPLATE_ID[kind];
  const record = resolvePromptTemplate(templateId, templateVersion);

  if (kind === "cross_platform_analysis") {
    return renderPromptTemplate(record, {
      companyName,
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
  companyName: string,
  vars: Partial<SpecializedMarketingAgentPromptVars>,
  templateVersion: string | undefined,
): string {
  const base = renderBasePolicy(kind, companyName, vars, templateVersion);
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
  const { companyName, promptVars = {}, templateVersion, factoryConfig = {} } = options;
  const role = KIND_ROLE[kind];
  const systemPolicy = buildSpecializedSystemPolicy(kind, companyName, promptVars, templateVersion);
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
  return factory.createTestAgent(cfg, options.mockLlm, {
    invocationCache: options.invocationCache,
  });
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
  return factory.createAgent(cfg, { invocationCache: options.invocationCache });
}
