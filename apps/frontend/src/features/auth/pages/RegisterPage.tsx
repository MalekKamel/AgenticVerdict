import { AuthLayout, RegisterForm } from "@/features/auth/ui";
import { useTranslations } from "@/i18n/react";
import { Route as RegisterRoute } from "@/routes/$locale/auth/register";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const search = RegisterRoute.useSearch();

  return (
    <AuthLayout
      title={t("register.title")}
      description={t("register.description")}
      navLinks={{
        loginLabel: `${t("register.buttons.hasAccount")} ${t("register.buttons.signIn")}`,
      }}
    >
      <RegisterForm
        initialAccountType={
          search.type === "individual" || search.type === "business" ? search.type : undefined
        }
        initialInviteCode={search.invite}
        initialPlan={search.plan}
        initialTenantId={search.tenantId}
      />
    </AuthLayout>
  );
}
