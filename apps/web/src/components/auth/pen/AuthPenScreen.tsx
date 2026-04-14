"use client";

import { clsx } from "@agenticverdict/ui";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { AUTH_PEN } from "./authPenDesign";

export interface AuthPenScreenProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * `Auth/Screen` (`uimay`) — max width 800px, padding 32px (`px-8 py-8`), centered column, bg {@link AUTH_PEN.screenBg}.
 */
export const AuthPenScreen = forwardRef<HTMLDivElement, AuthPenScreenProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "mx-auto flex min-h-screen w-full max-w-[800px] flex-col items-center justify-center px-8 py-8",
          className,
        )}
        style={{ backgroundColor: AUTH_PEN.screenBg }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

AuthPenScreen.displayName = "AuthPenScreen";
