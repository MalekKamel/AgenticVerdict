/**
 * LoginForm — `@agenticverdict/ui` + `authentication.pen` (`AuthPenButton`, `AuthPenLinkRow`).
 */

"use client";

import { useLoginMutation } from "@/hooks/useLoginMutation";
import { type LoginFormData } from "@/lib/validations/auth";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  AUTH_PEN,
  AuthPenAlert,
  AuthPenButton,
  AuthPenCheckbox,
  AuthPenLinkRow,
} from "@/components/auth/pen";
import { FormField, Input } from "@agenticverdict/ui";
import { useTranslations } from "@/i18n/react";
import { useForm } from "@mantine/form";
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

  const rememberProps = form.getInputProps("rememberMe", { type: "checkbox" });

  const linkClass =
    "text-sm font-normal no-underline hover:underline focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2";

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} className={className} noValidate>
      <div className="flex flex-col gap-4">
        {error ? (
          <AuthPenAlert
            variant="error"
            title={t("errors.invalidCredentials")}
            className="max-w-none"
          >
            {error}
          </AuthPenAlert>
        ) : null}

        {successMessage ? (
          <AuthPenAlert variant="success" className="max-w-none">
            {successMessage}
          </AuthPenAlert>
        ) : null}

        <FormField
          label={t("fields.email")}
          required
          id="login-email"
          error={typeof form.errors.email === "string" ? form.errors.email : undefined}
        >
          <Input
            key={form.key("email")}
            id="login-email"
            type="email"
            autoComplete="email"
            {...form.getInputProps("email")}
          />
        </FormField>

        <PasswordInput
          label={t("fields.password")}
          placeholder={t("fields.passwordPlaceholder")}
          required
          autoComplete="current-password"
          key={form.key("password")}
          error={form.errors.password}
          {...form.getInputProps("password")}
        />

        <div className="flex flex-wrap items-center gap-2">
          <AuthPenCheckbox
            label={t("fields.rememberMe")}
            checked={Boolean(rememberProps.checked)}
            onCheckedChange={(checked) => {
              rememberProps.onChange?.({
                currentTarget: { checked },
              } as React.ChangeEvent<HTMLInputElement>);
            }}
          />
        </div>

        <AuthPenButton type="submit" fullWidth size="md" loading={isLoading} disabled={isLoading}>
          {isLoading ? t("buttons.submitting") : t("buttons.submit")}
        </AuthPenButton>

        <AuthPenLinkRow>
          <Link
            href="/auth/forgot-password"
            className={linkClass}
            style={{ color: AUTH_PEN.primary }}
          >
            {t("buttons.forgotPassword")}
          </Link>
          <Link href="/auth/register" className={linkClass} style={{ color: AUTH_PEN.primary }}>
            {t("buttons.createAccount")}
          </Link>
        </AuthPenLinkRow>
      </div>
    </form>
  );
}

export default LoginForm;
