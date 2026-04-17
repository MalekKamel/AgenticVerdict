"use client";

import { Alert, Button, Typography } from "@agenticverdict/ui";
import { useForm, zodResolver } from "@mantine/form";
import { useTranslations } from "@/i18n/react";
import { useCallback, useEffect, useRef } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";

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
}

function PasswordRequirement({ label, met, ariaId }: PasswordRequirementProps) {
  return (
    <li
      id={ariaId}
      className="flex items-center gap-2 text-sm"
      style={{
        color: met ? "var(--av-color-success, #2E7D32)" : "var(--av-color-gray-600, #757575)",
      }}
      aria-label={`${label}: ${met ? "met" : "not met"}`}
    >
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white"
        style={{
          backgroundColor: met
            ? "var(--av-color-success, #2E7D32)"
            : "var(--av-color-gray-300, #E0E0E0)",
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
        <Alert variant="error" title={t("auth.resetPassword.errors.invalidToken")}>
          <div className="flex flex-col gap-3">
            <Typography variant="body-sm">{t("auth.resetPassword.errors.invalidToken")}</Typography>
            <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
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
            <Alert variant="error" title={t("common.error")}>
              <div className="flex flex-col gap-3">
                <Typography variant="body-sm">{apiError}</Typography>
                {isTokenExpired ? (
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t("auth.resetPassword.buttons.requestNew")}
                  </Link>
                ) : null}
              </div>
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
                  />
                ))}
              </ul>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Typography variant="body-sm" weight="medium">
                    {t("auth.password.strength.label")}
                  </Typography>
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    style={{ color: passwordStrength.color }}
                  >
                    {t(passwordStrength.label)}
                  </Typography>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
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
            aria-busy={isLoading}
          >
            {isLoading
              ? t("auth.resetPassword.buttons.resetting")
              : t("auth.resetPassword.buttons.submit")}
          </Button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-blue-600 hover:underline"
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
