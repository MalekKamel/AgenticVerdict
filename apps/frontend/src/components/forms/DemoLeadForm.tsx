"use client";

import { Alert, Stack } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { useTranslations } from "@/i18n/react";
import { z } from "zod";

import { AppButton } from "@/components/ui/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { useUiStore } from "@/stores/ui-store";

function buildSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, { message: t("required") }),
    email: z
      .string()
      .min(1, { message: t("required") })
      .email({ message: t("invalidEmail") }),
  });
}

export function DemoLeadForm() {
  const t = useTranslations("Validation");
  const schema = buildSchema(t);
  const leadFormSubmitted = useUiStore((s) => s.leadFormSubmitted);
  const setLeadFormSubmitted = useUiStore((s) => s.setLeadFormSubmitted);

  const form = useForm({
    initialValues: { name: "", email: "" },
    validate: zodResolver(schema),
    onValuesChange: () => {
      if (leadFormSubmitted) setLeadFormSubmitted(false);
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(() => {
        setLeadFormSubmitted(true);
      })}
    >
      <Stack gap="sm">
        {leadFormSubmitted ? (
          <Alert title={t("successTitle")} color="teal">
            {t("successBody")}
          </Alert>
        ) : null}
        <AppTextInput label={t("nameLabel")} name="name" {...form.getInputProps("name")} />
        <AppTextInput
          label={t("emailLabel")}
          name="email"
          type="email"
          {...form.getInputProps("email")}
        />
        <AppButton type="submit">{t("submitDemo")}</AppButton>
      </Stack>
    </form>
  );
}
