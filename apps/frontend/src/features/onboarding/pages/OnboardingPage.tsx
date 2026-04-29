"use client";

import { Button, Container, Group, Stack, Stepper, Text, Title } from "@mantine/core";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useAppShellHeader } from "@/components/layout/app-shell-context";
import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";
import { logOnboardingEvent } from "@/features/onboarding/model/onboarding-analytics";
import { isOnboardingWizardEnabled } from "@/features/onboarding/model/onboarding-readiness";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const { isLoading } = useRequireAuth();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { locale?: string };
  const locale = params.locale ?? "en";
  const enabled = isOnboardingWizardEnabled();
  const [active, setActive] = useState(0);
  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: tNav("onboarding"), href: "/onboarding" },
    ],
  });

  useEffect(() => {
    if (!enabled) {
      navigate({ to: `/${locale}/dashboard`, replace: true });
    }
  }, [enabled, locale, navigate]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (active === 0) {
      logOnboardingEvent("step_view", { step: "welcome", index: 0 });
    }
  }, [active, enabled]);

  if (!enabled) {
    return (
      <Container py="xl">
        <Text role="status">{tCommon("loading")}</Text>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container py="xl">
        <Text role="status">{tCommon("loading")}</Text>
      </Container>
    );
  }

  const next = () => {
    const nextIndex = active + 1;
    setActive(nextIndex);
    if (nextIndex === 1) {
      logOnboardingEvent("step_complete", { step: "welcome", index: 0 });
      logOnboardingEvent("step_view", { step: "preferences", index: 1 });
    }
    if (nextIndex === 2) {
      logOnboardingEvent("step_complete", { step: "preferences", index: 1 });
      logOnboardingEvent("step_view", { step: "complete", index: 2 });
    }
  };

  const finish = () => {
    logOnboardingEvent("wizard_complete", { step: "complete", index: 2 });
    navigate({ to: `/${locale}/dashboard`, replace: true });
  };

  return (
    <Container py="xl" size="sm">
      <Stack gap="lg">
        <Title order={1}>{t("title")}</Title>
        <Text c="dimmed">{t("subtitle")}</Text>
        <Stepper active={active} onStepClick={setActive}>
          <Stepper.Step label={t("stepWelcomeLabel")} description={t("stepWelcomeDescription")}>
            <Text>{t("stepWelcomeBody")}</Text>
          </Stepper.Step>
          <Stepper.Step
            label={t("stepPreferencesLabel")}
            description={t("stepPreferencesDescription")}
          >
            <Text>{t("stepPreferencesBody")}</Text>
          </Stepper.Step>
          <Stepper.Step label={t("stepDoneLabel")} description={t("stepDoneDescription")}>
            <Text>{t("stepDoneBody")}</Text>
          </Stepper.Step>
        </Stepper>
        <Group justify="space-between">
          <Button variant="default" component={Link} href="/dashboard">
            {tNav("dashboard")}
          </Button>
          <Group>
            {active < 2 ? (
              <Button onClick={next}>{t("continue")}</Button>
            ) : (
              <Button onClick={finish}>{t("finish")}</Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Container>
  );
}
