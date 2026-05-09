import { createDecipheriv, randomBytes, createCipheriv } from "node:crypto";
import { dbScoped, platformCredentials } from "@agenticverdict/database";
import { eq, and } from "drizzle-orm";
import type { ConnectorType } from "@agenticverdict/types";

import { getDatabase } from "../database";

/**
 * Decrypted platform credential payload.
 */
export interface DecryptedCredential {
  platform: ConnectorType;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Encrypted payload structure stored in the database.
 */
interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

/**
 * Fetches encrypted credentials for a tenant's platform connector from the database.
 * Uses `dbScoped()` for tenant isolation via RLS.
 */
export async function fetchPlatformCredentials(
  tenantId: string,
  platform: ConnectorType,
): Promise<typeof platformCredentials.$inferSelect | null> {
  const db = getDatabase();
  const results = await dbScoped(db, async (tx) => {
    return tx
      .select()
      .from(platformCredentials)
      .where(
        and(eq(platformCredentials.tenantId, tenantId), eq(platformCredentials.platform, platform)),
      )
      .limit(1);
  });
  return results[0] ?? null;
}

/**
 * Retrieves and validates the base64-encoded master encryption key from environment.
 * Returns a 32-byte Buffer suitable for AES-256.
 */
function getMasterKey(): Buffer {
  const encoded = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!encoded) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY environment variable is required for credential decryption",
    );
  }

  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error(
      `CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key (got ${key.length} bytes)`,
    );
  }

  return key;
}

/**
 * Decrypts a credential payload using AES-256-GCM.
 *
 * The encryptedPayload column contains JSON with base64-encoded iv, authTag, and ciphertext.
 * The master key is read from CREDENTIAL_ENCRYPTION_KEY (base64-encoded 32-byte key).
 */
export async function decryptCredential(
  credential: typeof platformCredentials.$inferSelect,
): Promise<DecryptedCredential> {
  const masterKey = getMasterKey();

  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(credential.encryptedPayload) as EncryptedPayload;
  } catch {
    throw new Error(
      "Credential encryptedPayload is not valid JSON — the stored credential data is corrupted",
    );
  }

  if (!payload.iv || !payload.authTag || !payload.ciphertext) {
    throw new Error(
      "Credential encryptedPayload is missing required fields (iv, authTag, ciphertext) — the stored credential data is corrupted",
    );
  }

  let iv: Buffer;
  let authTag: Buffer;
  let ciphertext: Buffer;
  try {
    iv = Buffer.from(payload.iv, "base64");
    authTag = Buffer.from(payload.authTag, "base64");
    ciphertext = Buffer.from(payload.ciphertext, "base64");
  } catch {
    throw new Error(
      "Credential encryptedPayload contains invalid base64 data — the stored credential data is corrupted",
    );
  }

  let decrypted: Buffer;
  try {
    const decipher = createDecipheriv("aes-256-gcm", masterKey, iv);
    decipher.setAuthTag(authTag);
    decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("auth")) {
      throw new Error(
        "Credential decryption failed: authentication tag mismatch — the data may have been tampered with or the master key has changed",
      );
    }
    throw new Error(`Credential decryption failed: ${(err as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decrypted.toString("utf-8"));
  } catch {
    throw new Error(
      "Decrypted credential payload is not valid JSON — the stored credential data is corrupted",
    );
  }

  const result = parsed as DecryptedCredential;
  if (!result.platform || !result.accessToken) {
    throw new Error(
      "Decrypted credential payload is missing required fields (platform, accessToken) — the stored credential data is corrupted",
    );
  }

  return result;
}

/**
 * Encrypts a credential payload using AES-256-GCM.
 * Returns the JSON string suitable for storage in the encryptedPayload column.
 *
 * This helper is intended for testing and seed data generation.
 */
export function createEncryptedCredential(credential: DecryptedCredential): string {
  const masterKey = getMasterKey();
  const iv = randomBytes(12);
  const plaintext = Buffer.from(JSON.stringify(credential), "utf-8");

  const cipher = createCipheriv("aes-256-gcm", masterKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };

  return JSON.stringify(payload);
}

/**
 * Fetches and decrypts credentials for a tenant's platform connector.
 * Returns null if no credentials exist.
 */
export async function getDecryptedPlatformCredentials(
  tenantId: string,
  platform: ConnectorType,
): Promise<DecryptedCredential | null> {
  const credential = await fetchPlatformCredentials(tenantId, platform);
  if (!credential) {
    return null;
  }
  return decryptCredential(credential);
}
