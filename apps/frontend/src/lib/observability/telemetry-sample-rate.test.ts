import { describe, expect, it } from "vitest";

import { parseTelemetrySampleRate } from "./telemetry-sample-rate";

describe("parseTelemetrySampleRate", () => {
  it("defaults to 1 for empty or invalid", () => {
    expect(parseTelemetrySampleRate(undefined)).toBe(1);
    expect(parseTelemetrySampleRate("")).toBe(1);
    expect(parseTelemetrySampleRate("  ")).toBe(1);
    expect(parseTelemetrySampleRate("nan")).toBe(1);
    expect(parseTelemetrySampleRate("-0.1")).toBe(1);
    expect(parseTelemetrySampleRate("1.1")).toBe(1);
  });

  it("parses valid fractions", () => {
    expect(parseTelemetrySampleRate("0")).toBe(0);
    expect(parseTelemetrySampleRate("0.1")).toBe(0.1);
    expect(parseTelemetrySampleRate("1")).toBe(1);
  });
});
