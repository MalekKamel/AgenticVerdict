"use client";

import { Box, Stepper, rem } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: WizardStep[];
  activeStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export function StepIndicator({ steps, activeStep, onStepClick }: StepIndicatorProps) {
  return (
    <Box p="md" style={{ borderBottom: "1px solid #e9ecef" }}>
      <Stepper
        active={activeStep}
        onStepClick={onStepClick}
        allowNextStepsSelect={false}
        size="sm"
        styles={{
          root: {
            width: "100%",
          },
          content: {
            textAlign: "center",
          },
        }}
      >
        {steps.map((step, index) => (
          <Stepper.Step
            key={step.id}
            label={step.title}
            description={step.description}
            icon={index < activeStep ? <IconCheck size={rem(16)} /> : index + 1}
            completedIcon={<IconCheck size={rem(16)} />}
          />
        ))}
      </Stepper>
    </Box>
  );
}
