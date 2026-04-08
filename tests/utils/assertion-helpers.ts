const PDF_MAGIC = "%PDF";

/** True if the buffer begins with a PDF file signature. */
export function assertPdfMagic(bytes: Uint8Array): void {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 4));
  if (head !== PDF_MAGIC) {
    throw new Error(`Expected PDF magic ${PDF_MAGIC}, got ${JSON.stringify(head)}`);
  }
}

const ARABIC_RE = /[\u0600-\u06FF]/u;

export function assertContainsArabicScript(text: string, message?: string): void {
  if (!ARABIC_RE.test(text)) {
    throw new Error(message ?? "Expected Arabic script in extracted text");
  }
}

export interface PdfSizeExpectations {
  readonly minByteLength?: number;
}

export function assertPdfByteLength(
  bytes: Uint8Array,
  expectations: PdfSizeExpectations = {},
): void {
  assertPdfMagic(bytes);
  const minLen = expectations.minByteLength ?? 400;
  if (bytes.length < minLen) {
    throw new Error(`PDF smaller than expected (${bytes.length} < ${minLen})`);
  }
}
