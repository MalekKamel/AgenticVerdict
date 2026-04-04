import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { migrationsFolder } from "../src/migrate";

describe("migrationsFolder", () => {
  it("points at an on-disk migrations directory", () => {
    expect(migrationsFolder).toMatch(/migrations$/);
    expect(existsSync(migrationsFolder)).toBe(true);
  });
});
