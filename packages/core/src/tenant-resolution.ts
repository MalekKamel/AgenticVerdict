import { TenantSecurityError } from "./tenant-security-error";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const JWT_TENANT_CLAIM_KEYS = [
  "tenant_id",
  "company_id",
  "https://agenticverdict.dev/tenant_id",
  "https://agenticverdict.dev/company_id",
] as const;

export interface TenantResolutionSources {
  /** Raw request headers (any casing). */
  headers?: Record<string, string | string[] | undefined>;
  /** Host header value, may include port (e.g. acme.app.test:3000). */
  host?: string;
  /** Verified JWT payload (caller must validate the token first). */
  jwtClaims?: Record<string, unknown>;
}

export interface TenantResolutionOptions {
  /**
   * Base hostnames used for subdomain extraction (lowercase, no port).
   * Example: ["app.example.com", "localhost"].
   */
  trustedBaseDomains?: string[];
  /**
   * Maps the first subdomain label to a tenant UUID (e.g. lookup `companies.slug`).
   */
  resolveSlugToTenantId?: (slug: string) => Promise<string | undefined>;
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function normalizeHeaders(
  headers: Record<string, string | string[] | undefined> | undefined,
): Record<string, string | undefined> {
  if (!headers) {
    return {};
  }
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    const low = key.toLowerCase();
    const first = Array.isArray(value) ? value[0] : value;
    out[low] = first;
  }
  return out;
}

function tenantIdFromHeaders(headers: Record<string, string | undefined>): string | undefined {
  const fromTenant = headers["x-tenant-id"]?.trim();
  if (fromTenant && isUuid(fromTenant)) {
    return fromTenant;
  }
  const fromCompany = headers["x-company-id"]?.trim();
  if (fromCompany && isUuid(fromCompany)) {
    return fromCompany;
  }
  if (fromTenant || fromCompany) {
    throw new TenantSecurityError(
      "INVALID_TENANT_ID",
      "Tenant header must contain a valid UUID",
      400,
    );
  }
  return undefined;
}

function tenantIdFromJwtClaims(claims: Record<string, unknown>): string | undefined {
  for (const key of JWT_TENANT_CLAIM_KEYS) {
    const raw = claims[key];
    if (typeof raw !== "string") {
      continue;
    }
    const trimmed = raw.trim();
    if (isUuid(trimmed)) {
      return trimmed;
    }
    throw new TenantSecurityError(
      "INVALID_TENANT_ID",
      `JWT claim ${key} must be a valid UUID`,
      400,
    );
  }
  return undefined;
}

/**
 * Returns the subdomain label immediately to the left of a trusted base domain, if any.
 * @example host "acme.app.example.com", base "app.example.com" → "acme"
 */
export function extractTenantSlugFromHost(
  host: string,
  trustedBaseDomains: string[],
): string | undefined {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (!hostname) {
    return undefined;
  }
  for (const base of trustedBaseDomains) {
    const b = base.toLowerCase();
    if (hostname === b) {
      return undefined;
    }
    const suffix = `.${b}`;
    if (hostname.endsWith(suffix)) {
      const prefix = hostname.slice(0, -suffix.length).replace(/\.$/, "");
      if (!prefix) {
        return undefined;
      }
      const label = prefix.includes(".") ? prefix.split(".")[0] : prefix;
      return label.length > 0 ? label : undefined;
    }
  }
  return undefined;
}

/**
 * Resolves a tenant UUID from headers, JWT claims, and optionally subdomain → slug mapping.
 *
 * **Priority:** `x-tenant-id` / `x-company-id` → JWT claims → subdomain (requires `resolveSlugToTenantId`).
 */
export async function resolveTenantIdentity(
  sources: TenantResolutionSources,
  options: TenantResolutionOptions = {},
): Promise<{ ok: true; tenantId: string } | { ok: false; error: TenantSecurityError }> {
  try {
    const headers = normalizeHeaders(sources.headers);
    const fromHeader = tenantIdFromHeaders(headers);
    if (fromHeader) {
      return { ok: true, tenantId: fromHeader };
    }

    if (sources.jwtClaims) {
      const fromJwt = tenantIdFromJwtClaims(sources.jwtClaims);
      if (fromJwt) {
        return { ok: true, tenantId: fromJwt };
      }
    }

    const bases = options.trustedBaseDomains ?? [];
    if (sources.host && bases.length > 0) {
      const slug = extractTenantSlugFromHost(sources.host, bases);
      if (slug) {
        const resolver = options.resolveSlugToTenantId;
        if (!resolver) {
          return {
            ok: false,
            error: new TenantSecurityError(
              "TENANT_SLUG_UNRESOLVED",
              "Subdomain tenant requires resolveSlugToTenantId",
              400,
            ),
          };
        }
        const tenantId = await resolver(slug);
        if (!tenantId) {
          return {
            ok: false,
            error: new TenantSecurityError("MISSING_TENANT", "Unknown tenant slug in host", 403),
          };
        }
        if (!isUuid(tenantId)) {
          return {
            ok: false,
            error: new TenantSecurityError(
              "INVALID_TENANT_ID",
              "resolveSlugToTenantId must return a UUID",
              500,
            ),
          };
        }
        return { ok: true, tenantId };
      }
    }

    return {
      ok: false,
      error: new TenantSecurityError(
        "MISSING_TENANT",
        "No tenant could be resolved from the request",
        401,
      ),
    };
  } catch (err) {
    if (err instanceof TenantSecurityError) {
      return { ok: false, error: err };
    }
    throw err;
  }
}
