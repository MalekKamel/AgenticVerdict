import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  listJsonFilenamesInDir,
  readCompanyPayloadsFromDir,
} from "../src/seeds/company-config-seed";

describe("company-config-seed", () => {
  const pkgRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
  const fixturesDir = join(pkgRoot, "..", "..", "tests", "fixtures", "companies");

  it("lists json fixtures", () => {
    const names = listJsonFilenamesInDir(fixturesDir);
    expect(names.length).toBeGreaterThanOrEqual(3);
    expect(names.every((n) => n.endsWith(".json"))).toBe(true);
  });

  it("reads company payloads with ids and names", () => {
    const payloads = readCompanyPayloadsFromDir(fixturesDir);
    const ids = new Set(payloads.map((p) => p.companyId));
    expect(ids.has("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).toBe(true);
    expect(payloads.every((p) => p.companyName.length > 0)).toBe(true);
  });
});
