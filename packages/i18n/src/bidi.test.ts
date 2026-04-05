import { describe, expect, it } from "vitest";

import { isolateLtrText, isolateRtlText, wrapHtmlDirAuto } from "./bidi";

describe("wrapHtmlDirAuto", () => {
  it("wraps content with dir=auto", () => {
    expect(wrapHtmlDirAuto("x&amp;y")).toContain('dir="auto"');
    expect(wrapHtmlDirAuto("x&amp;y")).toContain("x&amp;y");
  });
});

describe("unicode isolates", () => {
  it("embeds LTR and RTL isolates", () => {
    expect(isolateLtrText("SKU-12")).toMatch(/^\u2066/);
    expect(isolateLtrText("SKU-12")).toMatch(/\u2069$/);
    expect(isolateRtlText("مرحبا")).toMatch(/^\u2067/);
  });
});
