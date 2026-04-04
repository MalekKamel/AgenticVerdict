/**
 * Builds a Redis (or other shared) cache key scoped to a tenant.
 * Colons in `segments` are replaced to avoid accidental key structure breaks.
 */
export function tenantScopedCacheKey(tenantId: string, ...segments: string[]): string {
  const encoded = segments.map((s) => s.replace(/:/g, "_"));
  return `t:${tenantId}:${encoded.join(":")}`;
}
