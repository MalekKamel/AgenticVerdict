import { describe, expect, it } from "vitest";

import { PlatformAuthError } from "../errors";
import { validateGoogleAccessTokenForConnector } from "./oauth";

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("validateGoogleAccessTokenForConnector", () => {
  it("tags PlatformAuthError with the requested platform", async () => {
    const fetchImpl = () => jsonResponse({ error_description: "bad" }, 400);
    try {
      await validateGoogleAccessTokenForConnector("gsc", "x", fetchImpl);
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(PlatformAuthError);
      expect((e as PlatformAuthError).connector).toBe("gsc");
    }
  });
});
