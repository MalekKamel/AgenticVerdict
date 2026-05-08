import { describe, expect, it, vi, beforeEach } from "vitest";
import { S3ObjectStorage } from "./s3-storage";
import { runWithTenantContext, type TenantContext } from "../tenant-context";

const createTenantContext = (tenantId: string): TenantContext => ({
  tenantId,
  tenantType: "direct_business",
  tenantStatus: "active",
  config: {
    tenantId,
    tenantName: `Tenant ${tenantId}`,
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
  requestId: `request-${tenantId}`,
});

const mockConfig = {
  endpoint: "http://localhost:8333",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
  bucket: "test-bucket",
  region: "auto",
  forcePathStyle: true,
};

describe("Tenant Isolation Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("tenant context enforcement", () => {
    it("should throw error when no tenant context exists for upload", async () => {
      const testData = Buffer.from("test content");

      await expect(async () => {
        const storage = new S3ObjectStorage(mockConfig);
        await storage.uploadObject({
          key: "test.txt",
          body: testData,
        });
      }).rejects.toThrow("Tenant context is not set");
    });

    it("should throw error when no tenant context exists for download", async () => {
      await expect(async () => {
        const storage = new S3ObjectStorage(mockConfig);
        await storage.downloadObject({ key: "test.txt" });
      }).rejects.toThrow("Tenant context is not set");
    });

    it("should throw error when no tenant context exists for exists check", async () => {
      await expect(async () => {
        const storage = new S3ObjectStorage(mockConfig);
        await storage.objectExists({ key: "test.txt" });
      }).rejects.toThrow("Tenant context is not set");
    });

    it("should throw error when no tenant context exists for delete", async () => {
      await expect(async () => {
        const storage = new S3ObjectStorage(mockConfig);
        await storage.deleteObject({ key: "test.txt" });
      }).rejects.toThrow("Tenant context is not set");
    });

    it("should throw error when no tenant context exists for presigned URL", async () => {
      await expect(async () => {
        const storage = new S3ObjectStorage(mockConfig);
        await storage.generatePresignedUrl({ key: "test.txt" });
      }).rejects.toThrow("Tenant context is not set");
    });
  });

  describe("path-based tenant scoping", () => {
    it("should prefix all keys with tenant path", async () => {
      const tenantContext = createTenantContext("tenant-abc-123");

      vi.mock("@aws-sdk/client-s3", async () => {
        const actual =
          await vi.importActual<typeof import("@aws-sdk/client-s3")>("@aws-sdk/client-s3");
        return {
          ...actual,
          S3Client: vi.fn().mockImplementation(() => ({
            send: vi.fn().mockResolvedValue({}),
          })),
        };
      });

      await runWithTenantContext(tenantContext, async () => {
        const storage = new S3ObjectStorage(mockConfig);
        const testData = Buffer.from("test content");

        await storage.uploadObject({ key: "reports/annual.pdf", body: testData });

        const mockClient = (storage as unknown as { client: { send: ReturnType<typeof vi.fn> } })
          .client;
        const sendMock = mockClient.send;
        const callArgs = sendMock.mock.calls[0][0];
        expect(callArgs.input.Key).toBe("tenants/tenant-abc-123/reports/annual.pdf");
      });
    });

    it("should handle nested directory paths correctly", async () => {
      const tenantContext = createTenantContext("tenant-xyz");

      await runWithTenantContext(tenantContext, async () => {
        const mockSend = vi.fn().mockResolvedValue({});
        const mockClient = { send: mockSend };

        const storage = new S3ObjectStorage(mockConfig);
        (storage as unknown as { client: typeof mockClient }).client = mockClient;

        const testData = Buffer.from("test content");

        await storage.uploadObject({
          key: "exports/2024/january/report.pdf",
          body: testData,
        });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Key).toBe("tenants/tenant-xyz/exports/2024/january/report.pdf");
      });
    });

    it("should handle alphanumeric tenant IDs", async () => {
      const alphaTenant = createTenantContext("tenant_abc_123");

      await runWithTenantContext(alphaTenant, async () => {
        const mockSend = vi.fn().mockResolvedValue({});
        const mockClient = { send: mockSend };

        const storage = new S3ObjectStorage(mockConfig);
        (storage as unknown as { client: typeof mockClient }).client = mockClient;

        const testData = Buffer.from("test content");

        await storage.uploadObject({ key: "test.txt", body: testData });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Key).toBe("tenants/tenant_abc_123/test.txt");
      });
    });
  });

  describe("security edge cases", () => {
    it("should handle tenant ID with special characters safely", async () => {
      const specialTenant = createTenantContext("tenant-with-dashes");

      await runWithTenantContext(specialTenant, async () => {
        const mockSend = vi.fn().mockResolvedValue({});
        const mockClient = { send: mockSend };

        const storage = new S3ObjectStorage(mockConfig);
        (storage as unknown as { client: typeof mockClient }).client = mockClient;

        const testData = Buffer.from("test content");

        await storage.uploadObject({ key: "test.txt", body: testData });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Key).toBe("tenants/tenant-with-dashes/test.txt");
      });
    });

    it("should prevent path traversal attempts in keys", async () => {
      const tenantContext = createTenantContext("security-tenant");

      await runWithTenantContext(tenantContext, async () => {
        const mockSend = vi.fn().mockResolvedValue({});
        const mockClient = { send: mockSend };

        const storage = new S3ObjectStorage(mockConfig);
        (storage as unknown as { client: typeof mockClient }).client = mockClient;

        const testData = Buffer.from("test content");

        await storage.uploadObject({
          key: "../../../etc/passwd",
          body: testData,
        });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Key).toContain("tenants/security-tenant/");
      });
    });

    it("should handle empty key gracefully", async () => {
      const tenantContext = createTenantContext("empty-key-tenant");

      await runWithTenantContext(tenantContext, async () => {
        const mockSend = vi.fn().mockResolvedValue({});
        const mockClient = { send: mockSend };

        const storage = new S3ObjectStorage(mockConfig);
        (storage as unknown as { client: typeof mockClient }).client = mockClient;

        const testData = Buffer.from("test content");

        await storage.uploadObject({ key: "", body: testData });

        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.input.Key).toBe("tenants/empty-key-tenant/");
      });
    });
  });
});
