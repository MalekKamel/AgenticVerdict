#!/usr/bin/env node
/**
 * HS256 JWT for local API testing. Matches `apps/api` auth (`jose` verify, claims: `sub`, `tenant_id`, `roles`).
 *
 * Usage:
 *   export TOKEN=$(node scripts/generate-dev-jwt.mjs --tenant <uuid>)
 *
 * Secret resolution (first match): `JWT_SECRET` (length ≥ 8), `JWT_SECRET_FILE`, or `secrets/jwt_secret.txt` at repo root.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SignJWT } from "jose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function parseArgs(argv) {
  const out = {
    tenant: undefined,
    sub: "user-123",
    roles: ["admin"],
    expires: "1h",
    secretFile: undefined,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--tenant" && argv[i + 1]) {
      out.tenant = argv[++i];
      continue;
    }
    if (a === "--sub" && argv[i + 1]) {
      out.sub = argv[++i];
      continue;
    }
    if (a === "--roles" && argv[i + 1]) {
      const raw = argv[++i];
      out.roles = raw
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      continue;
    }
    if (a === "--expires" && argv[i + 1]) {
      out.expires = argv[++i];
      continue;
    }
    if (a === "--secret-file" && argv[i + 1]) {
      out.secretFile = argv[++i];
      continue;
    }
  }
  return out;
}

function resolveSecretPath(args) {
  if (args.secretFile) {
    return resolve(args.secretFile);
  }
  const fromEnv = process.env.JWT_SECRET_FILE?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  return resolve(repoRoot, "secrets/jwt_secret.txt");
}

function loadSecret(args) {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 8) {
    return fromEnv;
  }
  const path = resolveSecretPath(args);
  if (existsSync(path)) {
    return readFileSync(path, "utf8").trim();
  }
  console.error(
    "JWT secret not found. Set JWT_SECRET or JWT_SECRET_FILE, or run ./scripts/generate-secrets.sh (creates secrets/jwt_secret.txt).",
  );
  process.exit(1);
}

const args = parseArgs(process.argv);
if (!args.tenant) {
  console.error(
    "Usage: node scripts/generate-dev-jwt.mjs --tenant <uuid> [--sub user-123] [--roles admin] [--expires 1h] [--secret-file path]",
  );
  process.exit(1);
}

const secret = loadSecret(args);
const token = await new SignJWT({
  tenant_id: args.tenant,
  roles: args.roles,
})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(args.sub)
  .setIssuedAt()
  .setExpirationTime(args.expires)
  .sign(new TextEncoder().encode(secret));

console.log(token);
