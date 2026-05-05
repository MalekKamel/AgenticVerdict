"use client";

import { Stack, Select, Slider, Textarea, Group, Text, Box } from "@mantine/core";
import { useFormContext, Controller } from "react-hook-form";

interface AISettingsValues {
  model: string;
  quality: number;
  detailLevel: string;
  customPrompt?: string;
}

interface AISettingsStepProps {
  models: { value: string; label: string }[];
}

export function AISettingsStep({ models }: AISettingsStepProps) {
  const { register, control, watch, setValue } = useFormContext<AISettingsValues>();

  const quality = watch("quality") ?? 50;

  return (
    <Stack gap="md">
      <Controller
        name="model"
        control={control}
        rules={{
          required: "Model is required",
        }}
        render={({ field, fieldState: { error } }) => (
          <Select
            label="AI Model"
            placeholder="Select model"
            data={models}
            {...field}
            error={error?.message}
            description="Claude 3.5 Sonnet recommended for best results"
          />
        )}
      />

      <Box>
        <Group justify="space-between" mb="xs">
          <Text fw={500}>Analysis Quality</Text>
          <Text size="sm" c="dimmed">
            {quality}%
          </Text>
        </Group>
        <Slider
          value={quality}
          onChange={(value) => {
            setValue("quality", value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
          }}
          marks={[
            { value: 25, label: "Fast" },
            { value: 50, label: "Balanced" },
            { value: 75, label: "Detailed" },
            { value: 100, label: "Comprehensive" },
          ]}
          step={25}
          min={0}
          max={100}
        />
        <Text size="xs" c="dimmed" mt="xs">
          Higher quality provides more detailed analysis but takes longer to generate
        </Text>
      </Box>

      <Controller
        name="detailLevel"
        control={control}
        rules={{
          required: "Detail level is required",
        }}
        render={({ field, fieldState: { error } }) => (
          <Select
            label="Detail Level"
            placeholder="Select detail level"
            data={[
              { value: "executive", label: "Executive Summary" },
              { value: "standard", label: "Standard Analysis" },
              { value: "comprehensive", label: "Comprehensive Report" },
            ]}
            {...field}
            error={error?.message}
          />
        )}
      />

      <Textarea
        label="Custom Instructions (Optional)"
        placeholder="Add specific instructions for the AI analyst..."
        autosize
        minRows={4}
        {...register("customPrompt")}
        description="Guide the AI to focus on specific aspects of your data"
      />
    </Stack>
  );
}
