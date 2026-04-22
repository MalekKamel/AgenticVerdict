import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { VerifyEmailClient } from "@/components/auth/VerifyEmailClient";
import { useTranslations } from "@/i18n/react";

export default function VerifyEmailPage() {
  const t = useTranslations("auth.verifyEmail");

  return (
    <AuthLayout
      title={t("title")}
      description={t("description")}
      navLinks={{
        loginLabel: t("buttons.signIn"),
        registerLabel: t("buttons.backToRegister"),
      }}
    >
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailClient />
      </Suspense>
    </AuthLayout>
  );
}

function VerifyEmailFallback() {
  const t = useTranslations("common");

  return (
    <div className="flex flex-col items-center gap-3 py-2" role="status" aria-live="polite">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--av-color-primary-subtle)] border-t-[var(--av-color-primary)]" />
      <p className="text-sm text-[var(--av-color-text-secondary)]">{t("loading")}</p>
    </div>
  );
}
