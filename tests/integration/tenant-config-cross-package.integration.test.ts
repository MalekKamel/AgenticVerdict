import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { tenantConfigSchema } from "@agenticverdict/config";

const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));

describe("Cross-package integration — tenant config fixtures", () => {
  it("parses Masafh-style fixture as valid TenantConfig", async () => {
    const raw = await readFile(
      path.join(
        root,
        "apps/api/test-fixtures/tenant-configs/aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee.json",
      ),
      "utf8",
    );
    const parsed = tenantConfigSchema.parse(JSON.parse(raw));
    expect(parsed.tenantId).toBe("aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
    expect(parsed.localization.language).toMatch(/^(ar|en|fr)$/);
  });

  it("parses alternate tenant fixture", async () => {
    const raw = await readFile(
      path.join(
        root,
        "apps/api/test-fixtures/tenant-configs/11111111-1111-4111-8111-111111111111.json",
      ),
      "utf8",
    );
    const parsed = tenantConfigSchema.parse(JSON.parse(raw));
    expect(parsed.tenantId).toBe("11111111-1111-4111-8111-111111111111");
  });
});
