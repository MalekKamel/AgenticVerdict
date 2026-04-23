import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApiServer } from "../server";

const apiPackageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("API integration — health & metrics", () => {
  let app: Awaited<ReturnType<typeof buildApiServer>>;

  beforeAll(async () => {
    process.env.TENANT_CONFIG_DIR = path.join(apiPackageRoot, "test-fixtures/tenant-configs");
    app = await buildApiServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns 200 with ok payload", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(typeof res.headers["referrer-policy"]).toBe("string");
    const body = res.json() as { ok: boolean; service: string };
    expect(body.ok).toBe(true);
    expect(body.service).toBe("@agenticverdict/api");
  });

  it("GET /api/health returns 200 with the same payload as /health", async () => {
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { ok: boolean; service: string };
    expect(body.ok).toBe(true);
    expect(body.service).toBe("@agenticverdict/api");
  });

  it("GET /metrics returns Prometheus exposition", async () => {
    const res = await app.inject({ method: "GET", url: "/metrics" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatch(/# HELP /);
  });
});
