import type { AnyRouteMatch } from "@tanstack/react-router";
import { resolveAuthBrandName } from "@/lib/auth/resolve-auth-brand-name";

export type AuthSeoRouteKey =
  | "login"
  | "register"
  | "forgotPassword"
  | "resetPassword"
  | "verifyEmail"
  | "terms"
  | "privacy"
  | "help";

type Messages = Record<string, unknown>;

function getNested(obj: unknown, path: string[]): unknown {
  // Defensive nested lookup for loosely-typed i18n payloads from route loader data.
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || cur === undefined || typeof cur !== "object") {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function readAuthSeoBlock(
  messages: Messages | undefined,
  routeKey: AuthSeoRouteKey,
): { title: string; description: string } | undefined {
  // Expected locale shape: `auth.seo.<routeKey>.{title,description}`.
  const block = getNested(messages, ["auth", "seo", routeKey]);
  if (block === null || typeof block !== "object") {
    return undefined;
  }
  const title = (block as Record<string, unknown>).title;
  const description = (block as Record<string, unknown>).description;
  if (typeof title !== "string" || typeof description !== "string") {
    return undefined;
  }
  return { title, description };
}

function localeLoaderDataFromMatches(
  matches: readonly AnyRouteMatch[],
): { messages?: Messages; tenantName?: string } | undefined {
  // Auth routes are nested under `/$locale`, so loaderData lives on that match.
  const localeMatch = matches.find((m) => m.routeId === "/$locale");
  return localeMatch?.loaderData as { messages?: Messages; tenantName?: string } | undefined;
}

function interpolateAuthBrand(input: string, brandName: string): string {
  // Replace all occurrences so translators can use `{brand}` more than once in a sentence.
  return input.replaceAll("{brand}", brandName);
}

/**
 * Builds `<head>` meta for auth routes using `/$locale` loader messages (`auth.seo.*`).
 */
export function buildAuthSeoHead(
  matches: readonly AnyRouteMatch[],
  routeKey: AuthSeoRouteKey,
): { meta: Array<Record<string, string>> } {
  // Route-specific SEO copy from i18n files.
  const localeData = localeLoaderDataFromMatches(matches);
  const block = readAuthSeoBlock(localeData?.messages, routeKey);
  const brandName = resolveAuthBrandName(matches);
  // Keep translations generic (`{brand}`) while injecting the active tenant brand at runtime.
  const title = interpolateAuthBrand(block?.title ?? "AgenticVerdict", brandName);
  const description = interpolateAuthBrand(block?.description ?? "", brandName);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      // Auth pages should not be indexed/crawled.
      { name: "robots", content: "noindex, nofollow" },
    ],
  };
}
