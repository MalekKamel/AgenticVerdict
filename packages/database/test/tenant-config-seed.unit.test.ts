import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { listJsonFilenamesInDir, readTenantPayloadsFromDir } from "../src/seeds/tenant-config-seed";

describe("tenant-config-seed", () => {
  const pkgRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
  const fixturesDir = join(pkgRoot, "..", "config", "test", "fixtures", "tenants");

  it("lists json fixtures", () => {
    const names = listJsonFilenamesInDir(fixturesDir);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => n.endsWith(".json"))).toBe(true);
  });

  it("reads tenant payloads with ids and names", () => {
    const payloads = readTenantPayloadsFromDir(fixturesDir);
    expect(payloads.length).toBeGreaterThan(0);
    expect(payloads.every((p) => p.tenantId.length > 0)).toBe(true);
    expect(payloads.every((p) => p.tenantName.length > 0)).toBe(true);
  });
});
