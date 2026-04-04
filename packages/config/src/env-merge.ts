function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge JSON-like objects. Arrays and primitives from `patch` replace the base value.
 */
export function deepMergeConfig(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(patch)) {
    const patchVal = patch[key];
    const baseVal = out[key];
    if (isPlainObject(patchVal) && isPlainObject(baseVal)) {
      out[key] = deepMergeConfig(baseVal, patchVal);
    } else {
      out[key] = patchVal;
    }
  }
  return out;
}

export function sanitizeCompanyIdForEnv(companyId: string): string {
  return companyId.replace(/-/g, "_");
}

/**
 * Env var suffix: `AGENTICVERDICT_COMPANY_MERGE_<uuid_with_underscores>` (case-insensitive on most platforms).
 */
export function companyConfigMergeEnvKey(companyId: string): string {
  return `AGENTICVERDICT_COMPANY_MERGE_${sanitizeCompanyIdForEnv(companyId)}`;
}

/**
 * Reads optional JSON merge patch from process.env for a tenant.
 */
export function readCompanyConfigMergeFromEnv(
  companyId: string,
): Record<string, unknown> | undefined {
  const key = companyConfigMergeEnvKey(companyId);
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === "") {
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error(
      `Environment variable ${key} must contain valid JSON (merge patch for company ${companyId})`,
    );
  }
  if (!isPlainObject(parsed)) {
    throw new Error(
      `Environment variable ${key} must be a JSON object (merge patch for company ${companyId})`,
    );
  }
  return parsed;
}
