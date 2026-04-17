import { describe, expect, it } from "vitest";

import { parseSessionCookie, SESSION_COOKIE_NAME } from "./auth-session-cookie";

describe("auth-session-cookie", () => {
  it("reads av_session from Cookie header", () => {
    const token = "eyJhbGciOiJ";
    const header = `foo=1; ${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; other=2`;
    expect(parseSessionCookie(header)).toBe(token);
  });

  it("returns undefined when cookie missing", () => {
    expect(parseSessionCookie(undefined)).toBeUndefined();
    expect(parseSessionCookie("a=b")).toBeUndefined();
  });
});
