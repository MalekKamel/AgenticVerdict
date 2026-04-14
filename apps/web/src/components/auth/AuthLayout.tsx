/**
 * AuthLayout — authentication shell using `@agenticverdict/ui` (`Card`, `Typography`)
 * mapped from `design-system/molecules/card.pen` and typography tokens.
 */

"use client";

import { Card, Typography } from "@agenticverdict/ui";
import { useTranslations } from "@/i18n/react";
import { forwardRef, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

interface AuthNavLinks {
  registerLabel?: string;
  loginLabel?: string;
  forgotPasswordLabel?: string;
}

export interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  navLinks?: AuthNavLinks;
  className?: string;
  showSkipLink?: boolean;
}

export const AuthLayout = forwardRef<HTMLDivElement, AuthLayoutProps>(
  ({ children, title, description, navLinks, className, showSkipLink = true }, ref) => {
    const t = useTranslations();

    return (
      <div
        ref={ref}
        className={`flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 ${className ?? ""}`}
      >
        {showSkipLink ? (
          <a href="#main-content" className="skip-link">
            {t("accessibility.skipToContent")}
          </a>
        ) : null}

        <div className="w-full max-w-[480px]">
          <Card variant="elevated" padding="lg" className="w-full">
            <div className="mb-2 text-center">
              <Link href="/" className="inline-flex items-center justify-center no-underline">
                <Typography
                  variant="h3"
                  color="primary"
                  weight="bold"
                  as="span"
                  className="tracking-tight"
                >
                  Masafh
                </Typography>
              </Link>
            </div>

            {title || description ? (
              <div className="mb-6 text-center">
                {title ? (
                  <Typography variant="h1" className="mb-2">
                    {title}
                  </Typography>
                ) : null}
                {description ? (
                  <Typography variant="body-sm" color="secondary">
                    {description}
                  </Typography>
                ) : null}
              </div>
            ) : null}

            <div
              id="main-content"
              role="main"
              aria-label={t("auth.layout.mainContent")}
              className="flex flex-col gap-4"
            >
              {children}
            </div>

            {navLinks ? (
              <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-4 text-center">
                {navLinks.registerLabel ? (
                  <Link href="/auth/register" className="text-sm text-blue-600 hover:underline">
                    {navLinks.registerLabel}
                  </Link>
                ) : null}
                {navLinks.loginLabel ? (
                  <Link href="/auth/login" className="text-sm text-blue-600 hover:underline">
                    {navLinks.loginLabel}
                  </Link>
                ) : null}
                {navLinks.forgotPasswordLabel ? (
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {navLinks.forgotPasswordLabel}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    );
  },
);

AuthLayout.displayName = "AuthLayout";

export default AuthLayout;
