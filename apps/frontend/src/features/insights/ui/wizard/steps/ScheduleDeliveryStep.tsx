"use client";

import {
  Stack,
  Select,
  NumberInput,
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

interface ScheduleDeliveryValues {
  frequency: string;
  time: string;
  format: string;
  emailRecipients: string[];
  webhookUrl?: string;
  enableWebhook: boolean;
}

export function ScheduleDeliveryStep() {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ScheduleDeliveryValues>();

  const frequency = watch("frequency");
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
        name="frequency"
        control={control}
        rules={{
          required: "Frequency is required",
        }}
        render={({ field, fieldState: { error } }) => (
          <Select
            label="Frequency"
            placeholder="Select frequency"
            data={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "quarterly", label: "Quarterly" },
            ]}
            {...field}
            error={error?.message}
          />
        )}
      />

      {frequency && (
        <Controller
          name="time"
          control={control}
          rules={{
            required: "Time is required",
            validate: (value) => {
              const num = Number(value);
              return (num >= 0 && num <= 23) || "Hour must be between 0 and 23";
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <NumberInput
              label="Hour of Day (24-hour format)"
              placeholder="e.g., 9 for 9 AM"
              value={field.value ?? 9}
              onChange={field.onChange}
              error={error?.message}
            />
          )}
        />
      )}

      <Controller
        name="format"
        control={control}
        rules={{
          required: "Format is required",
        }}
        render={({ field, fieldState: { error } }) => (
          <Select
            label="Report Format"
            placeholder="Select format"
            data={[
              { value: "pdf", label: "PDF" },
              { value: "excel", label: "Excel" },
              { value: "both", label: "Both PDF & Excel" },
            ]}
            {...field}
            error={error?.message}
          />
        )}
      />

      <Divider />

      <Box>
        <Text fw={500} mb="xs">
          Email Recipients
        </Text>

        <Group gap="xs" mb="xs">
          <TextInput
            placeholder="email@example.com"
            value={newRecipient}
            onChange={(e) => setNewRecipient(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRecipient())}
            style={{ flex: 1 }}
          />
          <Button onClick={handleAddRecipient} disabled={!newRecipient}>
            Add
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
        label="Enable Webhook Delivery"
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
          label="Webhook URL"
          placeholder="https://your-domain.com/webhook"
          required
          {...register("webhookUrl", {
            required: enableWebhook ? "Webhook URL is required" : false,
            pattern: {
              value: /^https?:\/\/.+/i,
              message: "Must be a valid URL",
            },
          })}
          error={errors.webhookUrl?.message}
        />
      )}
    </Stack>
  );
}
