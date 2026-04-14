/**
 * AuthLayout — shell mapped from `design/features/auth.pen`
 * (`AuthPenScreen`, `AuthPenBrand`, `AuthPenCard` / k9d2u screens).
 */

"use client";

import { useTranslations } from "@/i18n/react";
import { forwardRef, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

import { AuthPenBrand, AuthPenCard, AuthPenScreen } from "@/components/auth/pen";
import { AUTH_PEN } from "@/components/auth/pen/authPenDesign";

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
  /** When set, children render below the brand without {@link AuthPenCard} (for flows that supply their own card). */
  childrenOnly?: boolean;
  /** Override default shield icon (e.g. verify-email screen uses mail in authentication.pen). */
  brandIcon?: ReactNode;
}

export const AuthLayout = forwardRef<HTMLDivElement, AuthLayoutProps>(
  (
    {
      children,
      title,
      description,
      navLinks,
      className,
      showSkipLink = true,
      childrenOnly = false,
      brandIcon,
    },
    ref,
  ) => {
    const t = useTranslations();
    const brandName = t("common.brand");

    return (
      <AuthPenScreen ref={ref} className={className}>
        {showSkipLink ? (
          <a href="#main-content" className="skip-link">
            {t("accessibility.skipToContent")}
          </a>
        ) : null}

        <AuthPenBrand brandName={brandName} icon={brandIcon} />

        {childrenOnly ? (
          <div className="w-full max-w-[440px]">{children}</div>
        ) : (
          <AuthPenCard title={title} subtitle={description}>
            <div className="flex flex-col gap-4">
              <div
                id="main-content"
                role="main"
                aria-label={t("auth.layout.mainContent")}
                className="flex flex-col gap-4"
              >
                {children}
              </div>

              {navLinks ? (
                <nav
                  className="mt-2 flex flex-col gap-3 border-t pt-6 text-center"
                  style={{ borderColor: AUTH_PEN.borderDefault }}
                  aria-label={t("auth.layout.mainContent")}
                >
                  {navLinks.registerLabel ? (
                    <Link
                      href="/auth/register"
                      className="text-sm font-normal no-underline hover:underline"
                      style={{ color: AUTH_PEN.primary }}
                    >
                      {navLinks.registerLabel}
                    </Link>
                  ) : null}
                  {navLinks.loginLabel ? (
                    <Link
                      href="/auth/login"
                      className="text-sm font-normal no-underline hover:underline"
                      style={{ color: AUTH_PEN.primary }}
                    >
                      {navLinks.loginLabel}
                    </Link>
                  ) : null}
                  {navLinks.forgotPasswordLabel ? (
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm font-normal no-underline hover:underline"
                      style={{ color: AUTH_PEN.primary }}
                    >
                      {navLinks.forgotPasswordLabel}
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </div>
          </AuthPenCard>
        )}
      </AuthPenScreen>
    );
  },
);

AuthLayout.displayName = "AuthLayout";

export default AuthLayout;
