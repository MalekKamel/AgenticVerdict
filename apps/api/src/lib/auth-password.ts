import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PREFIX = "scrypt$";
const KEYLEN = 64;

/**
 * Scrypt-based password hashing (no extra npm deps).
 * Wire format: `scrypt$<salt_b64>$<hash_b64>`
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEYLEN, { N: 16384, r: 8, p: 1 });
  return `${PREFIX}${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(plain: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.startsWith(PREFIX)) {
    return false;
  }
  const withoutPrefix = stored.slice(PREFIX.length);
  const dollar = withoutPrefix.indexOf("$");
  if (dollar <= 0) {
    return false;
  }
  const saltB64 = withoutPrefix.slice(0, dollar);
  const hashB64 = withoutPrefix.slice(dollar + 1);
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64");
    expected = Buffer.from(hashB64, "base64");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length !== KEYLEN) {
    return false;
  }
  const computed = scryptSync(plain, salt, KEYLEN, { N: 16384, r: 8, p: 1 });
  if (computed.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(computed, expected);
}
