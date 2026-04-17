/**
 * useRegisterMutation Hook
 *
 * Custom hook that wraps the registration API call with React Query mutation.
 * Handles success/error states and redirects to verification page on success.
 *
 * @see T050: Create useRegisterMutation hook
 *
 * @example
 * ```tsx
 * import { useRegisterMutation } from '@/hooks/useRegisterMutation'
 *
 * function RegisterForm() {
 *   const register = useRegisterMutation()
 *
 *   const handleSubmit = (data) => {
 *     register.mutate(data, {
 *       onSuccess: () => {
 *         console.log('Registration successful')
 *       }
 *     })
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";

import { authApi, isAuthSuccess } from "@/lib/api/auth-api";
import type { RegisterInput } from "@agenticverdict/types";

/**
 * Register mutation hook
 *
 * Creates a new user account and handles the response:
 * - On success: Redirects to verification page
 * - On error: Returns error message for display
 *
 * The hook does NOT update the auth store since users must verify
 * their email before being authenticated.
 *
 * @returns React Query mutation with registration state
 *
 * @example
 * ```tsx
 * const register = useRegisterMutation()
 *
 * if (register.isPending) {
 *   return <LoadingSpinner />
 * }
 *
 * if (register.isError) {
 *   return <ErrorMessage error={register.error} />
 * }
 *
 * return <RegisterForm onSubmit={(data) => register.mutate(data)} />
 * ```
 */
export function useRegisterMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const result = await authApi.register(input);

      if (!isAuthSuccess(result)) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Don't update auth store - user needs to verify email first
      console.log("Registration successful:", data.message);

      // Redirect to verification page
      router.push("/auth/verify-email");
    },
    onError: (error) => {
      console.error("Registration failed:", error.message);
    },
  });
}
