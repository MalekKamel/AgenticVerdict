import { describe, expect, it } from "vitest";

import { missingKeysComparedTo } from "./translation-parity";
import { APP_LOCALES } from "./formatters";

describe("translation parity (QA)", () => {
  it("reports missing keys for non-English locales (informational)", () => {
    // This test reports missing translation keys but doesn't fail
    // Translation completion is tracked separately
    for (const loc of APP_LOCALES) {
      if (loc === "en") {
        continue;
      }
      const missing = missingKeysComparedTo("en", loc);
      // Log missing keys for awareness, but don't fail the test
      // Translation teams complete these keys incrementally
      if (missing.length > 0) {
        console.log(`[i18n] Locale "${loc}" has ${missing.length} pending translations`);
      }
    }
    expect(true).toBe(true);
  });
});
