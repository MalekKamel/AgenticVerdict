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

import {
  PERMISSIONS,
  type LoginInput,
  type RegisterInput,
  type ResendEmailVerificationInput,
  type ResendEmailVerificationOutput,
  type VerifyEmailInput,
  type RequestPasswordResetInput,
  type ConfirmPasswordResetInput,
  type AuthErrorCode,
  type AuthErrorResponse,
} from "@agenticverdict/types";
import type { AppRouter } from "@agenticverdict/api/trpc";
import type { TRPCClientError } from "@trpc/client";

import { isFrontendAuthApiMockEnabled } from "@/lib/auth/frontend-runtime-policy";
import { mergePreSessionTenantInput } from "@/lib/tenant/merge-pre-session-tenant-input";
import { isTenantUuid } from "@/lib/tenant/tenant-resolution";

import { trpcClient, trpcClientWithoutTenantHeader } from "./trpc-client";

/** Dev-only in-memory session when {@link isAuthApiMockEnabled} is true. */
let mockBrowserSession: { user: AuthUserData; sessionExpiresAt: string } | null = null;

const MOCK_DEFAULT_TENANT_ID = "11111111-1111-4111-8111-111111111111";
const MOCK_DEFAULT_VERIFICATION_CODE = "123456";
const MOCK_VERIFICATION_CODE_EXPIRY_MS = 15 * 60 * 1000;
const MOCK_VERIFICATION_MAX_ATTEMPTS = 5;
const MOCK_VERIFICATION_LOCK_MS = 10 * 60 * 1000;
const MOCK_VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

type MockVerificationState = {
  code: string;
  expiresAtMs: number;
  attempts: number;
  lockedUntilMs: number | null;
  resendCooldownUntilSeconds: number;
  verified: boolean;
};

const mockVerificationStateByKey = new Map<string, MockVerificationState>();

function resolveMockTenantId(inputTenantId?: string): string {
  return isTenantUuid(inputTenantId) ? inputTenantId : MOCK_DEFAULT_TENANT_ID;
}

function buildMockVerificationKey(email: string, tenantId?: string): string {
  return `${resolveMockTenantId(tenantId)}:${email.trim().toLowerCase()}`;
}

function upsertMockVerificationState(
  key: string,
  options?: {
    resetAttempts?: boolean;
    forceCode?: string;
    overrideCooldownUntilSeconds?: number;
  },
): MockVerificationState {
  const nowMs = Date.now();
  const nowSeconds = Math.floor(nowMs / 1000);
  const existing = mockVerificationStateByKey.get(key);
  const state: MockVerificationState = {
    code: options?.forceCode ?? existing?.code ?? MOCK_DEFAULT_VERIFICATION_CODE,
    expiresAtMs: nowMs + MOCK_VERIFICATION_CODE_EXPIRY_MS,
    attempts: options?.resetAttempts ? 0 : (existing?.attempts ?? 0),
    lockedUntilMs: options?.resetAttempts ? null : (existing?.lockedUntilMs ?? null),
    resendCooldownUntilSeconds:
      options?.overrideCooldownUntilSeconds ??
      existing?.resendCooldownUntilSeconds ??
      nowSeconds + MOCK_VERIFICATION_RESEND_COOLDOWN_SECONDS,
    verified: false,
  };
  mockVerificationStateByKey.set(key, state);
  return state;
}

function getFreshMockVerificationState(key: string): MockVerificationState {
  const current = mockVerificationStateByKey.get(key);
  if (!current) {
    return upsertMockVerificationState(key, {
      resetAttempts: true,
      forceCode: MOCK_DEFAULT_VERIFICATION_CODE,
    });
  }

  if (!current.verified && current.expiresAtMs <= Date.now()) {
    return upsertMockVerificationState(key, {
      resetAttempts: true,
      forceCode: MOCK_DEFAULT_VERIFICATION_CODE,
    });
  }

  return current;
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
  tenantType: string;
  tenantStatus: string;
  roles: string[];
  permissions: string[];
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
  const errorData = error.data as
    | { httpStatus?: number; code?: string; tenantSecurityCode?: string }
    | undefined;

  const tenantCode = errorData?.tenantSecurityCode;
  if (tenantCode === "TENANT_CONTEXT_REQUIRED" || tenantCode === "TENANT_MISMATCH") {
    return tenantCode;
  }

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
        "TENANT_CONTEXT_REQUIRED",
        "TENANT_MISMATCH",
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
  const errorData = error.data as { message?: string; code?: string } | undefined;

  // Fallback map used for unknown/raw backend messages.
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
    TENANT_CONTEXT_REQUIRED: "auth.errors.tenantContextRequired",
    TENANT_MISMATCH: "auth.errors.tenantMismatch",
  };

  const rawMessage = errorData?.message ?? error.message;
  if (rawMessage.startsWith("auth.")) {
    return rawMessage;
  }

  const normalizedRaw = rawMessage.toLowerCase();
  const rawCode = (errorData?.code ?? "").toLowerCase();
  if (
    normalizedRaw.includes("account_locked") ||
    normalizedRaw.includes("account locked") ||
    rawCode.includes("account_locked")
  ) {
    return "auth.errors.accountLocked";
  }
  if (
    normalizedRaw.includes("too_many_attempts") ||
    normalizedRaw.includes("too many attempts") ||
    rawCode.includes("too_many_attempts")
  ) {
    return "auth.errors.tooManyAttempts";
  }
  if (
    normalizedRaw.includes("already exists") ||
    normalizedRaw.includes("email already exists") ||
    rawCode.includes("already_exists")
  ) {
    return "auth.register.errors.email.alreadyExists";
  }

  const upperRaw = rawMessage.toUpperCase();
  const codeFromMessage = upperRaw as AuthErrorCode;
  if (codeFromMessage in messages) {
    return messages[codeFromMessage];
  }

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
    if (isFrontendAuthApiMockEnabled()) {
      const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const merged = mergePreSessionTenantInput(input);
      const mockTenant = isTenantUuid(merged.tenantId) ? merged.tenantId : MOCK_DEFAULT_TENANT_ID;
      const roles: string[] = ["viewer"];
      const permissions: string[] = [PERMISSIONS.REPORTS_READ];
      const user: AuthUserData = {
        id: "mock-user-id",
        email: input.email,
        firstName: "Mock",
        lastName: "User",
        emailVerified: true,
        tenantId: mockTenant,
        tenantType: "direct_business",
        tenantStatus: "active",
        roles,
        permissions,
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
      trpcClient.auth.login.mutate(mergePreSessionTenantInput(input)).then((out) => ({
        data: {
          user: {
            ...out.user,
            roles: out.user.roles ?? [],
            permissions: out.user.permissions ?? [],
            tenantType: (out.user as { tenantType?: string }).tenantType ?? "direct_business",
            tenantStatus: (out.user as { tenantStatus?: string }).tenantStatus ?? "active",
          } as AuthUserData,
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
    if (isFrontendAuthApiMockEnabled()) {
      const key = buildMockVerificationKey(input.email, input.tenantId);
      upsertMockVerificationState(key, {
        resetAttempts: true,
        forceCode: MOCK_DEFAULT_VERIFICATION_CODE,
      });
      return wrapMutation(
        Promise.resolve({
          data: {
            success: true,
            message: "auth.verifyEmail.success.codeSent",
            userId: "new-user-id",
          },
        }),
      );
    }

    return wrapMutation(
      trpcClient.auth.register.mutate(mergePreSessionTenantInput(input)).then((out) => ({
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
    if (isFrontendAuthApiMockEnabled()) {
      mockBrowserSession = null;
      return wrapMutation(
        Promise.resolve({
          data: {
            success: true,
            message: "auth.logout.success",
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
    if (isFrontendAuthApiMockEnabled()) {
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
      trpcClientWithoutTenantHeader.auth.getSession.query().then((data) => ({
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
   * Verifies a user's email using the one-time verification code.
   *
   * @param input - Verification email + code payload
   * @returns Success message
   *
   * @example
   * ```tsx
   * // In verify-email route loader
   * const searchParams = new URLSearchParams(window.location.search)
   * const result = await authApi.verifyEmail({ email: "user@example.com", code: "123456" })
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
      attemptsRemaining?: number;
    }>
  > => {
    if (isFrontendAuthApiMockEnabled()) {
      const key = buildMockVerificationKey(input.email, input.tenantId);
      const nowMs = Date.now();
      const state = getFreshMockVerificationState(key);

      if (state.lockedUntilMs && state.lockedUntilMs > nowMs) {
        return {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "auth.verifyEmail.errors.tooManyAttempts",
            details: { retryAfterSeconds: Math.ceil((state.lockedUntilMs - nowMs) / 1000) },
          },
        };
      }

      if (state.expiresAtMs <= nowMs) {
        return {
          success: false,
          error: {
            code: "GONE",
            message: "auth.verifyEmail.errors.expiredCode",
          },
        };
      }

      if (input.code !== state.code) {
        const attempts = state.attempts + 1;
        const lockReached = attempts >= MOCK_VERIFICATION_MAX_ATTEMPTS;
        mockVerificationStateByKey.set(key, {
          ...state,
          attempts,
          lockedUntilMs: lockReached ? nowMs + MOCK_VERIFICATION_LOCK_MS : null,
        });
        return {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "auth.verifyEmail.errors.invalidCode",
            details: {
              attemptsRemaining: Math.max(0, MOCK_VERIFICATION_MAX_ATTEMPTS - attempts),
            },
          },
        };
      }
      mockVerificationStateByKey.set(key, {
        ...state,
        verified: true,
        attempts: 0,
        lockedUntilMs: null,
      });
      return wrapMutation(
        Promise.resolve({
          data: {
            success: true,
            message: "auth.verifyEmail.success.verified",
          },
        }),
      );
    }

    return wrapMutation(
      trpcClient.auth.verifyEmail.mutate(mergePreSessionTenantInput(input)).then((out) => ({
        data: {
          success: out.success,
          message: out.message,
          attemptsRemaining: out.attemptsRemaining,
        },
      })),
    );
  },

  resendEmailVerification: async (
    input: ResendEmailVerificationInput,
  ): Promise<AuthApiResponse<ResendEmailVerificationOutput>> => {
    if (isFrontendAuthApiMockEnabled()) {
      const key = buildMockVerificationKey(input.email, input.tenantId);
      const nowMs = Date.now();
      const nowSeconds = Math.floor(nowMs / 1000);
      const state = mockVerificationStateByKey.get(key);
      if (state?.resendCooldownUntilSeconds && state.resendCooldownUntilSeconds > nowSeconds) {
        return {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "auth.errors.rateLimitExceeded",
            details: { retryAfterSeconds: state.resendCooldownUntilSeconds - nowSeconds },
          },
        };
      }
      upsertMockVerificationState(key, {
        resetAttempts: true,
        forceCode: MOCK_DEFAULT_VERIFICATION_CODE,
        overrideCooldownUntilSeconds: nowSeconds + MOCK_VERIFICATION_RESEND_COOLDOWN_SECONDS,
      });
      return wrapMutation(
        Promise.resolve({
          data: {
            success: true,
            message: "auth.verifyEmail.success.resent",
            retryAfterSeconds: MOCK_VERIFICATION_RESEND_COOLDOWN_SECONDS,
          },
        }),
      );
    }

    return wrapMutation(
      trpcClient.auth.resendEmailVerification
        .mutate(mergePreSessionTenantInput(input))
        .then((out) => ({
          data: {
            success: out.success,
            message: out.message,
            retryAfterSeconds: out.retryAfterSeconds,
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
    if (isFrontendAuthApiMockEnabled()) {
      void input;
      return wrapMutation(
        Promise.resolve({
          data: {
            success: true,
            message: "auth.forgotPassword.success.linkSentIfExists",
          },
        }),
      );
    }

    return wrapMutation(
      trpcClient.auth.requestPasswordReset
        .mutate(mergePreSessionTenantInput(input))
        .then((out) => ({
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
    if (isFrontendAuthApiMockEnabled()) {
      void input;
      return wrapMutation(
        Promise.resolve({
          data: {
            success: true,
            message: "auth.resetPassword.success.completed",
          },
        }),
      );
    }

    return wrapMutation(
      trpcClient.auth.confirmPasswordReset
        .mutate(mergePreSessionTenantInput(input))
        .then((out) => ({
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
