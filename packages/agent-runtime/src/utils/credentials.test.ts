import { describe, expect, it, beforeEach, vi } from "vitest";
import { CredentialManager } from "./credentials";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";

const createMockDb = () => {
  const limitMock = vi.fn().mockResolvedValue([]);
  const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  const selectMock = vi.fn().mockReturnValue({ from: fromMock });

  const mock = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    select: selectMock,
    from: fromMock,
    where: whereMock,
    limit: limitMock,
    delete: vi.fn().mockReturnThis(),
  };

  return mock;
};

let currentMockDb: ReturnType<typeof createMockDb>;

vi.mock("@agenticverdict/database", async () => {
  const actual = await vi.importActual("@agenticverdict/database");
  return {
    ...(actual as Record<string, unknown>),
    createDatabaseClient: vi.fn(() => currentMockDb),
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
  const testDatabaseUrl = "postgresql://test:test@localhost:5432/test";

  beforeEach(() => {
    currentMockDb = createMockDb();
    credentialManager = new CredentialManager(testEncryptionKey, testDatabaseUrl);
  });

  describe("credential storage and retrieval", () => {
    it("should store and retrieve credentials successfully", async () => {
      const payload = {
        providerId: "openai",
        credentials: {
          apiKey: "sk-test123",
          baseURL: "https://api.example.com",
        },
        updatedAt: new Date(),
      };

      currentMockDb!.limit.mockResolvedValueOnce([
        {
          encryptedPayload: JSON.stringify({
            encryptedData: Buffer.from(JSON.stringify(payload)).toString("base64"),
            algorithm: "base64",
            createdAt: new Date(),
          }),
        },
      ]);

      await credentialManager.storeCredentials("tenant-123", "openai", payload);

      const retrieved = await credentialManager.getCredentials("tenant-123", "openai");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.providerId).toBe("openai");
      expect(retrieved?.credentials.apiKey).toBe("sk-test123");
    });

    it("should return null when credential does not exist", async () => {
      currentMockDb!.limit.mockResolvedValue([]);

      const result = await credentialManager.getCredentials("tenant-123", "openai");
      expect(result).toBeNull();
    });

    it("should throw error when retrieving corrupted credential", async () => {
      const corruptedPayload = [{ encryptedPayload: "not-valid-json" }];

      currentMockDb!.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValueOnce(corruptedPayload),
          }),
        }),
      });

      let caughtError: AgentRuntimeError | null = null;
      try {
        await credentialManager.getCredentials("tenant-123", "openai");
      } catch (e) {
        caughtError = e as AgentRuntimeError;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError?.code).toBe(AgentRuntimeErrorCode.CREDENTIAL_INVALID);
    });
  });

  describe("list providers", () => {
    it("should list all credential provider IDs for a tenant", async () => {
      currentMockDb!.where.mockResolvedValueOnce([
        { platform: "openai" },
        { platform: "anthropic" },
        { platform: "google" },
      ]);

      const providers = await credentialManager.listProviders("tenant-123");
      expect(providers).toEqual(["openai", "anthropic", "google"]);
    });

    it("should return empty array when no providers exist", async () => {
      currentMockDb!.where.mockResolvedValueOnce([]);

      const providers = await credentialManager.listProviders("tenant-123");
      expect(providers).toEqual([]);
    });
  });

  describe("update credentials", () => {
    it("should update existing credentials", async () => {
      const existingPayload = {
        providerId: "openai",
        credentials: { apiKey: "old-key" },
        updatedAt: new Date(),
      };

      currentMockDb!.limit.mockResolvedValueOnce([
        {
          encryptedPayload: JSON.stringify({
            encryptedData: Buffer.from(JSON.stringify(existingPayload)).toString("base64"),
            algorithm: "base64",
            createdAt: new Date(),
          }),
        },
      ]);

      let updateCount = 0;
      currentMockDb!.onConflictDoUpdate.mockImplementation(() => {
        updateCount++;
        return Promise.resolve(undefined);
      });

      await credentialManager.updateCredentials("tenant-123", "openai", {
        providerId: "openai",
        credentials: { apiKey: "new-key" },
        updatedAt: new Date(),
      });

      expect(updateCount).toBe(1);
    });

    it("should throw CREDENTIAL_NOT_FOUND when updating non-existent credential", async () => {
      currentMockDb!.limit.mockResolvedValue([]);

      await expect(
        credentialManager.updateCredentials("tenant-123", "openai", {
          providerId: "openai",
          credentials: { apiKey: "new-key" },
          updatedAt: new Date(),
        }),
      ).rejects.toThrow(AgentRuntimeError);

      const error = await credentialManager
        .updateCredentials("tenant-123", "openai", {
          providerId: "openai",
          credentials: { apiKey: "new-key" },
          updatedAt: new Date(),
        })
        .catch((e) => e as AgentRuntimeError | null);

      expect(error?.code).toBe(AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND);
    });
  });

  describe("remove credentials", () => {
    it("should remove credentials", async () => {
      await credentialManager.removeCredentials("tenant-123", "openai");
      expect(currentMockDb.where).toHaveBeenCalled();
    });
  });

  describe("tenant isolation", () => {
    it("should scope credentials to tenant", async () => {
      const tenant1Payload = {
        providerId: "openai",
        credentials: { apiKey: "tenant-1-key" },
        updatedAt: new Date(),
      };

      currentMockDb!.where.mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            encryptedPayload: JSON.stringify({
              encryptedData: Buffer.from(JSON.stringify(tenant1Payload)).toString("base64"),
              algorithm: "base64",
              createdAt: new Date(),
            }),
          },
        ]),
      });

      const tenant1Result = await credentialManager.getCredentials("tenant-1", "openai");
      expect(tenant1Result).not.toBeNull();

      currentMockDb!.where.mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      const tenant2Result = await credentialManager.getCredentials("tenant-2", "openai");
      expect(tenant2Result).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should handle corrupted JSON in database", async () => {
      currentMockDb!.limit.mockResolvedValueOnce([{ encryptedPayload: "not-valid-json" }]);

      let error: AgentRuntimeError | null = null;
      try {
        await credentialManager.getCredentials("tenant-123", "openai");
      } catch (e) {
        error = e as AgentRuntimeError;
      }

      expect(error?.code).toBe(AgentRuntimeErrorCode.CREDENTIAL_INVALID);
      expect(error?.tenantId).toBe("tenant-123");
      expect(error?.providerId).toBe("openai");
    });
  });
});
