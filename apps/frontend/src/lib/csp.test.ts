import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "./csp";
import { getCspNonce } from "./csp-nonce.stub";

describe("buildContentSecurityPolicy", () => {
  it("includes shared script/style nonces and baseline directives", () => {
    const policy = buildContentSecurityPolicy("test-nonce-1");
    expect(policy).toContain("script-src 'self' 'nonce-test-nonce-1'");
    expect(policy).toContain("style-src 'self' 'nonce-test-nonce-1'");
    expect(policy).toContain("style-src-attr 'unsafe-inline'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("upgrade-insecure-requests");
  });
});

describe("getCspNonce (client stub)", () => {
  it("reads nonce from meta[property=csp-nonce] when present", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("property", "csp-nonce");
    meta.setAttribute("content", "from-meta");
    document.head.append(meta);
    expect(getCspNonce()).toBe("from-meta");
    meta.remove();
  });
});
