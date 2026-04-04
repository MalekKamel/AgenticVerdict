import { describe, expect, it } from "vitest";

import { createDefaultAdapterInfrastructure } from "./adapter-infrastructure";

describe("createDefaultAdapterInfrastructure", () => {
  it("returns a bundle with getHealth()", async () => {
    const bundle = createDefaultAdapterInfrastructure();
    const report = await bundle.getHealth();
    expect(report.platforms.length).toBe(5);
    expect(bundle.cache).toBeDefined();
    expect(bundle.metrics).toBeDefined();
  });
});
