"use client";

import { Container } from "@mantine/core";
import { useEffect, useRef } from "react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { useTranslations } from "@/i18n/react";
import { AgencyDashboardSurface } from "@/features/dashboard/ui/surfaces/AgencyDashboardSurface";
import { useTenantType } from "@/features/auth/hooks/useTenantType";
import { useRouter } from "@/i18n/navigation";

export default function AgencyDashboardPage() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const router = useRouter();
  const redirectOnce = useRef(false);

  const { isLoading: authLoading, isReady } = useRequireAuth({ requireVerifiedEmail: true });
  const { capabilities, isLoading: tenantLoading } = useTenantType();

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: t("agency.title"), href: "/dashboard/agency" },
    ],
  });

  useEffect(() => {
    if (authLoading || tenantLoading || !isReady) {
      return;
    }
    if (!capabilities.canAccessAgencyDashboard && !redirectOnce.current) {
      redirectOnce.current = true;
      router.replace("/dashboard");
    }
  }, [authLoading, tenantLoading, isReady, capabilities.canAccessAgencyDashboard, router]);

  const gatePending =
    authLoading || tenantLoading || !isReady || !capabilities.canAccessAgencyDashboard;

  if (gatePending) {
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
