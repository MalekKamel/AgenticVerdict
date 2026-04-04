import { z } from "zod";

/** Single insight referenced from a media verdict (tasks.md 6.3). */
export const marketingInsightSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  detail: z.string().min(1),
  impact: z.enum(["high", "medium", "low"]).optional(),
  /** 0–1 confidence for evidence strength language. */
  confidence: z.number().min(0).max(1).optional(),
});

export const verdictRecommendationSchema = z.object({
  title: z.string().min(1),
  rationale: z.string().min(1),
  priority: z.number().int().min(1).max(5).optional(),
  estimatedRoasImpact: z.number().finite().optional(),
});

export const verdictActionItemSchema = z.object({
  description: z.string().min(1),
  /** Role label only — no personal names (PII). */
  ownerRole: z.string().min(1),
  dueHint: z.string().optional(),
});

export const verdictEvidenceSchema = z.object({
  label: z.string().min(1),
  metric: z.string().optional(),
  value: z.string().optional(),
  source: z.enum(["meta", "ga4", "gsc", "gbp", "tiktok", "internal", "unknown"]).optional(),
});

/**
 * Structured media verdict for Phase 3 consumers and contract tests (tasks.md 6.3).
 */
export const verdictSchema = z.object({
  summary: z.string().min(1),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  score: z.number().min(0).max(100),
  keyInsights: z.array(marketingInsightSchema).default([]),
  recommendations: z.array(verdictRecommendationSchema).default([]),
  actionItems: z.array(verdictActionItemSchema).default([]),
  evidence: z.array(verdictEvidenceSchema).default([]),
  nextSteps: z.array(z.string().min(1)).default([]),
});

export type MarketingInsight = z.infer<typeof marketingInsightSchema>;
export type VerdictRecommendation = z.infer<typeof verdictRecommendationSchema>;
export type VerdictActionItem = z.infer<typeof verdictActionItemSchema>;
export type VerdictEvidence = z.infer<typeof verdictEvidenceSchema>;
export type Verdict = z.infer<typeof verdictSchema>;

export class VerdictParseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "VerdictParseError";
  }
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

export function parseVerdictFromAgentText(text: string): Verdict {
  let raw: unknown;
  try {
    raw = JSON.parse(extractJsonObjectText(text)) as unknown;
  } catch (e) {
    throw new VerdictParseError("Verdict JSON could not be parsed", { cause: e });
  }
  const parsed = verdictSchema.safeParse(raw);
  if (!parsed.success) {
    throw new VerdictParseError("Verdict JSON failed schema validation", { cause: parsed.error });
  }
  return parsed.data;
}

export function safeParseVerdictFromAgentText(
  text: string,
): { ok: true; data: Verdict } | { ok: false; error: VerdictParseError } {
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
