/**
 * RegisterForm — Mantine form controls (`TextInput`, `PasswordInput`, `Alert`, `Button`, `Checkbox`).
 */

"use client";

import { useForm } from "@mantine/form";
import { useTranslations } from "@/i18n/react";
import { type ReactNode, useEffect, useState } from "react";

import { AUTH_TEXT_LINK_CLASS, AUTH_TRACK_MUTED_CLASS } from "@/components/auth/authUi";
import { Alert, Button, Checkbox, List, Text, TextInput } from "@mantine/core";
import { useRegisterMutation } from "@/hooks/useRegisterMutation";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { calculatePasswordStrength, type PasswordStrengthResult } from "@/lib/validations/password";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { IconCheck, IconUserPlus, IconX } from "@tabler/icons-react";

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
        className={AUTH_TRACK_MUTED_CLASS}
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
      <Text size="sm" c="dimmed">
        {t(passwordMessageKey(strength.label))}
      </Text>

      <List
        data-testid="password-requirements"
        listStyleType="none"
        m={0}
        p={0}
        spacing="xs"
        size="sm"
      >
        {strength.requirements.map((req) => (
          <List.Item
            key={req.id}
            data-checked={req.met ? "true" : "false"}
            style={{
              color: req.met ? "var(--av-color-success)" : "var(--av-color-text-secondary)",
            }}
            icon={
              <span
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white"
                style={{
                  backgroundColor: req.met
                    ? "var(--av-color-success)"
                    : "var(--av-color-border-subtle)",
                }}
                aria-hidden
              >
                {req.met ? <IconCheck size={10} stroke={3} /> : <IconX size={10} stroke={3} />}
              </span>
            }
          >
            <span id={req.ariaId}>{t(`requirements.${req.id}`)}</span>
          </List.Item>
        ))}
      </List>
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

  const termsProps = form.getInputProps("acceptTerms", { type: "checkbox" });

  return (
    <div className={className}>
      {children}

      {register.isError ? (
        <div className="mb-4" data-testid="form-error">
          <Alert color="red" title={t("errors.apiError")} variant="light">
            {(register.error as Error).message}
          </Alert>
        </div>
      ) : null}

      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <div className="flex flex-col gap-5">
          <TextInput
            {...form.getInputProps("email")}
            id="register-email"
            name="email"
            type="email"
            label={t("fields.email.label")}
            required
            autoComplete="email"
            radius="md"
            w="100%"
            error={typeof form.errors.email === "string" ? form.errors.email : undefined}
            aria-describedby="register-email-description"
            aria-invalid={!!form.errors.email}
          />

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
              radius="md"
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
            radius="md"
            aria-describedby="register-confirm-password-description"
            aria-invalid={!!form.errors.confirmPassword || passwordsMatch === false}
          />

          {passwordsMatch === true && watchedConfirmPassword.length > 0 ? (
            <Text size="sm" c="green" className="inline-flex items-center gap-1.5">
              <IconCheck size={16} stroke={2.5} className="shrink-0" aria-hidden />
              {t("errors.passwordsMatch")}
            </Text>
          ) : null}

          <TextInput
            {...form.getInputProps("firstName")}
            id="register-first-name"
            name="firstName"
            label={t("fields.firstName.label")}
            required
            autoComplete="given-name"
            radius="md"
            w="100%"
            error={typeof form.errors.firstName === "string" ? form.errors.firstName : undefined}
            aria-describedby="register-first-name-description"
            aria-invalid={!!form.errors.firstName}
          />

          <TextInput
            {...form.getInputProps("lastName")}
            id="register-last-name"
            name="lastName"
            label={t("fields.lastName.label")}
            required
            autoComplete="family-name"
            radius="md"
            w="100%"
            error={typeof form.errors.lastName === "string" ? form.errors.lastName : undefined}
            aria-describedby="register-last-name-description"
            aria-invalid={!!form.errors.lastName}
          />

          <div className="flex flex-col gap-2">
            <Checkbox
              label={t("fields.acceptTerms.label")}
              id="register-accept-terms"
              checked={Boolean(termsProps.checked)}
              onChange={termsProps.onChange}
            />
            <Text size="sm" c="dimmed" component="div">
              {t("fields.acceptTerms.description")}{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className={AUTH_TEXT_LINK_CLASS}
              >
                {t("fields.acceptTerms.termsLink")}
              </a>{" "}
              {t("fields.acceptTerms.and")}{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={AUTH_TEXT_LINK_CLASS}
              >
                {t("fields.acceptTerms.privacyLink")}
              </a>
            </Text>
            {form.errors.acceptTerms ? (
              <Text size="sm" c="red" role="alert">
                {form.errors.acceptTerms}
              </Text>
            ) : null}
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            radius="md"
            loading={register.isPending}
            disabled={register.isPending}
            aria-busy={register.isPending}
            leftSection={
              !register.isPending ? <IconUserPlus size={20} stroke={1.75} aria-hidden /> : undefined
            }
          >
            {register.isPending ? t("buttons.creatingAccount") : t("buttons.createAccount")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm;
