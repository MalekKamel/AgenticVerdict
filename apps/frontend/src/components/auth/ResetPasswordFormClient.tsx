import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { useConfirmPasswordReset } from "@/hooks/usePasswordReset";
import { AuthMutationError } from "@/hooks/usePasswordReset";

export function ResetPasswordFormClient({ token }: { token: string }) {
  const resetMutation = useConfirmPasswordReset(token);
  const isPending = resetMutation.isPending;
  const error = resetMutation.error;

  return (
    <ResetPasswordForm
      token={token}
      onSubmit={(data) => resetMutation.mutate({ token: data.token, newPassword: data.password })}
      isLoading={isPending}
      error={error instanceof AuthMutationError ? error : null}
    />
  );
}
