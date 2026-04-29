import { AuthHelpContent, AuthLayout } from "@/features/auth/ui";
import { useTranslations } from "@/i18n/react";

export default function HelpPage() {
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
