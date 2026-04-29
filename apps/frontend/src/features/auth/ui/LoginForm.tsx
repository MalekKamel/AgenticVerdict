/**
 * LoginForm — Mantine form controls (`TextInput`, `PasswordInput`, `Alert`, `Button`).
 */

"use client";

import { useLoginMutation } from "@/features/auth/hooks/useLoginMutation";
import type { LoginOAuthProvider } from "@/features/auth/hooks/useLoginMutation";
import { isOAuthCapabilityEnabled } from "@/features/auth/hooks/useLoginMutation";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { PasswordInput } from "@/features/auth/ui/PasswordInput";
import { AUTH_TEXT_LINK_CLASS, getDirectionalSectionProps } from "@/features/auth/ui/authUi";
import { Alert, Button, Checkbox, Text, TextInput } from "@mantine/core";
import { useLocale, useTranslations } from "@/i18n/react";
import { useForm, zodResolver } from "@mantine/form";
import {
  IconBrandApple,
  IconBrandGoogleFilled,
  IconBrandWindows,
  IconLogin2,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { getDirection } from "@/i18n/locales";

export interface LoginFormProps {
  onSuccess?: () => void;
  defaultEmail?: string;
  redirectTo?: string;
  sessionExpired?: boolean;
  oauthAutoProvider?: LoginOAuthProvider;
  oauthProviders?: LoginOAuthProvider[];
  className?: string;
}

function resolveLoginErrorMessage(error: string | null, t: (key: string) => string): string | null {
  if (!error) {
    return null;
  }

  if (error.startsWith("auth.login.")) {
    return t(error.slice("auth.".length));
  }

  if (error.startsWith("auth.")) {
    return t(error.slice("auth.".length));
  }

  return t("errors.internalError");
}

const DEFAULT_OAUTH_PROVIDERS: LoginOAuthProvider[] = ["google", "microsoft", "apple"];

function oauthProviderIcon(provider: LoginOAuthProvider) {
  switch (provider) {
    case "google":
      return <IconBrandGoogleFilled size={18} aria-hidden />;
    case "microsoft":
      return <IconBrandWindows size={18} aria-hidden />;
    case "apple":
      return <IconBrandApple size={18} aria-hidden />;
  }
}

function oauthProviderLabel(provider: LoginOAuthProvider, t: (key: string) => string): string {
  return t(`login.oauth.providers.${provider}`);
}

export function LoginForm({
  onSuccess,
  defaultEmail,
  redirectTo,
  sessionExpired = false,
  oauthAutoProvider,
  oauthProviders = DEFAULT_OAUTH_PROVIDERS,
  className,
}: LoginFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const isRtl = getDirection(locale) === "rtl";
  const {
    login,
    loginWithOAuth,
    isLoading,
    error,
    state,
    oauthLoadingProvider,
    retryAfterSeconds,
    clearError,
  } = useLoginMutation(redirectTo);
  const [oauthFallbackMessage, setOauthFallbackMessage] = useState<string | null>(null);
  const [autoTriggeredProvider, setAutoTriggeredProvider] = useState<LoginOAuthProvider | null>(
    null,
  );
  const localizedError = resolveLoginErrorMessage(error, t);
  const isRateLimited = state === "rate_limited";
  const isLockedOut = state === "locked_out";
  const oauthEnabled = isOAuthCapabilityEnabled();
  const visibleOauthProviders = oauthEnabled ? oauthProviders : [];

  const form = useForm<LoginFormData>({
    mode: "uncontrolled",
    validate: zodResolver(loginSchema),
    initialValues: {
      email: defaultEmail || "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    const firstInput = document.querySelector("#login-email") as HTMLInputElement | null;
    firstInput?.focus();
  }, []);

  useEffect(() => {
    if (!oauthAutoProvider || autoTriggeredProvider === oauthAutoProvider) {
      return;
    }
    if (!oauthEnabled) {
      setOauthFallbackMessage(t("login.oauth.unavailable"));
      return;
    }
    if (!oauthProviders.includes(oauthAutoProvider)) {
      setOauthFallbackMessage(t("login.oauth.autoTriggerFallback"));
      return;
    }
    setAutoTriggeredProvider(oauthAutoProvider);
    void loginWithOAuth(oauthAutoProvider);
  }, [autoTriggeredProvider, loginWithOAuth, oauthAutoProvider, oauthEnabled, oauthProviders, t]);

  useEffect(() => {
    if (error === "auth.login.oauth.unavailable") {
      setOauthFallbackMessage(t("login.oauth.unavailable"));
    }
  }, [error, t]);

  const handleSubmit = async (values: LoginFormData) => {
    clearError();
    setOauthFallbackMessage(null);

    await login({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    });

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} className={className} noValidate>
      <div className="flex flex-col gap-5">
        {sessionExpired ? (
          <div role="status" aria-live="polite">
            <Alert color="yellow" title={t("login.session.expiredTitle")} variant="light">
              {t("login.session.expiredMessage")}
            </Alert>
          </div>
        ) : null}

        {oauthFallbackMessage ? (
          <div role="status" aria-live="polite">
            <Alert color="yellow" variant="light">
              {oauthFallbackMessage}
            </Alert>
          </div>
        ) : null}

        {state === "oauth_redirecting" ? (
          <div role="status" aria-live="polite">
            <Alert color="blue" variant="light">
              {t("login.oauth.redirecting")}
            </Alert>
          </div>
        ) : null}

        {isRateLimited ? (
          <div role="alert" aria-live="assertive">
            <Alert color="yellow" title={t("login.rateLimit.title")} variant="light">
              {retryAfterSeconds
                ? t("login.rateLimit.retryAfter", { seconds: String(retryAfterSeconds) })
                : t("login.rateLimit.message")}
            </Alert>
          </div>
        ) : null}

        {isLockedOut ? (
          <div role="alert" aria-live="assertive">
            <Alert color="red" title={t("login.lockout.title")} variant="light">
              {t("login.lockout.message")}
            </Alert>
          </div>
        ) : null}

        {localizedError &&
        !isRateLimited &&
        !isLockedOut &&
        error !== "auth.login.oauth.unavailable" ? (
          <div role="alert" aria-live="assertive">
            <Alert color="red" title={t("login.errors.invalidCredentials")} variant="light">
              {localizedError}
            </Alert>
          </div>
        ) : null}

        <TextInput
          key={form.key("email")}
          id="login-email"
          label={t("login.fields.email")}
          type="email"
          required
          autoComplete="email"
          radius="md"
          w="100%"
          error={
            typeof form.errors.email === "string"
              ? resolveLoginErrorMessage(form.errors.email, t)
              : undefined
          }
          {...form.getInputProps("email")}
        />

        <PasswordInput
          label={t("login.fields.password")}
          placeholder={t("login.fields.passwordPlaceholder")}
          required
          autoComplete="current-password"
          key={form.key("password")}
          error={
            typeof form.errors.password === "string"
              ? resolveLoginErrorMessage(form.errors.password, t)
              : undefined
          }
          radius="md"
          {...form.getInputProps("password")}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Checkbox
            key={form.key("rememberMe")}
            label={t("login.fields.rememberMe")}
            {...form.getInputProps("rememberMe", { type: "checkbox" })}
          />

          <Link href="/auth/forgot-password" className={AUTH_TEXT_LINK_CLASS}>
            {t("login.buttons.forgotPassword")}
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="md"
          radius="md"
          loading={isLoading}
          disabled={isLoading}
          {...getDirectionalSectionProps(
            !isLoading ? <IconLogin2 size={20} stroke={1.75} aria-hidden /> : undefined,
            isRtl,
          )}
        >
          {isLoading ? t("login.buttons.submitting") : t("login.buttons.submit")}
        </Button>

        {visibleOauthProviders.length > 0 ? (
          <>
            <div className="text-center text-sm text-[var(--av-color-text-secondary)]">
              {t("login.oauth.or")}
            </div>

            <div className="grid gap-2">
              {visibleOauthProviders.map((provider) => (
                <Button
                  key={provider}
                  variant="default"
                  radius="md"
                  fullWidth
                  {...getDirectionalSectionProps(oauthProviderIcon(provider), isRtl)}
                  loading={oauthLoadingProvider === provider}
                  disabled={isLoading}
                  onClick={() => void loginWithOAuth(provider)}
                  type="button"
                >
                  {t("login.oauth.continueWith", {
                    provider: oauthProviderLabel(provider, t),
                  })}
                </Button>
              ))}
            </div>
          </>
        ) : null}

        <div className="border-t border-[var(--av-color-border-subtle)] pt-5 text-center">
          <Text size="sm" c="dimmed" span>
            {t("login.buttons.noAccount")}{" "}
          </Text>
          <Link href="/auth/register" className={AUTH_TEXT_LINK_CLASS}>
            {t("login.buttons.createAccount")}
          </Link>
        </div>
      </div>
    </form>
  );
}

export default LoginForm;
