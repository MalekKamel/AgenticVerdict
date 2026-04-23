import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHelpContent } from "@/components/auth/AuthLegalDocument";
import { useTranslations } from "@/i18n/react";

export default function AuthHelpPage() {
  const t = useTranslations("auth");

  return (
    <AuthLayout
      showLegalFooter={false}
      navLinks={{
        loginLabel: t("layout.backToSignIn"),
        forgotPasswordLabel: t("layout.forgotPasswordShort"),
      }}
    >
      <AuthHelpContent />
    </AuthLayout>
  );
}
