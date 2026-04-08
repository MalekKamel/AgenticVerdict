import { afterEach, describe, expect, it } from "vitest";

import { createPinoLogger } from "./logger";

describe("createPinoLogger", () => {
  const prevLevel = process.env.LOG_LEVEL;
  const prevVitest = process.env.VITEST;

  afterEach(() => {
    process.env.LOG_LEVEL = prevLevel;
    process.env.VITEST = prevVitest;
  });

  it("binds service name on the root logger", () => {
    process.env.LOG_LEVEL = "silent";
    process.env.VITEST = "true";
    const log = createPinoLogger("api");
    expect(log.bindings().service).toBe("api");
  });
});
