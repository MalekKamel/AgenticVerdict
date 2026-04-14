/**
 * Auth Mutation Hooks
 *
 * Custom hooks that wrap auth API calls with React Query mutations.
 * These hooks integrate with the auth store to update state automatically.
 *
 * @example
 * ```tsx
 * import { useLoginMutation } from '@/hooks/useAuthMutation'
 *
 * function LoginForm() {
 *   const login = useLoginMutation()
 *
 *   const handleSubmit = (data) => {
 *     login.mutate(data, {
 *       onSuccess: (user) => {
 *         console.log('Logged in:', user.email)
 *       }
 *     })
 *   }
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 * }
 * ```
 */

import { useMutation } from "@tanstack/react-query";

import { authActions } from "@/stores/auth-store";
import { authApi, isAuthSuccess } from "@/lib/api/auth-api";
import type {
  LoginInput,
  RegisterInput,
  VerifyEmailInput,
  RequestPasswordResetInput,
  ConfirmPasswordResetInput,
} from "@agenticverdict/types";

/**
 * Login mutation hook
 *
 * Authenticates a user with email and password.
 * Automatically updates auth store on success.
 *
 * @example
 * ```tsx
 * const login = useLoginMutation()
 *
 * login.mutate(
 *   { email: 'user@example.com', password: 'pass123' },
 *   {
 *     onSuccess: (user) => {
 *       console.log('Logged in as:', user.email)
 *       router.navigate({ to: '/dashboard' })
 *     },
 *     onError: (error) => {
 *       console.error('Login failed:', error.message)
 *     }
 *   }
 * )
 * ```
 */
export function useLoginMutation() {
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await authApi.login(input);

      if (!isAuthSuccess(result)) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Update auth store with user data
      authActions.setAuth(
        true,
        {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          emailVerified: data.user.emailVerified,
        },
        data.user.tenantId,
      );
    },
  });
}

/**
 * Register mutation hook
 *
 * Creates a new user account.
 *
 * @example
 * ```tsx
 * const register = useRegisterMutation()
 *
 * register.mutate(
 *   {
 *     email: 'newuser@example.com',
 *     password: 'SecurePassword123!',
 *     firstName: 'John',
 *     lastName: 'Doe'
 *   },
 *   {
 *     onSuccess: (data) => {
 *       console.log('Registration successful:', data.message)
 *       router.navigate({ to: '/auth/verify-email' })
 *     }
 *   }
 * )
 * ```
 */
export function useRegisterMutation() {
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
    },
  });
}

/**
 * Logout mutation hook
 *
 * Logs out the current user and clears auth store.
 *
 * @example
 * ```tsx
 * const logout = useLogoutMutation()
 *
 * logout.mutate(undefined, {
 *   onSuccess: () => {
 *     console.log('Logged out successfully')
 *     router.navigate({ to: '/auth/login' })
 *   }
 * })
 * ```
 */
export function useLogoutMutation() {
  return useMutation({
    mutationFn: async () => {
      const result = await authApi.logout();

      if (!isAuthSuccess(result)) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: () => {
      // Clear auth store
      authActions.logout();
    },
  });
}

/**
 * Verify email mutation hook
 *
 * Verifies a user's email address using a token.
 *
 * @example
 * ```tsx
 * const verifyEmail = useVerifyEmailMutation()
 *
 * verifyEmail.mutate(
 *   { token: 'abc123' },
 *   {
 *     onSuccess: () => {
 *       console.log('Email verified successfully')
 *       router.navigate({ to: '/auth/login' })
 *     }
 *   }
 * )
 * ```
 */
export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: async (input: VerifyEmailInput) => {
      const result = await authApi.verifyEmail(input);

      if (!isAuthSuccess(result)) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: () => {
      console.log("Email verified successfully");
    },
  });
}

/**
 * Request password reset mutation hook
 *
 * Initiates password reset flow by sending a reset link email.
 *
 * @example
 * ```tsx
 * const requestReset = useRequestPasswordResetMutation()
 *
 * requestReset.mutate(
 *   { email: 'user@example.com' },
 *   {
 *     onSuccess: (data) => {
 *       console.log(data.message)
 *       router.navigate({ to: '/auth/reset-password-sent' })
 *     }
 *   }
 * )
 * ```
 */
export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: async (input: RequestPasswordResetInput) => {
      const result = await authApi.requestPasswordReset(input);

      if (!isAuthSuccess(result)) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      console.log(data.message);
    },
  });
}

/**
 * Confirm password reset mutation hook
 *
 * Sets a new password using a valid reset token.
 *
 * @example
 * ```tsx
 * const confirmReset = useConfirmPasswordResetMutation()
 *
 * confirmReset.mutate(
 *   { token: 'abc123', newPassword: 'NewPassword123!' },
 *   {
 *     onSuccess: () => {
 *       console.log('Password reset successfully')
 *       router.navigate({ to: '/auth/login' })
 *     }
 *   }
 * )
 * ```
 */
export function useConfirmPasswordResetMutation() {
  return useMutation({
    mutationFn: async (input: ConfirmPasswordResetInput) => {
      const result = await authApi.confirmPasswordReset(input);

      if (!isAuthSuccess(result)) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: () => {
      console.log("Password reset successfully");
    },
  });
}

/**
 * Combined auth operations hook
 *
 * Provides all auth mutations in a single hook for convenience.
 *
 * @example
 * ```tsx
 * const auth = useAuthMutations()
 *
 * // Login
 * auth.login.mutate({ email: '...', password: '...' })
 *
 * // Register
 * auth.register.mutate({ email: '...', password: '...', firstName: '...', lastName: '...' })
 *
 * // Logout
 * auth.logout.mutate()
 * ```
 */
export function useAuthMutations() {
  return {
    login: useLoginMutation(),
    register: useRegisterMutation(),
    logout: useLogoutMutation(),
    verifyEmail: useVerifyEmailMutation(),
    requestPasswordReset: useRequestPasswordResetMutation(),
    confirmPasswordReset: useConfirmPasswordResetMutation(),
  };
}
