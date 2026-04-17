/** HttpOnly session cookie carrying the same HS256 JWT as `Authorization: Bearer`. */
export const SESSION_COOKIE_NAME = "av_session";

export function parseSessionCookie(
  cookieHeader: string | undefined,
  name: string = SESSION_COOKIE_NAME,
): string | undefined {
  if (!cookieHeader || !cookieHeader.length) {
    return undefined;
  }
  const parts = cookieHeader.split(";").map((s) => s.trim());
  const prefix = `${name}=`;
  for (const p of parts) {
    if (p.startsWith(prefix)) {
      const raw = p.slice(prefix.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return undefined;
}

export function buildSessionSetCookieHeader(
  token: string,
  options: { maxAgeSeconds: number; secure: boolean },
): string {
  const segments = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`,
  ];
  if (options.secure) {
    segments.push("Secure");
  }
  return segments.join("; ");
}

export function buildSessionClearCookieHeader(secure: boolean): string {
  const segments = [`${SESSION_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) {
    segments.push("Secure");
  }
  return segments.join("; ");
}
