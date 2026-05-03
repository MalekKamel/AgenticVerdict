import { z } from "zod";

/**
 * Authentication validation schemas
 *
 * These schemas provide runtime validation for authentication-related forms
 * using Zod. They ensure type safety and provide user-friendly error messages.
 *
 * All schemas support internationalization through error message interpolation.
 */

/**
 * Login form schema
 *
 * Validates email and password for user login.
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   schema: loginSchema,
 *   onSubmit: async (data) => {
 *     await auth.login(data.email, data.password);
 *   }
 * });
 * ```
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: "auth.login.errors.email.required",
      invalid_type_error: "auth.login.errors.email.invalid",
    })
    .min(1, { message: "auth.login.errors.email.required" })
    .email({ message: "auth.login.errors.email.invalid" })
    .toLowerCase()
    .trim(),

  password: z
    .string({
      required_error: "auth.login.errors.password.required",
    })
    .min(1, { message: "auth.login.errors.password.required" })
    .min(8, { message: "auth.login.errors.password.tooShort" }),

  rememberMe: z.boolean().optional().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form schema
 *
 * Validates user registration data including password confirmation.
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   schema: registerSchema,
 *   onSubmit: async (data) => {
 *     await auth.register(data);
 *   }
 * });
 * ```
 */
export const registerSchema = z
  .object({
    email: z
      .string({
        required_error: "auth.register.errors.email.required",
        invalid_type_error: "auth.register.errors.email.invalid",
      })
      .min(1, { message: "auth.register.errors.email.required" })
      .email({ message: "auth.register.errors.email.invalid" })
      .toLowerCase()
      .trim(),

    password: z
      .string({
        required_error: "auth.register.errors.password.required",
      })
      .min(1, { message: "auth.register.errors.password.required" })
      .min(8, { message: "auth.register.errors.password.tooShort" })
      .regex(/[A-Z]/, { message: "auth.register.errors.password.noUppercase" })
      .regex(/[a-z]/, { message: "auth.register.errors.password.noLowercase" })
      .regex(/[0-9]/, { message: "auth.register.errors.password.noNumber" })
      .regex(/[^A-Za-z0-9]/, { message: "auth.register.errors.password.noSpecial" }),

    confirmPassword: z
      .string({
        required_error: "auth.register.errors.confirmPassword.required",
      })
      .min(1, { message: "auth.register.errors.confirmPassword.required" }),

    firstName: z
      .string({
        required_error: "auth.register.errors.firstName.required",
      })
      .min(1, { message: "auth.register.errors.firstName.required" })
      .min(2, { message: "auth.register.errors.firstName.tooShort" })
      .max(50, { message: "auth.register.errors.firstName.tooLong" })
      .trim(),

    lastName: z
      .string({
        required_error: "auth.register.errors.lastName.required",
      })
      .min(1, { message: "auth.register.errors.lastName.required" })
      .min(2, { message: "auth.register.errors.lastName.tooShort" })
      .max(50, { message: "auth.register.errors.lastName.tooLong" })
      .trim(),

    acceptTerms: z
      .boolean({
        required_error: "auth.register.errors.acceptTerms.required",
      })
      .refine((val) => val === true, {
        message: "auth.register.errors.acceptTerms.required",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.register.errors.confirmPassword.mismatch",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const registerStepAccountTypeSchema = z.object({
  accountType: z.enum(["individual", "business"], {
    required_error: "auth.register.steps.accountType.errors.required",
  }),
});

export const registerStepTenantSchema = z.object({
  tenantName: z
    .string({ required_error: "auth.register.steps.tenant.errors.tenantNameRequired" })
    .min(2, { message: "auth.register.steps.tenant.errors.tenantNameTooLong" })
    .max(120, { message: "auth.register.steps.tenant.errors.tenantNameTooLong" })
    .trim(),
  tenantWebsite: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^https?:\/\/.+/i.test(value),
      "auth.register.steps.tenant.errors.tenantWebsiteInvalid",
    ),
  tenantSize: z.enum(["1-10", "11-50", "51-250", "251+"], {
    required_error: "auth.register.steps.tenant.errors.tenantSizeRequired",
  }),
});

export const registerStepUserAccountSchema = registerSchema;

export type RegisterStepAccountTypeData = z.infer<typeof registerStepAccountTypeSchema>;
export type RegisterStepTenantData = z.infer<typeof registerStepTenantSchema>;
export type RegisterMultiStepData = RegisterStepAccountTypeData &
  RegisterStepTenantData &
  RegisterFormData;

/**
 * Forgot password form schema
 *
 * Validates email for password reset request.
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   schema: forgotPasswordSchema,
 *   onSubmit: async (data) => {
 *     await auth.requestPasswordReset(data.email);
 *   }
 * });
 * ```
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({
      required_error: "auth.forgotPassword.errors.email.required",
      invalid_type_error: "auth.forgotPassword.errors.email.invalid",
    })
    .min(1, { message: "auth.forgotPassword.errors.email.required" })
    .email({ message: "auth.forgotPassword.errors.email.invalid" })
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password form schema
 *
 * Validates new password and confirmation for password reset.
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   schema: resetPasswordSchema,
 *   onSubmit: async (data) => {
 *     await auth.resetPassword(token, data.password);
 *   }
 * });
 * ```
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string({
        required_error: "auth.resetPassword.errors.password.required",
      })
      .min(1, { message: "auth.resetPassword.errors.password.tooShort" })
      .min(8, { message: "auth.resetPassword.errors.password.tooShort" })
      .regex(/[A-Z]/, { message: "auth.resetPassword.errors.password.noUppercase" })
      .regex(/[a-z]/, { message: "auth.resetPassword.errors.password.noLowercase" })
      .regex(/[0-9]/, { message: "auth.resetPassword.errors.password.noNumber" })
      .regex(/[^A-Za-z0-9]/, { message: "auth.resetPassword.errors.password.noSpecial" }),

    confirmPassword: z
      .string({
        required_error: "auth.resetPassword.errors.confirmPassword.required",
      })
      .min(1, { message: "auth.resetPassword.errors.confirmPassword.required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.resetPassword.errors.confirmPassword.mismatch",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Email verification schema
 *
 * Validates verification code from email.
 */
export const verifyEmailSchema = z.object({
  code: z
    .string({
      required_error: "auth.verifyEmail.errors.code.required",
    })
    .min(1, { message: "auth.verifyEmail.errors.code.required" })
    .length(6, { message: "auth.verifyEmail.errors.code.invalidLength" })
    .regex(/^\d+$/, { message: "auth.verifyEmail.errors.code.invalidFormat" }),
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
