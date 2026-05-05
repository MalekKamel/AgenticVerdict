# S3 SeaweedFS Implementation Specification

**Document ID:** SPEC-STORAGE-001  
**Version:** 1.0  
**Status:** Proposed  
**Date:** 2026-05-04  
**Related ADR:** ADR-007

---

## Overview

This specification defines the implementation details for integrating SeaweedFS S3-compatible object storage into AgenticVerdict, providing tenant-isolated file storage for reports, exports, uploads, and future file-based features.

---

## Architecture

### Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         AgenticVerdict Platform                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │   API Service   │    │   Worker Svc    │    │    Frontend     │      │
│  │   (Fastify)     │    │   (BullMQ)      │    │   (Next.js 15)  │      │
│  │                 │    │                 │    │                 │      │
│  │  tRPC Routers   │    │  Report Jobs    │    │  Download UI    │      │
│  │  REST Endpoints │    │  Export Jobs    │    │  Upload Widgets │      │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘      │
│           │                     │                     │                 │
│           └─────────────────────┼─────────────────────┘                 │
│                                 │                                       │
│                    ┌────────────▼────────────┐                          │
│                    │   Storage Adapter       │                          │
│                    │   (packages/core/src/   │                          │
│                    │    storage/)            │                          │
│                    │                         │                          │
│                    │  - S3ObjectStorage      │                          │
│                    │  - StorageError         │                          │
│                    │  - TenantIsolation      │                          │
│                    └────────────┬────────────┘                          │
│                                 │                                       │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │   SeaweedFS     │
                         │   S3 API        │
                         │   Port: 8333    │
                         │                 │
                         │  - Filer        │
                         │  - Volume Svr   │
                         │  - Master       │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │  Persistent     │
                         │  Storage        │
                         └─────────────────┘
```

### Layer Responsibilities

| Layer                  | Package                                   | Responsibility                                            |
| ---------------------- | ----------------------------------------- | --------------------------------------------------------- |
| **Storage Core**       | `packages/core/src/storage/`              | Abstract storage interface, tenant isolation, error types |
| **S3 Adapter**         | `packages/core/src/storage/s3-storage.ts` | AWS SDK integration, SeaweedFS communication              |
| **API Integration**    | `apps/api/src/lib/storage/`               | tRPC router integration, request handling                 |
| **Worker Integration** | `apps/worker/src/lib/storage/`            | Async job file handling                                   |
| **Frontend**           | `apps/frontend/src/lib/storage/`          | Download/upload UI, presigned URLs                        |

---

## Storage Interface

### Core Interface

```typescript
// packages/core/src/storage/types.ts

import type { TenantContext } from "../tenant-context";

/**
 * Tenant-scoped object storage operations.
 * All operations enforce tenant isolation via path-based scoping.
 */
export interface ObjectStorage {
  /**
   * Upload object to tenant-scoped storage.
   *
   * @param params - Upload parameters
   * @param params.tenantId - Tenant UUID (validated against context)
   * @param params.key - Object key (relative to tenant root)
   * @param params.content - File content as Buffer
   * @param params.contentType - MIME type (e.g., 'application/pdf')
   * @param params.metadata - Optional S3 metadata (max 2KB)
   * @returns Upload result with integrity hash
   *
   * @throws {TenantSecurityError} If tenantId doesn't match context
   * @throws {StorageUploadError} If upload fails
   */
  uploadObject(params: UploadObjectParams): Promise<UploadObjectResult>;

  /**
   * Download object from tenant-scoped storage.
   *
   * @param params - Download parameters
   * @param params.tenantId - Tenant UUID (validated against context)
   * @param params.key - Object key (relative to tenant root)
   * @returns Downloaded content with metadata
   *
   * @throws {TenantSecurityError} If tenantId doesn't match context
   * @throws {StorageNotFoundError} If object doesn't exist
   * @throws {StorageDownloadError} If download fails
   */
  downloadObject(params: DownloadObjectParams): Promise<DownloadObjectResult>;

  /**
   * Check if object exists in tenant-scoped storage.
   *
   * @param params - Check parameters
   * @param params.tenantId - Tenant UUID (validated against context)
   * @param params.key - Object key (relative to tenant root)
   * @returns True if object exists
   *
   * @throws {TenantSecurityError} If tenantId doesn't match context
   */
  objectExists(params: CheckObjectParams): Promise<boolean>;

  /**
   * Delete object from tenant-scoped storage.
   *
   * @param params - Delete parameters
   * @param params.tenantId - Tenant UUID (validated against context)
   * @param params.key - Object key (relative to tenant root)
   *
   * @throws {TenantSecurityError} If tenantId doesn't match context
   * @throws {StorageDeleteError} If delete fails
   */
  deleteObject(params: DeleteObjectParams): Promise<void>;

  /**
   * Generate presigned URL for direct browser upload/download.
   *
   * @param params - URL generation parameters
   * @param params.tenantId - Tenant UUID (validated against context)
   * @param params.key - Object key (relative to tenant root)
   * @param params.expiresInSeconds - URL validity duration (max 604800)
   * @param params.operation - 'get' or 'put'
   * @returns Presigned URL string
   *
   * @throws {TenantSecurityError} If tenantId doesn't match context
   * @throws {StoragePresignedUrlError} If URL generation fails
   */
  generatePresignedUrl(params: PresignedUrlParams): Promise<string>;

  /**
   * Health check for storage backend.
   *
   * @returns True if storage is accessible
   */
  isHealthy(): Promise<boolean>;
}

export interface UploadObjectParams {
  tenantId: string;
  key: string;
  content: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface UploadObjectResult {
  sha256: string;
  byteLength: number;
  key: string;
  etag?: string;
}

export interface DownloadObjectParams {
  tenantId: string;
  key: string;
}

export interface DownloadObjectResult {
  content: Buffer;
  contentType: string;
  byteLength: number;
  lastModified?: Date;
  etag?: string;
}

export interface CheckObjectParams {
  tenantId: string;
  key: string;
}

export interface DeleteObjectParams {
  tenantId: string;
  key: string;
}

export interface PresignedUrlParams {
  tenantId: string;
  key: string;
  expiresInSeconds: number;
  operation: "get" | "put";
}
```

### Error Types

```typescript
// packages/core/src/storage/errors.ts

import { AppFault } from "../error-system";

/**
 * Base class for all storage-related errors.
 */
export abstract class StorageError extends AppFault {
  constructor(
    code: string,
    message: string,
    public readonly tenantId?: string,
    public readonly objectKey?: string,
  ) {
    super("STORAGE", code, message);
  }
}

/**
 * Tenant ID doesn't match AsyncLocalStorage context.
 * CRITICAL: This is a security violation.
 */
export class TenantSecurityError extends StorageError {
  constructor(expected: string, actual: string, objectKey?: string) {
    super(
      "TENANT_MISMATCH",
      `Tenant mismatch: expected ${expected}, got ${actual}`,
      expected,
      objectKey,
    );
  }
}

/**
 * Upload operation failed.
 */
export class StorageUploadError extends StorageError {
  constructor(
    message: string,
    tenantId: string,
    objectKey: string,
    public readonly cause?: unknown,
  ) {
    super("UPLOAD_FAILED", message, tenantId, objectKey);
  }
}

/**
 * Download operation failed.
 */
export class StorageDownloadError extends StorageError {
  constructor(
    message: string,
    tenantId: string,
    objectKey: string,
    public readonly cause?: unknown,
  ) {
    super("DOWNLOAD_FAILED", message, tenantId, objectKey);
  }
}

/**
 * Object not found.
 */
export class StorageNotFoundError extends StorageError {
  constructor(tenantId: string, objectKey: string) {
    super("NOT_FOUND", `Object not found: ${objectKey}`, tenantId, objectKey);
  }
}

/**
 * Delete operation failed.
 */
export class StorageDeleteError extends StorageError {
  constructor(
    message: string,
    tenantId: string,
    objectKey: string,
    public readonly cause?: unknown,
  ) {
    super("DELETE_FAILED", message, tenantId, objectKey);
  }
}

/**
 * Presigned URL generation failed.
 */
export class StoragePresignedUrlError extends StorageError {
  constructor(
    message: string,
    tenantId: string,
    objectKey: string,
    public readonly cause?: unknown,
  ) {
    super("PRESIGNED_URL_FAILED", message, tenantId, objectKey);
  }
}
```

---

## S3 Implementation

### S3ObjectStorage Class

```typescript
// packages/core/src/storage/s3-storage.ts

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetBucketLocationCommand,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHash } from "node:crypto";
import type {
  ObjectStorage,
  UploadObjectParams,
  UploadObjectResult,
  DownloadObjectParams,
  DownloadObjectResult,
  CheckObjectParams,
  DeleteObjectParams,
  PresignedUrlParams,
} from "./types";
import {
  StorageUploadError,
  StorageDownloadError,
  StorageNotFoundError,
  StorageDeleteError,
  StoragePresignedUrlError,
  TenantSecurityError,
} from "./errors";
import { requireTenantContext } from "../tenant-context";
import { streamToBuffer } from "../utils/stream-utils";

export interface S3StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle: boolean;
}

export class S3ObjectStorage implements ObjectStorage {
  private client: S3Client;
  private bucket: string;

  constructor(config: S3StorageConfig) {
    const s3Config: S3ClientConfig = {
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // Connection pooling for performance
      maxAttempts: 3,
      retryMode: "standard",
    };

    this.client = new S3Client(s3Config);
    this.bucket = config.bucket;
  }

  /**
   * Build tenant-scoped object key.
   * All keys are prefixed with tenants/{tenantId}/ for isolation.
   */
  private buildKey(tenantId: string, key: string): string {
    // Normalize key: remove leading slashes, collapse multiple slashes
    const normalizedKey = key.replace(/^\/+/, "").replace(/\/+/g, "/");

    return `tenants/${tenantId}/${normalizedKey}`;
  }

  /**
   * Validate tenant ID against AsyncLocalStorage context.
   * CRITICAL: This enforces tenant isolation at the application layer.
   */
  private validateTenantContext(providedTenantId: string): void {
    const ctx = requireTenantContext();

    if (ctx.tenantId !== providedTenantId) {
      throw new TenantSecurityError(ctx.tenantId, providedTenantId);
    }
  }

  async uploadObject(params: UploadObjectParams): Promise<UploadObjectResult> {
    this.validateTenantContext(params.tenantId);

    const key = this.buildKey(params.tenantId, params.key);
    const sha256 = createHash("sha256").update(params.content).digest("hex");

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: params.content,
        ContentType: params.contentType,
        Metadata: {
          "tenant-id": params.tenantId,
          sha256: sha256,
          "uploaded-at": new Date().toISOString(),
          "uploaded-by": requireTenantContext().userId ?? "system",
          ...params.metadata,
        },
      });

      const response = await this.client.send(command);

      return {
        sha256,
        byteLength: params.content.length,
        key,
        etag: response.ETag?.replace(/"/g, ""),
      };
    } catch (error) {
      throw new StorageUploadError(
        error instanceof Error ? error.message : "Upload failed",
        params.tenantId,
        key,
        error,
      );
    }
  }

  async downloadObject(params: DownloadObjectParams): Promise<DownloadObjectResult> {
    this.validateTenantContext(params.tenantId);

    const key = this.buildKey(params.tenantId, params.key);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new StorageNotFoundError(params.tenantId, key);
      }

      const content = await streamToBuffer(response.Body);
      const contentType = response.ContentType ?? "application/octet-stream";

      return {
        content,
        contentType,
        byteLength: content.length,
        lastModified: response.LastModified,
        etag: response.ETag?.replace(/"/g, ""),
      };
    } catch (error) {
      if (error instanceof Error && error.name === "NoSuchKey") {
        throw new StorageNotFoundError(params.tenantId, key);
      }
      throw new StorageDownloadError(
        error instanceof Error ? error.message : "Download failed",
        params.tenantId,
        key,
        error,
      );
    }
  }

  async objectExists(params: CheckObjectParams): Promise<boolean> {
    this.validateTenantContext(params.tenantId);

    const key = this.buildKey(params.tenantId, params.key);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  async deleteObject(params: DeleteObjectParams): Promise<void> {
    this.validateTenantContext(params.tenantId);

    const key = this.buildKey(params.tenantId, params.key);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      throw new StorageDeleteError(
        error instanceof Error ? error.message : "Delete failed",
        params.tenantId,
        key,
        error,
      );
    }
  }

  async generatePresignedUrl(params: PresignedUrlParams): Promise<string> {
    this.validateTenantContext(params.tenantId);

    const key = this.buildKey(params.tenantId, params.key);

    try {
      // Presigned URL implementation depends on AWS SDK v3 presigner
      // This is a placeholder - actual implementation requires GetObjectCommand
      // or PutObjectCommand with presigner configuration
      throw new StoragePresignedUrlError(
        "Presigned URLs not yet implemented",
        params.tenantId,
        key,
      );
    } catch (error) {
      if (error instanceof StoragePresignedUrlError) {
        throw error;
      }
      throw new StoragePresignedUrlError(
        error instanceof Error ? error.message : "Presigned URL generation failed",
        params.tenantId,
        key,
        error,
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const command = new GetBucketLocationCommand({
        Bucket: this.bucket,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      // Log error but don't throw - health checks should be non-blocking
      console.error("SeaweedFS health check failed:", error);
      return false;
    }
  }
}
```

---

## Factory and Configuration

### Storage Factory

```typescript
// packages/core/src/storage/factory.ts

import type { ObjectStorage } from "./types";
import { S3ObjectStorage, type S3StorageConfig } from "./s3-storage";
import { MemoryObjectStorage } from "./memory-storage";

export type StorageProvider = "seaweedfs" | "memory" | "filesystem";

export interface StorageFactoryConfig {
  provider: StorageProvider;
  seaweedfs?: {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    forcePathStyle: boolean;
  };
}

/**
 * Create storage instance from environment configuration.
 */
export function createObjectStorageFromEnv(): ObjectStorage {
  const provider = (process.env.STORAGE_PROVIDER as StorageProvider) || "memory";

  switch (provider) {
    case "seaweedfs":
      return createSeaweedFSStorage();
    case "memory":
      return new MemoryObjectStorage();
    case "filesystem":
      // Legacy filesystem backend (deprecated)
      throw new Error('Filesystem storage provider is deprecated. Use "memory" or "seaweedfs".');
    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}

function createSeaweedFSStorage(): ObjectStorage {
  const config: S3StorageConfig = {
    endpoint: process.env.STORAGE_ENDPOINT!,
    region: process.env.STORAGE_REGION || "auto",
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
    bucket: process.env.STORAGE_BUCKET || "agenticverdict-reports",
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
  };

  // Validate required configuration
  if (!config.endpoint) {
    throw new Error("STORAGE_ENDPOINT is required for SeaweedFS storage");
  }
  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error("STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY are required");
  }

  return new S3ObjectStorage(config);
}

/**
 * Singleton instance for application-wide use.
 */
let storageInstance: ObjectStorage | undefined;

export function getObjectStorage(): ObjectStorage {
  if (!storageInstance) {
    storageInstance = createObjectStorageFromEnv();
  }
  return storageInstance;
}

/**
 * Reset singleton (for testing).
 */
export function resetObjectStorage(): void {
  storageInstance = undefined;
}
```

---

## API Integration

### tRPC Router Integration

```typescript
// apps/api/src/trpc/routers/reports.ts

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getObjectStorage } from "@agenticverdict/core/storage";
import { dbScoped } from "@agenticverdict/database";
import { reports, auditTrail } from "@agenticverdict/database/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { authedProcedure, router } from "../trpc";

export const reportsRouter = router({
  /**
   * Upload report content to SeaweedFS.
   */
  uploadContent: authedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        version: z.number().int().min(1),
        format: z.enum(["pdf", "excel"]),
        content: z.string(), // base64 encoded
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        sha256: z.string(),
        byteLength: z.number(),
        key: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenant.tenantId;
      const db = ctx.db;
      const storage = getObjectStorage();

      await dbScoped(db, async (tx) => {
        // Verify report exists and belongs to tenant
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

        // Validate report status
        if (report.status === "deleted") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot upload content to deleted report",
          });
        }

        // Upload to SeaweedFS
        const contentBuffer = Buffer.from(input.content, "base64");
        const key = `reports/${input.id}/v${input.version}.${input.format}`;

        const {
          sha256,
          byteLength,
          key: storageKey,
        } = await storage.uploadObject({
          tenantId,
          key,
          content: contentBuffer,
          contentType:
            input.format === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          metadata: {
            "report-id": input.id,
            version: input.version.toString(),
            format: input.format,
          },
        });

        // Update report metadata
        const metadata = (report.metadata as Record<string, unknown>) || {};
        const versions = (metadata.versions as Array<Record<string, unknown>>) || [];

        versions.push({
          version: input.version,
          sha256,
          byteLength,
          contentType:
            input.format === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          storageKey,
          uploadedAt: new Date().toISOString(),
          uploadedBy: ctx.auth.userId,
        });

        await tx
          .update(reports)
          .set({
            metadata: { ...metadata, versions },
            status: "ready",
            updatedAt: new Date(),
          })
          .where(eq(reports.id, input.id));

        // Audit trail
        await tx.insert(auditTrail).values({
          tenantId,
          reportId: input.id,
          actorSub: ctx.auth.userId,
          action: "content.upload",
          eventType: "content_uploaded",
          status: "success",
          metadata: {
            version: input.version,
            sha256,
            byteLength,
            storageKey,
            storageProvider: "seaweedfs",
          },
          requestId: randomUUID(),
          createdAt: new Date(),
        });
      });

      return { success: true, sha256, byteLength, key: `tenants/${tenantId}/${key}` };
    }),

  /**
   * Download report content from SeaweedFS.
   */
  content: authedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        format: z.enum(["pdf", "excel"]),
        version: z.number().int().min(1).optional(),
      }),
    )
    .output(
      z.object({
        content: z.string(),
        contentType: z.string(),
        version: z.number(),
        byteLength: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenant.tenantId;
      const db = ctx.db;
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

      const metadata = (report.metadata as Record<string, unknown>) || {};
      const versions = (metadata.versions as Array<Record<string, unknown>>) || [];

      if (versions.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No content available for this report",
        });
      }

      const targetVersion = input.version ?? versions.length;
      const versionInfo = versions.find(
        (v: Record<string, unknown>) => v.version === targetVersion,
      );

      if (!versionInfo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Version ${targetVersion} not found`,
        });
      }

      const key = `reports/${input.id}/v${targetVersion}.${input.format}`;
      const { content, contentType, byteLength } = await storage.downloadObject({
        tenantId,
        key,
      });

      return {
        content: content.toString("base64"),
        contentType,
        version: targetVersion,
        byteLength,
      };
    }),
});
```

---

## Docker Configuration

### Docker Compose Service

```yaml
# docker-compose.yml

services:
  seaweedfs:
    image: chrislusf/seaweedfs:latest
    container_name: seaweedfs
    ports:
      - "8333:8333" # S3 API
      - "8888:8888" # Filer UI
    command: >
      server
      -s3
      -filer=true
      -s3.port=8333
      -s3.config=/etc/seaweedfs/s3.json
      -dir=/data
    volumes:
      - seaweedfs_data:/data
      - ./deploy/seaweedfs/s3.json:/etc/seaweedfs/s3.json:ro
    networks:
      - agenticverdict-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8333/"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 512M

volumes:
  seaweedfs_data:
    driver: local
```

### SeaweedFS S3 Configuration

```json
// deploy/seaweedfs/s3.json

{
  "ident": "agenticverdict",
  "secret": "CHANGE_ME_IN_PRODUCTION",
  "name": "AgenticVerdict Storage"
}
```

---

## Environment Configuration

### .env.docker.example

```bash
# SeaweedFS S3-compatible Storage
STORAGE_PROVIDER=seaweedfs
STORAGE_ENDPOINT=http://seaweedfs:8333
STORAGE_ENDPOINT_LOCAL=http://localhost:8333
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=agenticverdict
STORAGE_SECRET_KEY=<generate-secure-secret>
STORAGE_BUCKET=agenticverdict-reports
STORAGE_FORCE_PATH_STYLE=true

# For local development with default credentials
STORAGE_ACCESS_KEY_LOCAL=agenticverdict
STORAGE_SECRET_KEY_LOCAL=change-me-local
```

### Makefile Targets

```makefile
# Makefile

.PHONY: seaweedfs-up seaweedfs-down seaweedfs-logs

seaweedfs-up:
	docker compose up -d seaweedfs

seaweedfs-down:
	docker compose stop seaweedfs

seaweedfs-logs:
	docker compose logs -f seaweedfs

seaweedfs-shell:
	docker compose exec seaweedfs weed shell

seaweedfs-status:
	docker compose exec seaweedfs weed -v
```

---

## Testing Strategy

### Unit Tests

```typescript
// packages/core/src/storage/s3-storage.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import { S3ObjectStorage } from "./s3-storage";
import { TenantSecurityError, StorageNotFoundError } from "./errors";
import { runWithTenantContext, createTenantContext } from "../tenant-context";

describe("S3ObjectStorage", () => {
  let storage: S3ObjectStorage;
  const mockConfig = {
    endpoint: "http://localhost:8333",
    region: "auto",
    accessKeyId: "test-key",
    secretAccessKey: "test-secret",
    bucket: "test-bucket",
    forcePathStyle: true,
  };

  const mockTenantContext = createTenantContext({
    tenantId: "tenant-test-001",
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: "req-test-001",
    config: {} as any,
  });

  beforeEach(() => {
    storage = new S3ObjectStorage(mockConfig);
  });

  describe("uploadObject", () => {
    it("should upload object with tenant-scoped key", async () => {
      const content = Buffer.from("test content");

      await runWithTenantContext(mockTenantContext, async () => {
        const result = await storage.uploadObject({
          tenantId: "tenant-test-001",
          key: "reports/test-report/v1.pdf",
          content,
          contentType: "application/pdf",
        });

        expect(result.sha256).toBeDefined();
        expect(result.byteLength).toBe(content.length);
        expect(result.key).toBe("tenants/tenant-test-001/reports/test-report/v1.pdf");
      });
    });

    it("should reject upload with tenant mismatch", async () => {
      const content = Buffer.from("test content");

      await expect(
        runWithTenantContext(mockTenantContext, async () => {
          await storage.uploadObject({
            tenantId: "tenant-wrong-001",
            key: "reports/test-report/v1.pdf",
            content,
            contentType: "application/pdf",
          });
        }),
      ).rejects.toThrow(TenantSecurityError);
    });
  });

  describe("downloadObject", () => {
    it("should download object with correct metadata", async () => {
      // Mock S3 client response
      // ... test implementation
    });

    it("should throw StorageNotFoundError for missing object", async () => {
      // ... test implementation
    });
  });

  describe("objectExists", () => {
    it("should return true for existing object", async () => {
      // ... test implementation
    });

    it("should return false for missing object", async () => {
      // ... test implementation
    });
  });
});
```

### Integration Tests

```typescript
// apps/api/tests/integration/storage.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getObjectStorage, resetObjectStorage } from "@agenticverdict/core/storage";
import { runWithTenantContext, createTenantContext } from "@agenticverdict/core";
import { execSync } from "node:child_process";

describe("Storage Integration (SeaweedFS)", () => {
  const tenantContext = createTenantContext({
    tenantId: "tenant-integration-001",
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: "req-integration-001",
    config: {} as any,
  });

  beforeAll(() => {
    // Start SeaweedFS for integration tests
    execSync("docker compose up -d seaweedfs", { stdio: "inherit" });
    // Wait for SeaweedFS to be ready
    execSync("sleep 5");
  });

  afterAll(() => {
    execSync("docker compose down seaweedfs", { stdio: "inherit" });
    resetObjectStorage();
  });

  it("should upload and download object with tenant isolation", async () => {
    const storage = getObjectStorage();
    const content = Buffer.from("integration test content");

    // Upload for tenant A
    await runWithTenantContext(tenantContext, async () => {
      const result = await storage.uploadObject({
        tenantId: "tenant-integration-001",
        key: "test/file.txt",
        content,
        contentType: "text/plain",
      });

      expect(result.sha256).toBeDefined();
      expect(result.byteLength).toBe(content.length);
    });

    // Download for tenant A
    await runWithTenantContext(tenantContext, async () => {
      const result = await storage.downloadObject({
        tenantId: "tenant-integration-001",
        key: "test/file.txt",
      });

      expect(result.content).toEqual(content);
      expect(result.contentType).toBe("text/plain");
    });

    // Tenant B should not access tenant A's file
    const tenantBContext = createTenantContext({
      ...tenantContext,
      tenantId: "tenant-integration-002",
    });

    await expect(
      runWithTenantContext(tenantBContext, async () => {
        await storage.downloadObject({
          tenantId: "tenant-integration-002",
          key: "test/file.txt",
        });
      }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
```

---

## Observability

### Prometheus Metrics

```typescript
// apps/api/src/metrics/storage-metrics.ts

import { register, Counter, Histogram } from "prom-client";

export const storageUploadDuration = new Histogram({
  name: "storage_upload_duration_seconds",
  help: "Duration of storage upload operations",
  labelNames: ["tenantId", "operation", "outcome"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const storageDownloadDuration = new Histogram({
  name: "storage_download_duration_seconds",
  help: "Duration of storage download operations",
  labelNames: ["tenantId", "operation", "outcome"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const storageBytesUploaded = new Counter({
  name: "storage_bytes_uploaded_total",
  help: "Total bytes uploaded to storage",
  labelNames: ["tenantId"],
  registers: [register],
});

export const storageBytesDownloaded = new Counter({
  name: "storage_bytes_downloaded_total",
  help: "Total bytes downloaded from storage",
  labelNames: ["tenantId"],
  registers: [register],
});

export const storageErrors = new Counter({
  name: "storage_errors_total",
  help: "Total storage errors",
  labelNames: ["tenantId", "error_type", "operation"],
  registers: [register],
});
```

### Structured Logging

```typescript
// apps/api/src/lib/logging/storage-logging.ts

import { logger } from "./logger";

export function logStorageUpload(params: {
  tenantId: string;
  requestId: string;
  objectKey: string;
  byteLength: number;
  sha256: string;
  durationMs: number;
  success: boolean;
  error?: string;
}): void {
  if (params.success) {
    logger.info(
      {
        tenantId: params.tenantId,
        requestId: params.requestId,
        objectKey: params.objectKey,
        byteLength: params.byteLength,
        sha256: params.sha256,
        durationMs: params.durationMs,
        operation: "upload",
      },
      "File uploaded to SeaweedFS",
    );
  } else {
    logger.error(
      {
        tenantId: params.tenantId,
        requestId: params.requestId,
        objectKey: params.objectKey,
        durationMs: params.durationMs,
        operation: "upload",
        error: params.error,
      },
      "File upload failed",
    );
  }
}

export function logStorageDownload(params: {
  tenantId: string;
  requestId: string;
  objectKey: string;
  byteLength: number;
  durationMs: number;
  success: boolean;
  error?: string;
}): void {
  if (params.success) {
    logger.info(
      {
        tenantId: params.tenantId,
        requestId: params.requestId,
        objectKey: params.objectKey,
        byteLength: params.byteLength,
        durationMs: params.durationMs,
        operation: "download",
      },
      "File downloaded from SeaweedFS",
    );
  } else {
    logger.error(
      {
        tenantId: params.tenantId,
        requestId: params.requestId,
        objectKey: params.objectKey,
        durationMs: params.durationMs,
        operation: "download",
        error: params.error,
      },
      "File download failed",
    );
  }
}
```

---

## Security Checklist

- [ ] Tenant ID validated against AsyncLocalStorage context on every operation
- [ ] No credentials logged (access keys, secrets)
- [ ] SHA-256 integrity verification on upload/download
- [ ] Audit trail captures all storage operations
- [ ] SeaweedFS not exposed to public internet
- [ ] HTTPS enabled in production
- [ ] Regular security updates for SeaweedFS image
- [ ] Backup strategy implemented

---

## Definition of Done

### Code Quality

- [ ] Zero TypeScript errors
- [ ] Zero ESLint violations
- [ ] Unit test coverage > 85%
- [ ] Integration tests passing
- [ ] JSDoc comments on all public APIs

### Documentation

- [ ] ADR approved and merged
- [ ] This specification reviewed
- [ ] Environment variables documented
- [ ] Runbook created for operations

### Testing

- [ ] Unit tests for all storage operations
- [ ] Integration tests with SeaweedFS
- [ ] Tenant isolation tests
- [ ] Error handling tests
- [ ] Performance benchmarks

### Security

- [ ] Security review completed
- [ ] Penetration testing (if applicable)
- [ ] Audit trail verified
- [ ] Tenant isolation validated

---

## References

- ADR-007: S3-Compatible Object Storage with SeaweedFS
- Phase 1 Remediation Plan: `/docs/audit/reports-remediation-phase-1.md`
- Multi-Tenant Guardrails: `/docs/05-reference/multi-tenant-guardrails.md`
- Error System: `/packages/core/src/error-system/`
