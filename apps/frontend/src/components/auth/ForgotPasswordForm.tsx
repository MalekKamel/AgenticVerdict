"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/i18n/react";
import { Alert, Button, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconMailForward } from "@tabler/icons-react";

import { useRequestPasswordReset } from "@/hooks/usePasswordReset";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";

interface ForgotPasswordFormProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
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

export function ForgotPasswordForm({ onSuccess, onError }: ForgotPasswordFormProps) {
  const t = useTranslations("auth.forgotPassword");
  const tCommon = useTranslations("common");
  const emailInputRef = useRef<HTMLInputElement>(null);

  const requestReset = useRequestPasswordReset();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormData>({
    mode: "uncontrolled",
    initialValues: {
      email: "",
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

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await requestReset.mutateAsync(values);
      const message = t("success");
      setSuccessMessage(message);
      onSuccess?.(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.email.required");
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
          <Alert color="green" title={t("alerts.successTitle")} variant="light">
            {successMessage}
          </Alert>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-4" role="alert" aria-live="assertive">
          <Alert color="red" title={tCommon("error")} variant="light">
            {errorMessage}
          </Alert>
        </div>
      ) : null}

      <form onSubmit={form.onSubmit(handleSubmit)} aria-label={t("title")}>
        <div className="flex flex-col gap-5">
          <TextInput
            ref={emailInputRef}
            id="forgot-password-email"
            type="email"
            autoComplete="email"
            key={form.key("email")}
            label={t("fields.email")}
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
            aria-describedby={form.errors.email ? "email-error" : "email-description"}
          />

          <Button
            type="submit"
            fullWidth
            loading={requestReset.isPending}
            disabled={requestReset.isPending}
            size="md"
            radius="md"
            aria-busy={requestReset.isPending}
            leftSection={
              !requestReset.isPending ? (
                <IconMailForward size={20} stroke={1.75} aria-hidden />
              ) : undefined
            }
          >
            {requestReset.isPending ? t("buttons.submitting") : t("buttons.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ForgotPasswordForm;
