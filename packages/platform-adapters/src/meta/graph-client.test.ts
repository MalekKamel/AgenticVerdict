import { describe, expect, it, vi } from "vitest";

import { PlatformAuthError, PlatformError, PlatformRateLimitError } from "../errors";
import {
  mapMetaGraphHttpError,
  metaGraphGet,
  metaGraphGetAllPages,
  META_GRAPH_API_VERSION,
} from "./graph-client";

describe("mapMetaGraphHttpError", () => {
  it("maps OAuthException 190 to auth", () => {
    const err = mapMetaGraphHttpError(400, {
      error: { message: "Invalid OAuth", code: 190 },
    });
    expect(err).toBeInstanceOf(PlatformAuthError);
  });

  it("maps HTTP 401 to auth", () => {
    const err = mapMetaGraphHttpError(401, {});
    expect(err).toBeInstanceOf(PlatformAuthError);
  });

  it("maps code 17 to rate limit", () => {
    const err = mapMetaGraphHttpError(400, { error: { message: "limit", code: 17 } });
    expect(err).toBeInstanceOf(PlatformRateLimitError);
  });

  it("maps Marketing API throttle codes", () => {
    const err = mapMetaGraphHttpError(400, { error: { message: "throttle", code: 80_004 } });
    expect(err).toBeInstanceOf(PlatformRateLimitError);
  });

  it("maps 404 to not_found", () => {
    const err = mapMetaGraphHttpError(404, { error: { message: "missing" } });
    expect(err).toBeInstanceOf(PlatformError);
    expect((err as PlatformError).code).toBe("not_found");
  });

  it("maps 4xx to invalid_request", () => {
    const err = mapMetaGraphHttpError(422, { error: { message: "bad" } });
    expect(err).toBeInstanceOf(PlatformError);
    expect((err as PlatformError).code).toBe("invalid_request");
  });

  it("maps 5xx to upstream_error", () => {
    const err = mapMetaGraphHttpError(503, { error: { message: "down" } });
    expect(err).toBeInstanceOf(PlatformError);
    expect((err as PlatformError).code).toBe("upstream_error");
  });
});

describe("metaGraphGet", () => {
  it("returns parsed JSON on success", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: "42" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const beforeRequest = vi.fn();
    const data = await metaGraphGet<{ id: string }>(
      "me",
      { fields: "id" },
      { accessToken: "tok", fetchImpl: fetchImpl as typeof fetch, beforeRequest },
    );
    expect(data.id).toBe("42");
    expect(beforeRequest).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0]?.[0]).toContain(`/${META_GRAPH_API_VERSION}/me`);
  });

  it("returns null for empty success body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const data = await metaGraphGet(
      "me",
      {},
      {
        accessToken: "tok",
        fetchImpl: fetchImpl as typeof fetch,
      },
    );
    expect(data).toBeNull();
  });

  it("wraps invalid JSON bodies in parse marker on success HTTP", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("not-json", { status: 200 }));
    const data = await metaGraphGet<{ _parseFailure?: string }>(
      "me",
      {},
      {
        accessToken: "tok",
        fetchImpl: fetchImpl as typeof fetch,
      },
    );
    expect(data._parseFailure).toBe("not-json");
  });

  it("throws mapped error on failure", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "nope", code: 190 } }), { status: 400 }),
      );
    await expect(
      metaGraphGet("me", {}, { accessToken: "tok", fetchImpl: fetchImpl as typeof fetch }),
    ).rejects.toThrow(PlatformAuthError);
  });
});

describe("metaGraphGetAllPages", () => {
  it("propagates errors on a subsequent page fetch", async () => {
    const fetchImpl = vi.fn();
    fetchImpl
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ x: 1 }],
            paging: { next: "https://graph.facebook.com/v21.0/next?access_token=t" },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "fail", code: 2 } }), { status: 500 }),
      );

    await expect(
      metaGraphGetAllPages<{ x: number }>(
        "act_1/campaigns",
        {},
        {
          accessToken: "tok",
          fetchImpl: fetchImpl as typeof fetch,
        },
      ),
    ).rejects.toThrow(PlatformError);
  });

  it("follows paging.next", async () => {
    const fetchImpl = vi.fn();
    fetchImpl
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ x: 1 }],
            paging: {
              next: "https://graph.facebook.com/v21.0/act_1/campaigns?access_token=t&after=a",
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ x: 2 }] }), { status: 200 }));

    const rows = await metaGraphGetAllPages<{ x: number }>(
      "act_1/campaigns",
      { limit: "10" },
      { accessToken: "tok", fetchImpl: fetchImpl as typeof fetch },
    );
    expect(rows).toEqual([{ x: 1 }, { x: 2 }]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("stops when next is set but chunk is empty", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [],
          paging: { next: "https://graph.facebook.com/v21.0/next" },
        }),
        { status: 200 },
      ),
    );
    const rows = await metaGraphGetAllPages<{ x: number }>(
      "act_1/campaigns",
      {},
      { accessToken: "tok", fetchImpl: fetchImpl as typeof fetch },
    );
    expect(rows).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("stops when page has no next", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: [{ x: 1 }], paging: {} }), { status: 200 }),
      );

    const rows = await metaGraphGetAllPages<{ x: number }>(
      "act_1/ads",
      {},
      { accessToken: "tok", fetchImpl: fetchImpl as typeof fetch },
    );
    expect(rows).toEqual([{ x: 1 }]);
  });
});
