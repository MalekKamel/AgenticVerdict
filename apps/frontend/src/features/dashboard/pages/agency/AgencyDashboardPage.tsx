"use client";

import { Container } from "@mantine/core";

import { useAppShellHeader } from "@/components/layout/app-shell-context";
import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { useTranslations } from "@/i18n/react";
import { AgencyDashboardSurface } from "@/features/dashboard/ui/surfaces/AgencyDashboardSurface";

export default function AgencyDashboardPage() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const { isLoading } = useRequireAuth({ requireVerifiedEmail: true });

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: t("agency.title"), href: "/dashboard/agency" },
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
      <AgencyDashboardSurface />
    </Container>
  );
}
