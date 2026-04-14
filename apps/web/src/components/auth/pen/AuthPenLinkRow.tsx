"use client";

import { clsx } from "@agenticverdict/ui";
import type { HTMLAttributes } from "react";

import { AUTH_PEN } from "./authPenDesign";

/**
 * `Auth/LinkRow` (`aLZcA`) — full width, `space-between`, 14px links ({@link AUTH_PEN.primary}).
 */
export function AuthPenLinkRow({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "flex w-full max-w-[400px] flex-row flex-wrap items-center justify-between gap-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * `Auth/Text/Muted` (`6DckF`) — centered 14px caption {@link AUTH_PEN.textSecondary}.
 */
export function AuthPenLinkText({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={clsx("m-0 w-full max-w-[400px] text-center text-sm", className)}
      style={{ color: AUTH_PEN.textSecondary }}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * `Auth/ActionsRow` (`d9wnR`) — centered row, gap 12px.
 */
export function AuthPenActionsRow({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "flex w-full max-w-[400px] flex-wrap items-center justify-center gap-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * `Auth/FooterCenter` (`ih55w`) — centered row, gap 8px.
 */
export function AuthPenFooterCenter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "flex w-full max-w-[400px] flex-wrap items-center justify-center gap-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
