import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { __clearRateLimitMemoryForTests } from "../../middleware/rate-limit";
import { buildApiServer } from "../../server";

const validEnvelope = {
  kind: "web_vital" as const,
  ts: "2026-04-17T12:00:00.000Z",
  tenantId: null,
  payload: { name: "LCP", value: 1 },
};

describe("POST /api/v1/telemetry/ingest", () => {
  let app: Awaited<ReturnType<typeof buildApiServer>>;
  const prevNodeEnv = process.env.NODE_ENV;
  const prevSecret = process.env.TELEMETRY_INGEST_SECRET;

  beforeAll(async () => {
    app = await buildApiServer();
    await app.ready();
  });

  afterEach(() => {
    __clearRateLimitMemoryForTests();
    process.env.NODE_ENV = prevNodeEnv;
    if (prevSecret === undefined) {
      delete process.env.TELEMETRY_INGEST_SECRET;
    } else {
      process.env.TELEMETRY_INGEST_SECRET = prevSecret;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it("accepts a valid envelope when TELEMETRY_INGEST_SECRET is unset (non-production dev)", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.TELEMETRY_INGEST_SECRET;

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/telemetry/ingest",
      headers: { "content-type": "application/json" },
      payload: validEnvelope,
    });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual({ accepted: true });
  });

  it("requires Authorization when TELEMETRY_INGEST_SECRET is set", async () => {
    process.env.NODE_ENV = "development";
    process.env.TELEMETRY_INGEST_SECRET = "test-secret";

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/telemetry/ingest",
      headers: { "content-type": "application/json" },
      payload: validEnvelope,
    });
    expect(res.statusCode).toBe(401);

    const ok = await app.inject({
      method: "POST",
      url: "/api/v1/telemetry/ingest",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer test-secret",
      },
      payload: validEnvelope,
    });
    expect(ok.statusCode).toBe(202);
  });

  it("returns 503 in production when TELEMETRY_INGEST_SECRET is unset", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.TELEMETRY_INGEST_SECRET;

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/telemetry/ingest",
      headers: { "content-type": "application/json" },
      payload: validEnvelope,
    });
    expect(res.statusCode).toBe(503);
  });

  it("returns 400 for invalid envelope", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.TELEMETRY_INGEST_SECRET;

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/telemetry/ingest",
      headers: { "content-type": "application/json" },
      payload: { kind: "unknown" },
    });
    expect(res.statusCode).toBe(400);
  });
});
