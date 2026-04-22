/**
 * Email verification UI — `@agenticverdict/ui` (`Card`, `Alert`, `Button`, `Typography`).
 */

import { Alert, Button, Typography } from "@agenticverdict/ui";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { useVerifyEmailMutation } from "@/hooks/useAuthMutation";
import { logAuthFunnelEvent } from "@/lib/observability/auth-funnel-analytics";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";

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
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--av-color-primary-subtle)] border-t-[var(--av-color-primary)]" />
      <Typography variant="body-sm" color="secondary">
        {t("status.verifying")}
      </Typography>
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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--av-color-success-subtle)] text-3xl font-bold text-[var(--av-color-success)]">
        ✓
      </div>
      <Typography variant="h3">{t("status.success")}</Typography>
      <Typography variant="body-sm" color="secondary">
        {t("status.successMessage")}
      </Typography>
      <Button size="lg" className="mt-2" onClick={() => router.push("/auth/login")}>
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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--av-color-danger-subtle)] text-3xl font-bold text-[var(--av-color-danger)]">
        ✕
      </div>
      <Typography variant="h3">{t("status.error")}</Typography>
      <Alert variant="error">{errorMessage}</Alert>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button variant="secondary" onClick={() => router.push("/auth/register")}>
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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--av-color-warning-subtle)] text-3xl font-bold text-[var(--av-color-warning)]">
        ⏱
      </div>
      <Typography variant="h3">{t("status.expired")}</Typography>
      <Typography variant="body-sm" color="secondary">
        {t("status.expiredMessage")}
      </Typography>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button variant="secondary" onClick={handleResend} disabled={resendCountdown > 0}>
          {resendCountdown > 0
            ? t("buttons.resendCountdown", { seconds: resendCountdown })
            : t("buttons.resend")}
        </Button>
        <Button onClick={() => router.push("/auth/register")}>{t("buttons.backToRegister")}</Button>
      </div>
      {resendSuccess ? (
        <div className="mt-4 w-full">
          <Alert variant="success">{t("status.resendSuccess")}</Alert>
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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--av-color-danger-subtle)] text-3xl font-bold text-[var(--av-color-danger)]">
        ⚠
      </div>
      <Typography variant="h3">{t("status.invalid")}</Typography>
      <Typography variant="body-sm" color="secondary">
        {t("status.invalidMessage")}
      </Typography>
      <div className="mt-2">
        <Button variant="secondary" onClick={() => router.push("/auth/register")}>
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
