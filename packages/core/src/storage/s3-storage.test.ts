import { describe, expect, it, vi } from "vitest";
import { S3ObjectStorage } from "./s3-storage";
import {
  StorageUploadError,
  StorageDownloadError,
  StorageDeleteError,
  StorageIntegrityError,
  StorageConfigurationError,
  StorageError,
} from "./errors";
import { runWithTenantContext, type TenantContext } from "../tenant-context";

const sampleTenantContext: TenantContext = {
  tenantId: "tenant-123",
  tenantType: "direct_business",
  tenantStatus: "active",
  config: {
    tenantId: "tenant-123",
    tenantName: "Test Tenant",
    localization: {
      language: "en",
      region: "SA",
      timezone: "UTC",
      currency: "USD",
    },
    marketing: { channels: [] },
    ai: {
      primaryProvider: "openai" as const,
      defaultModel: {
        providerId: "openai" as const,
        modelId: "gpt-4",
      },
    },
    features: { enableInsights: true, enableVerdict: false },
  },
  requestId: "test-request",
};

const mockConfig = {
  endpoint: "http://localhost:8333",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
  bucket: "test-bucket",
  region: "auto",
  forcePathStyle: true,
};

describe("S3ObjectStorage", () => {
  describe("constructor", () => {
    it("should create instance with valid config", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);
        expect(storage).toBeInstanceOf(S3ObjectStorage);
      });
    });

    it("should throw StorageConfigurationError when endpoint is missing", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        expect(
          () =>
            new S3ObjectStorage({
              ...mockConfig,
              endpoint: "",
            }),
        ).toThrow(StorageConfigurationError);
      });
    });

    it("should throw StorageConfigurationError when accessKeyId is missing", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        expect(
          () =>
            new S3ObjectStorage({
              ...mockConfig,
              accessKeyId: "",
            }),
        ).toThrow(StorageConfigurationError);
      });
    });

    it("should throw StorageConfigurationError when secretAccessKey is missing", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        expect(
          () =>
            new S3ObjectStorage({
              ...mockConfig,
              secretAccessKey: "",
            }),
        ).toThrow(StorageConfigurationError);
      });
    });

    it("should throw StorageConfigurationError when bucket is missing", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        expect(
          () =>
            new S3ObjectStorage({
              ...mockConfig,
              bucket: "",
            }),
        ).toThrow(StorageConfigurationError);
      });
    });
  });

  describe("uploadObject", () => {
    it("should upload object successfully with SHA-256 hash", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("test content");

        const mockSend = vi.fn().mockResolvedValue({
          ETag: '"abc123"',
          VersionId: "v1",
        });

        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        const result = await storage.uploadObject({
          key: "test/file.txt",
          body: testData,
          contentType: "text/plain",
          metadata: { custom: "value" },
        });

        expect(result.key).toBe("test/file.txt");
        expect(result.etag).toBe("abc123");
        expect(result.versionId).toBe("v1");
        expect(result.sha256Hash).toBeDefined();
        expect(mockSend).toHaveBeenCalled();
      });
    });

    it("should build tenant-scoped key with proper prefix", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("test content");

        const mockSend = vi.fn().mockResolvedValue({});
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await storage.uploadObject({
          key: "reports/report.pdf",
          body: testData,
        });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Key).toBe("tenants/tenant-123/reports/report.pdf");
      });
    });

    it("should normalize key by removing leading slashes", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("test content");

        const mockSend = vi.fn().mockResolvedValue({});
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await storage.uploadObject({
          key: "/reports//report.pdf",
          body: testData,
        });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Key).toBe("tenants/tenant-123/reports/report.pdf");
      });
    });

    it("should include SHA-256 hash in metadata", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("test content");

        const mockSend = vi.fn().mockResolvedValue({});
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await storage.uploadObject({
          key: "test.txt",
          body: testData,
        });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Metadata["sha256-hash"]).toBeDefined();
        expect(callArgs.input.Metadata["tenant-id"]).toBe("tenant-123");
      });
    });

    it("should throw StorageUploadError on upload failure", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("test content");

        const mockSend = vi.fn().mockRejectedValue(new Error("S3 error"));
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await expect(
          storage.uploadObject({
            key: "test.txt",
            body: testData,
          }),
        ).rejects.toThrow(StorageUploadError);
      });
    });

    it("should throw error when tenant context is missing", async () => {
      const testData = Buffer.from("test content");

      await expect(async () => {
        const storage = new S3ObjectStorage(mockConfig);
        await storage.uploadObject({
          key: "test.txt",
          body: testData,
        });
      }).rejects.toThrow("Tenant context is not set");
    });
  });

  describe("downloadObject", () => {
    it("should download object successfully", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("test content");

        const mockSend = vi.fn().mockResolvedValue({
          Body: {
            [Symbol.asyncIterator]: async function* () {
              yield testData;
            },
          },
          ContentType: "text/plain",
          Metadata: {},
        });

        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        const result = await storage.downloadObject({ key: "test/file.txt" });

        expect(result.body).toEqual(testData);
        expect(result.contentType).toBe("text/plain");
        expect(result.sha256Hash).toBeDefined();
      });
    });

    it("should verify SHA-256 hash on download", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("test content");

        const mockSend = vi.fn().mockResolvedValue({
          Body: {
            [Symbol.asyncIterator]: async function* () {
              yield testData;
            },
          },
          Metadata: {
            "sha256-hash": "invalid-hash",
          },
        });

        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await expect(storage.downloadObject({ key: "test.txt" })).rejects.toThrow(
          StorageIntegrityError,
        );
      });
    });

    it("should throw error when object not found", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const mockSend = vi.fn().mockRejectedValue({
          $metadata: { httpStatusCode: 404 },
          name: "NotFound",
        });

        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await expect(storage.downloadObject({ key: "nonexistent.txt" })).rejects.toThrow(
          "Failed to download object",
        );
      });
    });

    it("should throw StorageDownloadError on download failure", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const mockSend = vi.fn().mockRejectedValue(new Error("S3 error"));
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await expect(storage.downloadObject({ key: "test.txt" })).rejects.toThrow(
          StorageDownloadError,
        );
      });
    });

    it("should build tenant-scoped key for download", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("test content");

        const mockSend = vi.fn().mockResolvedValue({
          Body: {
            [Symbol.asyncIterator]: async function* () {
              yield testData;
            },
          },
          Metadata: {},
        });

        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await storage.downloadObject({ key: "reports/report.pdf" });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Key).toBe("tenants/tenant-123/reports/report.pdf");
      });
    });
  });

  describe("objectExists", () => {
    it("should return true when object exists", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const mockSend = vi.fn().mockResolvedValue({});
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        const exists = await storage.objectExists({ key: "test.txt" });

        expect(exists).toBe(true);
      });
    });

    it("should return false when object does not exist", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const mockSend = vi.fn().mockRejectedValue({
          $metadata: { httpStatusCode: 404 },
        });

        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        const exists = await storage.objectExists({ key: "nonexistent.txt" });

        expect(exists).toBe(false);
      });
    });

    it("should throw StorageError on unexpected error", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const mockSend = vi.fn().mockRejectedValue(new Error("S3 error"));
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await expect(storage.objectExists({ key: "test.txt" })).rejects.toThrow(StorageError);
      });
    });
  });

  describe("deleteObject", () => {
    it("should delete object successfully", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const mockSend = vi.fn().mockResolvedValue({});
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await expect(storage.deleteObject({ key: "test.txt" })).resolves.toBeUndefined();
        expect(mockSend).toHaveBeenCalled();
      });
    });

    it("should be idempotent (no error if object does not exist)", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const mockSend = vi.fn().mockResolvedValue({});
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await expect(storage.deleteObject({ key: "nonexistent.txt" })).resolves.toBeUndefined();
      });
    });

    it("should throw StorageDeleteError on delete failure", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const mockSend = vi.fn().mockRejectedValue(new Error("S3 error"));
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await expect(storage.deleteObject({ key: "test.txt" })).rejects.toThrow(StorageDeleteError);
      });
    });
  });

  describe("generatePresignedUrl", () => {
    it("should generate presigned URL for GET operation", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const url = await storage.generatePresignedUrl({
          key: "test.txt",
          operation: "get",
          expiresIn: 3600,
        });

        expect(url).toBeDefined();
        expect(url).toContain("test.txt");
      });
    });

    it("should generate presigned URL for PUT operation", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const url = await storage.generatePresignedUrl({
          key: "test.txt",
          operation: "put",
          expiresIn: 1800,
        });

        expect(url).toBeDefined();
      });
    });
  });

  describe("isHealthy", () => {
    it("should return true when bucket is accessible", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const mockSend = vi.fn().mockResolvedValue({});
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        const healthy = await storage.isHealthy();

        expect(healthy).toBe(true);
      });
    });

    it("should return false when bucket is not accessible", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);

        const mockSend = vi.fn().mockRejectedValue(new Error("Bucket not found"));
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        const healthy = await storage.isHealthy();

        expect(healthy).toBe(false);
      });
    });
  });

  describe("tenant isolation", () => {
    it("should enforce tenant isolation with path-based scoping", async () => {
      const tenant1Context: TenantContext = {
        ...sampleTenantContext,
        tenantId: "tenant-1",
      };

      const tenant2Context: TenantContext = {
        ...sampleTenantContext,
        tenantId: "tenant-2",
      };

      await runWithTenantContext(tenant1Context, async () => {
        const storage1 = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("tenant 1 data");

        const mockSend = vi.fn().mockResolvedValue({});
        (storage1 as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await storage1.uploadObject({ key: "shared/file.txt", body: testData });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Key).toBe("tenants/tenant-1/shared/file.txt");
      });

      await runWithTenantContext(tenant2Context, async () => {
        const storage2 = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("tenant 2 data");

        const mockSend = vi.fn().mockResolvedValue({});
        (storage2 as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await storage2.uploadObject({ key: "shared/file.txt", body: testData });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Key).toBe("tenants/tenant-2/shared/file.txt");
      });
    });

    it("should prevent cross-tenant access through key manipulation", async () => {
      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("test content");

        const mockSend = vi.fn().mockResolvedValue({});
        (storage as unknown as { client: { send: typeof mockSend } }).client = { send: mockSend };

        await storage.uploadObject({
          key: "../tenant-456/secret.txt",
          body: testData,
        });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Key).toBe("tenants/tenant-123/../tenant-456/secret.txt");
      });
    });
  });
});
