"use client";

import { ReactNode } from "react";
import { Box, Stack, Button, Group, Divider } from "@mantine/core";
import { StepIndicator, WizardStep } from "./StepIndicator";
import { useTranslations } from "@/i18n/react";

interface WizardLayoutProps {
  steps: WizardStep[];
  activeStep: number;
  onStepChange: (stepIndex: number) => void;
  children: ReactNode;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
  isNextDisabled?: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
}

export function WizardLayout({
  steps,
  activeStep,
  onStepChange,
  children,
  onNext,
  onBack,
  onCancel,
  isNextDisabled = false,
  isLastStep = false,
  isLoading = false,
}: WizardLayoutProps) {
  const t = useTranslations("insights");

  return (
    <Stack gap="md">
      <StepIndicator steps={steps} activeStep={activeStep} onStepClick={onStepChange} />

      <Box p="md">{children}</Box>

      <Divider />
      <Group justify="space-between" p="md">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {t("wizard.cancel")}
        </Button>

        <Group gap="xs">
          {activeStep > 0 && (
            <Button variant="outline" onClick={onBack} disabled={isLoading}>
              {t("wizard.back")}
            </Button>
          )}
          {isLastStep ? (
            <Button onClick={onNext} loading={isLoading} disabled={isNextDisabled}>
              {t("wizard.create")}
            </Button>
          ) : (
            <Button onClick={onNext} loading={isLoading} disabled={isNextDisabled}>
              {t("wizard.next")}
            </Button>
          )}
        </Group>
      </Group>
    </Stack>
  );
}
