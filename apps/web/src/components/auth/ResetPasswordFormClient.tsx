import { useRouterState } from "@tanstack/react-router";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { useConfirmPasswordReset } from "@/hooks/usePasswordReset";

export function ResetPasswordFormClient() {
  const resetMutation = useConfirmPasswordReset();
  const isPending = resetMutation.isPending;
  const error = resetMutation.error;
  const search = useRouterState({ select: (s) => s.location.search });
  const token = new URLSearchParams(search).get("token") || "";

  return (
    <ResetPasswordForm
      token={token}
      onSubmit={(data) => resetMutation.mutate({ newPassword: data.password })}
      isLoading={isPending}
      error={error?.message}
    />
  );
}
