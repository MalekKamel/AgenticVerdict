import { describe, expect, it } from "vitest";

import {
  applyVerdictPipelineContext,
  extractJsonObjectText,
  getVerdictParseFailureDetails,
  parseVerdictFromAgentText,
  safeParseVerdictFromAgentText,
} from "./agent-verdict-json";
import { buildVerdictFixture } from "./test-utils/verdict-fixtures";
import { VerdictParseError } from "@agenticverdict/types";

const TENANT = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const ANALYSIS = "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("agent-verdict-json", () => {
  it("extractJsonObjectText handles fenced JSON", () => {
    const inner = JSON.stringify(
      buildVerdictFixture({
        tenantId: TENANT,
        analysisId: ANALYSIS,
        overrides: { summary: "Executive summary long enough for schema minimum length rules." },
      }),
    );
    const raw = `Here you go:\n\`\`\`json\n${inner}\n\`\`\`\n`;
    expect(extractJsonObjectText(raw)).toContain('"verdictType"');
  });

  it("parseVerdictFromAgentText validates a minimal fixture", () => {
    const json = JSON.stringify(
      buildVerdictFixture({
        tenantId: TENANT,
        analysisId: ANALYSIS,
      }),
    );
    const v = parseVerdictFromAgentText(json);
    expect(v.sentiment).toBe("neutral");
    expect(v.score).toBe(72);
    expect(v.keyInsights[0]?.title).toBe("Channel efficiency");
  });

  it("safeParseVerdictFromAgentText returns error on invalid JSON", () => {
    const r = safeParseVerdictFromAgentText("not json");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBeInstanceOf(VerdictParseError);
    }
  });

  it("parseVerdictFromAgentText rejects out-of-range score", () => {
    const v = buildVerdictFixture({ tenantId: TENANT, analysisId: ANALYSIS });
    const bad = JSON.stringify({ ...v, score: 101 });
    expect(() => parseVerdictFromAgentText(bad)).toThrow(VerdictParseError);
  });

  it("rejects non-uuid nested IDs and reports failing fields", () => {
    const v = buildVerdictFixture({ tenantId: TENANT, analysisId: ANALYSIS });
    const bad = JSON.stringify({
      ...v,
      keyInsights: [{ ...v.keyInsights[0], id: "insight-001" }],
      recommendations: [{ ...v.recommendations[0], id: "rec-001" }],
      actionItems: [{ ...v.actionItems[0], id: "action-001" }],
      evidence: [{ ...v.evidence[0], id: "evi-001" }],
    });
    try {
      parseVerdictFromAgentText(bad);
      expect.unreachable("expected VerdictParseError");
    } catch (error) {
      expect(error).toBeInstanceOf(VerdictParseError);
      const details = getVerdictParseFailureDetails(error);
      expect(details.kind).toBe("schema");
      expect(details.fields).toContain("keyInsights.0.id");
      expect(details.fields).toContain("recommendations.0.id");
      expect(details.fields).toContain("actionItems.0.id");
      expect(details.fields).toContain("evidence.0.id");
    }
  });

  it("rejects enum case mismatches for sentiment and impact", () => {
    const v = buildVerdictFixture({ tenantId: TENANT, analysisId: ANALYSIS });
    const bad = JSON.stringify({
      ...v,
      sentiment: "Caution",
      keyInsights: [{ ...v.keyInsights[0], impact: "High" }],
    });
    expect(() => parseVerdictFromAgentText(bad)).toThrow(VerdictParseError);
  });

  it("rejects estimatedImpact string values", () => {
    const v = buildVerdictFixture({ tenantId: TENANT, analysisId: ANALYSIS });
    const bad = JSON.stringify({
      ...v,
      recommendations: [
        {
          ...v.recommendations[0],
          estimatedImpact: { roas: "+40%", cost: "5000 SAR" },
        },
      ],
    });
    expect(() => parseVerdictFromAgentText(bad)).toThrow(VerdictParseError);
  });

  it("applyVerdictPipelineContext overrides tenant and analysis ids", () => {
    const parsed = buildVerdictFixture({
      tenantId: TENANT,
      analysisId: ANALYSIS,
    });
    const v = applyVerdictPipelineContext(parsed, {
      tenantId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      analysisId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    });
    expect(v.tenantId).toBe("cccccccc-cccc-4ccc-8ccc-cccccccccccc");
    expect(v.analysisId).toBe("dddddddd-dddd-4ddd-8ddd-dddddddddddd");
  });
});
