import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useTranslations } from "@/i18n/react";

export default function ForgotPasswordPage() {
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
