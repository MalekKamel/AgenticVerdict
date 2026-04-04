import { describe, expect, it } from "vitest";

import {
  exportTemplateConfigJsonSchema,
  templateConfigSchema,
  templateSectionSchema,
} from "./template";

const section = templateSectionSchema.parse({
  id: "11111111-1111-4111-8111-111111111111",
  type: "header",
  order: 0,
});

describe("templateConfigSchema", () => {
  it("validates a complete template config", () => {
    const parsed = templateConfigSchema.parse({
      id: "22222222-2222-4222-8222-222222222222",
      name: "Executive Q1",
      version: "1.0.0",
      type: "executive-summary",
      sections: [section],
      styling: {},
      variables: [
        {
          name: "companyName",
          type: "string",
          required: true,
        },
      ],
      branding: {
        colors: ["#111111"],
        fonts: ["Inter"],
      },
      validation: {
        requiredSections: ["header"],
        allowedVariables: ["companyName"],
      },
      metadata: {
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        createdBy: "system",
      },
    });
    expect(parsed.name).toBe("Executive Q1");
    expect(parsed.sections).toHaveLength(1);
  });

  it("requires id and name", () => {
    const r = templateConfigSchema.safeParse({
      id: "not-a-uuid",
      name: "",
      version: "1.0.0",
      type: "executive-summary",
      sections: [section],
      styling: {},
      variables: [],
      branding: { colors: ["#000000"], fonts: ["Inter"] },
      validation: {
        requiredSections: ["header"],
        allowedVariables: ["x"],
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "u",
      },
    });
    expect(r.success).toBe(false);
  });

  it("validates monotonic section ordering via section order field", () => {
    const s2 = templateSectionSchema.parse({
      id: "33333333-3333-4333-8333-333333333333",
      type: "content",
      order: 1,
    });
    const parsed = templateConfigSchema.parse({
      id: "44444444-4444-4444-8444-444444444444",
      name: "Ordered",
      version: "2.0.0",
      type: "detailed-analysis",
      sections: [section, s2],
      styling: {},
      variables: [],
      branding: { colors: ["#FFFFFF"], fonts: ["Inter"] },
      validation: {
        requiredSections: ["header", "content"],
        allowedVariables: ["a"],
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "tester",
      },
    });
    expect(parsed.sections.map((s) => s.order)).toEqual([0, 1]);
  });

  it("exports a JSON schema document", () => {
    const doc = exportTemplateConfigJsonSchema();
    expect(typeof doc).toBe("object");
    const defs = doc.definitions as Record<string, { properties?: unknown }> | undefined;
    expect(defs?.TemplateConfig?.properties).toBeDefined();
  });
});
