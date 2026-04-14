/**
 * RegisterForm — `@agenticverdict/ui` + `design-system/atoms/*.pen` / `molecules/alert.pen`.
 */

"use client";

import { useForm } from "@mantine/form";
import { useTranslations } from "@/i18n/react";
import { type ReactNode, useEffect, useState } from "react";

import { Alert, Button, Checkbox, FormField, Input, Typography } from "@agenticverdict/ui";
import { useRegisterMutation } from "@/hooks/useRegisterMutation";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { calculatePasswordStrength, type PasswordStrengthResult } from "@/lib/validations/password";
import { PasswordInput } from "@/components/auth/PasswordInput";

const AUTH_PASSWORD_PREFIX = "auth.password.";

function passwordMessageKey(fullKey: string): string {
  return fullKey.startsWith(AUTH_PASSWORD_PREFIX)
    ? fullKey.slice(AUTH_PASSWORD_PREFIX.length)
    : fullKey;
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const t = useTranslations("auth.password");
  const [strength, setStrength] = useState<PasswordStrengthResult>(calculatePasswordStrength(""));

  useEffect(() => {
    setStrength(calculatePasswordStrength(password.length > 0 ? password : ""));
  }, [password]);

  if (password.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={strength.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("strength.label")}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${strength.percentage}%`, backgroundColor: strength.color }}
        />
      </div>
      <Typography variant="body-sm" color="secondary">
        {t(passwordMessageKey(strength.label))}
      </Typography>

      <ul data-testid="password-requirements" className="m-0 list-none p-0" role="list">
        {strength.requirements.map((req) => (
          <li
            key={req.id}
            data-checked={req.met ? "true" : "false"}
            className="flex items-center gap-2 text-sm"
            style={{
              color: req.met
                ? "var(--av-color-success, #2E7D32)"
                : "var(--av-color-gray-600, #757575)",
            }}
          >
            <span
              aria-hidden
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{
                backgroundColor: req.met
                  ? "var(--av-color-success, #2E7D32)"
                  : "var(--av-color-gray-300, #E0E0E0)",
              }}
            >
              {req.met ? "✓" : "✗"}
            </span>
            <span id={req.ariaId}>{t(`requirements.${req.id}`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface RegisterFormProps {
  onSuccess?: (data: RegisterFormData) => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: ReactNode;
}

export function RegisterForm({ onSuccess, onError, className, children }: RegisterFormProps) {
  const t = useTranslations("auth.register");
  const register = useRegisterMutation();

  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [passwordValue, setPasswordValue] = useState("");

  const form = useForm<RegisterFormData>({
    validate: (values) => {
      const result = registerSchema.safeParse(values);
      if (!result.success) {
        const errors: Record<string, string> = {};
        const registerPrefix = "auth.register.";
        for (const issue of result.error.issues) {
          const path0 = issue.path[0];
          if (path0 === undefined) continue;
          const field = String(path0);
          const raw = issue.message;
          const subKey = raw.startsWith(registerPrefix) ? raw.slice(registerPrefix.length) : raw;
          errors[field] = t(subKey);
        }
        return errors;
      }

      if (values.password !== values.confirmPassword && values.confirmPassword) {
        return { confirmPassword: t("errors.passwordsDoNotMatch") };
      }

      return {};
    },
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      acceptTerms: false,
    },
  });

  const watchedPassword = form.values.password;
  const watchedConfirmPassword = form.values.confirmPassword;

  useEffect(() => {
    if (watchedConfirmPassword.length > 0) {
      setPasswordsMatch(watchedPassword === watchedConfirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  }, [watchedPassword, watchedConfirmPassword]);

  const handleSubmit = async (values: RegisterFormData) => {
    try {
      await register.mutateAsync(values);
      onSuccess?.(values);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.onSubmit(handleSubmit)();
    }
  };

  const termsProps = form.getInputProps("acceptTerms", { type: "checkbox" });

  return (
    <div className={className}>
      {children}

      {register.isError ? (
        <div className="mb-4" data-testid="form-error">
          <Alert variant="error" title={t("errors.apiError")}>
            {(register.error as Error).message}
          </Alert>
        </div>
      ) : null}

      <form onSubmit={form.onSubmit(handleSubmit)} onKeyDown={handleKeyDown} noValidate>
        <div className="flex flex-col gap-4">
          <FormField
            label={t("fields.email.label")}
            required
            id="register-email"
            error={typeof form.errors.email === "string" ? form.errors.email : undefined}
          >
            <Input
              {...form.getInputProps("email")}
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              aria-describedby="register-email-description"
              aria-invalid={!!form.errors.email}
            />
          </FormField>

          <div>
            <PasswordInput
              {...form.getInputProps("password")}
              id="register-password"
              name="password"
              label={t("fields.password.label")}
              placeholder={t("fields.password.placeholder")}
              required
              autoComplete="new-password"
              error={typeof form.errors.password === "string" ? form.errors.password : undefined}
              aria-describedby="register-password-description"
              aria-invalid={!!form.errors.password}
              onChange={(e) => {
                form.getInputProps("password").onChange(e);
                setPasswordValue(e.target.value);
              }}
            />
            <PasswordStrengthIndicator password={passwordValue} />
          </div>

          <PasswordInput
            {...form.getInputProps("confirmPassword")}
            id="register-confirm-password"
            name="confirmPassword"
            label={t("fields.confirmPassword.label")}
            placeholder={t("fields.confirmPassword.placeholder")}
            error={
              (typeof form.errors.confirmPassword === "string"
                ? form.errors.confirmPassword
                : undefined) ||
              (passwordsMatch === false ? t("errors.passwordsDoNotMatch") : undefined)
            }
            required
            autoComplete="new-password"
            aria-describedby="register-confirm-password-description"
            aria-invalid={!!form.errors.confirmPassword || passwordsMatch === false}
          />

          {passwordsMatch === true && watchedConfirmPassword.length > 0 ? (
            <Typography variant="body-sm" color="success">
              ✓ {t("errors.passwordsMatch")}
            </Typography>
          ) : null}

          <FormField
            label={t("fields.firstName.label")}
            required
            id="register-first-name"
            error={typeof form.errors.firstName === "string" ? form.errors.firstName : undefined}
          >
            <Input
              {...form.getInputProps("firstName")}
              id="register-first-name"
              name="firstName"
              autoComplete="given-name"
              aria-describedby="register-first-name-description"
              aria-invalid={!!form.errors.firstName}
            />
          </FormField>

          <FormField
            label={t("fields.lastName.label")}
            required
            id="register-last-name"
            error={typeof form.errors.lastName === "string" ? form.errors.lastName : undefined}
          >
            <Input
              {...form.getInputProps("lastName")}
              id="register-last-name"
              name="lastName"
              autoComplete="family-name"
              aria-describedby="register-last-name-description"
              aria-invalid={!!form.errors.lastName}
            />
          </FormField>

          <div className="flex flex-col gap-2">
            <Checkbox
              label={t("fields.acceptTerms.label")}
              checked={Boolean(termsProps.checked)}
              onCheckedChange={(checked) => {
                termsProps.onChange?.({
                  currentTarget: { checked },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
            />
            <Typography variant="body-sm" color="secondary" as="div">
              {t("fields.acceptTerms.description")}{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {t("fields.acceptTerms.termsLink")}
              </a>{" "}
              {t("fields.acceptTerms.and")}{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {t("fields.acceptTerms.privacyLink")}
              </a>
            </Typography>
            {form.errors.acceptTerms ? (
              <Typography variant="body-sm" color="danger" role="alert">
                {form.errors.acceptTerms}
              </Typography>
            ) : null}
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={register.isPending}
            disabled={!form.isValid() || !form.isDirty()}
            aria-busy={register.isPending}
          >
            {register.isPending ? t("buttons.creatingAccount") : t("buttons.createAccount")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm;
