import { describe, expect, it } from "vitest";

import {
  applyMarketingVerdictPipelineContext,
  extractJsonObjectText,
  getVerdictParseFailureDetails,
  parseMarketingVerdictFromAgentText,
  safeParseMarketingVerdictFromAgentText,
} from "./agent-verdict-json";
import { buildMarketingVerdictFixture } from "./test-utils/marketing-verdict-fixtures";
import { VerdictParseError } from "./verdict-schema";

const TENANT = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
const ANALYSIS = "bbbbbbbb-bbbb-4ccc-dddd-eeeeeeeeeeee";

describe("agent-verdict-json", () => {
  it("extractJsonObjectText handles fenced JSON", () => {
    const inner = JSON.stringify(
      buildMarketingVerdictFixture({
        tenantId: TENANT,
        analysisId: ANALYSIS,
        overrides: { summary: "Executive summary long enough for schema minimum length rules." },
      }),
    );
    const raw = `Here you go:\n\`\`\`json\n${inner}\n\`\`\`\n`;
    expect(extractJsonObjectText(raw)).toContain('"verdictType"');
  });

  it("parseMarketingVerdictFromAgentText validates a minimal fixture", () => {
    const json = JSON.stringify(
      buildMarketingVerdictFixture({
        tenantId: TENANT,
        analysisId: ANALYSIS,
      }),
    );
    const v = parseMarketingVerdictFromAgentText(json);
    expect(v.sentiment).toBe("neutral");
    expect(v.score).toBe(72);
    expect(v.keyInsights[0]?.title).toBe("Channel efficiency");
  });

  it("safeParseMarketingVerdictFromAgentText returns error on invalid JSON", () => {
    const r = safeParseMarketingVerdictFromAgentText("not json");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBeInstanceOf(VerdictParseError);
    }
  });

  it("parseMarketingVerdictFromAgentText rejects out-of-range score", () => {
    const v = buildMarketingVerdictFixture({ tenantId: TENANT, analysisId: ANALYSIS });
    const bad = JSON.stringify({ ...v, score: 101 });
    expect(() => parseMarketingVerdictFromAgentText(bad)).toThrow(VerdictParseError);
  });

  it("rejects non-uuid nested IDs and reports failing fields", () => {
    const v = buildMarketingVerdictFixture({ tenantId: TENANT, analysisId: ANALYSIS });
    const bad = JSON.stringify({
      ...v,
      keyInsights: [{ ...v.keyInsights[0], id: "insight-001" }],
      recommendations: [{ ...v.recommendations[0], id: "rec-001" }],
      actionItems: [{ ...v.actionItems[0], id: "action-001" }],
      evidence: [{ ...v.evidence[0], id: "evi-001" }],
    });
    try {
      parseMarketingVerdictFromAgentText(bad);
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
    const v = buildMarketingVerdictFixture({ tenantId: TENANT, analysisId: ANALYSIS });
    const bad = JSON.stringify({
      ...v,
      sentiment: "Caution",
      keyInsights: [{ ...v.keyInsights[0], impact: "High" }],
    });
    expect(() => parseMarketingVerdictFromAgentText(bad)).toThrow(VerdictParseError);
  });

  it("rejects estimatedImpact string values", () => {
    const v = buildMarketingVerdictFixture({ tenantId: TENANT, analysisId: ANALYSIS });
    const bad = JSON.stringify({
      ...v,
      recommendations: [
        {
          ...v.recommendations[0],
          estimatedImpact: { roas: "+40%", cost: "5000 SAR" },
        },
      ],
    });
    expect(() => parseMarketingVerdictFromAgentText(bad)).toThrow(VerdictParseError);
  });

  it("applyMarketingVerdictPipelineContext overrides tenant and analysis ids", () => {
    const parsed = buildMarketingVerdictFixture({
      tenantId: TENANT,
      analysisId: ANALYSIS,
    });
    const v = applyMarketingVerdictPipelineContext(parsed, {
      tenantId: "cccccccc-cccc-4ccc-cccc-cccccccccccc",
      analysisId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    });
    expect(v.tenantId).toBe("cccccccc-cccc-4ccc-cccc-cccccccccccc");
    expect(v.analysisId).toBe("dddddddd-dddd-4ddd-8ddd-dddddddddddd");
  });
});
