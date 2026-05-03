/**
 * Authentication Types
 *
 * Shared TypeScript types and Zod schemas for authentication operations.
 * These types are used by both frontend and backend for type safety.
 *
 * This module exports the input/output schemas defined in the tRPC contracts:
 * /specs/01-ui/01-authentication/contracts/trpc-contracts.md
 */

import { z } from "zod";
import type { Role, Permission } from "./rbac";

/** Optional tenant UUID for pre-session `auth.*` procedures (body channel per SSOT C-HTTP-1). */
export const optionalAuthTenantIdSchema = z.string().uuid().optional();

/**
 * Login input schema
 *
 * Validates email and password for user login.
 */
export const loginInputSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
  tenantId: optionalAuthTenantIdSchema,
});

export type LoginInput = z.infer<typeof loginInputSchema>;

/**
 * Login output schema
 *
 * Response data for successful login.
 */
export const loginOutputSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    emailVerified: z.boolean(),
    tenantId: z.string().uuid(),
    roles: z
      .array(z.string())
      .default([])
      .transform((val) => val as Role[]),
    permissions: z
      .array(z.string())
      .default([])
      .transform((val) => val as Permission[]),
  }),
  sessionExpiresAt: z.string(), // ISO 8601 datetime string
});

export type LoginOutput = z.infer<typeof loginOutputSchema>;

/**
 * Register input schema
 *
 * Validates user registration data.
 */
export const registerInputSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters")
    .trim(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters")
    .trim(),
  tenantId: optionalAuthTenantIdSchema, // For multi-tenant signup
  accountType: z.enum(["individual", "business"]).optional(),
  tenantName: z.string().trim().min(1).max(120).optional(),
  tenantWebsite: z.string().trim().url().optional().or(z.literal("")),
  tenantSize: z.enum(["1-10", "11-50", "51-250", "251+"]).optional(),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

/**
 * Register output schema
 *
 * Response data for successful registration.
 */
export const registerOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(), // "Verification email sent to {email}"
  userId: z.string().uuid(),
});

export type RegisterOutput = z.infer<typeof registerOutputSchema>;

/**
 * Logout output schema
 *
 * Response data for successful logout.
 */
export const logoutOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(), // "Logged out successfully"
});

export type LogoutOutput = z.infer<typeof logoutOutputSchema>;

/**
 * Get session output schema
 *
 * Response data for session validation.
 */
export const getSessionOutputSchema = z.object({
  user: z
    .object({
      id: z.string().uuid(),
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      emailVerified: z.boolean(),
      tenantId: z.string().uuid(),
      tenantType: z.enum(["direct_business", "agency_partner", "agency_managed"]),
      tenantStatus: z.enum([
        "onboarding",
        "active",
        "suspended",
        "restricted",
        "archived",
        "deleted",
      ]),
      roles: z
        .array(z.string())
        .default([])
        .transform((val) => val as Role[]),
      permissions: z
        .array(z.string())
        .default([])
        .transform((val) => val as Permission[]),
    })
    .nullable(), // null if no active session
  sessionExpiresAt: z.string().nullable(),
});

export type GetSessionOutput = z.infer<typeof getSessionOutputSchema>;

/**
 * Verify email input schema
 *
 * Validates verification token from email.
 */
export const verifyEmailInputSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address").toLowerCase().trim(),
  tenantId: optionalAuthTenantIdSchema,
  code: z
    .string()
    .min(1, "Verification code is required")
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d+$/, "Verification code must contain only numbers"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;

/**
 * Verify email output schema
 *
 * Response data for successful email verification.
 */
export const verifyEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(), // "Email verified successfully"
  attemptsRemaining: z.number().int().min(0).optional(),
});

export type VerifyEmailOutput = z.infer<typeof verifyEmailOutputSchema>;

/**
 * Resend email verification input schema
 */
export const resendEmailVerificationInputSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address").toLowerCase().trim(),
  tenantId: optionalAuthTenantIdSchema,
});

export type ResendEmailVerificationInput = z.infer<typeof resendEmailVerificationInputSchema>;

/**
 * Resend email verification output schema
 */
export const resendEmailVerificationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  retryAfterSeconds: z.number().int().min(0).optional(),
});

export type ResendEmailVerificationOutput = z.infer<typeof resendEmailVerificationOutputSchema>;

/**
 * Request password reset input schema
 *
 * Validates email for password reset request.
 */
export const requestPasswordResetInputSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address").toLowerCase().trim(),
  tenantId: optionalAuthTenantIdSchema,
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInputSchema>;

/**
 * Request password reset output schema
 *
 * Response data for password reset request.
 */
export const requestPasswordResetOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(), // Generic: "If an account exists, a reset link was sent"
});

export type RequestPasswordResetOutput = z.infer<typeof requestPasswordResetOutputSchema>;

/**
 * Confirm password reset input schema
 *
 * Validates token and new password for password reset.
 */
export const confirmPasswordResetInputSchema = z.object({
  token: z.string().min(1, "Token is required"),
  tenantId: optionalAuthTenantIdSchema,
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetInputSchema>;

/**
 * Confirm password reset output schema
 *
 * Response data for successful password reset.
 */
export const confirmPasswordResetOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(), // "Password reset successfully"
});

export type ConfirmPasswordResetOutput = z.infer<typeof confirmPasswordResetOutputSchema>;

/**
 * User data type
 *
 * Common user information returned by auth operations.
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
 * Auth error codes
 *
 * Standard error codes for auth operations.
 */
export type AuthErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "RATE_LIMIT_EXCEEDED"
  | "EMAIL_NOT_VERIFIED"
  | "WEAK_PASSWORD"
  | "GONE"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "TENANT_CONTEXT_REQUIRED"
  | "TENANT_MISMATCH";

/**
 * Auth error response
 *
 * Standard error response structure for auth operations.
 */
export type AuthErrorResponse = {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
};
