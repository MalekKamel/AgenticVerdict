import { describe, expect, it, beforeEach, vi } from "vitest";
import { CredentialManager } from "./credentials";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";

const createMockDb = () => {
  const mock = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockReturnThis(),
  };

  // Make where return an object with limit method for proper chaining
  mock.where.mockReturnValue({
    limit: mock.limit,
  });

  return mock;
};

let currentMockDb: ReturnType<typeof createMockDb>;

vi.mock("@agenticverdict/database", async () => {
  const actual = await vi.importActual("@agenticverdict/database");
  return {
    ...(actual as Record<string, unknown>),
    dbScoped: vi.fn(() => currentMockDb),
    platformCredentials: {
      tenantId: "tenant_id",
      platform: "platform",
      encryptedPayload: "encrypted_payload",
    },
  };
});

describe("CredentialManager", () => {
  let credentialManager: CredentialManager;

  const testEncryptionKey = "test-encryption-key-32-bytes-long";

  beforeEach(() => {
    currentMockDb = createMockDb();
    credentialManager = new CredentialManager({
      encryptionKey: testEncryptionKey,
      cacheTTL: 5000,
    });
  });

  describe("encryption/decryption", () => {
    it("should encrypt and decrypt credentials successfully", () => {
      const payload = {
        apiKey: "sk-test123",
        baseURL: "https://api.example.com",
      };

      const encrypted = credentialManager.encrypt(payload);
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.authTag).toBeDefined();

      const decrypted = credentialManager.decrypt(encrypted);
      expect(decrypted.apiKey).toBe(payload.apiKey);
      expect(decrypted.baseURL).toBe(payload.baseURL);
    });

    it("should throw error when decrypting corrupted data", () => {
      const corrupted = {
        ciphertext: "invalid",
        iv: "invalid",
        salt: "invalid",
      };

      expect(() => credentialManager.decrypt(corrupted)).toThrow(AgentRuntimeError);
    });

    it("should encrypt different payloads differently (randomization)", () => {
      const payload = { apiKey: "sk-test123" };

      const encrypted1 = credentialManager.encrypt(payload);
      const encrypted2 = credentialManager.encrypt(payload);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });
  });

  describe("tenant context", () => {
    it("should throw error when accessing credential without tenant context", async () => {
      await expect(credentialManager.getCredential("openai")).rejects.toThrow(AgentRuntimeError);

      await expect(credentialManager.storeCredential("openai", { apiKey: "test" })).rejects.toThrow(
        AgentRuntimeError,
      );
    });

    it("should provide tenant context within runWithTenantContext", async () => {
      let tenantId: string | undefined;

      await credentialManager.runWithTenantContext("tenant-123", () => {
        tenantId = credentialManager.getTenantId();
      });

      expect(tenantId).toBe("tenant-123");
    });

    it("should maintain tenant context through async operations", async () => {
      const results: string[] = [];

      await credentialManager.runWithTenantContext("tenant-456", async () => {
        results.push(credentialManager.getTenantId());
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(credentialManager.getTenantId());
      });

      expect(results).toEqual(["tenant-456", "tenant-456"]);
    });

    it("should isolate tenant contexts between concurrent executions", async () => {
      const tenant1Results: string[] = [];
      const tenant2Results: string[] = [];

      const promise1 = credentialManager.runWithTenantContext("tenant-1", async () => {
        tenant1Results.push(credentialManager.getTenantId());
        await new Promise((resolve) => setTimeout(resolve, 5));
        tenant1Results.push(credentialManager.getTenantId());
      });

      const promise2 = credentialManager.runWithTenantContext("tenant-2", async () => {
        tenant2Results.push(credentialManager.getTenantId());
        await new Promise((resolve) => setTimeout(resolve, 5));
        tenant2Results.push(credentialManager.getTenantId());
      });

      await Promise.all([promise1, promise2]);

      expect(tenant1Results).toEqual(["tenant-1", "tenant-1"]);
      expect(tenant2Results).toEqual(["tenant-2", "tenant-2"]);
    });
  });

  describe("credential storage and retrieval", () => {
    it("should store and retrieve credentials within tenant context", async () => {
      currentMockDb!.limit.mockResolvedValueOnce([
        {
          encryptedPayload: JSON.stringify(credentialManager.encrypt({ apiKey: "sk-test123" })),
        },
      ]);

      await credentialManager.runWithTenantContext("tenant-123", async () => {
        await credentialManager.storeCredential("openai", {
          apiKey: "sk-test123",
        });

        const credential = await credentialManager.getCredential("openai");
        expect(credential.apiKey).toBe("sk-test123");
      });
    });

    it("should throw CREDENTIAL_NOT_FOUND when credential does not exist", async () => {
      currentMockDb!.limit.mockResolvedValue([]);

      await credentialManager.runWithTenantContext("tenant-123", async () => {
        await expect(credentialManager.getCredential("openai")).rejects.toThrow(AgentRuntimeError);

        const error = await credentialManager
          .getCredential("openai")
          .catch((e) => e as AgentRuntimeError);

        expect(error.code).toBe(AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND);
        expect(error.tenantId).toBe("tenant-123");
        expect(error.providerId).toBe("openai");
      });
    });

    it("should cache credentials to avoid repeated database queries", async () => {
      let queryCount = 0;

      currentMockDb!.limit.mockImplementation(() => {
        queryCount++;
        return Promise.resolve([
          {
            encryptedPayload: JSON.stringify(credentialManager.encrypt({ apiKey: "sk-cached" })),
          },
        ]);
      });

      await credentialManager.runWithTenantContext("tenant-123", async () => {
        await credentialManager.getCredential("openai");
        await credentialManager.getCredential("openai");
        await credentialManager.getCredential("openai");
      });

      expect(queryCount).toBe(1);
    });

    it("should respect cache TTL and refetch after expiration", async () => {
      const credentialManagerWithShortTTL = new CredentialManager({
        encryptionKey: testEncryptionKey,
        cacheTTL: 10,
      });

      let queryCount = 0;

      currentMockDb!.limit.mockImplementation(() => {
        queryCount++;
        return Promise.resolve([
          {
            encryptedPayload: JSON.stringify(
              credentialManagerWithShortTTL.encrypt({ apiKey: "sk-test" }),
            ),
          },
        ]);
      });

      await credentialManagerWithShortTTL.runWithTenantContext("tenant-123", async () => {
        await credentialManagerWithShortTTL.getCredential("openai");
        await new Promise((resolve) => setTimeout(resolve, 20));
        await credentialManagerWithShortTTL.getCredential("openai");
      });

      expect(queryCount).toBe(2);
    });
  });

  describe("credential management", () => {
    it("should delete credentials", async () => {
      await credentialManager.runWithTenantContext("tenant-123", async () => {
        await credentialManager.deleteCredential("openai");
        expect(currentMockDb.where).toHaveBeenCalled();
      });
    });

    it("should list all credential provider IDs for a tenant", async () => {
      currentMockDb.where.mockResolvedValueOnce([
        { platform: "openai" },
        { platform: "anthropic" },
        { platform: "google" },
      ]);

      await credentialManager.runWithTenantContext("tenant-123", async () => {
        const providers = await credentialManager.listCredentials();
        expect(providers).toEqual(["openai", "anthropic", "google"]);
      });
    });

    it("should rotate credentials", async () => {
      let updateCount = 0;

      currentMockDb.onConflictDoUpdate.mockImplementation(() => {
        updateCount++;
        return Promise.resolve(undefined);
      });

      currentMockDb.limit.mockResolvedValueOnce([
        {
          encryptedPayload: JSON.stringify(credentialManager.encrypt({ apiKey: "old-key" })),
        },
      ]);

      await credentialManager.runWithTenantContext("tenant-123", async () => {
        await credentialManager.rotateCredential("openai", {
          apiKey: "new-key",
        });
        expect(updateCount).toBe(1);
      });
    });

    it("should throw error when rotating non-existent credential", async () => {
      currentMockDb.limit.mockResolvedValue([]);

      await credentialManager.runWithTenantContext("tenant-123", async () => {
        await expect(
          credentialManager.rotateCredential("openai", { apiKey: "new-key" }),
        ).rejects.toThrow(AgentRuntimeError);

        const error = await credentialManager
          .rotateCredential("openai", { apiKey: "new-key" })
          .catch((e) => e as AgentRuntimeError);

        expect(error.code).toBe(AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND);
      });
    });
  });

  describe("tenant isolation", () => {
    it("should isolate credentials between tenants", async () => {
      const tenant2Error: AgentRuntimeError[] = [];

      currentMockDb.where.mockImplementation(
        (condition: (row: { tenantId: string; platform: string }) => boolean) => {
          const mockRow = {
            tenantId: "tenant-1",
            platform: "openai",
          };

          const matches = condition(mockRow);
          if (matches) {
            return {
              limit: vi.fn().mockResolvedValue([
                {
                  encryptedPayload: JSON.stringify(
                    credentialManager.encrypt({ apiKey: "tenant-1-key" }),
                  ),
                },
              ]),
            };
          }

          return {
            limit: vi.fn().mockResolvedValue([]),
          };
        },
      );

      await credentialManager.runWithTenantContext("tenant-1", async () => {
        await credentialManager.getCredential("openai");
      });

      await credentialManager.runWithTenantContext("tenant-2", async () => {
        try {
          await credentialManager.getCredential("openai");
        } catch (error: unknown) {
          tenant2Error.push(error as AgentRuntimeError);
        }
      });

      expect(tenant2Error.length).toBe(1);
      expect(tenant2Error[0].code).toBe(AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND);
    });

    it("should include tenantId in error metadata", async () => {
      currentMockDb.limit.mockResolvedValue([]);

      await credentialManager.runWithTenantContext("tenant-isolation-test", async () => {
        const error = await credentialManager
          .getCredential("openai")
          .catch((e) => e as AgentRuntimeError);

        expect(error.tenantId).toBe("tenant-isolation-test");
        expect(error.providerId).toBe("openai");
        expect(error.code).toBe(AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND);
      });
    });
  });

  describe("error handling", () => {
    it("should throw INVALID_CONFIG if no encryption key provided", () => {
      const originalEnv = process.env.AGENTICVERDICT_CREDENTIAL_ENCRYPTION_KEY;
      delete process.env.AGENTICVERDICT_CREDENTIAL_ENCRYPTION_KEY;

      expect(() => new CredentialManager()).toThrow(AgentRuntimeError);

      const error = (() => {
        try {
          new CredentialManager();
        } catch (e) {
          return e as AgentRuntimeError;
        }
      })();

      expect(error.code).toBe(AgentRuntimeErrorCode.INVALID_CONFIG);

      process.env.AGENTICVERDICT_CREDENTIAL_ENCRYPTION_KEY = originalEnv;
    });

    it("should handle corrupted JSON in database", async () => {
      currentMockDb.limit.mockResolvedValueOnce([{ encryptedPayload: "not-valid-json" }]);

      await credentialManager.runWithTenantContext("tenant-123", async () => {
        const error = await credentialManager
          .getCredential("openai")
          .catch((e) => e as AgentRuntimeError);

        expect(error.code).toBe(AgentRuntimeErrorCode.CREDENTIAL_INVALID);
      });
    });
  });
});
