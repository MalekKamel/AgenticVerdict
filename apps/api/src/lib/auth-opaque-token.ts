import { createHash, randomBytes } from "node:crypto";

export function hashOpaqueToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function newOpaqueToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashOpaqueToken(raw) };
}
