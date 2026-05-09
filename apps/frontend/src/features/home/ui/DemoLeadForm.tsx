"use client";

import { Alert, Stack } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { useUiStore, uiActions } from "@/stores/ui-store";
import { useForm } from "react-hook-form";

const demoLeadSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
});

type DemoLeadFormData = z.infer<typeof demoLeadSchema>;

export function DemoLeadForm() {
  const leadFormSubmitted = useUiStore((s) => s.leadFormSubmitted);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DemoLeadFormData>({
    resolver: zodResolver(demoLeadSchema),
    defaultValues: { name: "", email: "" },
  });

  return (
    <form
      onSubmit={handleSubmit(() => {
        uiActions.setLeadFormSubmitted(true);
      })}
    >
      <Stack gap="sm">
        {leadFormSubmitted ? (
          <Alert title="Success" color="teal">
            Thank you for your interest!
          </Alert>
        ) : null}
        <AppTextInput label="Name" {...register("name")} error={errors.name?.message} />
        <AppTextInput
          label="Email"
          {...register("email")}
          type="email"
          error={errors.email?.message}
        />
        <AppButton type="submit">Request Demo</AppButton>
      </Stack>
    </form>
  );
}
