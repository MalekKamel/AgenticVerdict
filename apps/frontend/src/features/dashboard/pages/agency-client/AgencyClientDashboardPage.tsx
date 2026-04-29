"use client";

import { Container } from "@mantine/core";
import { useParams } from "@tanstack/react-router";

import { useAppShellHeader } from "@/components/layout/app-shell-context";
import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { useTranslations } from "@/i18n/react";
import { HomeDashboardSurface } from "@/features/dashboard/ui/surfaces/HomeDashboardSurface";

export default function AgencyClientDashboardPage() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const params = useParams({ strict: false }) as { clientId?: string };
  const clientId = params.clientId ?? "";
  const { user, isLoading } = useRequireAuth({ requireVerifiedEmail: true });

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: t("agency.title"), href: "/dashboard/agency" },
      { label: clientId || "…", href: `/dashboard/agency/${clientId}` },
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
      <HomeDashboardSurface user={user} scopedClientId={clientId || undefined} />
    </Container>
  );
}
