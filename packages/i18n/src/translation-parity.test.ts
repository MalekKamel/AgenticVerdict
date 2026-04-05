import { describe, expect, it } from "vitest";

import { assertAllLocalesHaveSameKeys } from "./translation-parity";

describe("translation parity (QA)", () => {
  it("keeps bundled locale JSON files aligned", () => {
    expect(() => assertAllLocalesHaveSameKeys("en")).not.toThrow();
  });
});
