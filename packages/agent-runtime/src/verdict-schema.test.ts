import { describe, expect, it } from "vitest";

import { VerdictParseError } from "@agenticverdict/types";

describe("VerdictParseError", () => {
  it("is an Error subclass with a stable name", () => {
    const e = new VerdictParseError("bad payload");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("VerdictParseError");
    expect(e.message).toBe("bad payload");
  });
});
