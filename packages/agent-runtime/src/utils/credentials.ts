import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

import { AgentRuntimeError } from "../errors/AgentRuntimeError";
import { AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";

export interface CredentialPayload {
  apiKey: string;
  baseURL?: string;
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
  [key: string]: string | undefined;
}

export interface EncryptedCredential {
  ciphertext: string;
  iv: string;
  salt: string;
  authTag?: string;
}

export interface CredentialManagerConfig {
  encryptionKey?: string;
  cacheTTL?: number;
}

interface TenantCredentialCache {
  [providerId: string]: {
    payload: CredentialPayload;
    expiresAt: number;
  };
}

interface CredentialManagerContext {
  tenantId: string;
  cache: TenantCredentialCache;
}

export class CredentialManager {
  private readonly encryptionKey: Buffer;
  private readonly cacheTTL: number;
  private readonly storage: AsyncLocalStorage<CredentialManagerContext>;

  constructor(config: CredentialManagerConfig = {}) {
    const keyString = config.encryptionKey || process.env.AGENTICVERDICT_CREDENTIAL_ENCRYPTION_KEY;

    if (!keyString) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INVALID_CONFIG,
        message:
          "CredentialManager requires ENCRYPTION_KEY environment variable or config.encryptionKey",
      });
    }

    this.encryptionKey = this.deriveKey(keyString);
    this.cacheTTL = config.cacheTTL || 5 * 60 * 1000;
    this.storage = new AsyncLocalStorage<CredentialManagerContext>();
  }

  private deriveKey(keyString: string): Buffer {
    const salt = "agenticverdict-credential-salt-v1";
    const key = scryptSync(keyString, salt, 32);
    return key;
  }

  async runWithTenantContext<T>(tenantId: string, fn: () => T | Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        const result = this.storage.run(
          {
            tenantId,
            cache: {},
          },
          () => {
            const promise = fn();
            if (promise instanceof Promise) {
              return promise.then(resolve).catch(reject);
            }
            resolve(promise);
            return promise;
          },
        );

        if (result instanceof Promise) {
          return;
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  getTenantId(): string {
    const store = this.storage.getStore();
    if (!store) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING,
        message: "CredentialManager: Tenant context not set",
      });
    }
    return store.tenantId;
  }

  encrypt(payload: CredentialPayload): EncryptedCredential {
    try {
      const iv = randomBytes(12);
      const salt = randomBytes(16);

      const key = scryptSync(this.encryptionKey, salt.toString("hex"), 32);

      const cipher = createCipheriv("aes-256-gcm", key, iv);

      let encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag().toString("hex");

      return {
        ciphertext: encrypted,
        iv: iv.toString("hex"),
        salt: salt.toString("hex"),
        authTag,
      };
    } catch (error) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INTERNAL_ERROR,
        message: "Failed to encrypt credentials",
        cause: error,
      });
    }
  }

  decrypt(encrypted: EncryptedCredential): CredentialPayload {
    try {
      const { ciphertext, iv, salt, authTag } = encrypted;

      const key = scryptSync(this.encryptionKey, salt, 32);

      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));

      decipher.setAuthTag(Buffer.from(authTag || "", "hex"));

      let decrypted = decipher.update(ciphertext, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (error) {
      if (error instanceof Error && error.message.includes("authentication")) {
        throw new AgentRuntimeError({
          code: AgentRuntimeErrorCode.CREDENTIAL_INVALID,
          message: "Credential decryption failed - data may be corrupted",
          cause: error,
        });
      }

      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INTERNAL_ERROR,
        message: "Failed to decrypt credentials",
        cause: error,
      });
    }
  }

  async storeCredential(providerId: string, payload: CredentialPayload): Promise<void> {
    const tenantId = this.getTenantId();
    const store = this.storage.getStore();

    if (!store) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING,
        message: "Cannot store credential without tenant context",
      });
    }

    const encrypted = this.encrypt(payload);

    store.cache[providerId] = {
      payload,
      expiresAt: Date.now() + this.cacheTTL,
    };

    await this.persistCredential(tenantId, providerId, encrypted);
  }

  async getCredential(providerId: string): Promise<CredentialPayload> {
    const tenantId = this.getTenantId();
    const store = this.storage.getStore();

    if (!store) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING,
        message: "Cannot get credential without tenant context",
      });
    }

    const cached = store.cache[providerId];
    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload;
    }

    const encrypted = await this.fetchCredential(tenantId, providerId);

    if (!encrypted) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND,
        message: `No credential found for provider "${providerId}"`,
        providerId,
        tenantId,
      });
    }

    const decrypted = this.decrypt(encrypted);

    store.cache[providerId] = {
      payload: decrypted,
      expiresAt: Date.now() + this.cacheTTL,
    };

    return decrypted;
  }

  async deleteCredential(providerId: string): Promise<void> {
    const tenantId = this.getTenantId();
    const store = this.storage.getStore();

    if (!store) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING,
        message: "Cannot delete credential without tenant context",
      });
    }

    delete store.cache[providerId];

    await this.removeCredential(tenantId, providerId);
  }

  async listCredentials(): Promise<string[]> {
    const tenantId = this.getTenantId();
    const providerIds = await this.fetchAllCredentialIds(tenantId);
    return providerIds;
  }

  async rotateCredential(providerId: string, newPayload: CredentialPayload): Promise<void> {
    const tenantId = this.getTenantId();

    const exists = await this.fetchCredential(tenantId, providerId);

    if (!exists) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND,
        message: `Cannot rotate non-existent credential for provider "${providerId}"`,
        providerId,
        tenantId,
      });
    }

    await this.storeCredential(providerId, newPayload);
  }

  private async persistCredential(
    tenantId: string,
    providerId: string,
    encrypted: EncryptedCredential,
  ): Promise<void> {
    const { dbScoped, platformCredentials } = await import("@agenticverdict/database");

    const db = dbScoped();

    const payload = JSON.stringify(encrypted);

    await db
      .insert(platformCredentials)
      .values({
        tenantId,
        platform: providerId,
        encryptedPayload: payload,
      })
      .onConflictDoUpdate({
        target: [platformCredentials.tenantId, platformCredentials.platform],
        set: {
          encryptedPayload: payload,
          updatedAt: new Date(),
        },
      });
  }

  private async fetchCredential(
    tenantId: string,
    providerId: string,
  ): Promise<EncryptedCredential | null> {
    const { dbScoped, platformCredentials } = await import("@agenticverdict/database");

    const db = dbScoped();

    const [row] = await db
      .select({
        encryptedPayload: platformCredentials.encryptedPayload,
      })
      .from(platformCredentials)
      .where((fields) => fields.tenantId === tenantId && fields.platform === providerId)
      .limit(1);

    if (!row) {
      return null;
    }

    try {
      return JSON.parse(row.encryptedPayload) as EncryptedCredential;
    } catch {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.CREDENTIAL_INVALID,
        message: "Stored credential data is corrupted",
        providerId,
        tenantId,
      });
    }
  }

  private async fetchAllCredentialIds(tenantId: string): Promise<string[]> {
    const { dbScoped, platformCredentials } = await import("@agenticverdict/database");

    const db = dbScoped();

    const rows = await db
      .select({
        platform: platformCredentials.platform,
      })
      .from(platformCredentials)
      .where((fields) => fields.tenantId === tenantId);

    return rows.map((row) => row.platform);
  }

  private async removeCredential(tenantId: string, providerId: string): Promise<void> {
    const { dbScoped, platformCredentials } = await import("@agenticverdict/database");

    const db = dbScoped();

    await db
      .delete(platformCredentials)
      .where((fields) => fields.tenantId === tenantId && fields.platform === providerId);
  }
}
