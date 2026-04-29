import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const canonicalErrorFile = path.join(repoRoot, "packages/core/src/errors.ts");

const runtimeCriticalRoots = [
  "apps/api/src/routes",
  "apps/api/src/services",
  "apps/api/src/trpc",
  "apps/worker/src",
  "packages/core/src",
];

const ignoredSegments = new Set(["node_modules", "dist", "coverage", "__snapshots__"]);

const trpcAllowedCodes = new Set([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "TOO_MANY_REQUESTS",
  "INTERNAL_SERVER_ERROR",
  "CONFLICT",
  "PRECONDITION_FAILED",
  "METHOD_NOT_SUPPORTED",
  "TIMEOUT",
]);

const nonCanonicalCodeAllowlistByFile = new Map([
  ["apps/api/src/routes/v1/validation.ts", new Set(["SCHEMA_VIOLATION"])],
]);

const messageMatchingPatterns = [
  /error\.message\.includes\(/,
  /error\.message\.toLowerCase\(\)\.includes\(/,
  /error\.message\s*===\s*["'`]/,
];

function collectTsFiles(rootDir) {
  const out = [];
  const stack = [path.join(repoRoot, rootDir)];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const rel = path.relative(repoRoot, current);
    const segments = rel.split(path.sep);
    if (segments.some((segment) => ignoredSegments.has(segment))) continue;
    const stats = statSync(current);
    if (stats.isDirectory()) {
      for (const entry of readdirSync(current)) {
        stack.push(path.join(current, entry));
      }
      continue;
    }
    if (current.endsWith(".ts") || current.endsWith(".tsx")) {
      out.push(rel);
    }
  }
  return out;
}

function loadRegisteredCodes() {
  const source = readFileSync(canonicalErrorFile, "utf8");
  const listMatch = source.match(/export const ERROR_CODES = \[(.*?)\] as const;/s);
  if (!listMatch) {
    throw new Error("Unable to parse ERROR_CODES from packages/core/src/errors.ts");
  }
  const codeMatches = Array.from(listMatch[1].matchAll(/"([A-Z0-9_]+)"/g));
  return new Set(codeMatches.map((entry) => entry[1]));
}

function isAllowedCode(code, registeredCodes) {
  return registeredCodes.has(code) || trpcAllowedCodes.has(code);
}

function collectViolations(files, registeredCodes) {
  const violations = [];
  for (const file of files) {
    const source = readFileSync(path.join(repoRoot, file), "utf8");
    const codeFieldMatches = Array.from(
      source.matchAll(/(?:^|[\s,{])code\s*:\s*(["'`])([^"'`]+)\1/gm),
    );
    const fileAllowlist = nonCanonicalCodeAllowlistByFile.get(file);
    for (const [, , rawCode] of codeFieldMatches) {
      const code = rawCode.trim();
      if (!/^[A-Z0-9_]+$/.test(code)) {
        violations.push({
          file,
          type: "non-canonical-code-literal",
          detail: `code "${code}" must use canonical uppercase format`,
        });
        continue;
      }
      if (fileAllowlist?.has(code)) {
        continue;
      }
      if (!isAllowedCode(code, registeredCodes)) {
        violations.push({
          file,
          type: "unregistered-code",
          detail: `code "${code}" is not in canonical registry`,
        });
      }
    }

    for (const pattern of messageMatchingPatterns) {
      if (pattern.test(source)) {
        violations.push({
          file,
          type: "banned-message-matching",
          detail: `matched forbidden pattern ${pattern}`,
        });
      }
    }
  }
  return violations;
}

const files = runtimeCriticalRoots.flatMap((root) => collectTsFiles(root));
const registeredCodes = loadRegisteredCodes();
const violations = collectViolations(files, registeredCodes);

if (violations.length > 0) {
  console.error("Error governance check failed:\n");
  for (const violation of violations) {
    console.error(`- [${violation.type}] ${violation.file}: ${violation.detail}`);
  }
  process.exit(1);
}

console.log(
  `Error governance checks passed (${files.length} files scanned, ${registeredCodes.size} codes registered).`,
);
