import JSZip from "jszip";

/**
 * Validates that bytes look like a DOCX package (OOXML OPC: ZIP + core parts).
 */
export async function assertDocxOoxmlPackage(bytes: Uint8Array): Promise<void> {
  const zip = await JSZip.loadAsync(Buffer.from(bytes));
  const ct = zip.file("[Content_Types].xml");
  const rels = zip.file("_rels/.rels");
  const docXml = zip.file("word/document.xml");
  const missing: string[] = [];
  if (!ct) missing.push("[Content_Types].xml");
  if (!rels) missing.push("_rels/.rels");
  if (!docXml) missing.push("word/document.xml");
  if (missing.length > 0) {
    throw new Error(`DOCX missing OOXML parts: ${missing.join(", ")}`);
  }
}

/**
 * Asserts raw substrings appear in `word/document.xml` (escaped text as stored by generators).
 */
export async function assertDocxDocumentXmlContains(
  bytes: Uint8Array,
  substrings: readonly string[],
): Promise<void> {
  await assertDocxOoxmlPackage(bytes);
  const zip = await JSZip.loadAsync(Buffer.from(bytes));
  const docFile = zip.file("word/document.xml");
  if (!docFile) {
    throw new Error("word/document.xml missing after package validation");
  }
  const raw = await docFile.async("string");
  for (const s of substrings) {
    if (!raw.includes(s)) {
      throw new Error(`word/document.xml did not contain ${JSON.stringify(s)}`);
    }
  }
}
