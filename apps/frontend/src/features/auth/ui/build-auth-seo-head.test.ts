import type { AnyRouteMatch } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { buildAuthSeoHead } from "./build-auth-seo-head";

function matchWithLoaderData(loaderData: unknown): AnyRouteMatch {
  return {
    routeId: "/$locale",
    loaderData,
  } as AnyRouteMatch;
}

describe("buildAuthSeoHead", () => {
  it("uses runtime tenant tenant name when available", () => {
    const matches = [
      matchWithLoaderData({
        tenantName: "Acme Fleet",
        messages: {
          auth: {
            layout: { brandName: "AgenticVerdict" },
            seo: {
              login: {
                title: "Sign in | {brand}",
                description: "Sign in to your {brand} account.",
              },
            },
          },
        },
      }),
    ];

    const result = buildAuthSeoHead(matches, "login");

    expect(result.meta).toEqual([
      { title: "Sign in | Acme Fleet" },
      { name: "description", content: "Sign in to your Acme Fleet account." },
      { name: "robots", content: "noindex, nofollow" },
    ]);
  });

  it("falls back to localized brand when runtime tenant is unavailable", () => {
    const matches = [
      matchWithLoaderData({
        messages: {
          auth: {
            layout: { brandName: "AgenticVerdict" },
            seo: {
              help: {
                title: "Help & support | {brand}",
                description: "Contact {brand} support.",
              },
            },
          },
        },
      }),
    ];

    const result = buildAuthSeoHead(matches, "help");

    expect(result.meta[0]).toEqual({ title: "Help & support | AgenticVerdict" });
    expect(result.meta[1]).toEqual({
      name: "description",
      content: "Contact AgenticVerdict support.",
    });
  });

  it("falls back to AgenticVerdict when brand sources are missing", () => {
    const matches = [
      matchWithLoaderData({
        messages: {
          auth: {
            seo: {
              terms: {
                title: "Terms | {brand}",
                description: "Terms for {brand}.",
              },
            },
          },
        },
      }),
    ];

    const result = buildAuthSeoHead(matches, "terms");

    expect(result.meta[0]).toEqual({ title: "Terms | AgenticVerdict" });
    expect(result.meta[1]).toEqual({ name: "description", content: "Terms for AgenticVerdict." });
    expect(result.meta[2]).toEqual({ name: "robots", content: "noindex, nofollow" });
  });

  it("returns default title/description when seo block is missing", () => {
    const matches = [matchWithLoaderData({ messages: { auth: {} } })];

    const result = buildAuthSeoHead(matches, "register");

    expect(result.meta).toEqual([
      { title: "AgenticVerdict" },
      { name: "description", content: "" },
      { name: "robots", content: "noindex, nofollow" },
    ]);
  });
});
