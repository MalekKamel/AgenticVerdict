import type { ConnectorType } from "@agenticverdict/types";

import { PlatformAuthError, PlatformError, PlatformRateLimitError } from "../errors";

function extractGoogleRpcError(body: unknown): { message: string; status?: string } | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const err = (body as { error?: unknown }).error;
  if (typeof err !== "object" || err === null) {
    return null;
  }
  const message = (err as { message?: unknown }).message;
  const status = (err as { status?: unknown }).status;
  return {
    message: typeof message === "string" ? message : "",
    status: typeof status === "string" ? status : undefined,
  };
}

/**
 * Maps Google JSON / gRPC-style error bodies to {@link PlatformError} subclasses.
 */
export function mapGoogleJsonApiHttpError(
  connector: ConnectorType,
  status: number,
  body: unknown,
): Error {
  const rpc = extractGoogleRpcError(body);
  const message =
    rpc?.message && rpc.message.length > 0
      ? rpc.message
      : `Google API responded with HTTP ${status}`;

  if (status === 401 || status === 403) {
    return new PlatformAuthError(connector, message, { cause: body });
  }
  if (
    status === 429 ||
    /RESOURCE_EXHAUSTED|RATE_LIMIT|quota/i.test(message) ||
    rpc?.status === "RESOURCE_EXHAUSTED"
  ) {
    return new PlatformRateLimitError(connector, message, { cause: body });
  }
  if (status === 404) {
    return new PlatformError(connector, "not_found", message, { cause: body });
  }
  if (status >= 400 && status < 500) {
    return new PlatformError(connector, "invalid_request", message, { cause: body });
  }
  return new PlatformError(connector, "upstream_error", message, { cause: body });
}

export async function readGoogleApiJsonBody(res: Response): Promise<unknown> {
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
