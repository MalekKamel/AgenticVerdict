import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "./csp";

describe("buildContentSecurityPolicy", () => {
  it("includes nonce-based script-src and connect-src allowlist", () => {
    const csp = buildContentSecurityPolicy("testnonce");
    expect(csp).toContain("script-src 'self' 'nonce-testnonce'");
    expect(csp).toContain("connect-src 'self' https: wss:");
    expect(csp).toContain("ws://localhost:3000");
    expect(csp).toContain("http://localhost:4000");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  it("does not force insecure upgrade for localhost http origins", () => {
    const csp = buildContentSecurityPolicy("testnonce", {
      requestOrigin: "http://localhost:3000/en/dashboard",
    });
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("keeps insecure upgrade for https non-local origins", () => {
    const csp = buildContentSecurityPolicy("testnonce", {
      requestOrigin: "https://app.agenticverdict.com/en/dashboard",
    });
    expect(csp).toContain("upgrade-insecure-requests");
  });
});
