import { describe, expect, it } from "vitest";

import {
  CompositeFixtureLoader,
  deepMergeRecords,
  defaultFixturesRoot,
} from "../fixture-loaders/composite-fixture-loader";

describe("deepMergeRecords", () => {
  it("merges nested objects and overrides scalars", () => {
    const merged = deepMergeRecords(
      {
        a: 1,
        loc: { language: "en", currency: "USD" },
      },
      {
        b: 2,
        loc: { currency: "EUR" },
      },
    );
    expect(merged).toEqual({
      a: 1,
      b: 2,
      loc: { language: "en", currency: "EUR" },
    });
  });
});

describe("CompositeFixtureLoader", () => {
  const fixturesRoot = defaultFixturesRoot();

  it("resolves default fixtures root next to tests/fixtures", () => {
    expect(fixturesRoot).toMatch(/fixtures$/);
  });

  it("composes base tenant with scenario override", async () => {
    const loader = new CompositeFixtureLoader(fixturesRoot);
    const merged = await loader.loadMerged([
      { relativePath: "base/tenants/default-en-ltr.json", priority: 1 },
      { relativePath: "scenarios/normal-operations/tenant-override.json", priority: 2 },
    ]);
    expect(merged.companyName).toBe("Composed EN Tenant");
    expect(merged.companyId).toBe("dddddddd-dddd-4ddd-8ddd-dddddddddddd");
    const loc = merged.localization as Record<string, unknown>;
    expect(loc.language).toBe("en");
    expect(loc.currency).toBe("EUR");
    expect(loc.timezone).toBe("America/New_York");
  });

  it("loads existing company fixtures from companies/", async () => {
    const loader = new CompositeFixtureLoader(fixturesRoot);
    const data = await loader.loadJsonRelative("companies/test-tenant-001.json");
    expect(data.companyId).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });
});
