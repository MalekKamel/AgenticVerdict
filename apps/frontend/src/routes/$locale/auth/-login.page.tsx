import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { useTranslations } from "@/i18n/react";
import { Route as LoginRoute } from "./login";

export default function LoginPage() {
  const t = useTranslations("auth");
  const search = LoginRoute.useSearch();

  return (
    <AuthLayout title={t("login.title")} description={t("login.description")}>
      <LoginForm
        redirectTo={search.redirect}
        sessionExpired={search.session === "expired"}
        oauthAutoProvider={search.oauth}
      />
    </AuthLayout>
  );
}
