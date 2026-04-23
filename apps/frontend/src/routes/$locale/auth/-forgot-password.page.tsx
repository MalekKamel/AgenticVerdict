import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useTranslations } from "@/i18n/react";
import { Route as ForgotPasswordRoute } from "./forgot-password";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const search = ForgotPasswordRoute.useSearch();

  return (
    <AuthLayout
      title={t("forgotPassword.title")}
      description={t("forgotPassword.description")}
      navLinks={{
        loginLabel: t("forgotPassword.buttons.backToLogin"),
      }}
    >
      <ForgotPasswordForm defaultEmail={search.email} />
    </AuthLayout>
  );
}
