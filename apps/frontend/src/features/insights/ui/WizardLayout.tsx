"use client";

import { ReactNode } from "react";
import { Box, Stack, Button, Group } from "@mantine/core";
import { StepIndicator, WizardStep } from "./StepIndicator";

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
  return (
    <Stack gap="md">
      <StepIndicator steps={steps} activeStep={activeStep} onStepClick={onStepChange} />

      <Box p="md">{children}</Box>

      <Group justify="space-between" p="md" style={{ borderTop: "1px solid #e9ecef" }}>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>

        <Group gap="xs">
          {activeStep > 0 && (
            <Button variant="outline" onClick={onBack} disabled={isLoading}>
              Back
            </Button>
          )}
          {isLastStep ? (
            <Button onClick={onNext} loading={isLoading} disabled={isNextDisabled}>
              Create Insight
            </Button>
          ) : (
            <Button onClick={onNext} loading={isLoading} disabled={isNextDisabled}>
              Next
            </Button>
          )}
        </Group>
      </Group>
    </Stack>
  );
}
