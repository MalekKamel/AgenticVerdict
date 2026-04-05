import { describe, expect, it } from "vitest";

import {
  renderBarChartSvg,
  renderLineChartSvg,
  renderPieChartSvg,
  renderScatterChartSvg,
} from "./charts";

describe("chart SVG helpers", () => {
  it("renders bar chart rects for each series point", () => {
    const svg = renderBarChartSvg("Spend", [
      { label: "A", value: 10 },
      { label: "B", value: 20 },
    ]);
    expect(svg).toContain("Spend");
    expect(svg).toContain("<rect");
    expect(svg).toContain("A: 10");
  });

  it("renders line chart polyline when at least two points", () => {
    const svg = renderLineChartSvg("Trend", [
      { label: "d1", value: 1 },
      { label: "d2", value: 3 },
    ]);
    expect(svg).toContain("<polyline");
  });

  it("renders pie slices", () => {
    const svg = renderPieChartSvg("Mix", [
      { label: "x", value: 40 },
      { label: "y", value: 60 },
    ]);
    expect(svg).toContain("<path");
  });

  it("renders scatter circles", () => {
    const svg = renderScatterChartSvg("Corr", [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
    ]);
    expect(svg).toContain("<circle");
  });

  it("escapes chart title for XSS safety", () => {
    const svg = renderBarChartSvg("<script>", []);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });
});
