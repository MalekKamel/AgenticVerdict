import { describe, it } from "vitest";

import { assertArabicStructuralLocaleQuality } from "./arabic-locale-quality";

describe("Arabic structural CI gate", () => {
  it("passes for checked-in locale bundles", () => {
    assertArabicStructuralLocaleQuality("en");
  });
});
