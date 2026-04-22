import { describe, expect, it } from "vitest";

import { PROTOCOL } from "@agenticverdict/desktop-ipc";

import { extractDeepLinkArg } from "./deep-link";

describe("extractDeepLinkArg", () => {
  it("returns the first agenticverdict:// argument", () => {
    expect(
      extractDeepLinkArg(["--foo", `${PROTOCOL}://auth/callback?x=1`, `${PROTOCOL}://ignored`]),
    ).toBe(`${PROTOCOL}://auth/callback?x=1`);
  });

  it("returns undefined when absent", () => {
    expect(extractDeepLinkArg(["--no-protocol"])).toBeUndefined();
  });
});
