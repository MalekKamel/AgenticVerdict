#!/usr/bin/env node

/**
 * AST Scanner for Hardcoded Provider References
 *
 * Scans TypeScript/JavaScript files for hardcoded provider IDs
 * that should use tenant configuration instead.
 *
 * Usage:
 *   pnpm run scan:providers
 *   node scripts/scan-provider-references.js [directory]
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";

// Provider IDs that should be configured via tenant config, not hardcoded
const FORBIDDEN_PROVIDER_IDS = [
  "openai",
  "anthropic",
  "google",
  "bedrock",
  "azure-openai",
  "openai-compatible",
];

// Files and patterns to exclude from scanning
const EXCLUDE_PATTERNS = [
  /node_modules\//,
  /dist\//,
  /build\//,
  /\.test\.ts$/,
  /\.spec\.ts$/,
  /mock.*\.ts$/,
  /fixture.*\.ts$/,
  /provider-registry\.ts$/, // Provider registration is allowed
  /tenant.*config.*\.ts$/, // Config files are allowed
];

interface Finding {
  file: string;
  line: number;
  column: number;
  provider: string;
  context: string;
}

/**
 * Check if a file path should be excluded from scanning.
 */
function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Scan a single TypeScript file for hardcoded provider references.
 */
function scanFile(filePath: string): Finding[] {
  const findings: Finding[] = [];
  const sourceCode = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);

  function visit(node: ts.Node) {
    // Check string literals that might be provider IDs
    if (ts.isStringLiteral(node) || ts.isIdentifier(node)) {
      const text = node.getText(sourceFile).replace(/["'`]/g, "");

      if (FORBIDDEN_PROVIDER_IDS.includes(text)) {
        // Check if this is part of an assignment or comparison that looks like provider selection
        const parent = node.parent;

        // Skip if it's in an import statement
        if (ts.isImportDeclaration(parent) || ts.isImportSpecifier(parent)) {
          return;
        }

        // Skip if it's a type definition or interface
        if (ts.isTypeAliasDeclaration(parent) || ts.isInterfaceDeclaration(parent)) {
          return;
        }

        // Skip if it's in a comment or documentation
        const startPos = node.getStart(sourceFile);
        const lineAndChar = sourceFile.getLineAndCharacterOfPosition(startPos);
        const lineText = sourceCode.split("\n")[lineAndChar.line];

        if (lineText.trim().startsWith("//") || lineText.trim().startsWith("*")) {
          return;
        }

        // This looks like a hardcoded provider reference
        const context = lineText.trim();
        findings.push({
          file: filePath,
          line: lineAndChar.line + 1,
          column: lineAndChar.character + 1,
          provider: text,
          context: context.substring(0, 100),
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return findings;
}

/**
 * Recursively scan a directory for TypeScript files.
 */
function scanDirectory(dirPath: string): Finding[] {
  const findings: Finding[] = [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Skip excluded directories
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "build") {
        continue;
      }
      findings.push(...scanDirectory(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      if (!shouldExclude(fullPath)) {
        const fileFindings = scanFile(fullPath);
        findings.push(...fileFindings);
      }
    }
  }

  return findings;
}

/**
 * Print findings in a readable format.
 */
function printFindings(findings: Finding[]): void {
  if (findings.length === 0) {
    console.log("✓ No hardcoded provider references found!");
    return;
  }

  console.error(`\n❌ Found ${findings.length} hardcoded provider reference(s):\n`);

  // Group by file
  const byFile = new Map<string, Finding[]>();
  for (const finding of findings) {
    const existing = byFile.get(finding.file) || [];
    existing.push(finding);
    byFile.set(finding.file, existing);
  }

  for (const [file, fileFindings] of byFile.entries()) {
    console.error(`\n${file}:`);
    for (const finding of fileFindings) {
      console.error(`  ${finding.line}:${finding.column} - Provider "${finding.provider}"`);
      console.error(`    ${finding.context}`);
    }
  }

  console.error(
    `\n💡 Tip: Use tenant AI config (tenant.config.ai.primaryProvider) instead of hardcoded values.`,
  );
  console.error(`   See: packages/core/src/tenant/config-schema.ts\n`);
}

/**
 * Main entry point.
 */
function main(): void {
  const args = process.argv.slice(2);
  const targetDir = args[0] || path.join(process.cwd(), "packages/agent-runtime/src");

  console.log(`Scanning for hardcoded provider references in: ${targetDir}`);

  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory not found: ${targetDir}`);
    process.exit(1);
  }

  const findings = scanDirectory(targetDir);
  printFindings(findings);

  // Exit with error code if findings found
  if (findings.length > 0) {
    process.exit(1);
  }
}

main();
