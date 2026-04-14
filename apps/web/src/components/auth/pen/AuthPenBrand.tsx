"use client";

import { IconShieldCheck } from "@tabler/icons-react";
import { clsx } from "@agenticverdict/ui";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

import { AUTH_PEN } from "./authPenDesign";

export interface AuthPenBrandProps {
  brandName: string;
  href?: string;
  className?: string;
  icon?: ReactNode;
}

/**
 * `Auth/Brand` (`VW3Se`) — gap 12px, lucide `shield-check` 40×40, wordmark 20px / 600.
 */
export function AuthPenBrand({ brandName, href = "/", className, icon }: AuthPenBrandProps) {
  const inner = (
    <>
      {icon ?? (
        <IconShieldCheck
          className="h-10 w-10 shrink-0"
          style={{ color: AUTH_PEN.primary }}
          aria-hidden
        />
      )}
      <span
        className="text-xl font-semibold tracking-tight"
        style={{ color: AUTH_PEN.textPrimary, fontSize: "1.25rem" }}
      >
        {brandName}
      </span>
    </>
  );

  return (
    <div className={clsx("mb-6 flex items-center justify-center gap-3", className)}>
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-3 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ outlineColor: AUTH_PEN.primary }}
        >
          {inner}
        </Link>
      ) : (
        <div className="inline-flex items-center gap-3">{inner}</div>
      )}
    </div>
  );
}
