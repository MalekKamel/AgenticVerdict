import { describe, expect, it } from "vitest";

import { parseTelemetrySampleRate } from "./telemetry-sampling";

describe("parseTelemetrySampleRate", () => {
  it("defaults to 1 for empty or invalid", () => {
    expect(parseTelemetrySampleRate(undefined)).toBe(1);
    expect(parseTelemetrySampleRate("")).toBe(1);
    expect(parseTelemetrySampleRate("  ")).toBe(1);
    expect(parseTelemetrySampleRate("nan")).toBe(1);
    expect(parseTelemetrySampleRate("-1")).toBe(1);
    expect(parseTelemetrySampleRate("2")).toBe(1);
  });

  it("parses valid fractions", () => {
    expect(parseTelemetrySampleRate("0")).toBe(0);
    expect(parseTelemetrySampleRate("0.25")).toBe(0.25);
    expect(parseTelemetrySampleRate("1")).toBe(1);
    expect(parseTelemetrySampleRate(" 0.5 ")).toBe(0.5);
  });
});
