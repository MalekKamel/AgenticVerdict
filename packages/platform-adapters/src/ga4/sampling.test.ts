import { describe, expect, it } from "vitest";

import type { Ga4RunReportResponse } from "./models";
import { isRunReportSampled, mergeSamplingFlags } from "./sampling";

describe("isRunReportSampled", () => {
  it("returns false for empty metadata", () => {
    expect(isRunReportSampled({})).toBe(false);
    expect(isRunReportSampled({ metadata: {} })).toBe(false);
  });

  it("detects dataLossFromOtherReason", () => {
    expect(isRunReportSampled({ metadata: { dataLossFromOtherReason: true } })).toBe(true);
  });

  it("detects samplingMetadatas with read < space", () => {
    const r: Ga4RunReportResponse = {
      metadata: {
        samplingMetadatas: [{ samplesReadCount: "10", samplingSpaceSize: "100" }],
      },
    };
    expect(isRunReportSampled(r)).toBe(true);
  });

  it("treats equal read and space as not sampled", () => {
    const r: Ga4RunReportResponse = {
      metadata: {
        samplingMetadatas: [{ samplesReadCount: "100", samplingSpaceSize: "100" }],
      },
    };
    expect(isRunReportSampled(r)).toBe(false);
  });
});

describe("mergeSamplingFlags", () => {
  it("is true if any report is sampled", () => {
    const a: Ga4RunReportResponse = {};
    const b: Ga4RunReportResponse = {
      metadata: { dataLossFromOtherReason: true },
    };
    expect(mergeSamplingFlags([a, b])).toBe(true);
    expect(mergeSamplingFlags([a])).toBe(false);
  });
});
