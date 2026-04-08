import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { companyConfigSchema } from "@agenticverdict/config";

const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));

describe("Cross-package integration — company config fixtures", () => {
  it("parses Masafh-style fixture as valid CompanyConfig", async () => {
    const raw = await readFile(
      path.join(
        root,
        "apps/api/test-fixtures/company-configs/aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee.json",
      ),
      "utf8",
    );
    const parsed = companyConfigSchema.parse(JSON.parse(raw));
    expect(parsed.companyId).toBe("aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
    expect(parsed.localization.language).toMatch(/^(ar|en|fr)$/);
  });

  it("parses alternate tenant fixture", async () => {
    const raw = await readFile(
      path.join(
        root,
        "apps/api/test-fixtures/company-configs/11111111-1111-4111-8111-111111111111.json",
      ),
      "utf8",
    );
    const parsed = companyConfigSchema.parse(JSON.parse(raw));
    expect(parsed.companyId).toBe("11111111-1111-4111-8111-111111111111");
  });
});
