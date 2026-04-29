import { Loader, Stack, Text } from "@mantine/core";
import { Suspense } from "react";

import { AuthLayout, VerifyEmailClient } from "@/features/auth/ui";
import { useTranslations } from "@/i18n/react";
import { Route as VerifyEmailRoute } from "@/routes/$locale/auth/verify-email";

export default function VerifyEmailPage() {
  const t = useTranslations("auth");
  const search = VerifyEmailRoute.useSearch();

  return (
    <AuthLayout
      title={t("verifyEmail.title")}
      description={t("verifyEmail.description")}
      navLinks={{
        loginLabel: t("verifyEmail.buttons.signIn"),
        registerLabel: t("verifyEmail.buttons.backToRegister"),
      }}
    >
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailClient email={search.email} tenantId={search.tenantId} />
      </Suspense>
    </AuthLayout>
  );
}

function VerifyEmailFallback() {
  const t = useTranslations("common");

  return (
    <Stack align="center" gap="md" py="xs" role="status" aria-live="polite">
      <Loader size="lg" type="dots" />
      <Text size="sm" c="dimmed">
        {t("loading")}
      </Text>
    </Stack>
  );
}
