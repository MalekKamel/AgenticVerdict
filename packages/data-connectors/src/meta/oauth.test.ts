import { describe, expect, it, vi } from "vitest";

import { PlatformAuthError } from "../errors";
import { exchangeMetaLongLivedToken, validateMetaAccessToken } from "./oauth";

describe("exchangeMetaLongLivedToken", () => {
  it("returns access_token from successful exchange", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ access_token: "long", expires_in: 100 }), { status: 200 }),
      );
    const out = await exchangeMetaLongLivedToken({
      appId: "a",
      appSecret: "b",
      tokenToExchange: "short",
      fetchImpl: fetchImpl as typeof fetch,
    });
    expect(out.accessToken).toBe("long");
    expect(out.expiresInSeconds).toBe(100);
  });

  it("throws when access_token missing in success body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    await expect(
      exchangeMetaLongLivedToken({
        appId: "a",
        appSecret: "b",
        tokenToExchange: "short",
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow(PlatformAuthError);
  });

  it("omits expiresInSeconds when expires_in is not numeric", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ access_token: "x", expires_in: "999" }), { status: 200 }),
      );
    const out = await exchangeMetaLongLivedToken({
      appId: "a",
      appSecret: "b",
      tokenToExchange: "short",
      fetchImpl: fetchImpl as typeof fetch,
    });
    expect(out.expiresInSeconds).toBeUndefined();
  });

  it("rejects empty body on successful HTTP exchange", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    await expect(
      exchangeMetaLongLivedToken({
        appId: "a",
        appSecret: "b",
        tokenToExchange: "short",
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow(PlatformAuthError);
  });

  it("rejects non-JSON body on successful HTTP exchange", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("not-json", { status: 200 }));
    await expect(
      exchangeMetaLongLivedToken({
        appId: "a",
        appSecret: "b",
        tokenToExchange: "short",
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow(PlatformAuthError);
  });

  it("maps Graph errors on failed exchange", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "bad", code: 190 } }), { status: 400 }),
      );
    await expect(
      exchangeMetaLongLivedToken({
        appId: "a",
        appSecret: "b",
        tokenToExchange: "short",
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow(PlatformAuthError);
  });
});

describe("validateMetaAccessToken", () => {
  it("resolves on HTTP 200", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: "1" }), { status: 200 }));
    await expect(
      validateMetaAccessToken("tok", fetchImpl as typeof fetch),
    ).resolves.toBeUndefined();
  });

  it("throws on invalid token response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "invalid", code: 190 } }), { status: 400 }),
      );
    await expect(validateMetaAccessToken("bad", fetchImpl as typeof fetch)).rejects.toThrow(
      PlatformAuthError,
    );
  });
});
