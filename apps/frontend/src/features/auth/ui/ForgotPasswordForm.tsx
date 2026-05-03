"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "@/i18n/react";
import { Alert, Button, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconMailForward } from "@tabler/icons-react";

import { useRequestPasswordReset } from "@/features/auth/hooks/usePasswordReset";
import { AuthMutationError } from "@/features/auth/hooks/usePasswordReset";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/features/auth/model/validations/auth";
import { getDirection } from "@/i18n/locales";
import { getDirectionalSectionProps } from "@/features/auth/ui/authUi";

interface ForgotPasswordFormProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  defaultEmail?: string;
}

function forgotPasswordFieldError(
  raw: string | undefined,
  t: (key: string) => string,
): string | undefined {
  if (!raw) return undefined;
  const key = raw.startsWith("auth.forgotPassword.")
    ? raw.slice("auth.forgotPassword.".length)
    : raw;
  return t(key);
}

function localizeForgotPasswordError(raw: string, t: (key: string) => string): string {
  if (raw.startsWith("auth.")) {
    return t(raw.slice("auth.".length));
  }
  return t("errors.internalError");
}

export function ForgotPasswordForm({ onSuccess, onError, defaultEmail }: ForgotPasswordFormProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isRtl = getDirection(locale) === "rtl";
  const emailInputRef = useRef<HTMLInputElement>(null);

  const requestReset = useRequestPasswordReset();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  const form = useForm<ForgotPasswordFormData>({
    mode: "uncontrolled",
    initialValues: {
      email: defaultEmail ?? "",
    },
    validate: (values) => {
      const result = forgotPasswordSchema.safeParse(values);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0] as string] = issue.message;
          }
        });
        return errors;
      }
      return {};
    },
  });

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!retryAfterSeconds || retryAfterSeconds <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setRetryAfterSeconds((current) => {
        if (!current || current <= 1) {
          window.clearInterval(timer);
          return null;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfterSeconds]);

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await requestReset.mutateAsync(values);
      const message = t("forgotPassword.success");
      setSuccessMessage(message);
      onSuccess?.(message);
    } catch (error) {
      const message =
        error instanceof Error
          ? localizeForgotPasswordError(error.message, t)
          : t("errors.internalError");
      const retryAfter =
        error instanceof AuthMutationError && error.code === "RATE_LIMIT_EXCEEDED"
          ? error.retryAfterSeconds
          : null;
      setRetryAfterSeconds(retryAfter);
      setErrorMessage(message);
      onError?.(message);
    }
  };

  const handleInputChange = () => {
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  return (
    <div>
      {successMessage ? (
        <div className="mb-4" role="status" aria-live="polite">
          <Alert color="green" title={t("forgotPassword.alerts.successTitle")} variant="light">
            {successMessage}
          </Alert>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-4" role="alert" aria-live="assertive">
          <Alert color="red" title={tCommon("error")} variant="light">
            {errorMessage}
            {retryAfterSeconds ? (
              <div className="mt-2 text-sm">
                {t("forgotPassword.states.rateLimited", { seconds: String(retryAfterSeconds) })}
              </div>
            ) : null}
          </Alert>
        </div>
      ) : null}

      <form onSubmit={form.onSubmit(handleSubmit)} aria-label={t("forgotPassword.title")}>
        <div className="flex flex-col gap-5">
          <TextInput
            ref={emailInputRef}
            id="forgot-password-email"
            type="email"
            autoComplete="email"
            key={form.key("email")}
            label={t("forgotPassword.fields.email")}
            required
            radius="md"
            w="100%"
            error={forgotPasswordFieldError(
              typeof form.errors.email === "string" ? form.errors.email : undefined,
              t,
            )}
            {...form.getInputProps("email")}
            onChange={(event) => {
              form.getInputProps("email").onChange(event);
              handleInputChange();
            }}
            aria-required
            aria-invalid={!!form.errors.email}
          />

          <Button
            type="submit"
            fullWidth
            loading={requestReset.isPending}
            disabled={requestReset.isPending || Boolean(retryAfterSeconds)}
            size="md"
            radius="md"
            aria-busy={requestReset.isPending}
            {...getDirectionalSectionProps(
              !requestReset.isPending ? (
                <IconMailForward
                  size={20}
                  stroke={1.75}
                  aria-hidden
                  style={isRtl ? { transform: "scaleX(-1)" } : undefined}
                />
              ) : undefined,
              isRtl,
            )}
          >
            {requestReset.isPending
              ? t("forgotPassword.buttons.submitting")
              : retryAfterSeconds
                ? t("forgotPassword.buttons.retryCountdown", { seconds: String(retryAfterSeconds) })
                : t("forgotPassword.buttons.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ForgotPasswordForm;
