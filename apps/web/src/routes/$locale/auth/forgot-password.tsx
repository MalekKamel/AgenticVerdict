import { createFileRoute } from "@tanstack/react-router";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useTranslations } from "@/i18n/react";

export const Route = createFileRoute("/$locale/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password" },
      { name: "description", content: "Request a password reset link for your account." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");

  return (
    <AuthLayout
      title={t("title")}
      description={t("description")}
      navLinks={{
        loginLabel: t("buttons.backToLogin"),
      }}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
