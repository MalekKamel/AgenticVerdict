import * as crypto from "crypto";
import type {
  ObjectStorage,
  UploadObjectParams,
  UploadObjectResult,
  DownloadObjectParams,
  DownloadObjectResult,
  ObjectExistsParams,
  DeleteObjectParams,
  GeneratePresignedUrlParams,
} from "./types";
import {
  StorageUploadError,
  StorageDeleteError,
  StorageNotFoundError,
  StorageIntegrityError,
  TenantSecurityError,
} from "./errors";
import { getTenantId, type TenantContext } from "../tenant-context";

interface MemoryObject {
  body: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
  sha256Hash: string;
  createdAt: Date;
}

export class MemoryObjectStorage implements ObjectStorage {
  private readonly storage: Map<string, MemoryObject>;
  private readonly tenantContext: TenantContext;

  constructor() {
    this.storage = new Map();
    try {
      this.tenantContext = getTenantId();
    } catch {
      this.tenantContext = { tenantId: "" } as TenantContext;
    }
  }

  private getTenantIdFromContext(): string {
    const tenantId = this.tenantContext.tenantId;
    if (!tenantId) {
      throw new TenantSecurityError("Tenant context is required for storage operations", {
        details: { operation: "getTenantIdFromContext" },
      });
    }
    return tenantId;
  }

  private buildTenantKey(key: string): string {
    const tenantId = this.getTenantIdFromContext();
    const normalizedKey = this.normalizeKey(key);
    return `tenants/${tenantId}/${normalizedKey}`;
  }

  private normalizeKey(key: string): string {
    let normalized = key;
    if (normalized.startsWith("/")) {
      normalized = normalized.slice(1);
    }
    normalized = normalized.replace(/\/+/g, "/");
    return normalized;
  }

  private calculateSHA256(body: Buffer | Uint8Array): string {
    return crypto.createHash("sha256").update(body).digest("hex");
  }

  async uploadObject(params: UploadObjectParams): Promise<UploadObjectResult> {
    const tenantKey = this.buildTenantKey(params.key);
    const sha256Hash = this.calculateSHA256(params.body);

    try {
      this.storage.set(tenantKey, {
        body: Buffer.from(params.body),
        contentType: params.contentType,
        metadata: {
          ...params.metadata,
          "sha256-hash": sha256Hash,
          "tenant-id": this.getTenantIdFromContext(),
        },
        sha256Hash,
        createdAt: new Date(),
      });

      const etag = `"${sha256Hash}"`;

      return {
        key: params.key,
        etag,
        sha256Hash,
      };
    } catch (error) {
      throw new StorageUploadError(`Failed to upload object: ${params.key}`, {
        cause: error,
        key: params.key,
        details: { tenantKey },
      });
    }
  }

  async downloadObject(params: DownloadObjectParams): Promise<DownloadObjectResult> {
    const tenantKey = this.buildTenantKey(params.key);

    const object = this.storage.get(tenantKey);
    if (!object) {
      throw new StorageNotFoundError(`Object not found: ${params.key}`, {
        key: params.key,
      });
    }

    const sha256Hash = this.calculateSHA256(object.body);
    if (object.sha256Hash !== sha256Hash) {
      throw new StorageIntegrityError("SHA-256 hash mismatch on download", {
        key: params.key,
        details: { expectedHash: object.sha256Hash, actualHash: sha256Hash },
      });
    }

    return {
      body: object.body,
      contentType: object.contentType,
      metadata: object.metadata,
      sha256Hash,
    };
  }

  async objectExists(params: ObjectExistsParams): Promise<boolean> {
    const tenantKey = this.buildTenantKey(params.key);
    return this.storage.has(tenantKey);
  }

  async deleteObject(params: DeleteObjectParams): Promise<void> {
    const tenantKey = this.buildTenantKey(params.key);

    try {
      this.storage.delete(tenantKey);
    } catch (error) {
      throw new StorageDeleteError(`Failed to delete object: ${params.key}`, {
        cause: error,
        key: params.key,
        details: { tenantKey },
      });
    }
  }

  async generatePresignedUrl(params: GeneratePresignedUrlParams): Promise<string> {
    const tenantKey = this.buildTenantKey(params.key);
    const object = this.storage.get(tenantKey);

    if (!object && params.operation !== "put") {
      throw new StorageNotFoundError(`Object not found: ${params.key}`, {
        key: params.key,
      });
    }

    const mockUrl = new URL("http://localhost:8333");
    mockUrl.pathname = this.bucket;
    mockUrl.searchParams.set("key", tenantKey);
    mockUrl.searchParams.set("operation", params.operation ?? "get");
    mockUrl.searchParams.set("expiresIn", String(params.expiresIn ?? 3600));

    return mockUrl.toString();
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  private get bucket(): string {
    return "memory-bucket";
  }
}
