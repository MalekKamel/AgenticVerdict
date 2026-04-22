import { useRouterState } from "@tanstack/react-router";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { useConfirmPasswordReset } from "@/hooks/usePasswordReset";

export function ResetPasswordFormClient() {
  const search = useRouterState({ select: (s) => s.location.search });
  const token = new URLSearchParams(search).get("token") || "";
  const resetMutation = useConfirmPasswordReset(token);
  const isPending = resetMutation.isPending;
  const error = resetMutation.error;

  return (
    <ResetPasswordForm
      token={token}
      onSubmit={(data) => resetMutation.mutate({ token: data.token, newPassword: data.password })}
      isLoading={isPending}
      error={error?.message}
    />
  );
}
