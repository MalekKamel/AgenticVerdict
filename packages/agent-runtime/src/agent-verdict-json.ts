import { createHash } from "node:crypto";

import type { Verdict } from "@agenticverdict/types";
import { verdictSchema } from "@agenticverdict/types";
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
 * Parses and validates unified {@link Verdict} JSON from raw LLM output.
 */
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

export type VerdictParseFailureKind = "json" | "schema" | "unknown";

export interface VerdictParseFailureDetails {
  kind: VerdictParseFailureKind;
  fields: string[];
}

export function getVerdictParseFailureDetails(error: unknown): VerdictParseFailureDetails {
  if (!(error instanceof VerdictParseError)) {
    return { kind: "unknown", fields: [] };
  }
  const cause = error.cause;
  if (cause instanceof z.ZodError) {
    const fields = cause.issues
      .map((issue) => issue.path.join("."))
      .filter((field) => field.length > 0);
    return { kind: "schema", fields };
  }
  if (cause instanceof SyntaxError) {
    return { kind: "json", fields: [] };
  }
  return { kind: "unknown", fields: [] };
}

/**
 * Applies server-side tenant and analysis identifiers after LLM parse (tenant isolation).
 */
export function applyVerdictPipelineContext(
  verdict: Verdict,
  ctx: { tenantId: string; analysisId: string },
): Verdict {
  return verdictSchema.parse({
    ...verdict,
    tenantId: ctx.tenantId,
    analysisId: ctx.analysisId,
  });
}
