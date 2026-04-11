import { PlatformAuthError, PlatformError, PlatformRateLimitError } from "../errors";
import type { MetaGraphErrorBody, MetaListResponse } from "./models";

export const META_GRAPH_API_VERSION = "v21.0";
export const META_GRAPH_ORIGIN = "https://graph.facebook.com";

export interface MetaGraphRequestOptions {
  readonly accessToken: string;
  readonly fetchImpl?: typeof fetch;
  /** Invoked before each HTTP call (e.g. token bucket). */
  readonly beforeRequest?: () => void | Promise<void>;
}

function extractGraphError(body: unknown): MetaGraphErrorBody["error"] | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const e = (body as MetaGraphErrorBody).error;
  return e ?? null;
}

function isMetaRateLimitGraphCode(code: number | undefined): boolean {
  if (code === undefined) {
    return false;
  }
  if ([4, 17, 32, 613].includes(code)) {
    return true;
  }
  return code >= 80_000 && code < 80_500;
}

export function mapMetaGraphHttpError(status: number, body: unknown): Error {
  const ge = extractGraphError(body);
  const message = ge?.message ?? `Meta Graph API responded with HTTP ${status}`;
  const graphCode = ge?.code;

  if (status === 401 || status === 403 || graphCode === 190 || graphCode === 102) {
    return new PlatformAuthError("meta", message, { cause: body });
  }
  if (status === 429 || isMetaRateLimitGraphCode(graphCode)) {
    return new PlatformRateLimitError("meta", message, { cause: body });
  }
  if (status === 404) {
    return new PlatformError("meta", "not_found", message, { cause: body });
  }
  if (status >= 400 && status < 500) {
    return new PlatformError("meta", "invalid_request", message, { cause: body });
  }
  return new PlatformError("meta", "upstream_error", message, { cause: body });
}

async function readJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (text.length === 0) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _parseFailure: text.slice(0, 500) };
  }
}

/**
 * Performs a single Graph GET (path relative to version root, e.g. `me` or `act_123/campaigns`).
 */
export async function metaGraphGet<T = unknown>(
  path: string,
  searchParams: Record<string, string>,
  options: MetaGraphRequestOptions,
): Promise<T> {
  if (options.beforeRequest) {
    await options.beforeRequest();
  }
  const fetchFn = options.fetchImpl ?? fetch;
  const url = new URL(`${META_GRAPH_ORIGIN}/${META_GRAPH_API_VERSION}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
  }
  url.searchParams.set("access_token", options.accessToken);

  const res = await fetchFn(url.toString());
  const body = await readJsonBody(res);
  if (!res.ok) {
    throw mapMetaGraphHttpError(res.status, body);
  }
  return body as T;
}

/**
 * Follows `paging.next` until exhausted. The first call uses `path` + `initialParams`;
 * subsequent calls use the absolute `next` URL from Meta (still passes access token if missing).
 */
export async function metaGraphGetAllPages<TItem>(
  path: string,
  initialParams: Record<string, string>,
  options: MetaGraphRequestOptions,
): Promise<TItem[]> {
  const out: TItem[] = [];
  let nextUrl: string | null = null;

  while (true) {
    if (options.beforeRequest) {
      await options.beforeRequest();
    }
    const fetchFn = options.fetchImpl ?? fetch;
    const url =
      nextUrl ??
      (() => {
        const u = new URL(
          `${META_GRAPH_ORIGIN}/${META_GRAPH_API_VERSION}/${path.replace(/^\//, "")}`,
        );
        for (const [k, v] of Object.entries(initialParams)) {
          u.searchParams.set(k, v);
        }
        u.searchParams.set("access_token", options.accessToken);
        return u.toString();
      })();

    const res = await fetchFn(url);
    const body = await readJsonBody(res);
    if (!res.ok) {
      throw mapMetaGraphHttpError(res.status, body);
    }

    const page = body as MetaListResponse<TItem>;
    const chunk = page.data ?? [];
    out.push(...chunk);

    const next = page.paging?.next;
    if (!next || chunk.length === 0) {
      break;
    }
    nextUrl = next;
  }

  return out;
}
