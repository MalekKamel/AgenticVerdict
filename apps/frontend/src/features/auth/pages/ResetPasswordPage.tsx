import { AuthLayout, ResetPasswordFormClient } from "@/features/auth/ui";
import { useTranslations } from "@/i18n/react";
import { Route as ResetPasswordRoute } from "@/routes/$locale/auth/reset-password";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const search = ResetPasswordRoute.useSearch();

  return (
    <AuthLayout title={t("resetPassword.title")} description={t("resetPassword.description")}>
      <ResetPasswordFormClient token={search.token ?? ""} />
    </AuthLayout>
  );
}
