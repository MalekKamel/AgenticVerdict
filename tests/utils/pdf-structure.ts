import { PDFDocument } from "pdf-lib";

export interface PdfStructureExpectations {
  /** Minimum inclusive page count (default 1). */
  readonly minPages?: number;
}

/**
 * Loads the PDF with pdf-lib and asserts basic structural expectations.
 * Complements text-layer checks from {@link extractPdfText} / pdf-parse.
 */
export async function assertPdfStructure(
  bytes: Uint8Array,
  expectations: PdfStructureExpectations = {},
): Promise<void> {
  const minPages = expectations.minPages ?? 1;
  const doc = await PDFDocument.load(Buffer.from(bytes), { ignoreEncryption: true });
  const n = doc.getPageCount();
  if (n < minPages) {
    throw new Error(`Expected PDF with at least ${minPages} page(s), found ${n}`);
  }
}
