import { IconMail } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { AUTH_PEN } from "@/components/auth/pen";
import {
  VerifyEmailClient,
  VerifyEmailSuspenseFallback,
} from "@/components/auth/VerifyEmailClient";

export const Route = createFileRoute("/$locale/auth/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  return (
    <AuthLayout
      childrenOnly
      brandIcon={
        <IconMail className="h-10 w-10 shrink-0" style={{ color: AUTH_PEN.primary }} aria-hidden />
      }
    >
      <Suspense fallback={<VerifyEmailSuspenseFallback />}>
        <VerifyEmailClient />
      </Suspense>
    </AuthLayout>
  );
}
