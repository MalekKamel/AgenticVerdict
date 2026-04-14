"use client";

import { IconRefresh } from "@tabler/icons-react";
import { clsx } from "@agenticverdict/ui";
import type { HTMLAttributes } from "react";

import { AUTH_PEN } from "./authPenDesign";

export interface AuthPenLoadingIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  /** Accessible label (e.g. verifying email). */
  label: string;
}

/**
 * `Auth/LoadingIndicator` (`yShFU`) — 48×48 frame, 40px icon {@link AUTH_PEN.primary} (lucide `refresh-cw` in authentication.pen).
 */
export function AuthPenLoadingIndicator({
  label,
  className,
  ...props
}: AuthPenLoadingIndicatorProps) {
  return (
    <div
      role="status"
      aria-busy
      aria-label={label}
      className={clsx("inline-flex h-12 w-12 items-center justify-center", className)}
      {...props}
    >
      <IconRefresh
        className="h-10 w-10 shrink-0 animate-spin"
        style={{ color: AUTH_PEN.primary }}
        aria-hidden
      />
    </div>
  );
}
