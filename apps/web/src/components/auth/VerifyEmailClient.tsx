/**
 * Email verification — `authentication.pen` (`Screen / Verify email`, `AuthPenCard`, `AuthPenButton`).
 */

"use client";

import { Typography } from "@agenticverdict/ui";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  AUTH_PEN,
  AuthPenActionsRow,
  AuthPenAlert,
  AuthPenButton,
  AuthPenCard,
  AuthPenLoadingIndicator,
} from "@/components/auth/pen";
import { useVerifyEmailMutation } from "@/hooks/useAuthMutation";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";

type VerificationStatus = "loading" | "success" | "error" | "expired" | "invalid";

const RESEND_COUNTDOWN = 60;

const linkClass =
  "text-sm font-normal no-underline hover:underline focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2";

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

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t("errors.noToken"));
      return;
    }

    const verifyToken = async () => {
      try {
        await verifyEmail.mutateAsync({ token });
        setStatus("success");
      } catch (error) {
        const message = (error as Error).message;

        if (message.includes("expired")) {
          setStatus("expired");
        } else if (message.includes("invalid")) {
          setStatus("invalid");
        } else {
          setStatus("error");
        }

        setErrorMessage(message);
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

  const handleResend = async () => {
    setResendSuccess(true);
    setResendCountdown(RESEND_COUNTDOWN);

    setTimeout(() => {
      setResendSuccess(false);
    }, 5000);
  };

  const renderLoading = () => (
    <AuthPenCard title={t("title")} subtitle={t("status.verifying")}>
      <div className="flex flex-col items-center gap-4 py-2">
        <AuthPenLoadingIndicator label={t("status.verifying")} />
      </div>
    </AuthPenCard>
  );

  const renderSuccess = () => (
    <AuthPenCard title={t("status.success")} subtitle={t("status.successMessage")}>
      <div className="flex flex-col gap-4">
        <AuthPenAlert variant="success" title={t("success")} className="max-w-none">
          {t("status.successMessage")}
        </AuthPenAlert>
        <AuthPenButton type="button" fullWidth size="md" onClick={() => router.push("/auth/login")}>
          {t("buttons.signIn")}
        </AuthPenButton>
      </div>
    </AuthPenCard>
  );

  const renderError = () => (
    <AuthPenCard title={t("status.error")} subtitle={t("description")}>
      <div className="flex flex-col gap-4">
        <AuthPenAlert variant="error" className="max-w-none">
          {errorMessage}
        </AuthPenAlert>
        <AuthPenActionsRow>
          <AuthPenButton
            type="button"
            variant="secondary"
            size="md"
            onClick={() => router.push("/auth/register")}
          >
            {t("buttons.backToRegister")}
          </AuthPenButton>
          <AuthPenButton type="button" size="md" onClick={() => router.push("/auth/login")}>
            {t("buttons.signIn")}
          </AuthPenButton>
        </AuthPenActionsRow>
      </div>
    </AuthPenCard>
  );

  const renderExpired = () => (
    <AuthPenCard title={t("status.expired")} subtitle={t("status.expiredMessage")}>
      <div className="flex flex-col gap-4">
        <Typography variant="body-sm" color="secondary">
          {t("status.expiredMessage")}
        </Typography>
        <AuthPenActionsRow>
          <AuthPenButton
            type="button"
            variant="secondary"
            size="md"
            onClick={handleResend}
            disabled={resendCountdown > 0}
          >
            {resendCountdown > 0
              ? t("buttons.resendCountdown", { seconds: resendCountdown })
              : t("buttons.resend")}
          </AuthPenButton>
          <AuthPenButton type="button" size="md" onClick={() => router.push("/auth/register")}>
            {t("buttons.backToRegister")}
          </AuthPenButton>
        </AuthPenActionsRow>
        {resendSuccess ? (
          <AuthPenAlert variant="success" className="max-w-none">
            {t("status.resendSuccess")}
          </AuthPenAlert>
        ) : null}
      </div>
    </AuthPenCard>
  );

  const renderInvalid = () => (
    <AuthPenCard title={t("status.invalid")} subtitle={t("status.invalidMessage")}>
      <div className="flex flex-col gap-4">
        <AuthPenButton
          type="button"
          variant="secondary"
          size="md"
          onClick={() => router.push("/auth/register")}
        >
          {t("buttons.backToRegister")}
        </AuthPenButton>
      </div>
    </AuthPenCard>
  );

  const renderNoToken = () => (
    <AuthPenCard title={t("status.error")} subtitle={t("description")}>
      <div className="flex flex-col gap-4">
        <AuthPenAlert variant="error" className="max-w-none">
          {t("errors.noToken")}
        </AuthPenAlert>
        <Link href="/auth/login" className={linkClass} style={{ color: AUTH_PEN.primary }}>
          {t("buttons.signIn")}
        </Link>
      </div>
    </AuthPenCard>
  );

  return (
    <div id="main-content" role="main" className="w-full max-w-[440px]">
      {status === "loading" && renderLoading()}
      {status === "success" && renderSuccess()}
      {status === "error" && !token ? renderNoToken() : null}
      {status === "error" && token ? renderError() : null}
      {status === "expired" && renderExpired()}
      {status === "invalid" && renderInvalid()}
    </div>
  );
}

/** Suspense fallback — matches loading card in `Screen / Verify email` (authentication.pen). */
export function VerifyEmailSuspenseFallback() {
  const t = useTranslations("auth.verifyEmail");

  return (
    <div id="main-content" role="main" className="w-full max-w-[440px]">
      <AuthPenCard title={t("title")} subtitle={t("status.verifying")}>
        <div className="flex flex-col items-center gap-4 py-2">
          <AuthPenLoadingIndicator label={t("status.verifying")} />
        </div>
      </AuthPenCard>
    </div>
  );
}
