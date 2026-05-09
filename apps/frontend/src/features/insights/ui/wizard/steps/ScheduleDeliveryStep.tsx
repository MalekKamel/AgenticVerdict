"use client";

import {
  Stack,
  Select,
  TextInput,
  Group,
  Text,
  Box,
  Checkbox,
  Divider,
  Button,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useFormContext, Controller } from "react-hook-form";
import { useState } from "react";
import { useTranslations } from "@/i18n/react";

interface ScheduleDeliveryValues {
  format: string;
  emailRecipients: string[];
  webhookUrl?: string;
  enableWebhook: boolean;
}

interface ScheduleDeliveryStepProps {
  formatOptions: { value: string; label: string }[];
}

export function ScheduleDeliveryStep({ formatOptions }: ScheduleDeliveryStepProps) {
  const t = useTranslations("insights");
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ScheduleDeliveryValues>();

  const emailRecipients = watch("emailRecipients") || [];
  const enableWebhook = watch("enableWebhook") ?? false;
  const [newRecipient, setNewRecipient] = useState("");

  const handleAddRecipient = () => {
    if (newRecipient && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newRecipient)) {
      setValue("emailRecipients", [...emailRecipients, newRecipient], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setNewRecipient("");
    }
  };

  const handleRemoveRecipient = (index: number) => {
    const updated = emailRecipients.filter((_: string, i: number) => i !== index);
    setValue("emailRecipients", updated, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <Stack gap="md">
      <Controller
        name="format"
        control={control}
        rules={{
          required: "FORMAT_REQUIRED",
        }}
        render={({ field, fieldState: { error } }) => (
          <Select
            label={t("wizard.steps.delivery.formatLabel")}
            placeholder={t("wizard.steps.delivery.formatPlaceholder")}
            data={formatOptions}
            {...field}
            error={error?.message}
          />
        )}
      />

      <Divider />

      <Box>
        <Text fw={500} mb="xs">
          {t("wizard.steps.delivery.recipientsLabel")}
        </Text>

        <Group gap="xs" mb="xs">
          <TextInput
            placeholder={t("wizard.steps.delivery.recipientPlaceholder")}
            value={newRecipient}
            onChange={(e) => setNewRecipient(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRecipient())}
            style={{ flex: 1 }}
          />
          <Button onClick={handleAddRecipient} disabled={!newRecipient}>
            {t("wizard.steps.delivery.addRecipient")}
          </Button>
        </Group>

        {emailRecipients.length > 0 && (
          <Stack gap="xs" mt="xs">
            {emailRecipients.map((recipient: string, index: number) => (
              <Group
                key={index}
                justify="space-between"
                p="xs"
                style={{ backgroundColor: "#f8f9fa", borderRadius: 4 }}
              >
                <Text size="sm">{recipient}</Text>
                <Button
                  variant="subtle"
                  size="compact-xs"
                  color="red"
                  onClick={() => handleRemoveRecipient(index)}
                >
                  <IconX size={14} />
                </Button>
              </Group>
            ))}
          </Stack>
        )}
      </Box>

      <Checkbox
        label={t("wizard.steps.delivery.enableWebhook")}
        checked={enableWebhook}
        onChange={(e) =>
          setValue("enableWebhook", e.currentTarget.checked, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          })
        }
      />

      {enableWebhook && (
        <TextInput
          label={t("wizard.steps.delivery.webhookUrlLabel")}
          placeholder={t("wizard.steps.delivery.webhookUrlPlaceholder")}
          required
          {...register("webhookUrl", {
            required: enableWebhook ? "WEBHOOK_URL_REQUIRED" : false,
            pattern: {
              value: /^https?:\/\/.+/i,
              message: "WEBHOOK_URL_INVALID",
            },
          })}
          error={errors.webhookUrl?.message}
        />
      )}
    </Stack>
  );
}
