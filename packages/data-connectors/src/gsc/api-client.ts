import type { ConnectorType } from "@agenticverdict/types";

import { mapGoogleJsonApiHttpError, readGoogleApiJsonBody } from "../google/http";

export const GSC_WEBMASTERS_ORIGIN = "https://www.googleapis.com/webmasters/v3";
export const GSC_URL_INSPECTION_URL =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

export interface GscRequestOptions {
  readonly accessToken: string;
  readonly fetchImpl: typeof fetch;
  readonly beforeRequest?: () => void | Promise<void>;
  readonly connector?: ConnectorType;
}

async function beforeOpt(opts: GscRequestOptions): Promise<void> {
  if (opts.beforeRequest) {
    await opts.beforeRequest();
  }
}

export async function gscWebmastersGet<T = unknown>(
  path: string,
  options: GscRequestOptions,
): Promise<T> {
  await beforeOpt(options);
  const url = `${GSC_WEBMASTERS_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await options.fetchImpl(url, {
    headers: { Authorization: `Bearer ${options.accessToken}` },
  });
  const body = await readGoogleApiJsonBody(res);
  const connector = options.connector ?? "gsc";
  if (!res.ok) {
    throw mapGoogleJsonApiHttpError(connector, res.status, body);
  }
  return body as T;
}

export async function gscWebmastersPost<T = unknown>(
  path: string,
  jsonBody: unknown,
  options: GscRequestOptions,
): Promise<T> {
  await beforeOpt(options);
  const url = `${GSC_WEBMASTERS_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await options.fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jsonBody),
  });
  const body = await readGoogleApiJsonBody(res);
  const connector = options.connector ?? "gsc";
  if (!res.ok) {
    throw mapGoogleJsonApiHttpError(connector, res.status, body);
  }
  return body as T;
}

export async function gscUrlInspectionPost<T = unknown>(
  jsonBody: unknown,
  options: GscRequestOptions,
): Promise<T> {
  await beforeOpt(options);
  const res = await options.fetchImpl(GSC_URL_INSPECTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jsonBody),
  });
  const body = await readGoogleApiJsonBody(res);
  const connector = options.connector ?? "gsc";
  if (!res.ok) {
    throw mapGoogleJsonApiHttpError(connector, res.status, body);
  }
  return body as T;
}

export function encodeGscSiteUrl(siteUrl: string): string {
  return encodeURIComponent(siteUrl);
}
