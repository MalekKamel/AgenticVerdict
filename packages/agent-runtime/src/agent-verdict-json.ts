import { createHash } from "node:crypto";

import type { MarketingVerdict } from "@agenticverdict/types";
import { marketingVerdictSchema } from "@agenticverdict/types";
import { z } from "zod";

import { VerdictParseError } from "./verdict-schema";

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

/** When `workflowId` is not a UUID, derive a deterministic analysis id (legacy pipeline behavior). */
export function resolveWorkflowAnalysisUuid(tenantId: string, workflowId: string): string {
  const asUuid = z.string().uuid().safeParse(workflowId);
  if (asUuid.success) {
    return asUuid.data;
  }
  const h32 = createHash("sha256").update(`${tenantId}\n${workflowId}`).digest("hex").slice(0, 32);
  return `${h32.slice(0, 8)}-${h32.slice(8, 12)}-4${h32.slice(13, 16)}-a${h32.slice(17, 20)}-${h32.slice(20, 32)}`;
}

/**
 * Parses and validates unified {@link MarketingVerdict} JSON from raw LLM output.
 */
export function parseMarketingVerdictFromAgentText(text: string): MarketingVerdict {
  let raw: unknown;
  try {
    raw = JSON.parse(extractJsonObjectText(text)) as unknown;
  } catch (e) {
    throw new VerdictParseError("Verdict JSON could not be parsed", { cause: e });
  }
  const parsed = marketingVerdictSchema.safeParse(raw);
  if (!parsed.success) {
    throw new VerdictParseError("Verdict JSON failed schema validation", { cause: parsed.error });
  }
  return parsed.data;
}

export function safeParseMarketingVerdictFromAgentText(
  text: string,
): { ok: true; data: MarketingVerdict } | { ok: false; error: VerdictParseError } {
  try {
    return { ok: true, data: parseMarketingVerdictFromAgentText(text) };
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

/**
 * Applies server-side tenant and analysis identifiers after LLM parse (tenant isolation).
 */
export function applyMarketingVerdictPipelineContext(
  verdict: MarketingVerdict,
  ctx: { tenantId: string; analysisId: string },
): MarketingVerdict {
  return marketingVerdictSchema.parse({
    ...verdict,
    tenantId: ctx.tenantId,
    analysisId: ctx.analysisId,
  });
}
