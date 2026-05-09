"use client";

import { Box, Stepper, rem, Divider, Stack } from "@mantine/core";
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
    <Stack gap={0}>
      <Box p="md">
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
      <Divider />
    </Stack>
  );
}
