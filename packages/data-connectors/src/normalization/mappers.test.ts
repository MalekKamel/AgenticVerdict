import { describe, expect, it } from "vitest";

import {
  applySpendCurrencyConversion,
  convertAmountToUsd,
  DEFAULT_FX_RATES_TO_USD,
  normalizeCardinalityMetricValue,
  standardizeDimensions,
} from "./mappers";

describe("convertAmountToUsd", () => {
  it("converts EUR and GBP using the default table", () => {
    expect(convertAmountToUsd(100, "EUR", DEFAULT_FX_RATES_TO_USD)).toBeCloseTo(108, 5);
    expect(convertAmountToUsd(50, "gbp", DEFAULT_FX_RATES_TO_USD)).toBeCloseTo(63.5, 5);
    expect(convertAmountToUsd(1000, "SAR", DEFAULT_FX_RATES_TO_USD)).toBeCloseTo(267, 5);
  });

  it("returns the input when currency is unknown", () => {
    expect(convertAmountToUsd(99, "ZZZ", DEFAULT_FX_RATES_TO_USD)).toBe(99);
  });
});

describe("standardizeDimensions", () => {
  it("lowercases keys, trims values, and collapses whitespace", () => {
    expect(
      standardizeDimensions({
        " Campaign Name ": "  Foo   Bar ",
        ENTITY: "x",
      }),
    ).toEqual({
      campaign_name: "Foo Bar",
      entity: "x",
    });
  });

  it("returns undefined for empty input", () => {
    expect(standardizeDimensions(undefined)).toBeUndefined();
  });
});

describe("normalizeCardinalityMetricValue", () => {
  it("rounds count-like metrics and clamps negatives to zero", () => {
    expect(normalizeCardinalityMetricValue("meta.impressions", 10.4)).toBe(10);
    expect(normalizeCardinalityMetricValue("meta.clicks", -3)).toBe(0);
    expect(normalizeCardinalityMetricValue("ga4.event.eventCount", 2.7)).toBe(3);
  });

  it("leaves non-count metrics untouched", () => {
    expect(normalizeCardinalityMetricValue("meta.spend", 12.34)).toBe(12.34);
  });
});

describe("applySpendCurrencyConversion", () => {
  it("is a no-op for USD and adds dimensions when absent", () => {
    const row = {
      metricKey: "meta.spend",
      value: 10,
      capturedAt: "t",
    } as const;
    const same = applySpendCurrencyConversion([row], { defaultCurrency: "USD" });
    expect(same[0]).toBe(row);
    const withDims = applySpendCurrencyConversion(
      [{ metricKey: "meta.spend", value: 20, dimensions: { currency: "USD" }, capturedAt: "t" }],
      {},
    );
    expect(withDims[0]).toBeDefined();
    expect(withDims[0]!.value).toBe(20);
  });

  it("converts spend-like keys and stamps USD in dimensions", () => {
    const out = applySpendCurrencyConversion(
      [
        {
          metricKey: "meta.spend",
          value: 100,
          dimensions: { currency: "EUR" },
          capturedAt: "t",
        },
      ],
      {},
    );
    expect(out[0]!.value).toBeCloseTo(108, 5);
    expect(out[0]!.dimensions?.currency).toBe("USD");
  });
});
