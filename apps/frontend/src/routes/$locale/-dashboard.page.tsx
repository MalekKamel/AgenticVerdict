"use client";

import { Anchor, Container, Stack, Text, Title } from "@mantine/core";

import { useAppShellHeader } from "@/components/layout/app-shell-context";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { isFeatureFlagsAdminUiEnabled } from "@/lib/feature-flags/feature-flags-readiness";
import { isOnboardingWizardEnabled } from "@/lib/onboarding/onboarding-readiness";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";

export default function DashboardPage() {
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const { user, isLoading } = useRequireAuth({ requireVerifiedEmail: true });
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

  const showFlags = isFeatureFlagsAdminUiEnabled();
  const showOnboarding = isOnboardingWizardEnabled();

  return (
    <Container py="xl">
      <Stack gap="md">
        <Title order={1}>{tNav("dashboard")}</Title>
        <Text>{user?.email}</Text>
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
        </Stack>
        <Anchor component={Link} href="/">
          {tNav("home")}
        </Anchor>
      </Stack>
    </Container>
  );
}
