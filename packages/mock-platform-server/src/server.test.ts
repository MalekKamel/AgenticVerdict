import { describe, expect, it } from "vitest";

import { buildMockPlatformServer } from "./index";

describe("mock-platform-server HTTP", () => {
  it("GET /health returns ok", async () => {
    const app = await buildMockPlatformServer();
    await app.ready();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string };
    expect(body.status).toBe("healthy");
    await app.close();
  });

  it("POST /meta/... returns mock payload when headers are set", async () => {
    const app = await buildMockPlatformServer();
    await app.ready();
    const res = await app.inject({
      method: "POST",
      url: "/meta/v20.0/ad_campaigns",
      headers: {
        "x-mock-mode": "true",
        "x-tenant-id": "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
        "x-scenario": "normal",
        "x-seed": "42001",
        "content-type": "application/json",
      },
      payload: { start: "2026-01-01", end: "2026-01-07" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { mock?: boolean; platform?: string };
    expect(body.mock).toBe(true);
    expect(body.platform).toBe("meta");
    await app.close();
  });

  it("rejects mock routes without x-mock-mode", async () => {
    const app = await buildMockPlatformServer();
    await app.ready();
    const res = await app.inject({
      method: "POST",
      url: "/ga4/v1beta/properties/p1/runReport",
      headers: { "content-type": "application/json" },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});
