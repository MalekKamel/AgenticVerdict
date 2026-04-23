/**
 * Locale-scaffolded legal / help copy for auth-adjacent routes (Mantine typography).
 */

"use client";

import { Anchor, Stack, Text, Title } from "@mantine/core";
import { useRouterState } from "@tanstack/react-router";
import { useTranslations } from "@/i18n/react";

import { Link } from "@/i18n/navigation";
import { AUTH_TEXT_LINK_CLASS } from "@/components/auth/authUi";
import { resolveAuthBrandName } from "@/lib/auth/resolve-auth-brand-name";
import { getPublicSupportEmail } from "@/lib/public-support";

type LegalDoc = "terms" | "privacy";

export function AuthLegalDocument({ doc }: { doc: LegalDoc }) {
  const t = useTranslations("auth");
  const matches = useRouterState({ select: (s) => s.matches });
  const brandName = resolveAuthBrandName(matches);

  return (
    <Stack component="article" gap="lg" aria-labelledby={`auth-legal-${doc}-title`}>
      <header className="space-y-2">
        <Title order={1} id={`auth-legal-${doc}-title`} className="text-balance">
          {t(`legal.${doc}.title`)}
        </Title>
        <Text size="sm" c="dimmed">
          {t(`legal.${doc}.lastUpdated`)}
        </Text>
      </header>

      <section className="space-y-2" aria-labelledby={`auth-legal-${doc}-s1-h`}>
        <Title order={2} id={`auth-legal-${doc}-s1-h`} className="text-lg">
          {t(`legal.${doc}.section1Title`)}
        </Title>
        <Text size="sm" className="max-w-prose text-pretty leading-relaxed">
          {t(`legal.${doc}.section1Body`, { brand: brandName })}
        </Text>
      </section>

      <section className="space-y-2" aria-labelledby={`auth-legal-${doc}-s2-h`}>
        <Title order={2} id={`auth-legal-${doc}-s2-h`} className="text-lg">
          {t(`legal.${doc}.section2Title`)}
        </Title>
        <Text size="sm" className="max-w-prose text-pretty leading-relaxed">
          {t(`legal.${doc}.section2Body`)}
        </Text>
      </section>

      <section className="space-y-2" aria-labelledby={`auth-legal-${doc}-s3-h`}>
        <Title order={2} id={`auth-legal-${doc}-s3-h`} className="text-lg">
          {t(`legal.${doc}.section3Title`)}
        </Title>
        <Text size="sm" className="max-w-prose text-pretty leading-relaxed">
          {t(`legal.${doc}.section3Body`)}
        </Text>
      </section>

      <footer className="border-t border-[var(--av-color-border-subtle)] pt-4">
        <Text size="sm" c="dimmed">
          {t(`legal.${doc}.footerNote`)}{" "}
          <Link href="/auth/login" className={AUTH_TEXT_LINK_CLASS}>
            {t(`legal.${doc}.backToSignIn`)}
          </Link>
        </Text>
      </footer>
    </Stack>
  );
}

export function AuthHelpContent() {
  const t = useTranslations("auth");
  const supportEmail = getPublicSupportEmail() ?? t("help.supportEmailDefault");

  return (
    <Stack component="article" gap="md" aria-labelledby="auth-help-title">
      <Title order={1} id="auth-help-title" className="text-balance">
        {t("help.title")}
      </Title>
      <Text size="sm" c="dimmed" className="max-w-prose text-pretty leading-relaxed">
        {t("help.description")}
      </Text>
      <Text size="sm" className="max-w-prose leading-relaxed">
        {t("help.supportIntro")}{" "}
        <Anchor href={`mailto:${supportEmail}`} className={AUTH_TEXT_LINK_CLASS}>
          {supportEmail}
        </Anchor>
      </Text>
      <Text size="sm" c="dimmed" className="max-w-prose leading-relaxed">
        {t("help.hoursNote")}
      </Text>
      <nav aria-label={t("layout.legalNavLabel")} className="flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/auth/terms" className={AUTH_TEXT_LINK_CLASS}>
          {t("layout.terms")}
        </Link>
        <Link href="/auth/privacy" className={AUTH_TEXT_LINK_CLASS}>
          {t("layout.privacy")}
        </Link>
      </nav>
      <footer className="border-t border-[var(--av-color-border-subtle)] pt-4">
        <Link href="/auth/login" className={AUTH_TEXT_LINK_CLASS}>
          {t("help.backToSignIn")}
        </Link>
      </footer>
    </Stack>
  );
}
