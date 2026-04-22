import { Loader, Stack, Text } from "@mantine/core";
import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { VerifyEmailClient } from "@/components/auth/VerifyEmailClient";
import { useTranslations } from "@/i18n/react";

export default function VerifyEmailPage() {
  const t = useTranslations("auth.verifyEmail");

  return (
    <AuthLayout
      title={t("title")}
      description={t("description")}
      navLinks={{
        loginLabel: t("buttons.signIn"),
        registerLabel: t("buttons.backToRegister"),
      }}
    >
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailClient />
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
