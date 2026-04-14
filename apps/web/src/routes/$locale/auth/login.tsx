import { createFileRoute } from "@tanstack/react-router";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { useTranslations } from "@/i18n/react";

export const Route = createFileRoute("/$locale/auth/login")({
  head: () => ({
    meta: [
      { title: "Sign In - Masafh" },
      {
        name: "description",
        content: "Sign in to your Masafh account to access your dashboard and reports.",
      },
      { name: "keywords", content: "login, sign in, authentication" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const t = useTranslations("auth.login");

  return (
    <AuthLayout title={t("title")} description={t("description")}>
      <LoginForm />
    </AuthLayout>
  );
}
