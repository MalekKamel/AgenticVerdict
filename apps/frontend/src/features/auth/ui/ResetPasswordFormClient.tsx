import { ResetPasswordForm } from "@/features/auth/ui/ResetPasswordForm";
import { useConfirmPasswordReset } from "@/features/auth/hooks/usePasswordReset";
import { AuthMutationError } from "@/features/auth/hooks/usePasswordReset";

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
