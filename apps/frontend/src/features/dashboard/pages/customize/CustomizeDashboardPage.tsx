"use client";

import { Container } from "@mantine/core";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { useTranslations } from "@/i18n/react";
import { CustomizeDashboardPage as CustomizeDashboardSurface } from "@/features/dashboard/ui/surfaces/CustomizeDashboardPage";

export default function CustomizeDashboardPage() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const { user, isLoading } = useRequireAuth({ requireVerifiedEmail: true });

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: t("customize.title"), href: "/dashboard/customize" },
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
      <CustomizeDashboardSurface user={user} />
    </Container>
  );
}
