import { createFileRoute } from "@tanstack/react-router";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordFormClient } from "@/components/auth/ResetPasswordFormClient";
import { useTranslations } from "@/i18n/react";

export const Route = createFileRoute("/$locale/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password" },
      { name: "description", content: "Set a new password using your reset link." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");

  return (
    <AuthLayout title={t("title")} description={t("description")}>
      <ResetPasswordFormClient />
    </AuthLayout>
  );
}
