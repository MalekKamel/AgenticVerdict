import { describe, expect, it } from "vitest";

import { PlatformAuthError } from "../errors";
import { refreshGoogleAccessToken, validateGoogleAccessToken } from "./oauth";

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("validateGoogleAccessToken", () => {
  it("returns expiry and audience on success", async () => {
    const fetchImpl = () =>
      jsonResponse({ expires_in: "3600", aud: "client-id.apps.googleusercontent.com" });
    const r = await validateGoogleAccessToken("token", fetchImpl);
    expect(r.audience).toContain("googleusercontent");
    expect(r.expiresInSeconds).toBe(3600);
  });

  it("accepts numeric expires_in from tokeninfo", async () => {
    const fetchImpl = () => jsonResponse({ expires_in: 7200, aud: "id" });
    const r = await validateGoogleAccessToken("token", fetchImpl);
    expect(r.expiresInSeconds).toBe(7200);
  });

  it("throws when tokeninfo succeeds with an empty body", async () => {
    const fetchImpl = () => Promise.resolve(new Response("", { status: 200 }));
    await expect(validateGoogleAccessToken("token", fetchImpl)).rejects.toThrow(PlatformAuthError);
  });

  it("throws PlatformAuthError on HTTP error", async () => {
    const fetchImpl = () => jsonResponse({ error_description: "Invalid token" }, 400);
    await expect(validateGoogleAccessToken("bad", fetchImpl)).rejects.toThrow(PlatformAuthError);
  });

  it("uses a generic message when error_description is absent", async () => {
    const fetchImpl = () => jsonResponse({}, 401);
    await expect(validateGoogleAccessToken("bad", fetchImpl)).rejects.toThrow(PlatformAuthError);
  });
});

describe("refreshGoogleAccessToken", () => {
  it("returns a new access token", async () => {
    const fetchImpl = () =>
      jsonResponse({ access_token: "new-access", expires_in: 3599, token_type: "Bearer" });
    const r = await refreshGoogleAccessToken({
      clientId: "c",
      clientSecret: "s",
      refreshToken: "r",
      fetchImpl,
    });
    expect(r.accessToken).toBe("new-access");
  });

  it("parses string expires_in from the refresh response", async () => {
    const fetchImpl = () =>
      jsonResponse({ access_token: "a", expires_in: "120", token_type: "Bearer" });
    const r = await refreshGoogleAccessToken({
      clientId: "c",
      clientSecret: "s",
      refreshToken: "r",
      fetchImpl,
    });
    expect(r.expiresInSeconds).toBe(120);
  });

  it("throws when access_token missing", async () => {
    const fetchImpl = () => jsonResponse({ token_type: "Bearer" }, 200);
    await expect(
      refreshGoogleAccessToken({
        clientId: "c",
        clientSecret: "s",
        refreshToken: "r",
        fetchImpl,
      }),
    ).rejects.toThrow(PlatformAuthError);
  });

  it("prefers error_description on refresh failure", async () => {
    const fetchImpl = () => jsonResponse({ error_description: "revoked" }, 401);
    await expect(
      refreshGoogleAccessToken({
        clientId: "c",
        clientSecret: "s",
        refreshToken: "r",
        fetchImpl,
      }),
    ).rejects.toThrow(/revoked/);
  });
});
