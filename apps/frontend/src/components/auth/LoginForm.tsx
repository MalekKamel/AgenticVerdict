/**
 * LoginForm — Mantine form controls (`TextInput`, `PasswordInput`, `Alert`, `Button`).
 */

"use client";

import { useLoginMutation } from "@/hooks/useLoginMutation";
import { type LoginFormData } from "@/lib/validations/auth";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AUTH_TEXT_LINK_CLASS } from "@/components/auth/authUi";
import { Alert, Button, Checkbox, Text, TextInput } from "@mantine/core";
import { useTranslations } from "@/i18n/react";
import { useForm } from "@mantine/form";
import { IconLogin2 } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

export interface LoginFormProps {
  onSuccess?: () => void;
  defaultEmail?: string;
  className?: string;
}

export function LoginForm({ onSuccess, defaultEmail, className }: LoginFormProps) {
  const t = useTranslations("auth.login");
  const { login, isLoading, error, clearError } = useLoginMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    mode: "uncontrolled",
    initialValues: {
      email: defaultEmail || "",
      password: "",
      rememberMe: false,
    },
    validate: {
      email: (value) => {
        if (!value) return t("errors.email.required");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return t("errors.email.invalid");
        }
        return null;
      },
      password: (value) => {
        if (!value) return t("errors.password.required");
        if (value.length < 8) return t("errors.password.tooShort");
        return null;
      },
    },
  });

  useEffect(() => {
    const firstInput = document.querySelector("#login-email") as HTMLInputElement | null;
    firstInput?.focus();
  }, []);

  const handleSubmit = async (values: LoginFormData) => {
    clearError();
    setSuccessMessage(null);

    try {
      await login({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      setSuccessMessage(t("successMessage"));

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} className={className} noValidate>
      <div className="flex flex-col gap-5">
        {error ? (
          <div role="alert" aria-live="assertive">
            <Alert color="red" title={t("errors.invalidCredentials")} variant="light">
              {error}
            </Alert>
          </div>
        ) : null}

        {successMessage ? (
          <div role="status" aria-live="polite">
            <Alert color="green" variant="light">
              {successMessage}
            </Alert>
          </div>
        ) : null}

        <TextInput
          key={form.key("email")}
          id="login-email"
          label={t("fields.email")}
          type="email"
          required
          autoComplete="email"
          radius="md"
          w="100%"
          error={typeof form.errors.email === "string" ? form.errors.email : undefined}
          {...form.getInputProps("email")}
        />

        <PasswordInput
          label={t("fields.password")}
          placeholder={t("fields.passwordPlaceholder")}
          required
          autoComplete="current-password"
          key={form.key("password")}
          error={form.errors.password}
          radius="md"
          {...form.getInputProps("password")}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Checkbox
            key={form.key("rememberMe")}
            label={t("fields.rememberMe")}
            {...form.getInputProps("rememberMe", { type: "checkbox" })}
          />

          <Link href="/auth/forgot-password" className={AUTH_TEXT_LINK_CLASS}>
            {t("buttons.forgotPassword")}
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="md"
          radius="md"
          loading={isLoading}
          disabled={isLoading}
          leftSection={!isLoading ? <IconLogin2 size={20} stroke={1.75} aria-hidden /> : undefined}
        >
          {isLoading ? t("buttons.submitting") : t("buttons.submit")}
        </Button>

        <div className="border-t border-[var(--av-color-border-subtle)] pt-5 text-center">
          <Text size="sm" c="dimmed" span>
            {t("buttons.noAccount")}{" "}
          </Text>
          <Link href="/auth/register" className={AUTH_TEXT_LINK_CLASS}>
            {t("buttons.createAccount")}
          </Link>
        </div>
      </div>
    </form>
  );
}

export default LoginForm;
