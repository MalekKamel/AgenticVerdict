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
