"use client";

import { TextInput, Textarea, Select, Stack } from "@mantine/core";
import { useFormContext, Controller } from "react-hook-form";

interface BasicInfoValues {
  name: string;
  description: string;
  domain: string;
}

interface BasicInfoStepProps {
  domains: { value: string; label: string }[];
}

export function BasicInfoStep({ domains }: BasicInfoStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BasicInfoValues>();

  return (
    <Stack gap="md">
      <TextInput
        label="Insight Name"
        placeholder="e.g., Marketing Performance Dashboard"
        required
        {...register("name", {
          required: "Name is required",
          minLength: {
            value: 3,
            message: "Name must be at least 3 characters",
          },
        })}
        error={errors.name?.message}
      />

      <Controller
        name="domain"
        control={control}
        rules={{
          required: "Domain is required",
        }}
        render={({ field, fieldState: { error } }) => (
          <Select
            label="Domain"
            placeholder="Select domain"
            data={domains}
            {...field}
            error={error?.message}
          />
        )}
      />

      <Textarea
        label="Description"
        placeholder="Describe what this insight will analyze..."
        autosize
        minRows={3}
        {...register("description")}
      />
    </Stack>
  );
}
