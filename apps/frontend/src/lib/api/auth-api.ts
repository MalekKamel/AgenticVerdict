/**
 * Auth API Client
 *
 * Type-safe authentication API client using tRPC.
 * Provides a clean interface for all authentication operations.
 *
 * This module wraps tRPC mutations with proper error handling,
 * type safety, and integration with the auth store.
 *
 * @example
 * ```tsx
 * import { authApi } from '@/lib/api/auth-api'
 *
 * // Login
 * const result = await authApi.login({
 *   email: 'user@example.com',
 *   password: 'SecurePassword123!',
 *   rememberMe: true,
 * })
 *
 * if (result.success) {
 *   // Redirect to dashboard
 * }
 * ```
 */

import type {
  LoginInput,
  RegisterInput,
  VerifyEmailInput,
  RequestPasswordResetInput,
  ConfirmPasswordResetInput,
  AuthErrorCode,
  AuthErrorResponse,
} from "@agenticverdict/types";
import type { AppRouter } from "@agenticverdict/api/trpc";
import type { TRPCClientError } from "@trpc/client";

import { trpcClient } from "./trpc-client";

/** Dev-only in-memory session when {@link isAuthApiMockEnabled} is true. */
let mockBrowserSession: { user: AuthUserData; sessionExpiresAt: string } | null = null;

const MOCK_DEFAULT_TENANT_ID = "11111111-1111-4111-8111-111111111111";

/** When true, auth flows use the in-browser mock instead of the Fastify tRPC API. */
function isAuthApiMockEnabled(): boolean {
  if (import.meta.env.PROD) {
    return false;
  }
  return import.meta.env.VITE_PUBLIC_AUTH_API_MOCK !== "false";
}

/**
 * Auth API error response
 *
 * Normalized error structure for all auth operations.
 */
export interface AuthApiError extends AuthErrorResponse {
  field?: string;
}

/**
 * Successful auth response
 *
 * Generic success wrapper for auth operations.
 */
export interface AuthApiSuccess<T = unknown> {
  success: true;
  data: T;
}

/**
 * Failed auth response
 *
 * Generic error wrapper for auth operations.
 */
export interface AuthApiFailure {
  success: false;
  error: AuthApiError;
}

/**
 * Auth API response type
 *
 * Discriminated union for type-safe error handling.
 */
export type AuthApiResponse<T = unknown> = AuthApiSuccess<T> | AuthApiFailure;

/**
 * User data type from login/register responses
 */
export type AuthUserData = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  tenantId: string;
};

/**
 * Session data type
 */
export type SessionData = {
  user: AuthUserData | null;
  sessionExpiresAt: string | null;
};

/**
 * Extract error code from tRPC error
 *
 * tRPC errors have a specific structure. This function normalizes them.
 */

function extractErrorCode(error: TRPCClientError<AppRouter>): AuthErrorCode {
  if (error.message === "EMAIL_NOT_VERIFIED") {
    return "EMAIL_NOT_VERIFIED";
  }
  const errorData = error.data as { httpStatus?: number; code?: string } | undefined;

  // Handle HTTP status codes
  if (errorData?.httpStatus) {
    switch (errorData.httpStatus) {
      case 401:
        return "UNAUTHORIZED";
      case 403:
        return "FORBIDDEN";
      case 404:
        return "NOT_FOUND";
      case 409:
        return "CONFLICT";
      case 410:
        return "GONE";
      case 429:
        return "RATE_LIMIT_EXCEEDED";
      case 500:
        return "INTERNAL_ERROR";
    }
  }

  if (errorData?.code === "NOT_IMPLEMENTED") {
    return "INTERNAL_ERROR";
  }

  // Handle specific error codes from backend
  if (errorData?.code) {
    const upperCode = errorData.code.toUpperCase() as AuthErrorCode;
    if (
      [
        "UNAUTHORIZED",
        "FORBIDDEN",
        "NOT_FOUND",
        "CONFLICT",
        "BAD_REQUEST",
        "RATE_LIMIT_EXCEEDED",
        "EMAIL_NOT_VERIFIED",
        "WEAK_PASSWORD",
        "GONE",
        "INTERNAL_ERROR",
      ].includes(upperCode)
    ) {
      return upperCode;
    }
  }

  // Handle network errors
  if (
    error.message.includes("fetch") ||
    error.message.includes("network") ||
    error.message.includes("ECONNREFUSED")
  ) {
    return "NETWORK_ERROR";
  }

  return "INTERNAL_ERROR";
}

/**
 * Extract user-friendly error message from tRPC error
 *
 * Maps technical error codes to user-friendly messages.
 */

function extractErrorMessage(error: TRPCClientError<AppRouter>): string {
  const code = extractErrorCode(error);

  // Check for custom error message from backend
  const errorData = error.data as { message?: string } | undefined;
  if (errorData?.message) {
    return errorData.message;
  }

  // Fallback to code-based messages
  const messages: Record<AuthErrorCode, string> = {
    UNAUTHORIZED: "auth.errors.invalidCredentials",
    FORBIDDEN: "auth.errors.forbidden",
    NOT_FOUND: "auth.errors.notFound",
    CONFLICT: "auth.errors.conflict",
    BAD_REQUEST: "auth.errors.badRequest",
    RATE_LIMIT_EXCEEDED: "auth.errors.rateLimitExceeded",
    EMAIL_NOT_VERIFIED: "auth.errors.emailNotVerified",
    WEAK_PASSWORD: "auth.errors.weakPassword",
    GONE: "auth.errors.tokenExpired",
    INTERNAL_ERROR: "auth.errors.internalError",
    NETWORK_ERROR: "auth.errors.networkError",
  };

  return messages[code];
}

/**
 * Wrap tRPC mutation with error handling
 *
 * Normalizes tRPC errors into AuthApiResponse format.
 */
async function wrapMutation<T>(mutation: Promise<{ data: T }>): Promise<AuthApiResponse<T>> {
  try {
    const result = await mutation;
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    const trpcError = error as TRPCClientError<AppRouter>;

    return {
      success: false,
      error: {
        code: extractErrorCode(trpcError),
        message: extractErrorMessage(trpcError),
        details: trpcError.data as Record<string, unknown> | undefined,
      },
    };
  }
}

/**
 * Auth API client
 *
 * Provides all authentication operations with proper error handling.
 * Use this for all auth-related API calls from components and hooks.
 */
export const authApi = {
  /**
   * Login with email and password
   *
   * @param input - Login credentials
   * @returns Session data with user info on success
   *
   * @example
   * ```tsx
   * const result = await authApi.login({
   *   email: 'user@example.com',
   *   password: 'SecurePassword123!',
   *   rememberMe: true,
   * })
   *
   * if (result.success) {
   *   const { user } = result.data
   *   console.log('Logged in as:', user.email)
   * } else {
   *   console.error('Login failed:', result.error.message)
   * }
   * ```
   */
  login: async (
    input: LoginInput,
  ): Promise<
    AuthApiResponse<{
      user: AuthUserData;
      sessionExpiresAt: string;
    }>
  > => {
    if (isAuthApiMockEnabled()) {
      const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const user: AuthUserData = {
        id: "mock-user-id",
        email: input.email,
        firstName: "Mock",
        lastName: "User",
        emailVerified: true,
        tenantId: MOCK_DEFAULT_TENANT_ID,
      };
      mockBrowserSession = { user, sessionExpiresAt };
      return wrapMutation(
        Promise.resolve({
          data: {
            user,
            sessionExpiresAt,
          },
        }),
      );
    }

    return wrapMutation(
      trpcClient.auth.login.mutate(input).then((out) => ({
        data: {
          user: out.user,
          sessionExpiresAt: out.sessionExpiresAt,
        },
      })),
    );
  },

  /**
   * Register a new user account
   *
   * @param input - Registration data
   * @returns Success message and user ID
   *
   * @example
   * ```tsx
   * const result = await authApi.register({
   *   email: 'newuser@example.com',
   *   password: 'SecurePassword123!',
   *   firstName: 'John',
   *   lastName: 'Doe',
   * })
   *
   * if (result.success) {
   *   console.log('Registration successful:', result.data.message)
   * } else {
   *   console.error('Registration failed:', result.error.message)
   * }
   * ```
   */
  register: async (
    input: RegisterInput,
  ): Promise<
    AuthApiResponse<{
      success: boolean;
      message: string;
      userId: string;
    }>
  > => {
    if (isAuthApiMockEnabled()) {
      void input;
      return wrapMutation(
        Promise.resolve({
          data: {
            success: true,
            message: "Verification email sent",
            userId: "new-user-id",
          },
        }),
      );
    }

    return wrapMutation(
      trpcClient.auth.register.mutate(input).then((out) => ({
        data: {
          success: out.success,
          message: out.message,
          userId: out.userId,
        },
      })),
    );
  },

  /**
   * Logout current user
   *
   * Invalidates the session on the server.
   *
   * @returns Success message
   *
   * @example
   * ```tsx
   * const result = await authApi.logout()
   *
   * if (result.success) {
   *   console.log('Logged out successfully')
   * }
   * ```
   */
  logout: async (): Promise<
    AuthApiResponse<{
      success: boolean;
      message: string;
    }>
  > => {
    if (isAuthApiMockEnabled()) {
      mockBrowserSession = null;
      return wrapMutation(
        Promise.resolve({
          data: {
            success: true,
            message: "Logged out successfully",
          },
        }),
      );
    }

    mockBrowserSession = null;
    return wrapMutation(
      trpcClient.auth.logout.mutate().then((out) => ({
        data: {
          success: out.success,
          message: out.message,
        },
      })),
    );
  },

  /**
   * Get current session
   *
   * Retrieves the current active session user data.
   * Use this for session validation in route loaders.
   *
   * @returns Session data with user info (null if no active session)
   *
   * @example
   * ```tsx
   * // In a route loader
   * const result = await authApi.getSession()
   *
   * if (result.success && result.data.user) {
   *   // User is authenticated
   *   return { user: result.data.user }
   * }
   *
   * // User is not authenticated
   * throw redirect({ to: '/auth/login' })
   * ```
   */
  getSession: async (): Promise<
    AuthApiResponse<{
      user: AuthUserData | null;
      sessionExpiresAt: string | null;
    }>
  > => {
    if (isAuthApiMockEnabled()) {
      return wrapMutation(
        Promise.resolve({
          data: {
            user: mockBrowserSession?.user ?? null,
            sessionExpiresAt: mockBrowserSession?.sessionExpiresAt ?? null,
          },
        }),
      );
    }

    return wrapMutation(
      trpcClient.auth.getSession.query().then((data) => ({
        data: {
          user: data.user,
          sessionExpiresAt: data.sessionExpiresAt,
        },
      })),
    );
  },

  /**
   * Verify email address
   *
   * Verifies a user's email using a token from the verification email.
   *
   * @param input - Verification token
   * @returns Success message
   *
   * @example
   * ```tsx
   * // In verify-email route loader
   * const searchParams = new URLSearchParams(window.location.search)
   * const token = searchParams.get('token') || ''
   *
   * const result = await authApi.verifyEmail({ token })
   *
   * if (result.success) {
   *   console.log('Email verified successfully')
   * }
   * ```
   */
  verifyEmail: async (
    input: VerifyEmailInput,
  ): Promise<
    AuthApiResponse<{
      success: boolean;
      message: string;
    }>
  > => {
    if (isAuthApiMockEnabled()) {
      void input;
      return wrapMutation(
        Promise.resolve({
          data: {
            success: true,
            message: "Email verified successfully",
          },
        }),
      );
    }

    return wrapMutation(
      trpcClient.auth.verifyEmail.mutate(input).then((out) => ({
        data: {
          success: out.success,
          message: out.message,
        },
      })),
    );
  },

  /**
   * Request password reset
   *
   * Initiates password reset flow by sending a reset link email.
   *
   * @param input - Email address
   * @returns Generic success message (even for non-existent emails)
   *
   * @example
   * ```tsx
   * const result = await authApi.requestPasswordReset({
   *   email: 'user@example.com',
   * })
   *
   * if (result.success) {
   *   console.log('If an account exists, a reset link was sent')
   * }
   * ```
   */
  requestPasswordReset: async (
    input: RequestPasswordResetInput,
  ): Promise<
    AuthApiResponse<{
      success: boolean;
      message: string;
    }>
  > => {
    if (isAuthApiMockEnabled()) {
      void input;
      return wrapMutation(
        Promise.resolve({
          data: {
            success: true,
            message: "If an account exists, a reset link was sent",
          },
        }),
      );
    }

    return wrapMutation(
      trpcClient.auth.requestPasswordReset.mutate(input).then((out) => ({
        data: {
          success: out.success,
          message: out.message,
        },
      })),
    );
  },

  /**
   * Confirm password reset
   *
   * Sets a new password using a valid reset token.
   *
   * @param input - Reset token and new password
   * @returns Success message
   *
   * @example
   * ```tsx
   * const searchParams = new URLSearchParams(window.location.search)
   * const token = searchParams.get('token') || ''
   *
   * const result = await authApi.confirmPasswordReset({
   *   token,
   *   newPassword: 'NewSecurePassword123!',
   * })
   *
   * if (result.success) {
   *   console.log('Password reset successfully')
   * }
   * ```
   */
  confirmPasswordReset: async (
    input: ConfirmPasswordResetInput,
  ): Promise<
    AuthApiResponse<{
      success: boolean;
      message: string;
    }>
  > => {
    if (isAuthApiMockEnabled()) {
      void input;
      return wrapMutation(
        Promise.resolve({
          data: {
            success: true,
            message: "Password reset successfully",
          },
        }),
      );
    }

    return wrapMutation(
      trpcClient.auth.confirmPasswordReset.mutate(input).then((out) => ({
        data: {
          success: out.success,
          message: out.message,
        },
      })),
    );
  },
};

/**
 * Type guard for successful API responses
 *
 * @example
 * ```tsx
 * if (isAuthSuccess(result)) {
 *   const { user } = result.data
 *   console.log('Success:', user.email)
 * } else {
 *   console.error('Error:', result.error.message)
 * }
 * ```
 */
export function isAuthSuccess<T>(response: AuthApiResponse<T>): response is AuthApiSuccess<T> {
  return response.success === true;
}

/**
 * Type guard for failed API responses
 *
 * @example
 * ```tsx
 * if (isAuthFailure(result)) {
 *   console.error('Error:', result.error.message)
 *   // Handle specific error codes
 *   if (result.error.code === 'RATE_LIMIT_EXCEEDED') {
 *     // Show rate limit message
 *   }
 * }
 * ```
 */
export function isAuthFailure(response: AuthApiResponse): response is AuthApiFailure {
  return response.success === false;
}
