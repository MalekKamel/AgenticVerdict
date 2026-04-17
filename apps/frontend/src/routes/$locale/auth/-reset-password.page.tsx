import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordFormClient } from "@/components/auth/ResetPasswordFormClient";
import { useTranslations } from "@/i18n/react";

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");

  return (
    <AuthLayout title={t("title")} description={t("description")}>
      <ResetPasswordFormClient />
    </AuthLayout>
  );
}
