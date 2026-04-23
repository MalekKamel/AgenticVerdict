/**
 * Email verification UI — Mantine `Loader`, `Alert`, `Button`, `Text`, `Title`.
 */

import { Alert, Button, Loader, Text, Title } from "@mantine/core";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { useVerifyEmailMutation } from "@/hooks/useAuthMutation";
import { logAuthFunnelEvent } from "@/lib/observability/auth-funnel-analytics";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconClockHour4,
} from "@tabler/icons-react";

type VerificationStatus = "loading" | "success" | "error" | "expired" | "invalid";

const RESEND_COUNTDOWN = 60;

export function VerifyEmailClient() {
  const t = useTranslations("auth.verifyEmail");
  const search = useRouterState({ select: (s) => s.location.search });
  const token = new URLSearchParams(search).get("token") ?? undefined;
  const router = useRouter();
  const verifyEmail = useVerifyEmailMutation();

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const statusRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      logAuthFunnelEvent("auth.verify_email.result", {
        flow: "verify_email",
        outcome: "failure",
        tokenPresent: false,
        errorCode: "MISSING_TOKEN",
      });
      setStatus("error");
      setErrorMessage(t("errors.noToken"));
      return;
    }

    const verifyToken = async () => {
      const startedAt = performance.now();
      try {
        logAuthFunnelEvent("auth.verify_email.attempt", {
          flow: "verify_email",
          tokenPresent: true,
        });
        await verifyEmail.mutateAsync({ token });
        setStatus("success");
        logAuthFunnelEvent("auth.verify_email.result", {
          flow: "verify_email",
          outcome: "success",
          tokenPresent: true,
          latencyMs: Math.round(performance.now() - startedAt),
        });
      } catch (error) {
        const message = (error as Error).message;
        let errorCode = "VERIFY_EMAIL_FAILED";

        if (message.includes("expired")) {
          setStatus("expired");
          errorCode = "EXPIRED_TOKEN";
        } else if (message.includes("invalid")) {
          setStatus("invalid");
          errorCode = "INVALID_TOKEN";
        } else {
          setStatus("error");
        }

        setErrorMessage(message);
        logAuthFunnelEvent("auth.verify_email.result", {
          flow: "verify_email",
          outcome: "failure",
          tokenPresent: true,
          errorCode,
          latencyMs: Math.round(performance.now() - startedAt),
        });
      }
    };

    void verifyToken();
  }, [token, t, verifyEmail]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    statusRegionRef.current?.focus();
  }, [status]);

  const handleResend = async () => {
    setResendSuccess(true);
    setResendCountdown(RESEND_COUNTDOWN);
    logAuthFunnelEvent("auth.verify_email.resend_click", {
      flow: "verify_email",
      resendCooldownSec: RESEND_COUNTDOWN,
    });

    setTimeout(() => {
      setResendSuccess(false);
    }, 5000);
  };

  const renderLoading = () => (
    <div className="flex flex-col items-center gap-4">
      <Loader size="lg" type="oval" />
      <Text size="sm" c="dimmed">
        {t("status.verifying")}
      </Text>
    </div>
  );

  const renderSuccess = () => (
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
      <Title order={3}>{t("status.success")}</Title>
      <Text size="sm" c="dimmed">
        {t("status.successMessage")}
      </Text>
      <Button size="lg" radius="md" className="mt-2" onClick={() => router.push("/auth/login")}>
        {t("buttons.signIn")}
      </Button>
    </div>
  );

  const renderError = () => (
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
      <Title order={3}>{t("status.error")}</Title>
      <Alert color="red" variant="light" maw="100%">
        {errorMessage}
      </Alert>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button variant="light" onClick={() => router.push("/auth/register")}>
          {t("buttons.backToRegister")}
        </Button>
        <Button onClick={() => router.push("/auth/login")}>{t("buttons.signIn")}</Button>
      </div>
    </div>
  );

  const renderExpired = () => (
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
      <Title order={3}>{t("status.expired")}</Title>
      <Text size="sm" c="dimmed">
        {t("status.expiredMessage")}
      </Text>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button variant="light" onClick={handleResend} disabled={resendCountdown > 0}>
          {resendCountdown > 0
            ? t("buttons.resendCountdown", { seconds: resendCountdown })
            : t("buttons.resend")}
        </Button>
        <Button onClick={() => router.push("/auth/register")}>{t("buttons.backToRegister")}</Button>
      </div>
      {resendSuccess ? (
        <div className="mt-4 w-full">
          <Alert color="green" variant="light">
            {t("status.resendSuccess")}
          </Alert>
        </div>
      ) : null}
    </div>
  );

  const renderInvalid = () => (
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
      <Title order={3}>{t("status.invalid")}</Title>
      <Text size="sm" c="dimmed">
        {t("status.invalidMessage")}
      </Text>
      <div className="mt-2">
        <Button variant="light" onClick={() => router.push("/auth/register")}>
          {t("buttons.backToRegister")}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {status === "loading" && renderLoading()}
      {status === "success" && renderSuccess()}
      {status === "error" && renderError()}
      {status === "expired" && renderExpired()}
      {status === "invalid" && renderInvalid()}
    </>
  );
}
