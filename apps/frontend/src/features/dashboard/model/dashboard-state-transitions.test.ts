import { describe, expect, it } from "vitest";

import { combineHomeSurfaceStatus, resolveAsyncSectionStatus } from "./dashboard-state-transitions";

describe("resolveAsyncSectionStatus", () => {
  it("maps pending to loading", () => {
    expect(
      resolveAsyncSectionStatus({
        isPending: true,
        isFetching: false,
        isError: false,
        isSuccess: false,
        data: undefined,
        error: null,
        dataUpdatedAt: 0,
      }),
    ).toBe("loading");
  });
});

describe("combineHomeSurfaceStatus", () => {
  it("returns success when all sections succeed", () => {
    expect(
      combineHomeSurfaceStatus({
        kpis: "success",
        insights: "success",
        connectors: "success",
      }),
    ).toBe("success");
  });

  it("returns partial when one section errors but another succeeds", () => {
    expect(
      combineHomeSurfaceStatus({
        kpis: "success",
        insights: "error",
        connectors: "success",
      }),
    ).toBe("partial");
  });
});
