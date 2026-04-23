"use client";

import { Alert, Button, Text } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { useTranslations } from "@/i18n/react";
import { useCallback, useEffect, useRef } from "react";
import { IconCheck, IconKey, IconX } from "@tabler/icons-react";

import { AUTH_TEXT_LINK_CLASS, AUTH_TRACK_MUTED_CLASS } from "@/components/auth/authUi";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { calculatePasswordStrength, getPasswordRequirements } from "@/lib/validations/password";
import type { ResetPasswordFormData } from "@/lib/validations/auth";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Link } from "@/i18n/navigation";

export interface ResetPasswordFormProps {
  token: string;
  onSubmit?: (data: { token: string; password: string }) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

interface PasswordRequirementProps {
  label: string;
  met: boolean;
  ariaId: string;
  metLabel: string;
  unmetLabel: string;
}

function PasswordRequirement({
  label,
  met,
  ariaId,
  metLabel,
  unmetLabel,
}: PasswordRequirementProps) {
  return (
    <li
      id={ariaId}
      className="flex items-center gap-2 text-sm"
      style={{
        color: met ? "var(--av-color-success)" : "var(--av-color-text-secondary)",
      }}
      aria-label={`${label}: ${met ? metLabel : unmetLabel}`}
    >
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white"
        style={{
          backgroundColor: met ? "var(--av-color-success)" : "var(--av-color-border-subtle)",
        }}
        aria-hidden
      >
        {met ? <IconCheck size={10} /> : <IconX size={10} />}
      </span>
      <span>{label}</span>
    </li>
  );
}

export function ResetPasswordForm({
  token,
  onSubmit,
  isLoading = false,
  error: apiError,
  className,
}: ResetPasswordFormProps) {
  const t = useTranslations();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const form = useForm<ResetPasswordFormData>({
    mode: "uncontrolled",
    validate: zodResolver(resetPasswordSchema),
    initialValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const passwordStrength = calculatePasswordStrength(form.values.password);
  const passwordRequirements = getPasswordRequirements(
    form.values.password,
    "password-requirement",
  );

  const handleSubmit = useCallback(
    (values: ResetPasswordFormData) => {
      onSubmit?.({ token, password: values.password });
    },
    [token, onSubmit],
  );

  const isTokenExpired =
    apiError?.includes("expired") || apiError?.includes("invalid") || apiError?.includes("token");

  if (!token) {
    return (
      <div className={className}>
        <Alert color="red" title={t("auth.resetPassword.errors.invalidToken")} variant="light">
          <Text size="sm">{t("auth.resetPassword.errors.invalidToken")}</Text>
          <div className="mt-3">
            <Link href="/auth/forgot-password" className={AUTH_TEXT_LINK_CLASS}>
              {t("auth.resetPassword.buttons.requestNew")}
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <div className="flex flex-col gap-6">
          {apiError ? (
            <Alert color="red" title={t("common.error")} variant="light">
              <Text size="sm">{apiError}</Text>
              {isTokenExpired ? (
                <div className="mt-3">
                  <Link href="/auth/forgot-password" className={AUTH_TEXT_LINK_CLASS}>
                    {t("auth.resetPassword.buttons.requestNew")}
                  </Link>
                </div>
              ) : null}
            </Alert>
          ) : null}

          {form.values.password ? (
            <div className="flex flex-col gap-4">
              <ul
                className="m-0 grid list-none gap-1 p-0"
                aria-label={t("auth.password.requirements.ariaLabel")}
              >
                {passwordRequirements.map((req) => (
                  <PasswordRequirement
                    key={req.id}
                    label={t(req.label)}
                    met={req.met}
                    ariaId={req.ariaId}
                    metLabel={t("common.success")}
                    unmetLabel={t("common.error")}
                  />
                ))}
              </ul>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Text size="sm" fw={500}>
                    {t("auth.password.strength.label")}
                  </Text>
                  <Text size="sm" fw={500} style={{ color: passwordStrength.color }}>
                    {t(passwordStrength.label)}
                  </Text>
                </div>
                <div
                  className={AUTH_TRACK_MUTED_CLASS}
                  role="progressbar"
                  aria-label={t("auth.password.strength.ariaLabel")}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={passwordStrength.percentage}
                  data-testid="password-strength-bar"
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${passwordStrength.percentage}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <PasswordInput
            ref={firstFieldRef}
            label={t("auth.resetPassword.fields.password")}
            placeholder={t("auth.resetPassword.fields.password")}
            required
            radius="md"
            {...form.getInputProps("password")}
            error={typeof form.errors.password === "string" ? form.errors.password : undefined}
            aria-describedby="password-requirement-minlength password-requirement-uppercase password-requirement-lowercase password-requirement-number password-requirement-special"
            autoComplete="new-password"
            disabled={isLoading}
          />

          <PasswordInput
            label={t("auth.resetPassword.fields.confirmPassword")}
            placeholder={t("auth.resetPassword.fields.confirmPassword")}
            required
            radius="md"
            {...form.getInputProps("confirmPassword")}
            error={
              typeof form.errors.confirmPassword === "string"
                ? form.errors.confirmPassword
                : undefined
            }
            autoComplete="new-password"
            disabled={isLoading}
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
            radius="md"
            aria-busy={isLoading}
            leftSection={!isLoading ? <IconKey size={20} stroke={1.75} aria-hidden /> : undefined}
          >
            {isLoading
              ? t("auth.resetPassword.buttons.resetting")
              : t("auth.resetPassword.buttons.submit")}
          </Button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className={AUTH_TEXT_LINK_CLASS}
              aria-label={t("auth.resetPassword.buttons.backToLogin")}
            >
              {t("auth.resetPassword.buttons.backToLogin")}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ResetPasswordForm;
