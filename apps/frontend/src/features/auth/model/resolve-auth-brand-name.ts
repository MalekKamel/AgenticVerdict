import type { AnyRouteMatch } from "@tanstack/react-router";

type Messages = Record<string, unknown>;

function getNested(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || cur === undefined || typeof cur !== "object") {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function localeLoaderDataFromMatches(
  matches: readonly AnyRouteMatch[],
): { messages?: Messages; tenantName?: string } | undefined {
  const localeMatch = matches.find((m) => m.routeId === "/$locale");
  return localeMatch?.loaderData as { messages?: Messages; tenantName?: string } | undefined;
}

function readAuthBrandName(messages: Messages | undefined): string | undefined {
  return normalizeNonEmptyString(getNested(messages, ["auth", "layout", "brandName"]));
}

export function resolveAuthBrandName(matches: readonly AnyRouteMatch[]): string {
  const localeData = localeLoaderDataFromMatches(matches);
  return (
    normalizeNonEmptyString(localeData?.tenantName) ??
    readAuthBrandName(localeData?.messages) ??
    "AgenticVerdict"
  );
}
