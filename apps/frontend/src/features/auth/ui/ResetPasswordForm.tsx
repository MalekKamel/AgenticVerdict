"use client";

import { Alert, Button, Text } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { useLocale, useTranslations } from "@/i18n/react";
import { useCallback, useEffect, useRef } from "react";
import { IconCheck, IconKey, IconX } from "@tabler/icons-react";

import { AUTH_TEXT_LINK_CLASS, AUTH_TRACK_MUTED_CLASS } from "@/features/auth/ui/authUi";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { calculatePasswordStrength, getPasswordRequirements } from "@/lib/validations/password";
import type { ResetPasswordFormData } from "@/lib/validations/auth";
import { PasswordInput } from "@/features/auth/ui/PasswordInput";
import { Link } from "@/i18n/navigation";
import type { AuthMutationError } from "@/features/auth/hooks/usePasswordReset";
import { getDirectionalSectionProps } from "@/features/auth/ui/authUi";
import { getDirection } from "@/i18n/locales";

const RESET_ERROR_LINK_CLASS =
  "text-sm font-semibold text-[var(--mantine-color-red-9)] underline underline-offset-2 transition-colors hover:text-[var(--mantine-color-red-8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mantine-color-red-9)]";

export interface ResetPasswordFormProps {
  token: string;
  onSubmit?: (data: { token: string; password: string }) => void;
  isLoading?: boolean;
  error?: AuthMutationError | null;
  className?: string;
}

function localizeResetPasswordError(
  raw: string | null | undefined,
  t: (key: string) => string,
): string {
  if (!raw) {
    return t("errors.internalError");
  }
  if (raw.startsWith("auth.")) {
    return t(raw.slice("auth.".length));
  }
  return t("errors.internalError");
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
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isRtl = getDirection(locale) === "rtl";
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

  const errorCode = apiError?.code ?? null;
  const apiErrorMessage = apiError?.message ?? null;
  const isTokenExpired = errorCode === "GONE" || apiErrorMessage === "auth.errors.tokenExpired";
  const isTokenInvalid =
    errorCode === "BAD_REQUEST" ||
    apiErrorMessage === "auth.resetPassword.errors.invalidToken" ||
    apiErrorMessage === "auth.errors.tokenInvalid";
  const isRateLimited = errorCode === "RATE_LIMIT_EXCEEDED";
  const localizedApiError = localizeResetPasswordError(apiErrorMessage, tAuth);
  const passwordRequirementsDescription = form.values.password
    ? "password-requirement-minlength password-requirement-uppercase password-requirement-lowercase password-requirement-number password-requirement-special"
    : undefined;

  if (!token) {
    return (
      <div className={className}>
        <Alert
          color="red"
          title={tAuth("resetPassword.errors.invalidToken")}
          variant="outline"
          styles={{
            label: { color: "var(--mantine-color-red-9)" },
            message: { color: "var(--mantine-color-red-9)" },
          }}
        >
          <Text size="sm">{tAuth("resetPassword.errors.invalidToken")}</Text>
          <div className="mt-3">
            <Link href="/auth/forgot-password" className={RESET_ERROR_LINK_CLASS}>
              {tAuth("resetPassword.buttons.requestNew")}
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
          {apiErrorMessage ? (
            <div role="alert" aria-live="assertive">
              <Alert
                color="red"
                title={tCommon("error")}
                variant="outline"
                styles={{
                  label: { color: "var(--mantine-color-red-9)" },
                  message: { color: "var(--mantine-color-red-9)" },
                }}
              >
                <Text size="sm">{localizedApiError}</Text>
                {isRateLimited && apiError?.retryAfterSeconds ? (
                  <Text size="sm" mt="xs">
                    {tAuth("resetPassword.states.rateLimited", {
                      seconds: String(apiError.retryAfterSeconds),
                    })}
                  </Text>
                ) : null}
                {isTokenExpired || isTokenInvalid || isRateLimited ? (
                  <div className="mt-3">
                    <Link href="/auth/forgot-password" className={RESET_ERROR_LINK_CLASS}>
                      {tAuth("resetPassword.buttons.requestNew")}
                    </Link>
                  </div>
                ) : null}
              </Alert>
            </div>
          ) : null}

          {form.values.password ? (
            <div className="flex flex-col gap-4">
              <ul
                className="m-0 grid list-none gap-1 p-0"
                aria-label={tAuth("password.requirements.ariaLabel")}
              >
                {passwordRequirements.map((req) => (
                  <PasswordRequirement
                    key={req.id}
                    label={tAuth(
                      req.label.startsWith("auth.") ? req.label.slice("auth.".length) : req.label,
                    )}
                    met={req.met}
                    ariaId={req.ariaId}
                    metLabel={tCommon("success")}
                    unmetLabel={tCommon("error")}
                  />
                ))}
              </ul>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Text size="sm" fw={500}>
                    {tAuth("password.strength.label")}
                  </Text>
                  <Text
                    size="sm"
                    fw={500}
                    style={{ color: passwordStrength.color }}
                    aria-live="polite"
                  >
                    {tAuth(
                      passwordStrength.label.startsWith("auth.")
                        ? passwordStrength.label.slice("auth.".length)
                        : passwordStrength.label,
                    )}
                  </Text>
                </div>
                <div
                  className={AUTH_TRACK_MUTED_CLASS}
                  role="progressbar"
                  aria-label={tAuth("password.strength.ariaLabel")}
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
            label={tAuth("resetPassword.fields.password")}
            placeholder={tAuth("resetPassword.fields.password")}
            required
            radius="md"
            {...form.getInputProps("password")}
            error={typeof form.errors.password === "string" ? form.errors.password : undefined}
            aria-describedby={passwordRequirementsDescription}
            autoComplete="new-password"
            disabled={isLoading}
          />

          <PasswordInput
            label={tAuth("resetPassword.fields.confirmPassword")}
            placeholder={tAuth("resetPassword.fields.confirmPassword")}
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
            {...getDirectionalSectionProps(
              !isLoading ? <IconKey size={20} stroke={1.75} aria-hidden /> : undefined,
              isRtl,
            )}
          >
            {isLoading
              ? tAuth("resetPassword.buttons.resetting")
              : tAuth("resetPassword.buttons.submit")}
          </Button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className={AUTH_TEXT_LINK_CLASS}
              aria-label={tAuth("resetPassword.buttons.backToLogin")}
            >
              {tAuth("resetPassword.buttons.backToLogin")}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ResetPasswordForm;
