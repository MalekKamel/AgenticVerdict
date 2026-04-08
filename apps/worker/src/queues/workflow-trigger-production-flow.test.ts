import { describe, expect, it } from "vitest";

import { parseMainShellAttributes } from "./workflow-trigger-production-flow";

describe("parseMainShellAttributes", () => {
  it("reads dir and lang from R01-style marketing HTML", () => {
    const html = `<main class="report-two-column" dir="ltr" lang="en"><h1>x</h1></main>`;
    expect(parseMainShellAttributes(html)).toEqual({ dir: "ltr", lang: "en" });
  });

  it("reads dir and lang from R02-style marketing HTML", () => {
    const html = `<main dir="rtl" lang="ar"><p>y</p></main>`;
    expect(parseMainShellAttributes(html)).toEqual({ dir: "rtl", lang: "ar" });
  });

  it("returns nulls when main is missing", () => {
    expect(parseMainShellAttributes("<div>no main</div>")).toEqual({
      dir: null,
      lang: null,
    });
  });
});
