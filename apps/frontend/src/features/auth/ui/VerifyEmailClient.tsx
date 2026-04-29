import { Alert, Button, PinInput, Text, TextInput, Title } from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  useResendEmailVerificationMutation,
  useVerifyEmailMutation,
} from "@/features/auth/hooks/useEmailVerificationMutation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";
import { AuthMutationError } from "@/features/auth/hooks/usePasswordReset";
import { logAuthFunnelEvent } from "@/lib/observability/auth-funnel-analytics";
import { isTenantUuid } from "@/lib/tenant/tenant-resolution";
import { authActions } from "@/stores/auth-store";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconClockHour4,
} from "@tabler/icons-react";

type VerificationStatus = "idle" | "success" | "error" | "expired" | "invalid" | "rate_limited";

function localizeVerifyEmailError(raw: string, t: (key: string) => string): string {
  if (raw.startsWith("auth.")) {
    return t(raw.slice("auth.".length));
  }
  return t("verifyEmail.status.error");
}

function toAuthMutationError(error: unknown): AuthMutationError {
  if (error instanceof AuthMutationError) {
    return error;
  }
  if (error instanceof Error) {
    return new AuthMutationError(error.message, "INTERNAL_ERROR");
  }
  return new AuthMutationError("auth.errors.internalError", "INTERNAL_ERROR");
}

function mapVerifyStatusFromError(error: AuthMutationError): VerificationStatus {
  if (error.code === "RATE_LIMIT_EXCEEDED") {
    return "rate_limited";
  }
  if (
    error.code === "GONE" ||
    error.message.includes("expiredCode") ||
    error.message.includes("tokenExpired")
  ) {
    return "expired";
  }
  if (error.code === "BAD_REQUEST" && error.message.includes("invalidCode")) {
    return "invalid";
  }
  return "error";
}

function getAttemptsRemaining(error: AuthMutationError): number | null {
  const raw = error.details?.attemptsRemaining;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

export function VerifyEmailClient({ email, tenantId }: { email?: string; tenantId?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const verifyEmail = useVerifyEmailMutation();
  const resendVerification = useResendEmailVerificationMutation();
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [code, setCode] = useState("");
  const [currentEmail, setCurrentEmail] = useState(email ?? "");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const statusRegionRef = useRef<HTMLDivElement>(null);
  const normalizedTenantId = isTenantUuid(tenantId) ? tenantId : undefined;

  useEffect(() => {
    if (normalizedTenantId) {
      authActions.setTenantId(normalizedTenantId);
    }
  }, [normalizedTenantId]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  useEffect(() => {
    if (status !== "idle") {
      statusRegionRef.current?.focus();
    }
  }, [status]);

  const isBusy = verifyEmail.isPending || resendVerification.isPending;
  const canSubmit = currentEmail.length > 0 && code.length === 6 && !isBusy;

  const handleVerify = async () => {
    if (!canSubmit) return;
    const startedAt = performance.now();
    try {
      await verifyEmail.mutateAsync({ email: currentEmail, code, tenantId: normalizedTenantId });
      setStatus("success");
      setErrorMessage("");
      setAttemptsRemaining(null);
      logAuthFunnelEvent("auth.verify_email.result", {
        flow: "verify_email",
        outcome: "success",
        latencyMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      const authError = toAuthMutationError(error);
      const normalizedMessage = localizeVerifyEmailError(authError.message, t);
      setErrorMessage(normalizedMessage);
      const nextStatus = mapVerifyStatusFromError(authError);
      setStatus(nextStatus);
      setAttemptsRemaining(nextStatus === "invalid" ? getAttemptsRemaining(authError) : null);
      if (nextStatus === "rate_limited") {
        setResendCountdown(authError.retryAfterSeconds ?? 60);
      }

      logAuthFunnelEvent("auth.verify_email.result", {
        flow: "verify_email",
        outcome: "failure",
        errorCode: authError.code,
        latencyMs: Math.round(performance.now() - startedAt),
      });
    }
  };

  const handleResend = async () => {
    if (!currentEmail || resendCountdown > 0 || resendVerification.isPending) {
      return;
    }
    try {
      const response = await resendVerification.mutateAsync({
        email: currentEmail,
        tenantId: normalizedTenantId,
      });
      const retryAfter = response.retryAfterSeconds ?? 60;
      setResendSuccess(true);
      setResendCountdown(retryAfter);
      setStatus("idle");
      setErrorMessage("");
      setCode("");
      setAttemptsRemaining(null);
      logAuthFunnelEvent("auth.verify_email.resend_click", {
        flow: "verify_email",
        resendCooldownSec: retryAfter,
      });
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      const authError = toAuthMutationError(error);
      setErrorMessage(localizeVerifyEmailError(authError.message, t));
      if (authError.code === "RATE_LIMIT_EXCEEDED") {
        setStatus("rate_limited");
        setResendCountdown(authError.retryAfterSeconds ?? 60);
        return;
      }
      setStatus("error");
    }
  };

  const renderSuccess = useMemo(
    () => (
      <div
        ref={statusRegionRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-4 text-center focus:outline-none"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--av-color-success-subtle)] text-[var(--av-color-success)]">
          <IconCircleCheck size={40} stroke={1.5} aria-hidden />
        </div>
        <Title order={3}>{t("verifyEmail.status.success")}</Title>
        <Text size="sm" c="dimmed">
          {t("verifyEmail.status.successMessage")}
        </Text>
        <Button size="lg" radius="md" className="mt-2" onClick={() => router.push("/auth/login")}>
          {t("verifyEmail.buttons.signIn")}
        </Button>
      </div>
    ),
    [router, t],
  );

  const renderError = (
    <div
      ref={statusRegionRef}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center gap-4 text-center focus:outline-none"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--av-color-danger-subtle)] text-[var(--av-color-danger)]">
        <IconCircleX size={40} stroke={1.5} aria-hidden />
      </div>
      <Title order={3}>{t("verifyEmail.status.error")}</Title>
      <Alert color="red" variant="light" maw="100%">
        {errorMessage}
      </Alert>
      {attemptsRemaining !== null ? (
        <Text size="sm" c="dimmed">
          {t("verifyEmail.status.attemptsRemaining", { count: attemptsRemaining })}
        </Text>
      ) : null}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button variant="light" onClick={() => router.push("/auth/register")}>
          {t("verifyEmail.buttons.backToRegister")}
        </Button>
        <Button onClick={() => router.push("/auth/login")}>
          {t("verifyEmail.buttons.signIn")}
        </Button>
      </div>
    </div>
  );

  const renderExpired = (
    <div
      ref={statusRegionRef}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center gap-4 text-center focus:outline-none"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--av-color-warning-subtle)] text-[var(--av-color-warning)]">
        <IconClockHour4 size={40} stroke={1.5} aria-hidden />
      </div>
      <Title order={3}>{t("verifyEmail.status.expired")}</Title>
      <Text size="sm" c="dimmed">
        {t("verifyEmail.status.expiredMessage")}
      </Text>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button
          variant="light"
          onClick={handleResend}
          disabled={resendCountdown > 0}
          loading={resendVerification.isPending}
        >
          {resendCountdown > 0
            ? t("verifyEmail.buttons.resendCountdown", { seconds: resendCountdown })
            : t("verifyEmail.buttons.resend")}
        </Button>
        <Button onClick={() => router.push("/auth/register")}>
          {t("verifyEmail.buttons.backToRegister")}
        </Button>
      </div>
      {resendSuccess ? (
        <div className="mt-4 w-full">
          <Alert color="green" variant="light">
            {t("verifyEmail.status.resendSuccess")}
          </Alert>
        </div>
      ) : null}
    </div>
  );

  const renderInvalid = (
    <div
      ref={statusRegionRef}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center gap-4 text-center focus:outline-none"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--av-color-danger-subtle)] text-[var(--av-color-danger)]">
        <IconAlertTriangle size={40} stroke={1.5} aria-hidden />
      </div>
      <Title order={3}>{t("verifyEmail.status.invalid")}</Title>
      <Text size="sm" c="dimmed">
        {t("verifyEmail.status.invalidMessage")}
      </Text>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button variant="light" onClick={handleResend} disabled={resendCountdown > 0}>
          {resendCountdown > 0
            ? t("verifyEmail.buttons.resendCountdown", { seconds: resendCountdown })
            : t("verifyEmail.buttons.resend")}
        </Button>
        <Button onClick={handleVerify} disabled={!canSubmit}>
          {t("verifyEmail.buttons.submit")}
        </Button>
      </div>
    </div>
  );

  const renderRateLimited = (
    <div
      ref={statusRegionRef}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center gap-4 text-center focus:outline-none"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--av-color-warning-subtle)] text-[var(--av-color-warning)]">
        <IconClockHour4 size={40} stroke={1.5} aria-hidden />
      </div>
      <Title order={3}>{t("verifyEmail.status.error")}</Title>
      <Alert color="yellow" variant="light" maw="100%">
        {t("verifyEmail.status.retryAfter", { seconds: resendCountdown })}
      </Alert>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button
          variant="light"
          onClick={handleResend}
          disabled={resendCountdown > 0 || resendVerification.isPending || !currentEmail}
          loading={resendVerification.isPending}
        >
          {resendCountdown > 0
            ? t("verifyEmail.buttons.resendCountdown", { seconds: resendCountdown })
            : t("verifyEmail.buttons.resend")}
        </Button>
        <Button onClick={() => setStatus("idle")}>{t("verifyEmail.buttons.submit")}</Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        label={t("register.fields.email.label")}
        value={currentEmail}
        onChange={(event) => setCurrentEmail(event.currentTarget.value.trim().toLowerCase())}
        autoComplete="email"
        required
      />
      {status === "idle" ? (
        <>
          <div
            className="flex flex-col gap-2"
            role="group"
            aria-labelledby="verify-email-code-label"
          >
            <Text fw={500} id="verify-email-code-label">
              {t("verifyEmail.fields.code")}
            </Text>
            <div className="flex justify-center">
              <PinInput
                type="number"
                length={6}
                value={code}
                onChange={(value) => {
                  setCode(value.replace(/\D/g, "").slice(0, 6));
                  if (status !== "idle") setStatus("idle");
                }}
                oneTimeCode
                inputMode="numeric"
                aria-label={t("verifyEmail.fields.code")}
              />
            </div>
          </div>

          <Button onClick={handleVerify} disabled={!canSubmit} loading={verifyEmail.isPending}>
            {t("verifyEmail.buttons.submit")}
          </Button>

          <Button
            variant="light"
            onClick={handleResend}
            disabled={resendCountdown > 0 || resendVerification.isPending || !currentEmail}
            loading={resendVerification.isPending}
          >
            {resendCountdown > 0
              ? t("verifyEmail.buttons.resendCountdown", { seconds: resendCountdown })
              : t("verifyEmail.buttons.resend")}
          </Button>
        </>
      ) : null}

      {resendSuccess ? (
        <Alert color="green" variant="light">
          {t("verifyEmail.resendSuccess")}
        </Alert>
      ) : null}

      {status === "idle" && resendCountdown > 0 && !resendSuccess ? (
        <Alert color="yellow" variant="light">
          {t("verifyEmail.status.retryAfter", { seconds: resendCountdown })}
        </Alert>
      ) : null}

      {status === "success" && renderSuccess}
      {status === "error" && renderError}
      {status === "expired" && renderExpired}
      {status === "invalid" && renderInvalid}
      {status === "rate_limited" && renderRateLimited}
    </div>
  );
}
