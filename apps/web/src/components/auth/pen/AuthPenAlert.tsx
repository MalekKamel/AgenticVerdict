"use client";

import { clsx } from "@agenticverdict/ui";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import type { HTMLAttributes, ReactNode } from "react";

import { AUTH_PEN } from "./authPenDesign";

export interface AuthPenAlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant: "error" | "success";
  /** Optional heading; `x04Fm` is icon + message only — use for API-style alerts. */
  title?: ReactNode;
  children: ReactNode;
}

/**
 * `Auth/Alert/Error` (`x04Fm`) and `Auth/Alert/Success` (`5KAp1`) from authentication.pen.
 */
export function AuthPenAlert({ variant, title, children, className, ...props }: AuthPenAlertProps) {
  const isError = variant === "error";
  const bg = isError ? AUTH_PEN.errorSurface : AUTH_PEN.successSurface;
  const fg = isError ? AUTH_PEN.error : AUTH_PEN.success;
  const border = fg;

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={clsx(
        "flex w-full max-w-[400px] flex-row items-start rounded-lg border text-sm font-normal",
        className,
      )}
      style={{
        backgroundColor: bg,
        borderColor: border,
        color: fg,
        gap: AUTH_PEN.alertGapPx,
        padding: AUTH_PEN.alertPaddingPx,
      }}
      {...props}
    >
      <span
        className="inline-flex shrink-0"
        aria-hidden
        style={{ width: AUTH_PEN.alertIconPx, height: AUTH_PEN.alertIconPx }}
      >
        {isError ? (
          <IconAlertCircle size={AUTH_PEN.alertIconPx} stroke={1.5} style={{ color: fg }} />
        ) : (
          <IconCheck size={AUTH_PEN.alertIconPx} stroke={3} style={{ color: fg }} />
        )}
      </span>
      <div className="min-w-0 flex-1" style={{ color: fg }}>
        {title ? <p className="m-0 mb-1 font-semibold">{title}</p> : null}
        <div className="m-0 [&_a]:font-normal [&_a]:underline [&_a]:decoration-from-font">
          {children}
        </div>
      </div>
    </div>
  );
}
