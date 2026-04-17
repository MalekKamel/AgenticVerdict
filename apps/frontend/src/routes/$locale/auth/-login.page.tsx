import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { useTranslations } from "@/i18n/react";

export default function LoginPage() {
  const t = useTranslations("auth.login");

  return (
    <AuthLayout title={t("title")} description={t("description")}>
      <LoginForm />
    </AuthLayout>
  );
}
