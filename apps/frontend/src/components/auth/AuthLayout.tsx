/**
 * AuthLayout — authentication shell using Mantine `Card`, `Title`, `Text`.
 */

"use client";

import { Card, Text, Title } from "@mantine/core";
import { IconMapRoute } from "@tabler/icons-react";
import { useRouterState } from "@tanstack/react-router";
import { useTranslations } from "@/i18n/react";
import { forwardRef, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

import { AUTH_TEXT_LINK_CLASS } from "@/components/auth/authUi";
import { resolveAuthBrandName } from "@/lib/auth/resolve-auth-brand-name";

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
  /** When true, shows Terms / Privacy / Help links below optional account navigation. */
  showLegalFooter?: boolean;
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
      showLegalFooter = true,
    },
    ref,
  ) => {
    const t = useTranslations("accessibility");
    const tLayout = useTranslations("auth");
    const matches = useRouterState({ select: (s) => s.matches });
    const brandName = resolveAuthBrandName(matches);

    return (
      <div ref={ref} className={`auth-shell${className ? ` ${className}` : ""}`}>
        {showSkipLink ? (
          <a href="#main-content" className="skip-link">
            {t("skipToContent")}
          </a>
        ) : null}

        <div className="w-full max-w-[min(100%,28rem)]">
          <Card withBorder shadow="md" padding="lg" radius="lg" className="w-full">
            <div className="mb-6 flex flex-col items-center gap-3 text-center">
              <Link
                href="/"
                className="group inline-flex flex-col items-center justify-center gap-2 no-underline"
                aria-label={tLayout("layout.homeAriaLabel", { brand: brandName })}
              >
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--mantine-primary-color-light)] text-[var(--mantine-primary-color-light-color)] transition-transform duration-150 group-hover:scale-[1.02] group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--mantine-primary-color-filled)]"
                  aria-hidden
                >
                  <IconMapRoute size={26} stroke={1.75} />
                </span>
                <Text
                  size="lg"
                  fw={700}
                  c="var(--mantine-primary-color-filled)"
                  component="span"
                  className="tracking-tight"
                >
                  {brandName}
                </Text>
              </Link>
            </div>

            {title || description ? (
              <div className="mb-7 space-y-2 text-center">
                {title ? (
                  <Title order={1} className="text-balance">
                    {title}
                  </Title>
                ) : null}
                {description ? (
                  <Text
                    size="sm"
                    c="dimmed"
                    className="mx-auto max-w-prose text-pretty leading-relaxed"
                  >
                    {description}
                  </Text>
                ) : null}
              </div>
            ) : null}

            <main
              id="main-content"
              tabIndex={-1}
              aria-label={tLayout("layout.mainContent")}
              className="flex flex-col gap-5"
            >
              {children}
            </main>

            {navLinks ? (
              <div className="mt-8 border-t border-[var(--av-color-border-subtle)] pt-5">
                <nav
                  className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6"
                  aria-label={tLayout("layout.footerNav")}
                >
                  {navLinks.registerLabel ? (
                    <Link href="/auth/register" className={AUTH_TEXT_LINK_CLASS}>
                      {navLinks.registerLabel}
                    </Link>
                  ) : null}
                  {navLinks.loginLabel ? (
                    <Link href="/auth/login" className={AUTH_TEXT_LINK_CLASS}>
                      {navLinks.loginLabel}
                    </Link>
                  ) : null}
                  {navLinks.forgotPasswordLabel ? (
                    <Link href="/auth/forgot-password" className={AUTH_TEXT_LINK_CLASS}>
                      {navLinks.forgotPasswordLabel}
                    </Link>
                  ) : null}
                </nav>
              </div>
            ) : null}

            {showLegalFooter ? (
              <div className="mt-6 border-t border-[var(--av-color-border-subtle)] pt-4">
                <nav aria-label={tLayout("layout.legalNavLabel")}>
                  <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-x-4 gap-y-2 p-0 text-center">
                    <li>
                      <Link href="/auth/terms" className={AUTH_TEXT_LINK_CLASS}>
                        {tLayout("layout.terms")}
                      </Link>
                    </li>
                    <li>
                      <Link href="/auth/privacy" className={AUTH_TEXT_LINK_CLASS}>
                        {tLayout("layout.privacy")}
                      </Link>
                    </li>
                    <li>
                      <Link href="/auth/help" className={AUTH_TEXT_LINK_CLASS}>
                        {tLayout("layout.help")}
                      </Link>
                    </li>
                  </ul>
                </nav>
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
