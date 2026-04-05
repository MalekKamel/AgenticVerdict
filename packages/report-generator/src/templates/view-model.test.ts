import { describe, expect, it } from "vitest";

import { escapeHtml } from "../html-utils";
import { coerceReportTemplateViewModel, safeSectionBody } from "./view-model";

describe("coerceReportTemplateViewModel", () => {
  it("applies defaults for empty input", () => {
    const m = coerceReportTemplateViewModel(null);
    expect(m.title).toBe("Report");
    expect(m.metrics.columns).toEqual([]);
  });

  it("parses nested structures defensively", () => {
    const m = coerceReportTemplateViewModel({
      title: "X",
      narrativeSections: [{ id: "a", heading: "H", bodyText: "txt" }],
      metrics: { columns: ["c"], rows: [{ c: 1, bad: {} }] },
      charts: [{ kind: "bar", title: "C", series: [{ label: "L", value: 2 }] }],
    });
    expect(m.narrativeSections).toHaveLength(1);
    expect(m.metrics.rows[0]).toEqual({ c: 1 });
    expect(m.charts[0]?.kind).toBe("bar");
  });
});

describe("safeSectionBody", () => {
  it("allows bodyHtml only when it matches escaped bodyText", () => {
    const bodyText = "a<b>c";
    const escaped = escapeHtml(bodyText).replace(/\n/g, "<br/>");
    const out = safeSectionBody({
      id: "1",
      heading: "h",
      bodyText,
      bodyHtml: escaped,
    });
    expect(out).toBe(escaped);
  });

  it("rejects mismatched bodyHtml (injection attempt)", () => {
    const out = safeSectionBody({
      id: "1",
      heading: "h",
      bodyText: "ok",
      bodyHtml: "<img src=x onerror=alert(1)>",
    });
    expect(out).toBe("ok");
    expect(out).not.toContain("<img");
  });
});
