/**
 * Shared class names for the auth experience — one source of truth for
 * in-card links, consistent focus rings (WCAG), and RTL-friendly `outline`.
 */

import type { ReactNode } from "react";

export const AUTH_TEXT_LINK_CLASS =
  "text-sm font-medium text-[var(--av-color-primary)] underline-offset-2 transition-colors hover:text-[var(--av-color-primary-600)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--av-color-primary)]";

/** Filled bar track — uses Mantine surface tokens (light/dark). */
export const AUTH_TRACK_MUTED_CLASS =
  "h-2 w-full overflow-hidden rounded-full bg-[var(--mantine-color-default-hover)]";

export function getDirectionalSectionProps(
  icon: ReactNode,
  isRtl: boolean,
): { leftSection?: ReactNode; rightSection?: ReactNode } {
  return isRtl ? { rightSection: icon } : { leftSection: icon };
}
