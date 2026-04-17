/**
 * Email verification UI — `@agenticverdict/ui` (`Card`, `Alert`, `Button`, `Typography`).
 */

import { Alert, Button, Card, Typography } from "@agenticverdict/ui";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useVerifyEmailMutation } from "@/hooks/useAuthMutation";
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
    <div className="flex flex-col items-center gap-4">
      <div
        className="h-12 w-12 rounded-full border-4 border-blue-100 border-t-blue-600"
        style={{ animation: "verify-email-spin 1s linear infinite" }}
      />
      <Typography variant="body-sm" color="secondary">
        {t("status.verifying")}
      </Typography>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl font-bold text-green-700">
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
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl font-bold text-red-700">
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
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl font-bold text-orange-700">
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
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl font-bold text-red-700">
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
    <div className="mx-auto w-full max-w-[480px] p-4">
      <Card variant="elevated" padding="lg" className="w-full">
        <div className="mb-4 text-center">
          <Typography variant="h3" color="primary" weight="bold" className="tracking-tight">
            Masafh
          </Typography>
        </div>

        {status === "loading" && renderLoading()}
        {status === "success" && renderSuccess()}
        {status === "error" && renderError()}
        {status === "expired" && renderExpired()}
        {status === "invalid" && renderInvalid()}
      </Card>

      <style>{`
        @keyframes verify-email-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
