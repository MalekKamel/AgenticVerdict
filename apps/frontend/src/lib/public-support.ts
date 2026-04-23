/**
 * Public support contact surfaced on unauthenticated help pages.
 * Prefer `VITE_PUBLIC_SUPPORT_EMAIL` for white-label / ops-owned values.
 */
export function getPublicSupportEmail(): string | undefined {
  const raw =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_SUPPORT_EMAIL) ||
    (typeof process !== "undefined" && process.env.VITE_PUBLIC_SUPPORT_EMAIL);
  if (typeof raw !== "string") {
    return undefined;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
