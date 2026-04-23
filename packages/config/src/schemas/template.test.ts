import { describe, expect, it } from "vitest";

import {
  exportTemplateConfigJsonSchema,
  templateComponentSpecSchema,
  templateConfigSchema,
  templateInheritanceSchema,
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
          name: "tenantName",
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
        allowedVariables: ["tenantName"],
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

  it("rejects unsorted section ordering", () => {
    const s2 = templateSectionSchema.parse({
      id: "55555555-5555-4555-8555-555555555555",
      type: "content",
      order: 1,
    });
    const r = templateConfigSchema.safeParse({
      id: "66666666-6666-4666-8666-666666666666",
      name: "Unordered",
      version: "1.0.0",
      type: "detailed-analysis",
      sections: [s2, section],
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
    expect(r.success).toBe(false);
  });

  it("validates component spec and inheritance blocks", () => {
    const component = templateComponentSpecSchema.parse({
      id: "kpi-overview",
      type: "kpi-grid",
      sectionId: "11111111-1111-4111-8111-111111111111",
      bindings: [{ source: "verdict", path: "score.overall", required: true }],
      order: 0,
    });
    const inheritance = templateInheritanceSchema.parse({
      extendsTemplateId: "77777777-7777-4777-8777-777777777777",
      mode: "merge",
      sectionOverrides: [section],
    });
    const parsed = templateConfigSchema.parse({
      id: "88888888-8888-4888-8888-888888888888",
      name: "Derived Template",
      version: "2.1.0",
      type: "custom",
      sections: [section],
      components: [component],
      inheritance,
      styling: {},
      variables: [],
      branding: { colors: ["#101010"], fonts: ["Inter"] },
      validation: {
        requiredSections: ["header"],
        allowedVariables: ["score"],
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "tester",
      },
    });
    expect(parsed.components?.[0]?.type).toBe("kpi-grid");
    expect(parsed.inheritance?.mode).toBe("merge");
  });

  it("rejects inheritance pointing to self", () => {
    const r = templateConfigSchema.safeParse({
      id: "99999999-9999-4999-8999-999999999999",
      name: "Self Derived",
      version: "1.0.0",
      type: "custom",
      sections: [section],
      inheritance: {
        extendsTemplateId: "99999999-9999-4999-8999-999999999999",
        mode: "merge",
      },
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
        createdBy: "tester",
      },
    });
    expect(r.success).toBe(false);
  });

  it("exports a JSON schema document", () => {
    const doc = exportTemplateConfigJsonSchema();
    expect(typeof doc).toBe("object");
    const defs = doc.definitions as Record<string, { properties?: unknown }> | undefined;
    expect(defs?.TemplateConfig?.properties).toBeDefined();
  });
});
