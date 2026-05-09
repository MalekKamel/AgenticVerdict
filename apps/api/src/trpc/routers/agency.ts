import { TRPCError } from "@trpc/server";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { tenants, agencyPartners, tenantConnectors, insights } from "@agenticverdict/database";
import { t } from "../init";
import { getTrpcDatabase } from "../database";

const requireAgencyPartner = t.middleware(async ({ ctx, next }) => {
  if (!ctx.req.auth) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (ctx.req.auth.tenantType !== "agency_partner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only agency partners can access this resource",
    });
  }

  if (ctx.req.auth.tenantStatus !== "active") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Agency partner account is not active",
    });
  }

  return next({
    ctx: { ...ctx, agencyPartnerId: ctx.req.auth.tenantId },
  });
});

const validateClientAccess = t.middleware(async ({ ctx, input, next }) => {
  const db = getTrpcDatabase();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database unavailable",
    });
  }

  const { clientId } = input as { clientId: string };
  const agencyPartnerId = ctx.req.auth?.tenantId;

  if (!agencyPartnerId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Agency partner ID not found",
    });
  }

  const client = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.id, clientId), eq(tenants.agencyPartnerId, agencyPartnerId)))
    .limit(1);

  if (client.length === 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied to this client tenant",
    });
  }

  return next({
    ctx: { ...ctx, clientId },
  });
});

export const agencyRouter = t.router({
  getPermittedClients: t.procedure.use(requireAgencyPartner).query(async ({ ctx }) => {
    const db = getTrpcDatabase();
    if (!db) return [];

    const clients = await db
      .select({
        clientId: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        status: tenants.status,
        insightCount: db.$count(insights, eq(insights.tenantId, tenants.id)),
        connectorCount: db.$count(tenantConnectors, eq(tenantConnectors.tenantId, tenants.id)),
      })
      .from(tenants)
      .where(eq(tenants.agencyPartnerId, ctx.agencyPartnerId))
      .orderBy(tenants.name);

    return clients;
  }),

  getAggregateMetrics: t.procedure.use(requireAgencyPartner).query(async ({ ctx }) => {
    const db = getTrpcDatabase();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    }

    const clientTenants = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.agencyPartnerId, ctx.agencyPartnerId));

    const clientIds = clientTenants.map((c) => c.id);

    const totalInsights =
      clientIds.length > 0
        ? await db.$count(
            insights,
            and(inArray(insights.tenantId, clientIds), eq(insights.enabled, true)),
          )
        : 0;

    const totalConnectors =
      clientIds.length > 0
        ? await db.$count(tenantConnectors, inArray(tenantConnectors.tenantId, clientIds))
        : 0;

    return {
      clientCount: clientTenants.length,
      totalInsights,
      totalConnectors,
      activeInsights: totalInsights,
    };
  }),

  switchClientContext: t.procedure
    .use(requireAgencyPartner)
    .input(
      z.object({
        clientId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = getTrpcDatabase();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      const client = await db
        .select()
        .from(tenants)
        .where(
          and(eq(tenants.id, input.clientId), eq(tenants.agencyPartnerId, ctx.agencyPartnerId)),
        )
        .limit(1);

      if (client.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to this client tenant",
        });
      }

      return {
        tenantId: input.clientId,
        tenantName: client[0].name,
        tenantSlug: client[0].slug,
      };
    }),

  createClientTenant: t.procedure
    .use(requireAgencyPartner)
    .input(
      z.object({
        name: z.string().min(2).max(256),
        slug: z.string().min(1).max(128),
        adminEmail: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getTrpcDatabase();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      const agency = await db
        .select()
        .from(agencyPartners)
        .where(eq(agencyPartners.id, ctx.agencyPartnerId))
        .limit(1);

      const currentClientCount = await db
        .select({ count: db.$count(tenants) })
        .from(tenants)
        .where(eq(tenants.agencyPartnerId, ctx.agencyPartnerId));

      if (currentClientCount[0].count >= (agency[0]?.maxClients ?? 10)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Maximum client limit reached",
        });
      }

      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: input.name,
          slug: input.slug,
          type: "agency_managed",
          status: "onboarding",
          agencyPartnerId: ctx.agencyPartnerId,
        })
        .returning();

      return {
        tenantId: newTenant.id,
        slug: newTenant.slug,
        status: newTenant.status,
      };
    }),

  getClientById: t.procedure
    .use(requireAgencyPartner)
    .input(
      z.object({
        clientId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = getTrpcDatabase();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      const client = await db
        .select({
          id: tenants.id,
          name: tenants.name,
          slug: tenants.slug,
          status: tenants.status,
          type: tenants.type,
          createdAt: tenants.createdAt,
          updatedAt: tenants.updatedAt,
        })
        .from(tenants)
        .where(
          and(eq(tenants.id, input.clientId), eq(tenants.agencyPartnerId, ctx.agencyPartnerId)),
        )
        .limit(1);

      if (client.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client tenant not found",
        });
      }

      return client[0];
    }),

  listClientInsights: t.procedure
    .use(requireAgencyPartner)
    .use(validateClientAccess)
    .input(
      z.object({
        clientId: z.string().uuid(),
        limit: z.number().int().positive().max(100).optional().default(20),
        offset: z.number().int().nonnegative().optional().default(0),
      }),
    )
    .query(async ({ input }) => {
      const db = getTrpcDatabase();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      const clientInsights = await db
        .select({
          id: insights.id,
          name: insights.name,
          enabled: insights.enabled,
          createdAt: insights.createdAt,
        })
        .from(insights)
        .where(eq(insights.tenantId, input.clientId))
        .limit(input.limit)
        .offset(input.offset);

      const total = await db.$count(insights, eq(insights.tenantId, input.clientId));

      return {
        insights: clientInsights,
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }),
});
