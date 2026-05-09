"use client";

import { Stack, Select, Slider, Textarea, Group, Text, Box } from "@mantine/core";
import { useFormContext, Controller } from "react-hook-form";
import { useTranslations } from "@/i18n/react";

interface AISettingsValues {
  model: string;
  quality: number;
  detailLevel: string;
  customPrompt?: string;
}

interface AISettingsStepProps {
  models: { value: string; label: string }[];
  detailLevelOptions: { value: string; label: string }[];
}

export function AISettingsStep({ models, detailLevelOptions }: AISettingsStepProps) {
  const t = useTranslations("insights");
  const { register, control, watch, setValue } = useFormContext<AISettingsValues>();

  const quality = watch("quality") ?? 50;

  return (
    <Stack gap="md">
      <Controller
        name="model"
        control={control}
        rules={{
          required: "MODEL_REQUIRED",
        }}
        render={({ field, fieldState: { error } }) => (
          <Select
            label={t("wizard.steps.ai.modelLabel")}
            placeholder={t("wizard.steps.ai.modelPlaceholder")}
            data={models}
            {...field}
            error={error?.message}
            description={t("wizard.steps.ai.modelDescription")}
          />
        )}
      />

      <Box>
        <Group justify="space-between" mb="xs">
          <Text fw={500}>{t("wizard.steps.ai.qualityLabel")}</Text>
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
            { value: 25, label: t("wizard.steps.ai.qualityFast") },
            { value: 50, label: t("wizard.steps.ai.qualityBalanced") },
            { value: 75, label: t("wizard.steps.ai.qualityDetailed") },
            { value: 100, label: t("wizard.steps.ai.qualityComprehensive") },
          ]}
          step={25}
          min={0}
          max={100}
        />
        <Text size="xs" c="dimmed" mt="xs">
          {t("wizard.steps.ai.qualityDescription")}
        </Text>
      </Box>

      <Controller
        name="detailLevel"
        control={control}
        rules={{
          required: "DETAIL_LEVEL_REQUIRED",
        }}
        render={({ field, fieldState: { error } }) => (
          <Select
            label={t("wizard.steps.ai.detailLevelLabel")}
            placeholder={t("wizard.steps.ai.detailLevelPlaceholder")}
            data={detailLevelOptions}
            {...field}
            error={error?.message}
          />
        )}
      />

      <Textarea
        label={t("wizard.steps.ai.customPromptLabel")}
        placeholder={t("wizard.steps.ai.customPromptPlaceholder")}
        autosize
        minRows={4}
        {...register("customPrompt")}
        description={t("wizard.steps.ai.customPromptDescription")}
      />
    </Stack>
  );
}
