"use client";

import { Anchor, Container, Stack, Text } from "@mantine/core";

import { useAppShellHeader } from "@/components/layout/app-shell-context";
import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { useRoles } from "@/features/rbac/hooks/useRoles";
import { useTranslations } from "@/i18n/react";
import { Link } from "@/i18n/navigation";
import { HomeDashboardSurface } from "@/features/dashboard/ui/surfaces/HomeDashboardSurface";
import { isOnboardingWizardEnabled } from "@/features/onboarding/model/onboarding-readiness";

export default function DashboardHomePage() {
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const { user, isLoading } = useRequireAuth({ requireVerifiedEmail: true });
  const { hasRole } = useRoles();
  useAppShellHeader({
    breadcrumbs: [{ label: tNav("dashboard"), href: "/dashboard" }],
  });

  if (isLoading) {
    return (
      <Container py="xl">
        <Text role="status">{tCommon("loading")}</Text>
      </Container>
    );
  }

  const showFlags = hasRole("admin");
  const showOnboarding = isOnboardingWizardEnabled();

  return (
    <Container py="xl" size="lg">
      <Stack gap="xl">
        <Stack gap="xs">
          {showOnboarding ? (
            <Anchor component={Link} href="/onboarding">
              {tNav("onboarding")}
            </Anchor>
          ) : null}
          {showFlags ? (
            <Anchor component={Link} href="/dashboard/feature-flags">
              {tNav("featureFlags")}
            </Anchor>
          ) : null}
          <Anchor component={Link} href="/">
            {tNav("home")}
          </Anchor>
        </Stack>
        <HomeDashboardSurface user={user} />
      </Stack>
    </Container>
  );
}
