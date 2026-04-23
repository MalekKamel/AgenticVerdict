import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthLegalDocument } from "@/components/auth/AuthLegalDocument";
import { useTranslations } from "@/i18n/react";

export default function PrivacyPage() {
  const t = useTranslations("auth");

  return (
    <AuthLayout
      showLegalFooter={false}
      navLinks={{
        loginLabel: t("layout.backToSignIn"),
      }}
    >
      <AuthLegalDocument doc="privacy" />
    </AuthLayout>
  );
}
