import { describe, expect, it } from "vitest";

import {
  countInclusiveUtcDays,
  splitInclusiveDateRange,
  trailingInclusiveWindow,
} from "./date-range-split";

describe("countInclusiveUtcDays", () => {
  it("throws on invalid date strings", () => {
    expect(() => countInclusiveUtcDays("not-a-date", "2024-01-01")).toThrow();
  });

  it("counts inclusive calendar days", () => {
    expect(countInclusiveUtcDays("2024-01-01", "2024-01-01")).toBe(1);
    expect(countInclusiveUtcDays("2024-01-01", "2024-01-03")).toBe(3);
  });

  it("returns 0 when end is before start", () => {
    expect(countInclusiveUtcDays("2024-02-01", "2024-01-01")).toBe(0);
  });
});

describe("splitInclusiveDateRange edge cases", () => {
  it("returns the original range when the span is zero days (inverted bounds)", () => {
    const r = { startInclusive: "2024-02-01", endInclusive: "2024-01-01" };
    expect(splitInclusiveDateRange(r, 365)).toEqual([r]);
  });
});

describe("splitInclusiveDateRange", () => {
  it("rejects non-positive max chunk size", () => {
    expect(() =>
      splitInclusiveDateRange({ startInclusive: "2024-01-01", endInclusive: "2024-01-02" }, 0),
    ).toThrow();
  });

  it("returns a single chunk when within max", () => {
    const r = { startInclusive: "2024-01-01", endInclusive: "2024-12-31" };
    expect(splitInclusiveDateRange(r, 400)).toEqual([r]);
  });

  it("splits a 400-day range into two chunks for max 365", () => {
    const full = { startInclusive: "2024-01-01", endInclusive: "2025-02-03" };
    const chunks = splitInclusiveDateRange(full, 365);
    expect(countInclusiveUtcDays(full.startInclusive, full.endInclusive)).toBe(400);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.startInclusive).toBe("2024-01-01");
    expect(chunks[0]?.endInclusive).toBe("2024-12-30");
    expect(chunks[1]?.startInclusive).toBe("2024-12-31");
    expect(chunks[1]?.endInclusive).toBe("2025-02-03");
    const total = chunks.reduce(
      (acc, c) => acc + countInclusiveUtcDays(c.startInclusive, c.endInclusive),
      0,
    );
    expect(total).toBe(400);
  });
});

describe("trailingInclusiveWindow", () => {
  it("returns full range when short enough", () => {
    const r = { startInclusive: "2024-06-01", endInclusive: "2024-06-30" };
    expect(trailingInclusiveWindow(r, 365)).toEqual(r);
  });

  it("trims to trailing max days", () => {
    const w = trailingInclusiveWindow(
      { startInclusive: "2020-01-01", endInclusive: "2025-01-01" },
      365,
    );
    expect(countInclusiveUtcDays(w.startInclusive, w.endInclusive)).toBe(365);
    expect(w.endInclusive).toBe("2025-01-01");
  });
});
