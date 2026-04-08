import { describe, expect, it } from "vitest";

import {
  createDefaultFormatRegistry,
  createStubFormatRegistry,
  FormatGeneratorRegistry,
  StubFormatGenerator,
} from "./format-registry";
import { HtmlDocxFormatGenerator } from "./docx-format-generator";
import { PlaywrightPdfFormatGenerator } from "./pdf-playwright-generator";
import type { FormatGeneratorInput } from "./types";
import { ExcelXlsxFormatGenerator } from "./xlsx-format-generator";

describe("FormatGeneratorRegistry", () => {
  it("resolves stub registry formats", () => {
    const r = createStubFormatRegistry();
    expect(r.registeredFormats().sort()).toEqual(["docx", "pdf", "xlsx"]);
    expect(r.get("pdf").format).toBe("pdf");
  });

  it("default registry uses Playwright PDF and HTML DOCX when stubs env is unset", () => {
    const prev = process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS;
    delete process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS;
    try {
      const r = createDefaultFormatRegistry();
      expect(r.get("pdf")).toBeInstanceOf(PlaywrightPdfFormatGenerator);
      expect(r.get("docx")).toBeInstanceOf(HtmlDocxFormatGenerator);
      expect(r.get("xlsx")).toBeInstanceOf(ExcelXlsxFormatGenerator);
    } finally {
      if (prev === undefined) {
        delete process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS;
      } else {
        process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS = prev;
      }
    }
  });

  it("default registry uses stubs when AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS=1", () => {
    const prev = process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS;
    process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS = "1";
    try {
      const r = createDefaultFormatRegistry();
      expect(r.get("pdf")).toBeInstanceOf(StubFormatGenerator);
      expect(r.get("docx")).toBeInstanceOf(StubFormatGenerator);
    } finally {
      if (prev === undefined) {
        delete process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS;
      } else {
        process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS = prev;
      }
    }
  });

  it("throws when format is missing", () => {
    const r = new FormatGeneratorRegistry();
    expect(() => r.get("pdf")).toThrow(/No format generator/);
  });

  it("stub generator encodes context in output", async () => {
    const gen = new StubFormatGenerator("pdf");
    const input: FormatGeneratorInput = {
      context: {
        tenantId: "t1",
        reportId: "r1",
        locale: "en",
        templateId: "exec-summary",
      },
      model: { ok: true },
      renderedTemplate: "<html/>",
    };
    const out = new TextDecoder().decode(await gen.generate(input));
    expect(out).toContain("format=pdf");
    expect(out).toContain("tenant=t1");
    expect(out).toContain("renderedBytes=7");
  });
});
