import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";

import { buildApiServer } from "../../server";
import { __clearRateLimitMemoryForTests } from "../../middleware/rate-limit";
import { resetJwtSecretCacheForTests } from "../../middleware/auth";
import { __resetReportStoreForTests } from "../../services/report-store";
import { __resetReportAuditForTests } from "../../services/report-audit-store";
import { resetBullmqConnectionForTests } from "../../services/report-bullmq";

const JWT_SECRET = "test-jwt-secret-load-matrix-32chars-xx";
const TENANT_A = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

/** Burst sizes from audit P1 load matrix (CI runs all; keep each burst short). */
const BURST_SIZES = [1, 5, 10, 25, 50] as const;

describe("P1 report API concurrent load matrix (authenticated GET fan-out)", () => {
  let app: Awaited<ReturnType<typeof buildApiServer>>;
  let token: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    app = await buildApiServer();
    await app.ready();
    token = await new SignJWT({
      tenant_id: TENANT_A,
      roles: ["analyst", "reports:read"],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("load-test-user")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(JWT_SECRET));
  });

  beforeEach(() => {
    __clearRateLimitMemoryForTests();
    resetJwtSecretCacheForTests();
    delete process.env.REDIS_URL;
    resetBullmqConnectionForTests();
    __resetReportStoreForTests();
    __resetReportAuditForTests();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(BURST_SIZES)("parallel GET /api/v1/reports × %i succeeds", async (n) => {
    const started = performance.now();
    const results = await Promise.all(
      Array.from({ length: n }, () =>
        app.inject({
          method: "GET",
          url: "/api/v1/reports",
          headers: { authorization: `Bearer ${token}` },
        }),
      ),
    );
    const elapsedMs = performance.now() - started;
    for (const res of results) {
      expect(res.statusCode).toBe(200);
    }
    expect(elapsedMs).toBeLessThan(60_000);
  });
});
