import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { assertDocxDocumentXmlContains, assertDocxOoxmlPackage } from "./docx-ooxml";

async function minimalDocxBytes(bodyXml: string): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.file("word/document.xml", bodyXml);
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  return new Uint8Array(buf);
}

describe("docx OOXML helpers", () => {
  it("assertDocxOoxmlPackage accepts a minimal OPC layout", async () => {
    const bytes = await minimalDocxBytes(
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hi</w:t></w:r></w:p></w:body></w:document>',
    );
    await expect(assertDocxOoxmlPackage(bytes)).resolves.toBeUndefined();
  });

  it("assertDocxDocumentXmlContains finds substrings", async () => {
    const bytes = await minimalDocxBytes(
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Quarterly review</w:t></w:r></w:p></w:body></w:document>',
    );
    await expect(
      assertDocxDocumentXmlContains(bytes, ["Quarterly review"]),
    ).resolves.toBeUndefined();
  });

  it("assertDocxOoxmlPackage rejects random bytes", async () => {
    await expect(assertDocxOoxmlPackage(new Uint8Array([1, 2, 3]))).rejects.toThrow();
  });
});
