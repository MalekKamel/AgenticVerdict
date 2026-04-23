import { describe, expect, it } from "vitest";

import { resolveServerApiBaseUrls } from "./resolve-server-api-base-urls";

function createRequest(headers: Record<string, string>): Request {
  return new Request("http://localhost", { headers: new Headers(headers) });
}

describe("resolveServerApiBaseUrls", () => {
  it("prefers API_URL before browser-facing VITE_PUBLIC_API_URL on the server", () => {
    const req = createRequest({ host: "localhost:3000" });
    const urls = resolveServerApiBaseUrls(req, {
      vitePublicApiUrl: "http://localhost:4999/",
      apiUrl: "http://localhost:4000",
    });
    expect(urls[0]).toBe("http://localhost:4000");
    expect(urls[1]).toBe("http://localhost:4999");
  });

  it("maps frontend port to paired api port for local dev", () => {
    const req = createRequest({
      "x-forwarded-host": "localhost:3001",
      "x-forwarded-proto": "http",
    });
    const urls = resolveServerApiBaseUrls(req, {});
    expect(urls).toContain("http://localhost:4001");
    expect(urls).toContain("http://localhost:4000");
  });

  it("includes API_URL and localhost fallbacks", () => {
    const req = createRequest({ host: "127.0.0.1" });
    const urls = resolveServerApiBaseUrls(req, {
      apiUrl: "http://api.internal:4100",
    });
    expect(urls).toContain("http://api.internal:4100");
    expect(urls).toContain("http://localhost:4000");
    expect(urls).toContain("http://localhost:4001");
  });
});
