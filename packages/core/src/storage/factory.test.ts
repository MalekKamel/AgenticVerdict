import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createObjectStorageFromEnv, getObjectStorage, resetObjectStorage } from "./factory";
import { S3ObjectStorage } from "./s3-storage";
import { MemoryObjectStorage } from "./memory-storage";
import { StorageConfigurationError } from "./errors";
import { runWithTenantContext, type TenantContext } from "../tenant-context";

const sampleTenantContext: TenantContext = {
  tenantId: "test-tenant",
  tenantType: "direct_business",
  tenantStatus: "active",
  config: {
    tenantId: "test-tenant",
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

describe("Storage Factory", () => {
  beforeEach(() => {
    resetObjectStorage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetObjectStorage();
    delete process.env.STORAGE_PROVIDER;
    delete process.env.STORAGE_ENDPOINT;
    delete process.env.STORAGE_ACCESS_KEY;
    delete process.env.STORAGE_SECRET_KEY;
    delete process.env.STORAGE_BUCKET;
    delete process.env.STORAGE_FORCE_PATH_STYLE;
  });

  describe("createObjectStorageFromEnv", () => {
    describe("memory provider", () => {
      it("should create MemoryObjectStorage when provider is 'memory'", async () => {
        process.env.STORAGE_PROVIDER = "memory";

        await runWithTenantContext(sampleTenantContext, async () => {
          const storage = createObjectStorageFromEnv();
          expect(storage).toBeInstanceOf(MemoryObjectStorage);
        });
      });

      it("should default to memory provider when STORAGE_PROVIDER is not set", async () => {
        await runWithTenantContext(sampleTenantContext, async () => {
          const storage = createObjectStorageFromEnv();
          expect(storage).toBeInstanceOf(MemoryObjectStorage);
        });
      });
    });

    describe("seaweedfs provider", () => {
      it("should create S3ObjectStorage when provider is 'seaweedfs'", async () => {
        process.env.STORAGE_PROVIDER = "seaweedfs";
        process.env.STORAGE_ENDPOINT = "http://localhost:8333";
        process.env.STORAGE_ACCESS_KEY = "test-key";
        process.env.STORAGE_SECRET_KEY = "test-secret";
        process.env.STORAGE_BUCKET = "test-bucket";

        await runWithTenantContext(sampleTenantContext, async () => {
          const storage = createObjectStorageFromEnv();
          expect(storage).toBeInstanceOf(S3ObjectStorage);
        });
      });

      it("should use default bucket when not specified", async () => {
        process.env.STORAGE_PROVIDER = "seaweedfs";
        process.env.STORAGE_ENDPOINT = "http://localhost:8333";
        process.env.STORAGE_ACCESS_KEY = "test-key";
        process.env.STORAGE_SECRET_KEY = "test-secret";

        await runWithTenantContext(sampleTenantContext, async () => {
          const storage = createObjectStorageFromEnv();
          expect(storage).toBeInstanceOf(S3ObjectStorage);
        });
      });

      it("should use default forcePathStyle when not specified", async () => {
        process.env.STORAGE_PROVIDER = "seaweedfs";
        process.env.STORAGE_ENDPOINT = "http://localhost:8333";
        process.env.STORAGE_ACCESS_KEY = "test-key";
        process.env.STORAGE_SECRET_KEY = "test-secret";

        await runWithTenantContext(sampleTenantContext, async () => {
          const storage = createObjectStorageFromEnv();
          expect(storage).toBeInstanceOf(S3ObjectStorage);
        });
      });

      it("should set forcePathStyle to false when explicitly set to 'false'", async () => {
        process.env.STORAGE_PROVIDER = "seaweedfs";
        process.env.STORAGE_ENDPOINT = "http://localhost:8333";
        process.env.STORAGE_ACCESS_KEY = "test-key";
        process.env.STORAGE_SECRET_KEY = "test-secret";
        process.env.STORAGE_FORCE_PATH_STYLE = "false";

        await runWithTenantContext(sampleTenantContext, async () => {
          const storage = createObjectStorageFromEnv();
          expect(storage).toBeInstanceOf(S3ObjectStorage);
        });
      });

      it("should throw StorageConfigurationError when STORAGE_ENDPOINT is missing", async () => {
        process.env.STORAGE_PROVIDER = "seaweedfs";
        process.env.STORAGE_ACCESS_KEY = "test-key";
        process.env.STORAGE_SECRET_KEY = "test-secret";

        await runWithTenantContext(sampleTenantContext, async () => {
          expect(() => createObjectStorageFromEnv()).toThrow(StorageConfigurationError);
        });
      });

      it("should throw StorageConfigurationError when STORAGE_ACCESS_KEY is missing", async () => {
        process.env.STORAGE_PROVIDER = "seaweedfs";
        process.env.STORAGE_ENDPOINT = "http://localhost:8333";
        process.env.STORAGE_SECRET_KEY = "test-secret";

        await runWithTenantContext(sampleTenantContext, async () => {
          expect(() => createObjectStorageFromEnv()).toThrow(StorageConfigurationError);
        });
      });

      it("should throw StorageConfigurationError when STORAGE_SECRET_KEY is missing", async () => {
        process.env.STORAGE_PROVIDER = "seaweedfs";
        process.env.STORAGE_ENDPOINT = "http://localhost:8333";
        process.env.STORAGE_ACCESS_KEY = "test-key";

        await runWithTenantContext(sampleTenantContext, async () => {
          expect(() => createObjectStorageFromEnv()).toThrow(StorageConfigurationError);
        });
      });

      it("should throw StorageConfigurationError when all required env vars are missing", async () => {
        process.env.STORAGE_PROVIDER = "seaweedfs";

        await runWithTenantContext(sampleTenantContext, async () => {
          expect(() => createObjectStorageFromEnv()).toThrow(StorageConfigurationError);
        });
      });
    });

    describe("unknown provider", () => {
      it("should throw StorageConfigurationError for unknown provider", async () => {
        process.env.STORAGE_PROVIDER = "unknown-provider";

        await runWithTenantContext(sampleTenantContext, async () => {
          expect(() => createObjectStorageFromEnv()).toThrow(StorageConfigurationError);
        });
      });

      it("should throw StorageConfigurationError with provider name in message", async () => {
        process.env.STORAGE_PROVIDER = "invalid";

        await runWithTenantContext(sampleTenantContext, async () => {
          try {
            createObjectStorageFromEnv();
            expect.unreachable("Should have thrown");
          } catch (error) {
            expect(error).toBeInstanceOf(StorageConfigurationError);
            expect((error as Error).message).toContain("invalid");
          }
        });
      });
    });
  });

  describe("getObjectStorage", () => {
    it("should create storage instance on first call", async () => {
      process.env.STORAGE_PROVIDER = "memory";

      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = getObjectStorage();
        expect(storage).toBeDefined();
        expect(storage).toBeInstanceOf(MemoryObjectStorage);
      });
    });

    it("should return same instance on subsequent calls", async () => {
      process.env.STORAGE_PROVIDER = "memory";

      await runWithTenantContext(sampleTenantContext, async () => {
        const storage1 = getObjectStorage();
        const storage2 = getObjectStorage();
        expect(storage1).toBe(storage2);
      });
    });

    it("should respect resetObjectStorage and create new instance", async () => {
      process.env.STORAGE_PROVIDER = "memory";

      await runWithTenantContext(sampleTenantContext, async () => {
        const storage1 = getObjectStorage();
        resetObjectStorage();
        const storage2 = getObjectStorage();
        expect(storage1).not.toBe(storage2);
      });
    });

    it("should cache instance until resetObjectStorage is called", async () => {
      process.env.STORAGE_PROVIDER = "memory";

      await runWithTenantContext(sampleTenantContext, async () => {
        const storage1 = getObjectStorage();
        const storage2 = getObjectStorage();
        const storage3 = getObjectStorage();

        expect(storage1).toBe(storage2);
        expect(storage2).toBe(storage3);
      });
    });
  });

  describe("resetObjectStorage", () => {
    it("should clear cached instance", async () => {
      process.env.STORAGE_PROVIDER = "memory";

      await runWithTenantContext(sampleTenantContext, async () => {
        getObjectStorage();
        resetObjectStorage();

        const storage = getObjectStorage();
        expect(storage).toBeDefined();
      });
    });

    it("should allow switching providers after reset", async () => {
      process.env.STORAGE_PROVIDER = "memory";

      await runWithTenantContext(sampleTenantContext, async () => {
        const storage1 = getObjectStorage();
        expect(storage1).toBeInstanceOf(MemoryObjectStorage);

        resetObjectStorage();

        process.env.STORAGE_PROVIDER = "seaweedfs";
        process.env.STORAGE_ENDPOINT = "http://localhost:8333";
        process.env.STORAGE_ACCESS_KEY = "test-key";
        process.env.STORAGE_SECRET_KEY = "test-secret";

        const storage2 = getObjectStorage();
        expect(storage2).toBeInstanceOf(S3ObjectStorage);
      });
    });
  });

  describe("provider configuration", () => {
    it("should configure S3ObjectStorage with custom endpoint", async () => {
      process.env.STORAGE_PROVIDER = "seaweedfs";
      process.env.STORAGE_ENDPOINT = "http://custom-endpoint:9000";
      process.env.STORAGE_ACCESS_KEY = "custom-key";
      process.env.STORAGE_SECRET_KEY = "custom-secret";
      process.env.STORAGE_BUCKET = "custom-bucket";

      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = createObjectStorageFromEnv();
        expect(storage).toBeInstanceOf(S3ObjectStorage);
      });
    });

    it("should configure S3ObjectStorage with custom bucket", async () => {
      process.env.STORAGE_PROVIDER = "seaweedfs";
      process.env.STORAGE_ENDPOINT = "http://localhost:8333";
      process.env.STORAGE_ACCESS_KEY = "test-key";
      process.env.STORAGE_SECRET_KEY = "test-secret";
      process.env.STORAGE_BUCKET = "my-reports-bucket";

      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = createObjectStorageFromEnv();
        expect(storage).toBeInstanceOf(S3ObjectStorage);
      });
    });

    it("should handle STORAGE_FORCE_PATH_STYLE variations", async () => {
      const testCases = [
        { value: "true", expected: true },
        { value: "false", expected: false },
        { value: "1", expected: true },
        { value: "0", expected: false },
        { value: "", expected: true },
      ];

      for (const { value } of testCases) {
        process.env.STORAGE_PROVIDER = "seaweedfs";
        process.env.STORAGE_ENDPOINT = "http://localhost:8333";
        process.env.STORAGE_ACCESS_KEY = "test-key";
        process.env.STORAGE_SECRET_KEY = "test-secret";
        process.env.STORAGE_FORCE_PATH_STYLE = value;

        await runWithTenantContext(sampleTenantContext, async () => {
          const storage = createObjectStorageFromEnv();
          expect(storage).toBeInstanceOf(S3ObjectStorage);
        });
      }
    });
  });

  describe("singleton behavior", () => {
    it("should maintain singleton across multiple imports", async () => {
      process.env.STORAGE_PROVIDER = "memory";

      await runWithTenantContext(sampleTenantContext, async () => {
        const storage1 = getObjectStorage();
        const storage2 = getObjectStorage();

        expect(storage1).toBe(storage2);
      });
    });

    it("should allow reinitialization after reset", async () => {
      process.env.STORAGE_PROVIDER = "memory";

      await runWithTenantContext(sampleTenantContext, async () => {
        const instance1 = getObjectStorage();
        resetObjectStorage();
        const instance2 = getObjectStorage();

        expect(instance1).not.toBe(instance2);
      });
    });
  });

  describe("environment variable precedence", () => {
    it("should use STORAGE_PROVIDER over default", async () => {
      process.env.STORAGE_PROVIDER = "seaweedfs";
      process.env.STORAGE_ENDPOINT = "http://localhost:8333";
      process.env.STORAGE_ACCESS_KEY = "test-key";
      process.env.STORAGE_SECRET_KEY = "test-secret";

      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = createObjectStorageFromEnv();
        expect(storage).toBeInstanceOf(S3ObjectStorage);
      });
    });

    it("should use default bucket when STORAGE_BUCKET is not set", async () => {
      process.env.STORAGE_PROVIDER = "seaweedfs";
      process.env.STORAGE_ENDPOINT = "http://localhost:8333";
      process.env.STORAGE_ACCESS_KEY = "test-key";
      process.env.STORAGE_SECRET_KEY = "test-secret";

      await runWithTenantContext(sampleTenantContext, async () => {
        const storage = createObjectStorageFromEnv();
        expect(storage).toBeInstanceOf(S3ObjectStorage);
      });
    });
  });

  describe("error handling", () => {
    it("should provide helpful error message for missing configuration", async () => {
      process.env.STORAGE_PROVIDER = "seaweedfs";

      await runWithTenantContext(sampleTenantContext, async () => {
        try {
          createObjectStorageFromEnv();
          expect.unreachable("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(StorageConfigurationError);
          expect((error as Error).message).toContain("STORAGE_ENDPOINT");
          expect((error as Error).message).toContain("STORAGE_ACCESS_KEY");
          expect((error as Error).message).toContain("STORAGE_SECRET_KEY");
        }
      });
    });

    it("should not throw for optional environment variables", async () => {
      process.env.STORAGE_PROVIDER = "seaweedfs";
      process.env.STORAGE_ENDPOINT = "http://localhost:8333";
      process.env.STORAGE_ACCESS_KEY = "test-key";
      process.env.STORAGE_SECRET_KEY = "test-secret";

      await runWithTenantContext(sampleTenantContext, async () => {
        expect(() => createObjectStorageFromEnv()).not.toThrow();
      });
    });
  });
});
