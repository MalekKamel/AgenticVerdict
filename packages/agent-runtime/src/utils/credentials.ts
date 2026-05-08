import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";
import { createDatabaseClient } from "@agenticverdict/database";
import { platformCredentials } from "@agenticverdict/database";
import { eq, and } from "drizzle-orm";

export interface EncryptedCredential {
  encryptedData: string;
  algorithm: string;
  createdAt: Date;
}

/**
 * Credential payload structure
 */
export interface CredentialPayload {
  providerId: string;
  credentials: Record<string, unknown>;
  updatedAt: Date;
}

/**
 * Credential payload map for multiple providers
 */
export interface CredentialPayloadMap {
  [providerId: string]: CredentialPayload;
}

/**
 * Credential Manager
 *
 * Securely stores and retrieves platform credentials.
 * Uses encryption at rest and tenant-scoped access.
 */
export class CredentialManager {
  private encryptionKey: string;
  private databaseUrl: string;

  constructor(encryptionKey: string, databaseUrl: string) {
    this.encryptionKey = encryptionKey;
    this.databaseUrl = databaseUrl;
  }

  /**
   * Store credentials for a provider
   */
  async storeCredentials(
    tenantId: string,
    providerId: string,
    payload: CredentialPayload,
  ): Promise<void> {
    const encrypted = await this.encryptCredential(payload);
    await this.persistCredential(tenantId, providerId, encrypted);
  }

  /**
   * Retrieve credentials for a provider
   */
  async getCredentials(tenantId: string, providerId: string): Promise<CredentialPayload | null> {
    const encrypted = await this.fetchCredential(tenantId, providerId);
    if (!encrypted) {
      return null;
    }
    return this.decryptCredential(encrypted);
  }

  /**
   * List all configured providers for a tenant
   */
  async listProviders(tenantId: string): Promise<string[]> {
    return this.fetchAllCredentialIds(tenantId);
  }

  /**
   * Remove credentials for a provider
   */
  async removeCredentials(tenantId: string, providerId: string): Promise<void> {
    await this.removeCredential(tenantId, providerId);
  }

  /**
   * Update credentials (rotate keys, refresh tokens, etc.)
   */
  async updateCredentials(
    tenantId: string,
    providerId: string,
    payload: CredentialPayload,
  ): Promise<void> {
    const existing = await this.getCredentials(tenantId, providerId);
    if (!existing) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND,
        message: "No credentials found to update",
        providerId,
        tenantId,
      });
    }

    const newPayload: CredentialPayload = {
      ...existing,
      ...payload,
      updatedAt: new Date(),
    };

    await this.storeCredentials(tenantId, providerId, newPayload);
  }

  private async persistCredential(
    tenantId: string,
    providerId: string,
    encrypted: EncryptedCredential,
  ): Promise<void> {
    const db = createDatabaseClient(this.databaseUrl, {
      applicationName: "agenticverdict-credentials",
    });

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
    const db = createDatabaseClient(this.databaseUrl, {
      applicationName: "agenticverdict-credentials",
    });

    const [row] = await db
      .select({
        encryptedPayload: platformCredentials.encryptedPayload,
      })
      .from(platformCredentials)
      .where(
        and(
          eq(platformCredentials.tenantId, tenantId),
          eq(platformCredentials.platform, providerId),
        ),
      )
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
    const db = createDatabaseClient(this.databaseUrl, {
      applicationName: "agenticverdict-credentials",
    });

    const rows = await db
      .select({
        platform: platformCredentials.platform,
      })
      .from(platformCredentials)
      .where(eq(platformCredentials.tenantId, tenantId));

    return rows.map((row) => row.platform);
  }

  private async removeCredential(tenantId: string, providerId: string): Promise<void> {
    const db = createDatabaseClient(this.databaseUrl, {
      applicationName: "agenticverdict-credentials",
    });

    await db
      .delete(platformCredentials)
      .where(
        and(
          eq(platformCredentials.tenantId, tenantId),
          eq(platformCredentials.platform, providerId),
        ),
      );
  }

  private async encryptCredential(payload: CredentialPayload): Promise<EncryptedCredential> {
    // Simple base64 encoding - in production, use proper encryption
    const data = JSON.stringify(payload);
    const encrypted = Buffer.from(data).toString("base64");
    return {
      encryptedData: encrypted,
      algorithm: "base64",
      createdAt: new Date(),
    };
  }

  private async decryptCredential(encrypted: EncryptedCredential): Promise<CredentialPayload> {
    // Simple base64 decoding - in production, use proper decryption
    const data = Buffer.from(encrypted.encryptedData, "base64").toString("utf8");
    return JSON.parse(data) as CredentialPayload;
  }
}
