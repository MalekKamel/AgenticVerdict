import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useTranslations } from "@/i18n/react";

export default function RegisterPage() {
  const t = useTranslations("auth.register");

  return (
    <AuthLayout
      title={t("title")}
      description={t("description")}
      navLinks={{
        loginLabel: `${t("buttons.hasAccount")} ${t("buttons.signIn")}`,
      }}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
