import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createEncryptedCredential,
  decryptCredential,
  type DecryptedCredential,
} from "./credential-store";

/**
 * Build a mock credential row matching the Drizzle schema shape.
 * Only the fields used by decryptCredential are populated.
 */
function mockCredentialRow(encryptedPayload: string) {
  return {
    id: "cred_test_1",
    tenantId: "tenant_test_1",
    platform: "ga4",
    encryptedPayload,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Parameters<typeof decryptCredential>[0];
}

/** Generate a valid base64-encoded 32-byte key for tests. */
function validMasterKey(): string {
  return Buffer.alloc(32, 0x42).toString("base64");
}

describe("decryptCredential", () => {
  const originalKey = process.env.CREDENTIAL_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = validMasterKey();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.CREDENTIAL_ENCRYPTION_KEY;
    } else {
      process.env.CREDENTIAL_ENCRYPTION_KEY = originalKey;
    }
  });

  it("decrypts a valid AES-256-GCM encrypted payload", async () => {
    const original: DecryptedCredential = {
      platform: "ga4",
      accessToken: "ya29.test-access-token",
      refreshToken: "1//test-refresh-token",
      expiresAt: "2026-01-01T00:00:00Z",
      metadata: { accountId: "12345" },
    };

    const encryptedPayload = createEncryptedCredential(original);
    const row = mockCredentialRow(encryptedPayload);

    const result = await decryptCredential(row);

    expect(result.platform).toBe("ga4");
    expect(result.accessToken).toBe("ya29.test-access-token");
    expect(result.refreshToken).toBe("1//test-refresh-token");
    expect(result.expiresAt).toBe("2026-01-01T00:00:00Z");
    expect(result.metadata).toEqual({ accountId: "12345" });
  });

  it("throws when CREDENTIAL_ENCRYPTION_KEY is missing", async () => {
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;

    const row = mockCredentialRow("{}");

    await expect(decryptCredential(row)).rejects.toThrow(
      "CREDENTIAL_ENCRYPTION_KEY environment variable is required",
    );
  });

  it("throws when CREDENTIAL_ENCRYPTION_KEY is the wrong length", async () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(16, 0x42).toString("base64");

    const row = mockCredentialRow("{}");

    await expect(decryptCredential(row)).rejects.toThrow("must be a base64-encoded 32-byte key");
  });

  it("throws when encryptedPayload is not valid JSON", async () => {
    const row = mockCredentialRow("not-json-at-all");

    await expect(decryptCredential(row)).rejects.toThrow("not valid JSON");
  });

  it("throws when encryptedPayload is missing required fields", async () => {
    const row = mockCredentialRow(JSON.stringify({ iv: "abc" }));

    await expect(decryptCredential(row)).rejects.toThrow("missing required fields");
  });

  it("throws when encryptedPayload contains invalid base64 data", async () => {
    // While Buffer.from won't throw on arbitrary strings, we simulate
    // a scenario where the fields are present but the decryption fails
    // due to malformed base64 that produces wrong-length buffers.
    const row = mockCredentialRow(
      JSON.stringify({
        iv: "!!not-base64!!",
        authTag: "!!not-base64!!",
        ciphertext: "!!not-base64!!",
      }),
    );

    await expect(decryptCredential(row)).rejects.toThrow();
  });

  it("throws on authentication tag mismatch (tampered data)", async () => {
    const original: DecryptedCredential = {
      platform: "ga4",
      accessToken: "token",
    };

    const encryptedPayload = createEncryptedCredential(original);
    const payload = JSON.parse(encryptedPayload);

    // Tamper with the ciphertext to trigger auth tag mismatch
    payload.ciphertext = Buffer.from("tampered-data").toString("base64");

    const row = mockCredentialRow(JSON.stringify(payload));

    await expect(decryptCredential(row)).rejects.toThrow("authentication tag mismatch");
  });

  it("throws when decrypted payload is not valid JSON", async () => {
    const masterKey = Buffer.from(process.env.CREDENTIAL_ENCRYPTION_KEY!, "base64");
    const iv = Buffer.alloc(12, 0x00);
    const { createCipheriv } = await import("node:crypto");
    const cipher = createCipheriv("aes-256-gcm", masterKey, iv);
    const ciphertext = Buffer.concat([cipher.update(Buffer.from("not-json")), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const encryptedPayload = JSON.stringify({
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    });

    const row = mockCredentialRow(encryptedPayload);

    await expect(decryptCredential(row)).rejects.toThrow("not valid JSON");
  });

  it("throws when decrypted payload has empty accessToken", async () => {
    const incomplete: DecryptedCredential = {
      platform: "ga4",
      accessToken: "",
    };

    const encryptedPayload = createEncryptedCredential(incomplete);
    const row = mockCredentialRow(encryptedPayload);

    await expect(decryptCredential(row)).rejects.toThrow("missing required fields");
  });
});

describe("createEncryptedCredential", () => {
  const originalKey = process.env.CREDENTIAL_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = validMasterKey();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.CREDENTIAL_ENCRYPTION_KEY;
    } else {
      process.env.CREDENTIAL_ENCRYPTION_KEY = originalKey;
    }
  });

  it("produces a JSON string with iv, authTag, and ciphertext fields", () => {
    const credential: DecryptedCredential = {
      platform: "meta",
      accessToken: "test-token",
    };

    const result = createEncryptedCredential(credential);
    const parsed = JSON.parse(result);

    expect(parsed).toHaveProperty("iv");
    expect(parsed).toHaveProperty("authTag");
    expect(parsed).toHaveProperty("ciphertext");
    expect(typeof parsed.iv).toBe("string");
    expect(typeof parsed.authTag).toBe("string");
    expect(typeof parsed.ciphertext).toBe("string");
  });

  it("produces different ciphertext for different ivs (randomness)", () => {
    const credential: DecryptedCredential = {
      platform: "meta",
      accessToken: "same-token",
    };

    const result1 = createEncryptedCredential(credential);
    const result2 = createEncryptedCredential(credential);

    // The iv should differ, making the full payloads different
    expect(result1).not.toBe(result2);
  });

  it("round-trips through decryptCredential correctly", async () => {
    const original: DecryptedCredential = {
      platform: "meta",
      accessToken: "roundtrip-token",
      refreshToken: "roundtrip-refresh",
      metadata: { key: "value" },
    };

    const encryptedPayload = createEncryptedCredential(original);
    const row = mockCredentialRow(encryptedPayload);

    const decrypted = await decryptCredential(row);

    expect(decrypted.platform).toBe(original.platform);
    expect(decrypted.accessToken).toBe(original.accessToken);
    expect(decrypted.refreshToken).toBe(original.refreshToken);
    expect(decrypted.metadata).toEqual(original.metadata);
  });

  it("throws when master key is missing", () => {
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;

    const credential: DecryptedCredential = {
      platform: "meta",
      accessToken: "token",
    };

    expect(() => createEncryptedCredential(credential)).toThrow(
      "CREDENTIAL_ENCRYPTION_KEY environment variable is required",
    );
  });
});
