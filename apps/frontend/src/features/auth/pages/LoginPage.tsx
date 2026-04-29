import { AuthLayout, LoginForm } from "@/features/auth/ui";
import { useTranslations } from "@/i18n/react";
import { Route as LoginRoute } from "@/routes/$locale/auth/login";

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
