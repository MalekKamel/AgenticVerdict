import { createRequire } from "node:module";

import { assertContainsArabicScript, assertPdfByteLength } from "./assertion-helpers";

const require = createRequire(import.meta.url);
// pdf-parse is CJS; avoid static import so Vitest does not bundle a broken ESM graph for R01.
const pdfParse = require("pdf-parse") as (b: Buffer) => Promise<{ text?: string }>;

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const buf = Buffer.from(bytes);
  const data = await pdfParse(buf);
  return data.text ?? "";
}

export interface PdfScenarioExpectations {
  readonly minByteLength?: number;
  readonly expectArabic?: boolean;
  /** Each phrase must appear in the extracted PDF text layer (requires pdf-parse). */
  readonly mustContainText?: readonly string[];
}

export async function validatePdfBytes(
  bytes: Uint8Array,
  expectations: PdfScenarioExpectations = {},
): Promise<void> {
  assertPdfByteLength(bytes, { minByteLength: expectations.minByteLength ?? 400 });
  const phrases = expectations.mustContainText ?? [];
  const needsText =
    Boolean(expectations.expectArabic) || (Array.isArray(phrases) && phrases.length > 0);
  if (needsText) {
    const text = await extractPdfText(bytes);
    if (expectations.expectArabic) {
      assertContainsArabicScript(text, "Arabic glyphs not found in PDF text layer");
    }
    for (const phrase of phrases) {
      if (!text.includes(phrase)) {
        throw new Error(`Expected PDF text to contain ${JSON.stringify(phrase)}`);
      }
    }
  }
}
