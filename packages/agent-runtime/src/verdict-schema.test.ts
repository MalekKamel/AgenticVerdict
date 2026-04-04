import { describe, expect, it } from "vitest";

import {
  extractJsonObjectText,
  parseVerdictFromAgentText,
  safeParseVerdictFromAgentText,
  VerdictParseError,
} from "./verdict-schema";

const MINIMAL_VERDICT_JSON = `{
  "summary": "Channels are balanced with Meta leading efficiency.",
  "sentiment": "positive",
  "score": 78,
  "keyInsights": [{ "id": "k1", "title": "Efficiency", "detail": "Meta ROAS ahead of GA4-assisted view." }],
  "recommendations": [{ "title": "Reallocate 10% to Meta prospecting", "rationale": "Strong marginal ROAS" }],
  "actionItems": [{ "description": "Refresh creative on underperforming ad sets", "ownerRole": "performance_marketing" }],
  "evidence": [{ "label": "Blended ROAS", "metric": "roas", "value": "3.2", "source": "meta" }],
  "nextSteps": ["Validate incrementality test readout"]
}`;

describe("verdict-schema", () => {
  it("extractJsonObjectText handles fenced JSON", () => {
    const raw = `Here you go:\n\`\`\`json\n${MINIMAL_VERDICT_JSON}\n\`\`\`\n`;
    expect(extractJsonObjectText(raw)).toContain('"summary"');
  });

  it("parseVerdictFromAgentText validates a minimal verdict", () => {
    const v = parseVerdictFromAgentText(MINIMAL_VERDICT_JSON);
    expect(v.sentiment).toBe("positive");
    expect(v.score).toBe(78);
    expect(v.keyInsights[0]?.id).toBe("k1");
  });

  it("safeParseVerdictFromAgentText returns error on invalid JSON", () => {
    const r = safeParseVerdictFromAgentText("not json");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBeInstanceOf(VerdictParseError);
    }
  });

  it("parseVerdictFromAgentText rejects out-of-range score", () => {
    const bad = MINIMAL_VERDICT_JSON.replace('"score": 78', '"score": 101');
    expect(() => parseVerdictFromAgentText(bad)).toThrow(VerdictParseError);
  });
});
