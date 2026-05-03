"use client";

import { Container } from "@mantine/core";
import { useParams } from "@/router/hooks/useParams";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { useTranslations } from "@/i18n/react";
import type { DashboardDomainSlug } from "@/features/dashboard/model/contracts";
import { DomainDashboardSurface } from "@/features/dashboard/ui/surfaces/DomainDashboardSurface";

export default function DomainDashboardPage() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const params = useParams({ strict: false }) as { domain?: string };
  const domain = params.domain as DashboardDomainSlug;
  const { isLoading } = useRequireAuth({ requireVerifiedEmail: true });

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: t(`domains.${domain}`), href: `/dashboard/${domain}` },
    ],
  });

  if (isLoading) {
    return (
      <Container py="xl">
        <div role="status">{t("async.loadingSection")}</div>
      </Container>
    );
  }

  return (
    <Container py="xl" size="lg">
      <DomainDashboardSurface domain={domain} />
    </Container>
  );
}
