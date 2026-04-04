import { describe, expect, it, vi } from "vitest";

import { tiktokOauth2AccessToken, validateTikTokAccessToken } from "./oauth";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("tiktokOauth2AccessToken", () => {
  it("exchanges refresh_token for access_token", async () => {
    const fetchMock =
      vi.fn<(input: Parameters<typeof fetch>[0], init?: RequestInit) => Promise<Response>>();
    fetchMock.mockResolvedValue(
      jsonResponse({
        code: 0,
        message: "OK",
        data: { access_token: "at1", refresh_token: "rt2", expires_in: 3600 },
      }),
    );

    const out = await tiktokOauth2AccessToken({
      appId: "a",
      secret: "s",
      grantType: "refresh_token",
      refreshToken: "rt",
      fetchImpl: fetchMock as typeof fetch,
    });

    expect(out.accessToken).toBe("at1");
    expect(out.refreshToken).toBe("rt2");
    expect(fetchMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("/oauth2/access_token/");
    expect(init?.method).toBe("POST");
    expect(String(init?.body)).toContain("refresh_token");
  });

  it("throws when refresh grant missing refreshToken", async () => {
    await expect(
      tiktokOauth2AccessToken({
        appId: "a",
        secret: "s",
        grantType: "refresh_token",
        fetchImpl: vi.fn() as typeof fetch,
      }),
    ).rejects.toThrow(/refreshToken is required/);
  });

  it("exchanges authorization_code when authCode is provided", async () => {
    const fetchMock =
      vi.fn<(input: Parameters<typeof fetch>[0], init?: RequestInit) => Promise<Response>>();
    fetchMock.mockResolvedValue(
      jsonResponse({
        code: 0,
        message: "OK",
        data: { access_token: "at-code" },
      }),
    );

    const out = await tiktokOauth2AccessToken({
      appId: "a",
      secret: "s",
      grantType: "authorization_code",
      authCode: "ac",
      fetchImpl: fetchMock as typeof fetch,
    });

    expect(out.accessToken).toBe("at-code");
    expect(String(fetchMock.mock.calls[0]![1]?.body)).toContain("auth_code");
  });

  it("throws when authorization_code grant missing authCode", async () => {
    await expect(
      tiktokOauth2AccessToken({
        appId: "a",
        secret: "s",
        grantType: "authorization_code",
        fetchImpl: vi.fn() as typeof fetch,
      }),
    ).rejects.toThrow(/authCode is required/);
  });

  it("throws when response omits access_token", async () => {
    const fetchMock =
      vi.fn<(input: Parameters<typeof fetch>[0], init?: RequestInit) => Promise<Response>>();
    fetchMock.mockResolvedValue(
      jsonResponse({
        code: 0,
        message: "OK",
        data: {},
      }),
    );

    await expect(
      tiktokOauth2AccessToken({
        appId: "a",
        secret: "s",
        grantType: "refresh_token",
        refreshToken: "rt",
        fetchImpl: fetchMock as typeof fetch,
      }),
    ).rejects.toThrow(/missing access_token/);
  });
});

describe("validateTikTokAccessToken", () => {
  it("maps HTTP errors via mapTikTokHttpError", async () => {
    const fetchMock =
      vi.fn<(input: Parameters<typeof fetch>[0], init?: RequestInit) => Promise<Response>>();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ code: 40_102, message: "bad" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(validateTikTokAccessToken("t", fetchMock as typeof fetch)).rejects.toThrow();
  });

  it("calls user/info and succeeds on code 0", async () => {
    const fetchMock =
      vi.fn<(input: Parameters<typeof fetch>[0], init?: RequestInit) => Promise<Response>>();
    fetchMock.mockResolvedValue(jsonResponse({ code: 0, message: "OK", data: {} }));

    await validateTikTokAccessToken("tok", fetchMock as typeof fetch, false);

    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/user/info/"))).toBe(true);
    const init = fetchMock.mock.calls[0]![1];
    const hdrs = init?.headers;
    const access =
      hdrs instanceof Headers
        ? hdrs.get("Access-Token")
        : typeof hdrs === "object" && hdrs !== null && "Access-Token" in hdrs
          ? String((hdrs as Record<string, string>)["Access-Token"])
          : undefined;
    expect(access).toBe("tok");
  });
});
