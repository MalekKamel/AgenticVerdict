import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "./csp";

describe("buildContentSecurityPolicy", () => {
  it("includes nonce-based script-src and connect-src for https/wss", () => {
    const csp = buildContentSecurityPolicy("testnonce");
    expect(csp).toContain("script-src 'self' 'nonce-testnonce'");
    expect(csp).toContain("connect-src 'self' https: wss:");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
  });
});
