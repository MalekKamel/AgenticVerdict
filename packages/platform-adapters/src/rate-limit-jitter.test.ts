import { afterEach, describe, expect, it, vi } from "vitest";

import { applyBackoffJitter } from "./rate-limit";

describe("applyBackoffJitter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("applies -20% when random is 0", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(applyBackoffJitter(1000)).toBe(800);
  });

  it("applies +20% when random is 1", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);
    expect(applyBackoffJitter(1000)).toBe(1200);
  });
});
