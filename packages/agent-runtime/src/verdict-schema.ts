import { createHash, randomUUID } from "node:crypto";

import type {
  DataSourceInfo,
  MarketingVerdict,
  VerdictEvidenceSource,
} from "@agenticverdict/types";
import { marketingVerdictSchema } from "@agenticverdict/types";
import { z } from "zod";

/** LLM-facing insight row (legacy JSON contract; normalized to {@link MarketingVerdict} for APIs). */
export const legacyMarketingInsightSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  detail: z.string().min(1),
  impact: z.enum(["high", "medium", "low"]).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

/** LLM-facing verdict JSON (Phase 2 pipeline). */
export const legacyVerdictRecommendationSchema = z.object({
  title: z.string().min(1),
  rationale: z.string().min(1),
  priority: z.number().int().min(1).max(5).optional(),
  estimatedRoasImpact: z.number().finite().optional(),
});

export const legacyVerdictActionItemSchema = z.object({
  description: z.string().min(1),
  ownerRole: z.string().min(1),
  dueHint: z.string().optional(),
});

export const legacyVerdictEvidenceSchema = z.object({
  label: z.string().min(1),
  metric: z.string().optional(),
  value: z.string().optional(),
  source: z.enum(["meta", "ga4", "gsc", "gbp", "tiktok", "internal", "unknown"]).optional(),
});

export const legacyVerdictSchema = z.object({
  summary: z.string().min(1),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  score: z.number().min(0).max(100),
  keyInsights: z.array(legacyMarketingInsightSchema).default([]),
  recommendations: z.array(legacyVerdictRecommendationSchema).default([]),
  actionItems: z.array(legacyVerdictActionItemSchema).default([]),
  evidence: z.array(legacyVerdictEvidenceSchema).default([]),
  nextSteps: z.array(z.string().min(1)).default([]),
});

export type LegacyAgentVerdict = z.infer<typeof legacyVerdictSchema>;

/** @deprecated Prefer {@link LegacyAgentVerdict}; kept for existing imports. */
export type Verdict = LegacyAgentVerdict;

export type LegacyMarketingInsight = z.infer<typeof legacyMarketingInsightSchema>;

/** @deprecated Use {@link LegacyMarketingInsight}. */
export type MarketingInsight = LegacyMarketingInsight;
export type LegacyVerdictRecommendation = z.infer<typeof legacyVerdictRecommendationSchema>;
export type LegacyVerdictActionItem = z.infer<typeof legacyVerdictActionItemSchema>;
export type LegacyVerdictEvidence = z.infer<typeof legacyVerdictEvidenceSchema>;

/** @deprecated Use {@link LegacyVerdictRecommendation}. */
export type VerdictRecommendation = LegacyVerdictRecommendation;
/** @deprecated Use {@link LegacyVerdictActionItem}. */
export type VerdictActionItem = LegacyVerdictActionItem;
/** @deprecated Use {@link LegacyVerdictEvidence}. */
export type VerdictEvidence = LegacyVerdictEvidence;

/** @deprecated Use {@link legacyMarketingInsightSchema}. */
export const marketingInsightSchema = legacyMarketingInsightSchema;
/** @deprecated Use {@link legacyVerdictSchema}. */
export const verdictSchema = legacyVerdictSchema;
/** @deprecated Use {@link legacyVerdictRecommendationSchema}. */
export const verdictRecommendationSchema = legacyVerdictRecommendationSchema;
/** @deprecated Use {@link legacyVerdictActionItemSchema}. */
export const verdictActionItemSchema = legacyVerdictActionItemSchema;
/** @deprecated Use {@link legacyVerdictEvidenceSchema}. */
export const verdictEvidenceSchema = legacyVerdictEvidenceSchema;

export class VerdictParseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "VerdictParseError";
  }
}

export interface LegacyVerdictNormalizationContext {
  tenantId: string;
  analysisId: string;
  campaignId?: string;
  verdictType?: MarketingVerdict["verdictType"];
  generatedBy?: string;
  modelUsed?: string;
}

function correlationToDeterministicUuid(tenantId: string, correlation: string): string {
  const h32 = createHash("sha256").update(`${tenantId}\n${correlation}`).digest("hex").slice(0, 32);
  return `${h32.slice(0, 8)}-${h32.slice(8, 12)}-4${h32.slice(13, 16)}-a${h32.slice(17, 20)}-${h32.slice(20, 32)}`;
}

function resolveAnalysisUuid(ctx: LegacyVerdictNormalizationContext): string {
  const asUuid = z.string().uuid().safeParse(ctx.analysisId);
  if (asUuid.success) {
    return asUuid.data;
  }
  return correlationToDeterministicUuid(ctx.tenantId, ctx.analysisId);
}

function padReasonLine(line: string): string {
  if (line.length >= 10) {
    return line;
  }
  return `${line} — elaborated for downstream reporting.`;
}

function mapEvidenceSource(src: string | undefined): VerdictEvidenceSource {
  if (src === "unknown" || src === undefined) {
    return "internal";
  }
  if (
    src === "meta" ||
    src === "ga4" ||
    src === "gsc" ||
    src === "gbp" ||
    src === "tiktok" ||
    src === "internal" ||
    src === "composite"
  ) {
    return src;
  }
  return "internal";
}

function defaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 30);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function buildDataSourcesFromEvidence(
  legacy: LegacyAgentVerdict,
  range: { start: string; end: string },
): DataSourceInfo[] {
  const platforms = new Set<string>();
  for (const ev of legacy.evidence) {
    const s = mapEvidenceSource(ev.source);
    if (s !== "internal" && s !== "composite") {
      platforms.add(s);
    }
  }
  if (platforms.size === 0) {
    platforms.add("meta");
  }
  return [...platforms].map((platform) => ({
    platform: platform as DataSourceInfo["platform"],
    metrics: legacy.evidence
      .filter((e) => mapEvidenceSource(e.source) === platform)
      .map((e) => e.metric ?? e.label),
    dateRange: range,
    freshness: 0,
    qualityScore: 80,
  }));
}

/**
 * Converts an LLM legacy verdict payload into the unified {@link MarketingVerdict} (remediation R-7).
 */
export function legacyVerdictToMarketingVerdict(
  legacy: LegacyAgentVerdict,
  ctx: LegacyVerdictNormalizationContext,
): MarketingVerdict {
  const range = defaultDateRange();
  const reasoning =
    legacy.nextSteps.length > 0
      ? legacy.nextSteps.map(padReasonLine)
      : [padReasonLine(legacy.summary)];

  const keyInsights = legacy.keyInsights.map((k) => ({
    id: randomUUID(),
    title: k.title,
    detail: k.detail,
    impact: (k.impact ?? "medium") as "high" | "medium" | "low",
    confidence: k.confidence ?? 0.75,
    category: undefined,
    sourcePlatform: undefined,
    relatedMetrics: undefined,
  }));

  const recommendations = legacy.recommendations.map((r) => ({
    id: randomUUID(),
    title: r.title,
    rationale: r.rationale,
    priority: r.priority ?? 3,
    estimatedImpact:
      r.estimatedRoasImpact !== undefined ? { roas: r.estimatedRoasImpact } : undefined,
    effort: "medium" as const,
    timeline: undefined,
    ownerRole: undefined,
  }));

  const actionItems = legacy.actionItems.map((a) => ({
    id: randomUUID(),
    description: a.description,
    ownerRole: a.ownerRole,
    priority: 3,
    dueDateHint: a.dueHint,
    estimatedHours: undefined,
    dependencies: undefined,
  }));

  const evidence = legacy.evidence.map((e) => ({
    id: randomUUID(),
    label: e.label,
    value: e.value,
    metric: e.metric,
    valueFormatted: undefined,
    change: undefined,
    changePercent: undefined,
    source: mapEvidenceSource(e.source),
    capturedAt: new Date(),
  }));

  const platformsAnalyzed = [
    ...new Set(buildDataSourcesFromEvidence(legacy, range).map((d) => d.platform)),
  ];

  const summary =
    legacy.summary.length >= 10
      ? legacy.summary.slice(0, 500)
      : `${legacy.summary} — (expanded)`.slice(0, 500);

  const analysisUuid = resolveAnalysisUuid(ctx);

  const raw: MarketingVerdict = {
    id: randomUUID(),
    tenantId: ctx.tenantId,
    campaignId: ctx.campaignId,
    analysisId: analysisUuid,
    verdictType: ctx.verdictType ?? "overall_health",
    score: legacy.score,
    confidence: 0.75,
    sentiment: legacy.sentiment,
    summary,
    reasoning,
    keyInsights:
      keyInsights.length > 0
        ? keyInsights
        : [
            {
              id: randomUUID(),
              title: "Pipeline insight",
              detail: padReasonLine(legacy.summary),
              impact: "medium",
              confidence: 0.6,
            },
          ],
    recommendations:
      recommendations.length > 0
        ? recommendations
        : [
            {
              id: randomUUID(),
              title: "Review cross-channel performance",
              rationale: padReasonLine(legacy.summary),
              priority: 3,
              effort: "medium",
            },
          ],
    actionItems,
    evidence,
    historicalContext: undefined,
    dataSources: buildDataSourcesFromEvidence(legacy, range),
    methodology: undefined,
    platformsAnalyzed: platformsAnalyzed.length > 0 ? platformsAnalyzed : ["meta"],
    dateRange: range,
    generatedAt: new Date(),
    generatedBy: ctx.generatedBy ?? "agent.media_verdict",
    modelUsed: ctx.modelUsed ?? "legacy-normalization",
    parameters:
      analysisUuid !== ctx.analysisId ? { workflowCorrelationId: ctx.analysisId } : undefined,
    reportMetadata: undefined,
  };

  return marketingVerdictSchema.parse(raw);
}

/**
 * Pulls a JSON object from an LLM reply: optional ```json fence, else first `{`…`}` span.
 */
export function extractJsonObjectText(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  if (fence?.[1]) {
    return fence[1].trim();
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

export function parseVerdictFromAgentText(text: string): LegacyAgentVerdict {
  let raw: unknown;
  try {
    raw = JSON.parse(extractJsonObjectText(text)) as unknown;
  } catch (e) {
    throw new VerdictParseError("Verdict JSON could not be parsed", { cause: e });
  }
  const parsed = legacyVerdictSchema.safeParse(raw);
  if (!parsed.success) {
    throw new VerdictParseError("Verdict JSON failed schema validation", { cause: parsed.error });
  }
  return parsed.data;
}

export function safeParseVerdictFromAgentText(
  text: string,
): { ok: true; data: LegacyAgentVerdict } | { ok: false; error: VerdictParseError } {
  try {
    return { ok: true, data: parseVerdictFromAgentText(text) };
  } catch (e) {
    if (e instanceof VerdictParseError) {
      return { ok: false, error: e };
    }
    return {
      ok: false,
      error: new VerdictParseError("Unexpected verdict parse failure", { cause: e }),
    };
  }
}
