import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { dbScoped, reports, reportShares, auditTrail } from "@agenticverdict/database";
import { eq, and, desc, like, sql, between, gte, lte, inArray } from "drizzle-orm";
import { requireTrpcDatabase } from "../database";
import { authedProcedure, authedProcedureWithPermission } from "../procedures";
import { t } from "../init";
import { randomBytes } from "crypto";
import { randomUUID } from "crypto";
import {
  getObjectStorage,
  StorageNotFoundError,
  TenantSecurityError,
} from "@agenticverdict/core/storage";
import {
  recordStorageUploadCompleted,
  recordStorageDownloadCompleted,
  createPinoLogger,
} from "@agenticverdict/observability";
import {
  PERMISSIONS,
  reportMetadataSchema,
  reportListInputSchema,
  reportOutputSchema,
  reportListOutputSchema,
} from "@agenticverdict/types";

function buildSharedReportUrl(options: {
  baseUrl: string;
  reportId: string;
  token: string;
}): string {
  const baseUrl = options.baseUrl || "http://localhost:3000";
  return `${baseUrl}/shared/reports/${options.reportId}?token=${options.token}`;
}

const logger = createPinoLogger("api");

export const reportRouter = t.router({
  list: authedProcedure
    .input(reportListInputSchema)
    .output(reportListOutputSchema)
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "report.list",
          input,
        },
        "report.list.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const whereConditions = [eq(reports.tenantId, tenantId)];

          if (input.status && input.status !== "all") {
            whereConditions.push(eq(reports.status, input.status));
          }

          if (input.search) {
            whereConditions.push(like(reports.title, `%${input.search}%`));
          }

          if (input.dateFrom && input.dateTo) {
            whereConditions.push(
              between(reports.createdAt, new Date(input.dateFrom), new Date(input.dateTo)),
            );
          } else if (input.dateFrom) {
            whereConditions.push(gte(reports.createdAt, new Date(input.dateFrom)));
          } else if (input.dateTo) {
            whereConditions.push(lte(reports.createdAt, new Date(input.dateTo)));
          }

          if (input.insightId) {
            whereConditions.push(
              sql`${reports.metadata} @> ${JSON.stringify({ insightId: input.insightId })}::jsonb`,
            );
          }

          const [reportRows, countResult] = await Promise.all([
            tx
              .select({
                id: reports.id,
                tenantId: reports.tenantId,
                title: reports.title,
                status: reports.status,
                metadata: reports.metadata,
                createdAt: reports.createdAt,
                updatedAt: reports.updatedAt,
              })
              .from(reports)
              .where(and(...whereConditions))
              .orderBy(desc(reports.createdAt))
              .limit(input.pageSize)
              .offset((input.page - 1) * input.pageSize),

            tx
              .select({ count: sql<number>`count(*)` })
              .from(reports)
              .where(and(...whereConditions)),
          ]);

          const total = Number(countResult[0]?.count ?? 0);

          return {
            reports: reportRows,
            total,
            page: input.page,
            pageSize: input.pageSize,
          };
        });

        logger.info(
          {
            tenantId,
            procedure: "report.list",
            duration: Date.now() - start,
            total: result.total,
          },
          "report.list.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "report.list",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "report.list.error",
        );
        throw error;
      }
    }),

  detail: authedProcedure
    .input(z.object({ id: z.string() }))
    .output(reportOutputSchema)
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "report.detail",
          reportId: input.id,
        },
        "report.detail.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const reportRows = await tx
            .select()
            .from(reports)
            .where(and(eq(reports.id, input.id), eq(reports.tenantId, tenantId)))
            .limit(1);

          const report = reportRows[0];
          if (!report) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Report not found",
            });
          }

          return report;
        });

        logger.info(
          {
            tenantId,
            procedure: "report.detail",
            duration: Date.now() - start,
          },
          "report.detail.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "report.detail",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "report.detail.error",
        );
        throw error;
      }
    }),

  content: authedProcedure
    .input(z.object({ id: z.string(), format: z.enum(["pdf", "excel"]) }))
    .output(z.object({ content: z.string(), contentType: z.string() }))
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "report.content",
          reportId: input.id,
        },
        "report.content.start",
      );

      try {
        const db = requireTrpcDatabase();
        const storage = getObjectStorage();

        const report = await dbScoped(db, async (tx) => {
          const [report] = await tx
            .select()
            .from(reports)
            .where(and(eq(reports.id, input.id), eq(reports.tenantId, tenantId)))
            .limit(1);

          if (!report) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Report not found",
            });
          }

          return report;
        });

        const storageKey = `reports/${report.id}/${input.format}`;
        const downloadStart = Date.now();
        let downloadOutcome: "success" | "failure" = "success";
        let errorType: string | undefined;

        try {
          const storageResult = await storage.downloadObject({ key: storageKey });

          const base64Content = storageResult.body.toString("base64");

          await dbScoped(db, async (tx) => {
            await tx.insert(auditTrail).values({
              id: randomUUID(),
              tenantId,
              insightId: report.id,
              eventType: "accessed",
              eventData: {
                format: input.format,
                storageKey,
                sha256Hash: storageResult.sha256Hash,
                actorSub: ctx.auth.userId,
                action: "download",
                status: "success",
              },
            });
          });

          recordStorageDownloadCompleted({
            tenantId,
            operation: "download",
            durationSeconds: (Date.now() - downloadStart) / 1000,
            outcome: "success",
            bytesDownloaded: storageResult.body.length,
          });

          logger.info(
            {
              tenantId,
              procedure: "report.content",
              duration: Date.now() - start,
              format: input.format,
            },
            "report.content.success",
          );

          return {
            content: base64Content,
            contentType:
              storageResult.contentType ??
              (input.format === "pdf"
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
          };
        } catch (downloadError) {
          downloadOutcome = "failure";
          if (downloadError instanceof StorageNotFoundError) {
            errorType = "STORAGE_NOT_FOUND";
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Report content not found in storage",
            });
          }
          if (downloadError instanceof TenantSecurityError) {
            errorType = "TENANT_SECURITY_ERROR";
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Tenant security validation failed",
            });
          }
          errorType = downloadError instanceof Error ? downloadError.constructor.name : "UNKNOWN";
          throw downloadError;
        } finally {
          if (downloadOutcome === "failure") {
            recordStorageDownloadCompleted({
              tenantId,
              operation: "download",
              durationSeconds: (Date.now() - downloadStart) / 1000,
              outcome: downloadOutcome,
              errorType,
            });
          }
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error(
          {
            tenantId,
            procedure: "report.content",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "report.content.error",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch report content",
        });
      }
    }),

  uploadContent: authedProcedure
    .input(
      z.object({
        id: z.string(),
        format: z.enum(["pdf", "excel"]),
        content: z.string(),
        contentType: z.string().optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        storageKey: z.string(),
        sha256Hash: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "report.uploadContent",
          reportId: input.id,
          format: input.format,
        },
        "report.uploadContent.start",
      );

      try {
        const db = requireTrpcDatabase();
        const storage = getObjectStorage();

        const report = await dbScoped(db, async (tx) => {
          const [report] = await tx
            .select()
            .from(reports)
            .where(and(eq(reports.id, input.id), eq(reports.tenantId, tenantId)))
            .limit(1);

          if (!report) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Report not found",
            });
          }

          return report;
        });

        const contentBuffer = Buffer.from(input.content, "base64");
        const storageKey = `reports/${report.id}/${input.format}`;
        const uploadStart = Date.now();
        let uploadOutcome: "success" | "failure" = "success";
        let errorType: string | undefined;

        try {
          const uploadResult = await storage.uploadObject({
            key: storageKey,
            body: contentBuffer,
            contentType:
              input.contentType ??
              (input.format === "pdf"
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            metadata: {
              reportId: input.id,
              format: input.format,
              uploadedBy: ctx.auth.userId,
            },
          });

          await dbScoped(db, async (tx) => {
            await tx.insert(auditTrail).values({
              id: randomUUID(),
              tenantId,
              insightId: report.id,
              eventType: "created",
              eventData: {
                format: input.format,
                storageKey,
                sha256Hash: uploadResult.sha256Hash,
                etag: uploadResult.etag,
                actorSub: ctx.auth.userId,
                action: "upload",
                status: "success",
              },
            });
          });

          recordStorageUploadCompleted({
            tenantId,
            operation: "upload",
            durationSeconds: (Date.now() - uploadStart) / 1000,
            outcome: "success",
            bytesUploaded: contentBuffer.length,
          });

          logger.info(
            {
              tenantId,
              procedure: "report.uploadContent",
              duration: Date.now() - start,
              format: input.format,
              sha256Hash: uploadResult.sha256Hash,
            },
            "report.uploadContent.success",
          );

          return {
            success: true,
            storageKey,
            sha256Hash: uploadResult.sha256Hash,
          };
        } catch (uploadError) {
          uploadOutcome = "failure";
          if (uploadError instanceof TenantSecurityError) {
            errorType = "TENANT_SECURITY_ERROR";
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Tenant security validation failed",
            });
          }
          errorType = uploadError instanceof Error ? uploadError.constructor.name : "UNKNOWN";
          throw uploadError;
        } finally {
          if (uploadOutcome === "failure") {
            recordStorageUploadCompleted({
              tenantId,
              operation: "upload",
              durationSeconds: (Date.now() - uploadStart) / 1000,
              outcome: uploadOutcome,
              errorType,
            });
          }
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error(
          {
            tenantId,
            procedure: "report.uploadContent",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "report.uploadContent.error",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload report content",
        });
      }
    }),

  delete: authedProcedureWithPermission(PERMISSIONS.REPORTS_DELETE)
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "report.delete",
          reportId: input.id,
        },
        "report.delete.start",
      );

      try {
        const db = requireTrpcDatabase();

        await dbScoped(db, async (tx) => {
          const [deleted] = await tx
            .delete(reports)
            .where(and(eq(reports.id, input.id), eq(reports.tenantId, tenantId)))
            .returning();

          if (!deleted) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Report not found",
            });
          }

          await tx.insert(auditTrail).values({
            id: randomUUID(),
            tenantId,
            insightId: input.id,
            eventType: "deleted",
            eventData: {
              deletedReportId: input.id,
              actorSub: ctx.auth.userId,
              action: "delete",
              status: "success",
            },
          });
        });

        logger.info(
          {
            tenantId,
            procedure: "report.delete",
            duration: Date.now() - start,
          },
          "report.delete.success",
        );

        return { success: true };
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "report.delete",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "report.delete.error",
        );
        throw error;
      }
    }),

  deleteMany: authedProcedureWithPermission(PERMISSIONS.REPORTS_DELETE)
    .input(z.object({ ids: z.array(z.string()) }))
    .output(z.object({ success: z.boolean(), deletedCount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      if (input.ids.length > 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete more than 100 reports at once",
        });
      }

      logger.info(
        {
          tenantId,
          procedure: "report.deleteMany",
          count: input.ids.length,
        },
        "report.deleteMany.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const deleted = await tx
            .delete(reports)
            .where(and(eq(reports.tenantId, tenantId), inArray(reports.id, input.ids)))
            .returning();

          await tx.insert(auditTrail).values({
            id: randomUUID(),
            tenantId,
            eventType: "deleted",
            eventData: {
              deletedCount: deleted.length,
              reportIds: input.ids,
              actorSub: ctx.auth.userId,
              action: "deleteMany",
              status: "success",
            },
          });

          return deleted.length;
        });

        logger.info(
          {
            tenantId,
            procedure: "report.deleteMany",
            duration: Date.now() - start,
            deletedCount: result,
          },
          "report.deleteMany.success",
        );

        return { success: true, deletedCount: result };
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "report.deleteMany",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "report.deleteMany.error",
        );
        throw error;
      }
    }),

  shares: authedProcedure
    .input(z.object({ reportId: z.string() }))
    .output(
      z.object({
        shares: z.array(
          z.object({
            id: z.string(),
            token: z.string(),
            expiresAt: z.date(),
            revokedAt: z.date().nullable(),
            createdAt: z.date(),
            createdBy: z.string(),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "report.shares",
          reportId: input.reportId,
        },
        "report.shares.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const shareRows = await tx
            .select()
            .from(reportShares)
            .where(
              and(eq(reportShares.reportId, input.reportId), eq(reportShares.tenantId, tenantId)),
            )
            .orderBy(desc(reportShares.createdAt));

          return {
            shares: shareRows.map((share) => ({
              id: share.id,
              token: share.token,
              expiresAt: share.expiresAt,
              revokedAt: share.revokedAt,
              createdAt: share.createdAt,
              createdBy: share.createdBy,
            })),
          };
        });

        logger.info(
          {
            tenantId,
            procedure: "report.shares",
            duration: Date.now() - start,
            count: result.shares.length,
          },
          "report.shares.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "report.shares",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "report.shares.error",
        );
        throw error;
      }
    }),

  createShareLink: authedProcedure
    .input(
      z.object({
        reportId: z.string(),
        expiresAt: z.date(),
      }),
    )
    .output(
      z.object({
        shareUrl: z.string(),
        expiresAt: z.date(),
        token: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "report.createShareLink",
          reportId: input.reportId,
        },
        "report.createShareLink.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const [report] = await tx
            .select()
            .from(reports)
            .where(and(eq(reports.id, input.reportId), eq(reports.tenantId, tenantId)))
            .limit(1);

          if (!report) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Report not found",
            });
          }

          const token = randomBytes(32).toString("hex");

          const [share] = await tx
            .insert(reportShares)
            .values({
              tenantId,
              reportId: input.reportId,
              token,
              expiresAt: input.expiresAt,
              createdBy: ctx.auth.userId,
            })
            .returning();

          if (!share) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create share link",
            });
          }

          await tx.insert(auditTrail).values({
            id: randomUUID(),
            tenantId,
            insightId: input.reportId,
            eventType: "shared",
            eventData: {
              shareId: share.id,
              expiresAt: share.expiresAt.toISOString(),
              actorSub: ctx.auth.userId,
              action: "share",
              status: "success",
            },
          });

          const shareUrl = buildSharedReportUrl({
            baseUrl: process.env.FRONTEND_URL || "http://localhost:3000",
            reportId: input.reportId,
            token,
          });

          return {
            shareUrl,
            expiresAt: share.expiresAt,
            token: share.token,
          };
        });

        logger.info(
          {
            tenantId,
            procedure: "report.createShareLink",
            duration: Date.now() - start,
          },
          "report.createShareLink.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "report.createShareLink",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "report.createShareLink.error",
        );
        throw error;
      }
    }),

  revokeShareLink: authedProcedure
    .input(z.object({ shareId: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "report.revokeShareLink",
          shareId: input.shareId,
        },
        "report.revokeShareLink.start",
      );

      try {
        const db = requireTrpcDatabase();

        await dbScoped(db, async (tx) => {
          const [share] = await tx
            .select()
            .from(reportShares)
            .where(and(eq(reportShares.id, input.shareId), eq(reportShares.tenantId, tenantId)))
            .limit(1);

          if (!share) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Share link not found",
            });
          }

          await tx
            .update(reportShares)
            .set({ revokedAt: new Date() })
            .where(eq(reportShares.id, input.shareId));

          await tx.insert(auditTrail).values({
            id: randomUUID(),
            tenantId,
            insightId: share.reportId,
            eventType: "share_revoked",
            eventData: {
              shareId: input.shareId,
              actorSub: ctx.auth.userId,
              action: "revoke_share",
              status: "success",
            },
          });
        });

        logger.info(
          {
            tenantId,
            procedure: "report.revokeShareLink",
            duration: Date.now() - start,
          },
          "report.revokeShareLink.success",
        );

        return { success: true };
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "report.revokeShareLink",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "report.revokeShareLink.error",
        );
        throw error;
      }
    }),

  getSharedReport: t.procedure
    .input(z.object({ reportId: z.string(), token: z.string() }))
    .output(
      z.object({
        id: z.string(),
        tenantId: z.string(),
        title: z.string(),
        status: z.string(),
        metadata: reportMetadataSchema,
        createdAt: z.date(),
        updatedAt: z.date(),
      }),
    )
    .query(async ({ input }) => {
      const start = Date.now();

      logger.info(
        {
          procedure: "report.getSharedReport",
          reportId: input.reportId,
        },
        "report.getSharedReport.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await db.transaction(async (tx) => {
          const [share] = await tx
            .select()
            .from(reportShares)
            .where(
              and(eq(reportShares.reportId, input.reportId), eq(reportShares.token, input.token)),
            )
            .limit(1);

          if (!share) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Share link not found",
            });
          }

          if (share.revokedAt) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Share link has been revoked",
            });
          }

          if (share.expiresAt < new Date()) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Share link has expired",
            });
          }

          const [report] = await tx
            .select()
            .from(reports)
            .where(eq(reports.id, input.reportId))
            .limit(1);

          if (!report) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Report not found",
            });
          }

          return report;
        });

        logger.info(
          {
            procedure: "report.getSharedReport",
            duration: Date.now() - start,
          },
          "report.getSharedReport.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            procedure: "report.getSharedReport",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "report.getSharedReport.error",
        );
        throw error;
      }
    }),

  getSharedReportContent: t.procedure
    .input(z.object({ reportId: z.string(), token: z.string(), format: z.enum(["pdf", "excel"]) }))
    .output(z.object({ content: z.string(), contentType: z.string() }))
    .query(async ({ input }) => {
      const start = Date.now();

      logger.info(
        {
          procedure: "report.getSharedReportContent",
          reportId: input.reportId,
        },
        "report.getSharedReportContent.start",
      );

      try {
        const db = requireTrpcDatabase();

        await db.transaction(async (tx) => {
          const [share] = await tx
            .select()
            .from(reportShares)
            .where(
              and(eq(reportShares.reportId, input.reportId), eq(reportShares.token, input.token)),
            )
            .limit(1);

          if (!share) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Share link not found",
            });
          }

          if (share.revokedAt) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Share link has been revoked",
            });
          }

          if (share.expiresAt < new Date()) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Share link has expired",
            });
          }
        });

        // Fetch actual report content from object storage
        const storage = getObjectStorage();
        const storageKey = `reports/${input.reportId}/${input.format}`;
        const storageResult = await storage.downloadObject({ key: storageKey });
        const base64Content = storageResult.body.toString("base64");

        logger.info(
          {
            procedure: "report.getSharedReportContent",
            duration: Date.now() - start,
            contentLength: base64Content.length,
          },
          "report.getSharedReportContent.success",
        );

        return {
          content: base64Content,
          contentType:
            input.format === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
      } catch (error) {
        logger.error(
          {
            procedure: "report.getSharedReportContent",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "report.getSharedReportContent.error",
        );
        throw error;
      }
    }),
});
