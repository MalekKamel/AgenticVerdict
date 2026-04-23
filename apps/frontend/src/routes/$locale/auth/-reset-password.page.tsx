import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordFormClient } from "@/components/auth/ResetPasswordFormClient";
import { useTranslations } from "@/i18n/react";
import { Route as ResetPasswordRoute } from "./reset-password";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const search = ResetPasswordRoute.useSearch();

  return (
    <AuthLayout title={t("resetPassword.title")} description={t("resetPassword.description")}>
      <ResetPasswordFormClient token={search.token ?? ""} />
    </AuthLayout>
  );
}
