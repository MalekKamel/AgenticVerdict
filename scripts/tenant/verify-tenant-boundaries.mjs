import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const includeRoots = ["apps", "packages"];
const ignorePathSegments = new Set([
  "node_modules",
  "dist",
  "coverage",
  "docs",
  "changelog",
  "specs",
]);

const bannedPatterns = [
  {
    regex: /\bx-tenant-id\b/i,
    reason: "Legacy tenant header alias is forbidden; use x-tenant-id.",
  },
  {
    regex: /\bhttps:\/\/agenticverdict\.dev\/tenant_id\b/,
    reason: "Legacy tenant claim alias is forbidden; use tenant_id claim namespace.",
  },
  {
    regex: /\btenant_id\b/,
    reason: "Legacy tenant_id claim alias is forbidden in app/core logic.",
  },
];

function shouldIgnore(relativePath) {
  const segments = relativePath.split(path.sep);
  if (segments.some((segment) => ignorePathSegments.has(segment))) {
    return true;
  }
  return relativePath.startsWith(path.join("packages", "database"));
}

function collectTsFiles(rootDir) {
  const absoluteRoot = path.join(repoRoot, rootDir);
  const out = [];
  const stack = [absoluteRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    const rel = path.relative(repoRoot, current);
    if (rel && shouldIgnore(rel)) {
      continue;
    }
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current)) {
        stack.push(path.join(current, entry));
      }
      continue;
    }
    if (current.endsWith(".ts") || current.endsWith(".tsx")) {
      out.push(path.relative(repoRoot, current));
    }
  }
  return out;
}

const files = includeRoots.flatMap((root) => collectTsFiles(root));

const violations = [];
for (const relativePath of files) {
  const absolutePath = path.join(repoRoot, relativePath);
  const content = readFileSync(absolutePath, "utf8");
  for (const rule of bannedPatterns) {
    if (rule.regex.test(content)) {
      violations.push({ file: relativePath, reason: rule.reason, pattern: String(rule.regex) });
    }
  }
}

if (violations.length > 0) {
  console.error("Tenant boundary check failed. Forbidden legacy tenant patterns found:\n");
  for (const violation of violations) {
    console.error(`- ${violation.file}\n  ${violation.reason}\n  pattern: ${violation.pattern}`);
  }
  process.exit(1);
}

console.log(`Tenant boundary check passed (${files.length} files scanned).`);
