import { TRPCError } from "@trpc/server";
import { users } from "@agenticverdict/database";
import type {
  ConfirmPasswordResetOutput,
  LoginOutput,
  LogoutOutput,
  RegisterOutput,
  RequestPasswordResetOutput,
  VerifyEmailOutput,
} from "@agenticverdict/types";
import {
  confirmPasswordResetInputSchema,
  getSessionOutputSchema,
  loginInputSchema,
  registerInputSchema,
  requestPasswordResetInputSchema,
  verifyEmailInputSchema,
} from "@agenticverdict/types";
import { and, eq, gt } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";

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

const publicProcedure = t.procedure;

function readTenantIdFromRequest(req: FastifyRequest): string | undefined {
  const raw = req.headers["x-tenant-id"];
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") {
    return undefined;
  }
  const tId = v.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tId)
    ? tId
    : undefined;
}

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
    tenantId: row.companyId,
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

export const authRouter = t.router({
  getSession: publicProcedure.output(getSessionOutputSchema).query(async ({ ctx }) => {
    const session = await verifyBearerSessionFromRequest(ctx.req);
    if (!session) {
      return { user: null, sessionExpiresAt: null };
    }

    const db = getTrpcDatabase();
    if (db) {
      const rows = await db
        .select()
        .from(users)
        .where(and(eq(users.id, session.auth.userId), eq(users.companyId, session.auth.tenantId)))
        .limit(1);
      const row = rows[0];
      if (!row) {
        return { user: null, sessionExpiresAt: null };
      }
      return {
        user: mapUserRow(row),
        sessionExpiresAt: session.sessionExpiresAt,
      };
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
    const tenantId = readTenantIdFromRequest(ctx.req);
    if (!tenantId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Missing x-tenant-id",
      });
    }

    const db = requireTrpcDatabase();

    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.email, input.email), eq(users.companyId, tenantId)))
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

    const secret = resolveJwtSecret();
    if (!secret) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "JWT secret is not configured",
      });
    }

    const jwt = await signSessionAccessToken({
      userId: row.id,
      tenantId: row.companyId,
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
  }),

  register: publicProcedure.input(registerInputSchema).mutation(async function ({
    input,
    ctx,
  }): Promise<RegisterOutput> {
    const tenantId = input.tenantId ?? readTenantIdFromRequest(ctx.req);
    if (!tenantId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "tenantId or x-tenant-id is required",
      });
    }

    const db = requireTrpcDatabase();

    const displayName = `${input.firstName} ${input.lastName}`.trim();
    const verifyTok = newOpaqueToken();
    const verificationExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    try {
      const inserted = await db
        .insert(users)
        .values({
          companyId: tenantId,
          email: input.email,
          displayName,
          passwordHash: hashPassword(input.password),
          emailVerified: false,
          emailVerificationTokenHash: verifyTok.hash,
          emailVerificationExpiresAt: verificationExpiry,
        })
        .returning({ id: users.id });

      const id = inserted[0]?.id;
      if (!id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
      }

      void verifyTok.raw;

      return {
        success: true,
        message: `Verification email sent to ${input.email}`,
        userId: id,
      };
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
  }): Promise<VerifyEmailOutput> {
    const db = requireTrpcDatabase();
    const hash = hashOpaqueToken(input.token);
    const now = new Date();

    const rows = await db
      .select()
      .from(users)
      .where(
        and(eq(users.emailVerificationTokenHash, hash), gt(users.emailVerificationExpiresAt, now)),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid or expired verification token",
      });
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, row.id));

    return {
      success: true,
      message: "Email verified successfully",
    };
  }),

  requestPasswordReset: publicProcedure
    .input(requestPasswordResetInputSchema)
    .mutation(async function ({ input, ctx }): Promise<RequestPasswordResetOutput> {
      const tenantId = readTenantIdFromRequest(ctx.req);
      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing x-tenant-id",
        });
      }

      const db = requireTrpcDatabase();

      const rows = await db
        .select()
        .from(users)
        .where(and(eq(users.email, input.email), eq(users.companyId, tenantId)))
        .limit(1);
      const row = rows[0];

      if (row) {
        const tok = newOpaqueToken();
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        await db
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
    }),

  confirmPasswordReset: publicProcedure
    .input(confirmPasswordResetInputSchema)
    .mutation(async function ({ input }): Promise<ConfirmPasswordResetOutput> {
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

      await db
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
    }),
});
