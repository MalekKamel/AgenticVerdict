import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { assertPdfStructure } from "./pdf-structure";

describe("assertPdfStructure", () => {
  it("accepts a single-page pdf-lib document", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const bytes = new Uint8Array(await doc.save());
    await expect(assertPdfStructure(bytes, { minPages: 1 })).resolves.toBeUndefined();
  });

  it("rejects when minPages is not met", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const bytes = new Uint8Array(await doc.save());
    await expect(assertPdfStructure(bytes, { minPages: 2 })).rejects.toThrow(/at least 2 page/);
  });
});
