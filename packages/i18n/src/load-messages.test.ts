import { describe, expect, it } from "vitest";

import { loadMessagesSync, resolveLocaleOrFallback } from "./load-messages";

describe("loadMessagesSync", () => {
  it("returns frozen dictionaries per locale", () => {
    const en = loadMessagesSync("en");
    expect(en["reports.title"]).toBe("Reports");
    expect(Object.isFrozen(en)).toBe(true);
    expect(loadMessagesSync("zh")["reports.download"]).toBe("下载");
  });
});

describe("resolveLocaleOrFallback", () => {
  it("accepts supported locales only", () => {
    expect(resolveLocaleOrFallback("en", "ar")).toBe("en");
    expect(resolveLocaleOrFallback("xx", "ar")).toBe("ar");
    expect(resolveLocaleOrFallback(undefined, "ar")).toBe("ar");
  });
});
