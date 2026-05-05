import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetBucketLocationCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
  StorageDownloadError,
  StorageDeleteError,
  StorageNotFoundError,
  StorageIntegrityError,
  StorageConfigurationError,
  StorageError,
  TenantSecurityError,
} from "./errors";
import { getTenantId, type TenantContext } from "../tenant-context";

export interface S3ObjectStorageConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region?: string;
  forcePathStyle?: boolean;
}

export class S3ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly tenantContext: TenantContext;

  constructor(config: S3ObjectStorageConfig) {
    if (!config.endpoint) {
      throw new StorageConfigurationError("S3 endpoint is required");
    }
    if (!config.accessKeyId) {
      throw new StorageConfigurationError("S3 access key ID is required");
    }
    if (!config.secretAccessKey) {
      throw new StorageConfigurationError("S3 secret access key is required");
    }
    if (!config.bucket) {
      throw new StorageConfigurationError("S3 bucket is required");
    }

    this.bucket = config.bucket;
    this.tenantContext = getTenantId();

    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region ?? "auto",
      forcePathStyle: config.forcePathStyle ?? true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
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
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: tenantKey,
        Body: params.body,
        ContentType: params.contentType,
        Metadata: {
          ...params.metadata,
          "sha256-hash": sha256Hash,
          "tenant-id": this.getTenantIdFromContext(),
        },
      });

      const response = await this.client.send(command);

      return {
        key: params.key,
        etag: response.ETag?.replace(/"/g, "") ?? "",
        versionId: response.VersionId,
        sha256Hash,
      };
    } catch (error) {
      throw new StorageUploadError(`Failed to upload object: ${tenantKey}`, {
        cause: error,
        key: params.key,
        details: { tenantKey, bucket: this.bucket },
      });
    }
  }

  async downloadObject(params: DownloadObjectParams): Promise<DownloadObjectResult> {
    const tenantKey = this.buildTenantKey(params.key);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: tenantKey,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new StorageNotFoundError(`Object not found: ${params.key}`, {
          key: params.key,
        });
      }

      const body = await this.streamToBuffer(response.Body as NodeJS.ReadableStream);
      const sha256Hash = this.calculateSHA256(body);

      const expectedHash = response.Metadata?.["sha256-hash"];
      if (expectedHash && expectedHash !== sha256Hash) {
        throw new StorageIntegrityError("SHA-256 hash mismatch on download", {
          key: params.key,
          details: { expectedHash, actualHash: sha256Hash },
        });
      }

      return {
        body,
        contentType: response.ContentType,
        metadata: response.Metadata,
        sha256Hash,
      };
    } catch (error) {
      if (error instanceof StorageNotFoundError || error instanceof StorageIntegrityError) {
        throw error;
      }
      throw new StorageDownloadError(`Failed to download object: ${params.key}`, {
        cause: error,
        key: params.key,
        details: { tenantKey, bucket: this.bucket },
      });
    }
  }

  async objectExists(params: ObjectExistsParams): Promise<boolean> {
    const tenantKey = this.buildTenantKey(params.key);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: tenantKey,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      const statusCode = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode;
      if (statusCode === 404) {
        return false;
      }
      throw new StorageError(`Failed to check object existence: ${params.key}`, {
        cause: error,
        details: { tenantKey, bucket: this.bucket },
      });
    }
  }

  async deleteObject(params: DeleteObjectParams): Promise<void> {
    const tenantKey = this.buildTenantKey(params.key);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: tenantKey,
      });

      await this.client.send(command);
    } catch (error) {
      throw new StorageDeleteError(`Failed to delete object: ${params.key}`, {
        cause: error,
        key: params.key,
        details: { tenantKey, bucket: this.bucket },
      });
    }
  }

  async generatePresignedUrl(params: GeneratePresignedUrlParams): Promise<string> {
    const tenantKey = this.buildTenantKey(params.key);
    const expiresIn = params.expiresIn ?? 3600;
    const operation = params.operation ?? "get";

    try {
      if (operation === "put") {
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: tenantKey,
        });
        return await getSignedUrl(this.client, command, { expiresIn });
      } else {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: tenantKey,
        });
        return await getSignedUrl(this.client, command, { expiresIn });
      }
    } catch (error) {
      throw new StorageError(`Failed to generate presigned URL: ${params.key}`, {
        cause: error,
        details: { tenantKey, bucket: this.bucket, operation },
      });
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const command = new GetBucketLocationCommand({
        Bucket: this.bucket,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }
}
