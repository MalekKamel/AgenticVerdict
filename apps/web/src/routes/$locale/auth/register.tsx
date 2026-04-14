import { createFileRoute } from "@tanstack/react-router";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useTranslations } from "@/i18n/react";

export const Route = createFileRoute("/$locale/auth/register")({
  head: () => ({
    meta: [
      { title: "Create Account - AgenticVerdict" },
      { name: "description", content: "Join AgenticVerdict to start gaining business insights." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
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
