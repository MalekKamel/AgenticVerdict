import { describe, it } from "vitest";

import { APP_LOCALES } from "./formatters";
import { assertStructuralLocaleQuality, targetLocales } from "./locale-quality";

describe("Locale structural CI gate", () => {
  it.each(targetLocales())("passes structural checks for locale '%s'", (locale) => {
    assertStructuralLocaleQuality(locale, "en");
  });

  it("passes for all checked-in locale bundles", () => {
    for (const locale of APP_LOCALES) {
      if (locale === "en") continue;
      assertStructuralLocaleQuality(locale, "en");
    }
  });
});
