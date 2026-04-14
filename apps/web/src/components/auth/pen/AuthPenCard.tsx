"use client";

import { clsx } from "@agenticverdict/ui";
import type { HTMLAttributes, ReactNode } from "react";

import { AUTH_PEN } from "./authPenDesign";

export interface AuthPenCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}

/**
 * `Auth/Card` (yMbmO): 440px max width, 8px radius, white fill, outer shadow from .pen.
 */
export function AuthPenCard({ title, subtitle, children, className, ...props }: AuthPenCardProps) {
  const hasHeader = Boolean(title ?? subtitle);

  return (
    <div
      className={clsx("w-full overflow-hidden rounded-lg bg-white", className)}
      style={{
        maxWidth: AUTH_PEN.cardMaxWidthPx,
        boxShadow: AUTH_PEN.cardShadow,
      }}
      {...props}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-2 p-6 pb-6">
          {title ? (
            <h1 className="m-0 text-2xl font-semibold" style={{ color: AUTH_PEN.textPrimary }}>
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="m-0 text-sm font-normal" style={{ color: AUTH_PEN.textSecondary }}>
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={clsx("flex flex-col gap-4 px-6 pb-6", hasHeader ? "pt-0" : "pt-6")}>
        {children}
      </div>
    </div>
  );
}
