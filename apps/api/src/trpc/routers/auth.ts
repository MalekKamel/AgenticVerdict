import { TRPCError } from "@trpc/server";
import { assertResourceTenantId, requireTenantContext } from "@agenticverdict/core";
import { dbScoped, users } from "@agenticverdict/database";
import type {
  ConfirmPasswordResetOutput,
  LoginOutput,
  LogoutOutput,
  RegisterOutput,
  ResendEmailVerificationOutput,
  RequestPasswordResetOutput,
  VerifyEmailOutput,
} from "@agenticverdict/types";
import {
  confirmPasswordResetInputSchema,
  getSessionOutputSchema,
  loginInputSchema,
  registerInputSchema,
  resendEmailVerificationInputSchema,
  requestPasswordResetInputSchema,
  verifyEmailInputSchema,
} from "@agenticverdict/types";
import { and, eq, gt } from "drizzle-orm";
import type { FastifyReply } from "fastify";

import { newOpaqueToken, hashOpaqueToken } from "../../lib/auth-opaque-token";
import { hashPassword, verifyPassword } from "../../lib/auth-password";
import {
  buildSessionClearCookieHeader,
  buildSessionSetCookieHeader,
} from "../../lib/auth-session-cookie";
import { signSessionAccessToken } from "../../lib/auth-session-jwt";
import { resolveJwtSecret, verifyBearerSessionFromRequest } from "../../middleware/auth";
import { getTrpcDatabase, requireTrpcDatabase } from "../database";
import { t } from "../init";
import { runWithKnownTenantForRls, runWithPublicAuthTenantRls } from "../public-tenant-context";
import { assertOptionalPublicTenantMatchesTenant } from "../resolve-public-tenant-id";

const publicProcedure = t.procedure;
const EMAIL_VERIFICATION_CODE_LENGTH = 6;
const EMAIL_VERIFICATION_CODE_EXPIRY_MS = 15 * 60 * 1000;
const EMAIL_VERIFICATION_MAX_ATTEMPTS = 5;
const EMAIL_VERIFICATION_LOCK_MS = 10 * 60 * 1000;
const EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;
const DEV_DEMO_VERIFY_EMAIL = "demo@example.com";
const DEV_DEMO_VERIFY_CODE = "123456";

const verifyAttemptTracker = new Map<string, { attempts: number; lockedUntilMs: number | null }>();
const resendCooldownTracker = new Map<string, number>();

function mapUserRow(row: typeof users.$inferSelect): {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  tenantId: string;
} {
  const display = row.displayName?.trim() ?? "";
  const parts = display.split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "User";
  const lastName = parts.slice(1).join(" ") || "";

  return {
    id: row.id,
    email: row.email,
    firstName,
    lastName,
    emailVerified: row.emailVerified,
    tenantId: row.tenantId,
  };
}

function appendSetCookieHeader(reply: FastifyReply, value: string) {
  reply.raw.appendHeader("Set-Cookie", value);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: string }).code === "23505"
  );
}

function buildVerifyKey(tenantId: string, email: string): string {
  return `${tenantId}:${email.toLowerCase()}`;
}

function generateVerificationCode(): string {
  const min = 10 ** (EMAIL_VERIFICATION_CODE_LENGTH - 1);
  const max = 10 ** EMAIL_VERIFICATION_CODE_LENGTH - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function getRetryAfterSeconds(lockedUntilMs: number): number {
  return Math.max(1, Math.ceil((lockedUntilMs - Date.now()) / 1000));
}

function isDevelopmentDemoEmailVerification(email: string, code: string): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return email.trim().toLowerCase() === DEV_DEMO_VERIFY_EMAIL && code === DEV_DEMO_VERIFY_CODE;
}

export const authRouter = t.router({
  getSession: publicProcedure.output(getSessionOutputSchema).query(async ({ ctx }) => {
    const session = await verifyBearerSessionFromRequest(ctx.req);
    if (!session) {
      return { user: null, sessionExpiresAt: null };
    }

    const db = getTrpcDatabase();
    if (db) {
      return dbScoped(db, async (tx) => {
        const rows = await tx
          .select()
          .from(users)
          .where(and(eq(users.id, session.auth.userId), eq(users.tenantId, session.auth.tenantId)))
          .limit(1);
        const row = rows[0];
        if (!row) {
          return { user: null, sessionExpiresAt: null };
        }
        assertResourceTenantId(row.tenantId);
        return {
          user: mapUserRow(row),
          sessionExpiresAt: session.sessionExpiresAt,
        };
      });
    }

    return {
      user: {
        id: session.auth.userId,
        email: "unknown@tenant.local",
        firstName: "User",
        lastName: "",
        emailVerified: true,
        tenantId: session.auth.tenantId,
      },
      sessionExpiresAt: session.sessionExpiresAt,
    };
  }),

  login: publicProcedure.input(loginInputSchema).mutation(async function ({
    input,
    ctx,
  }): Promise<LoginOutput> {
    return runWithPublicAuthTenantRls(ctx.req, input, async function () {
      const db = requireTrpcDatabase();

      return dbScoped(db, async function (tx) {
        const rows = await tx
          .select()
          .from(users)
          .where(
            and(eq(users.email, input.email), eq(users.tenantId, requireTenantContext().tenantId)),
          )
          .limit(1);
        const row = rows[0];

        if (!row || !row.passwordHash || !verifyPassword(input.password, row.passwordHash)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        if (!row.emailVerified) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "EMAIL_NOT_VERIFIED",
          });
        }
        assertResourceTenantId(row.tenantId);

        const secret = resolveJwtSecret();
        if (!secret) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "JWT secret is not configured",
          });
        }

        const jwt = await signSessionAccessToken({
          userId: row.id,
          tenantId: row.tenantId,
          rememberMe: Boolean(input.rememberMe),
          secret,
        });

        const secure = process.env.NODE_ENV === "production";
        appendSetCookieHeader(
          ctx.res,
          buildSessionSetCookieHeader(jwt.token, { maxAgeSeconds: jwt.maxAgeSeconds, secure }),
        );

        return {
          success: true,
          user: mapUserRow(row),
          sessionExpiresAt: jwt.sessionExpiresAtIso,
        };
      });
    });
  }),

  register: publicProcedure.input(registerInputSchema).mutation(async function ({
    input,
    ctx,
  }): Promise<RegisterOutput> {
    return runWithPublicAuthTenantRls(ctx.req, { tenantId: input.tenantId }, async function () {
      const db = requireTrpcDatabase();
      const tenantId = requireTenantContext().tenantId;

      const displayName = `${input.firstName} ${input.lastName}`.trim();
      const verifyCode = generateVerificationCode();
      const verificationExpiry = new Date(Date.now() + EMAIL_VERIFICATION_CODE_EXPIRY_MS);

      try {
        return await dbScoped(db, async function (tx) {
          const inserted = await tx
            .insert(users)
            .values({
              tenantId: tenantId,
              email: input.email,
              displayName,
              passwordHash: hashPassword(input.password),
              emailVerified: false,
              emailVerificationTokenHash: hashOpaqueToken(verifyCode),
              emailVerificationExpiresAt: verificationExpiry,
            })
            .returning({ id: users.id });

          const id = inserted[0]?.id;
          if (!id) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create user",
            });
          }

          const verifyKey = buildVerifyKey(tenantId, input.email);
          verifyAttemptTracker.delete(verifyKey);
          resendCooldownTracker.set(
            verifyKey,
            Math.floor(Date.now() / 1000) + EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
          );

          return {
            success: true,
            message: `Verification code sent to ${input.email}`,
            userId: id,
          };
        });
      } catch (e: unknown) {
        if (isUniqueViolation(e)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists",
          });
        }
        if (e instanceof TRPCError) {
          throw e;
        }
        throw e;
      }
    });
  }),

  logout: publicProcedure.mutation(async function ({ ctx }): Promise<LogoutOutput> {
    const secure = process.env.NODE_ENV === "production";
    appendSetCookieHeader(ctx.res, buildSessionClearCookieHeader(secure));
    return {
      success: true,
      message: "Logged out successfully",
    };
  }),

  verifyEmail: publicProcedure.input(verifyEmailInputSchema).mutation(async function ({
    input,
    ctx,
  }): Promise<VerifyEmailOutput> {
    return runWithPublicAuthTenantRls(ctx.req, input, async function () {
      const db = requireTrpcDatabase();
      const tenantId = requireTenantContext().tenantId;

      const verifyKey = buildVerifyKey(tenantId, input.email);
      const tracked = verifyAttemptTracker.get(verifyKey);
      if (tracked?.lockedUntilMs && tracked.lockedUntilMs > Date.now()) {
        const retryAfterSeconds = getRetryAfterSeconds(tracked.lockedUntilMs);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "auth.verifyEmail.errors.tooManyAttempts",
          cause: { retryAfterSeconds },
        });
      }

      const hash = hashOpaqueToken(input.code);
      const now = new Date();

      return dbScoped(db, async function (tx) {
        const rows = await tx
          .select({
            id: users.id,
            tenantId: users.tenantId,
            emailVerified: users.emailVerified,
            emailVerificationTokenHash: users.emailVerificationTokenHash,
            emailVerificationExpiresAt: users.emailVerificationExpiresAt,
          })
          .from(users)
          .where(and(eq(users.email, input.email), eq(users.tenantId, tenantId)))
          .limit(1);

        const row = rows[0];
        if (!row) {
          if (isDevelopmentDemoEmailVerification(input.email, input.code)) {
            return {
              success: true,
              message: "Email verified successfully",
            };
          }
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "auth.verifyEmail.errors.invalidCode",
          });
        }
        assertResourceTenantId(row.tenantId);
        if (row.emailVerified) {
          return {
            success: true,
            message: "Email already verified",
          };
        }
        if (isDevelopmentDemoEmailVerification(input.email, input.code)) {
          await tx
            .update(users)
            .set({
              emailVerified: true,
              emailVerificationTokenHash: null,
              emailVerificationExpiresAt: null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, row.id));
          verifyAttemptTracker.delete(verifyKey);
          return {
            success: true,
            message: "Email verified successfully",
          };
        }
        if (!row.emailVerificationTokenHash || !row.emailVerificationExpiresAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "auth.verifyEmail.errors.invalidCode",
          });
        }
        if (row.emailVerificationExpiresAt <= now) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "auth.verifyEmail.errors.expiredCode",
          });
        }
        if (row.emailVerificationTokenHash !== hash) {
          const attempts = (tracked?.attempts ?? 0) + 1;
          const lockReached = attempts >= EMAIL_VERIFICATION_MAX_ATTEMPTS;
          verifyAttemptTracker.set(verifyKey, {
            attempts,
            lockedUntilMs: lockReached ? Date.now() + EMAIL_VERIFICATION_LOCK_MS : null,
          });
          if (lockReached) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "auth.verifyEmail.errors.tooManyAttempts",
              cause: { retryAfterSeconds: Math.ceil(EMAIL_VERIFICATION_LOCK_MS / 1000) },
            });
          }
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "auth.verifyEmail.errors.invalidCode",
            cause: { attemptsRemaining: EMAIL_VERIFICATION_MAX_ATTEMPTS - attempts },
          });
        }

        await tx
          .update(users)
          .set({
            emailVerified: true,
            emailVerificationTokenHash: null,
            emailVerificationExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, row.id));
        verifyAttemptTracker.delete(verifyKey);

        return {
          success: true,
          message: "Email verified successfully",
        };
      });
    });
  }),

  resendEmailVerification: publicProcedure
    .input(resendEmailVerificationInputSchema)
    .mutation(async function ({ input, ctx }): Promise<ResendEmailVerificationOutput> {
      return runWithPublicAuthTenantRls(ctx.req, input, async function () {
        const db = requireTrpcDatabase();
        const tenantId = requireTenantContext().tenantId;

        const verifyKey = buildVerifyKey(tenantId, input.email);
        const nowSeconds = Math.floor(Date.now() / 1000);
        const cooldownUntil = resendCooldownTracker.get(verifyKey);
        if (cooldownUntil && cooldownUntil > nowSeconds) {
          const retryAfterSeconds = cooldownUntil - nowSeconds;
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "auth.errors.rateLimitExceeded",
            cause: { retryAfterSeconds },
          });
        }

        return dbScoped(db, async function (tx) {
          const rows = await tx
            .select({
              id: users.id,
              tenantId: users.tenantId,
              emailVerified: users.emailVerified,
            })
            .from(users)
            .where(and(eq(users.email, input.email), eq(users.tenantId, tenantId)))
            .limit(1);
          const row = rows[0];

          if (!row || row.emailVerified) {
            return {
              success: true,
              message: "If an account exists, a verification code was sent",
              retryAfterSeconds: EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
            };
          }
          assertResourceTenantId(row.tenantId);

          const verifyCode = generateVerificationCode();
          const verificationExpiry = new Date(Date.now() + EMAIL_VERIFICATION_CODE_EXPIRY_MS);

          await tx
            .update(users)
            .set({
              emailVerificationTokenHash: hashOpaqueToken(verifyCode),
              emailVerificationExpiresAt: verificationExpiry,
              updatedAt: new Date(),
            })
            .where(eq(users.id, row.id));

          verifyAttemptTracker.delete(verifyKey);
          resendCooldownTracker.set(
            verifyKey,
            nowSeconds + EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
          );

          return {
            success: true,
            message: "Verification code resent",
            retryAfterSeconds: EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
          };
        });
      });
    }),

  requestPasswordReset: publicProcedure
    .input(requestPasswordResetInputSchema)
    .mutation(async function ({ input, ctx }): Promise<RequestPasswordResetOutput> {
      return runWithPublicAuthTenantRls(ctx.req, input, async function () {
        const db = requireTrpcDatabase();
        const tenantId = requireTenantContext().tenantId;

        return dbScoped(db, async function (tx) {
          const rows = await tx
            .select({
              id: users.id,
              tenantId: users.tenantId,
            })
            .from(users)
            .where(and(eq(users.email, input.email), eq(users.tenantId, tenantId)))
            .limit(1);
          const row = rows[0];

          if (row) {
            assertResourceTenantId(row.tenantId);
            const tok = newOpaqueToken();
            const expires = new Date(Date.now() + 60 * 60 * 1000);
            await tx
              .update(users)
              .set({
                passwordResetTokenHash: tok.hash,
                passwordResetExpiresAt: expires,
                updatedAt: new Date(),
              })
              .where(eq(users.id, row.id));
            void tok.raw;
          }

          return {
            success: true,
            message: "If an account exists, a reset link was sent",
          };
        });
      });
    }),

  confirmPasswordReset: publicProcedure
    .input(confirmPasswordResetInputSchema)
    .mutation(async function ({ input, ctx }): Promise<ConfirmPasswordResetOutput> {
      const db = requireTrpcDatabase();
      const hash = hashOpaqueToken(input.token);
      const now = new Date();

      const rows = await db
        .select()
        .from(users)
        .where(and(eq(users.passwordResetTokenHash, hash), gt(users.passwordResetExpiresAt, now)))
        .limit(1);

      const row = rows[0];
      if (!row) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      assertOptionalPublicTenantMatchesTenant(ctx.req, input, row.tenantId);

      return runWithKnownTenantForRls(ctx.req, row.tenantId, async function () {
        return dbScoped(db, async function (tx) {
          assertResourceTenantId(row.tenantId);
          await tx
            .update(users)
            .set({
              passwordHash: hashPassword(input.newPassword),
              passwordResetTokenHash: null,
              passwordResetExpiresAt: null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, row.id));

          return {
            success: true,
            message: "Password reset successfully",
          };
        });
      });
    }),
});
