#!/usr/bin/env node

/**
 * AST-Based Legacy Import Scanner
 *
 * Scans the codebase for legacy LangChain provider imports and hardcoded implementations.
 * Used for Task 3.4 in ai-providers change to ensure complete legacy code removal.
 *
 * Usage:
 *   node legacy-import-scanner.js [directory]
 *   node legacy-import-scanner.js packages/agent-runtime/src
 */

import fs from "fs";
import path from "path";
import ts from "typescript";

// Legacy patterns to detect
const LEGACY_PATTERNS = {
  // Files to be removed
  files: ["glm-config.ts", "configurable-llm-agent.ts", "langchain-integration.ts"],

  // Imports that should be removed (provider instantiation)
  removeImports: [
    { module: "@langchain/openai", named: ["ChatOpenAI"] },
    { module: "@langchain/anthropic", named: ["ChatAnthropic"] },
    { module: "@langchain/core/language_models/chat_models", named: ["BaseChatModel"] },
  ],

  // Imports that are allowed (agent orchestration only)
  allowedImports: [
    { module: "@langchain/langgraph" },
    { module: "@langchain/core/messages" },
    { module: "@langchain/core/tools" },
    { module: "@langchain/core/prompts" },
  ],

  // Legacy function calls
  functionCalls: [
    "invokeChatModelWithProviderFallback",
    "createGlmChatModel",
    "createPrimaryAndFallbackChatModels",
  ],

  // Legacy class references
  classReferences: ["ConfigurableLlmAgent", "ChatGlm"],

  // Hardcoded credentials (security risk)
  hardcodedCredentials: [
    /API_KEY\s*=\s*['"]sk-[a-zA-Z0-9]+['"]/g,
    /apiKey:\s*['"]sk-[a-zA-Z0-9]+['"]/g,
  ],
};

// Results storage
const results = {
  files: [],
  imports: [],
  functionCalls: [],
  classReferences: [],
  hardcodedCredentials: [],
  summary: {
    totalFiles: 0,
    filesWithLegacyCode: 0,
    criticalIssues: 0,
  },
};

/**
 * Check if a file path should be scanned
 */
function shouldScanFile(filePath) {
  return filePath.endsWith(".ts") || filePath.endsWith(".tsx");
}

/**
 * Check if file is in allowed list (test files, etc.)
 */
function isExcludedFile(filePath) {
  // Don't scan the scanner itself
  if (filePath.includes("legacy-import-scanner")) {
    return true;
  }
  // Don't scan node_modules
  if (filePath.includes("node_modules")) {
    return true;
  }
  return false;
}

/**
 * Parse TypeScript file and extract imports
 */
function parseImports(filePath, content) {
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  const imports = [];

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      const moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, "");
      const importClause = node.importClause;

      const namedImports = [];
      const defaultImport = importClause?.name?.getText(sourceFile);

      if (importClause?.namedBindings) {
        const namedBindings = importClause.namedBindings;
        if (ts.isNamedImports(namedBindings)) {
          namedBindings.elements.forEach((element) => {
            namedImports.push(element.name.getText(sourceFile));
          });
        }
      }

      imports.push({
        module: moduleSpecifier,
        default: defaultImport,
        named: namedImports,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      });
    }
  });

  return imports;
}

/**
 * Check for legacy function calls in content
 */
function findFunctionCalls(filePath, content, functionName) {
  const matches = [];
  const regex = new RegExp(`\\b${functionName}\\s*\\(`, "g");
  let match;

  while ((match = regex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split("\n").length;
    matches.push({
      file: filePath,
      function: functionName,
      line: lineNumber,
      context: content.substring(match.index, match.index + 100).replace(/\n/g, " "),
    });
  }

  return matches;
}

/**
 * Check for legacy class references
 */
function findClassReferences(filePath, content, className) {
  const matches = [];
  const regex = new RegExp(`\\b${className}\\b`, "g");
  let match;

  while ((match = regex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split("\n").length;
    // Filter out comments and type definitions
    const lineStart = content.lastIndexOf("\n", match.index) + 1;
    const lineEnd = content.indexOf("\n", match.index);
    const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);

    // Skip if in comment
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
      continue;
    }

    matches.push({
      file: filePath,
      class: className,
      line: lineNumber,
      context: line.trim(),
    });
  }

  return matches;
}

/**
 * Check for hardcoded credentials
 */
function findHardcodedCredentials(filePath, content, pattern) {
  const matches = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split("\n").length;
    matches.push({
      file: filePath,
      line: lineNumber,
      context: "HARDCODED CREDENTIAL DETECTED (security risk)",
    });
  }

  return matches;
}

/**
 * Scan a single file
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath);

  // Parse imports
  const imports = parseImports(filePath, content);

  // Check for legacy imports
  imports.forEach((imp) => {
    LEGACY_PATTERNS.removeImports.forEach((pattern) => {
      if (imp.module === pattern.module) {
        const overlapping = imp.named.filter((n) => pattern.named?.includes(n));
        if (overlapping.length > 0) {
          results.imports.push({
            file: relativePath,
            module: imp.module,
            imports: overlapping,
            line: imp.line,
            severity: "ERROR",
          });
        }
      }
    });
  });

  // Check for function calls
  LEGACY_PATTERNS.functionCalls.forEach((funcName) => {
    const calls = findFunctionCalls(filePath, content, funcName);
    results.functionCalls.push(...calls);
  });

  // Check for class references
  LEGACY_PATTERNS.classReferences.forEach((className) => {
    const refs = findClassReferences(filePath, content, className);
    results.classReferences.push(...refs);
  });

  // Check for hardcoded credentials
  LEGACY_PATTERNS.hardcodedCredentials.forEach((pattern) => {
    const creds = findHardcodedCredentials(filePath, content, pattern);
    results.hardcodedCredentials.push(...creds);
  });
}

/**
 * Recursively scan directory
 */
function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dirPath, entry.name);

    if (isExcludedFile(fullPath)) {
      return;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && shouldScanFile(fullPath)) {
      results.summary.totalFiles++;
      scanFile(fullPath);
    }
  });
}

/**
 * Check for legacy files that should be deleted
 */
function checkLegacyFiles(baseDir) {
  LEGACY_PATTERNS.files.forEach((fileName) => {
    const filePath = path.join(baseDir, fileName);
    if (fs.existsSync(filePath)) {
      results.files.push({
        file: path.relative(process.cwd(), filePath),
        status: "EXISTS - SHOULD BE DELETED",
        severity: "ERROR",
      });
    }
  });
}

/**
 * Print results
 */
function printResults() {
  console.log("\n========================================");
  console.log("LEGACY IMPORT SCAN RESULTS");
  console.log("========================================\n");

  console.log(`Files scanned: ${results.summary.totalFiles}`);
  console.log("");

  // Legacy files
  if (results.files.length > 0) {
    console.log("❌ LEGACY FILES (should be deleted):");
    results.files.forEach((item) => {
      console.log(`  ${item.file}: ${item.status}`);
    });
    console.log("");
    results.summary.criticalIssues += results.files.length;
  }

  // Legacy imports
  if (results.imports.length > 0) {
    console.log("❌ LEGACY IMPORTS (provider instantiation):");
    results.imports.forEach((item) => {
      console.log(`  ${item.file}:${item.line}`);
      console.log(`    Module: ${item.module}`);
      console.log(`    Imports: ${item.imports.join(", ")}`);
    });
    console.log("");
    results.summary.criticalIssues += results.imports.length;
  }

  // Function calls
  if (results.functionCalls.length > 0) {
    console.log("⚠️  LEGACY FUNCTION CALLS:");
    results.functionCalls.forEach((item) => {
      console.log(`  ${item.file}:${item.line}`);
      console.log(`    Function: ${item.function}()`);
    });
    console.log("");
    results.summary.criticalIssues += results.functionCalls.length;
  }

  // Class references
  if (results.classReferences.length > 0) {
    console.log("⚠️  LEGACY CLASS REFERENCES:");
    results.classReferences.forEach((item) => {
      console.log(`  ${item.file}:${item.line}`);
      console.log(`    Class: ${item.class}`);
      console.log(`    Context: ${item.context}`);
    });
    console.log("");
    results.summary.criticalIssues += results.classReferences.length;
  }

  // Hardcoded credentials
  if (results.hardcodedCredentials.length > 0) {
    console.log("🚨 HARDCODED CREDENTIALS (SECURITY RISK):");
    results.hardcodedCredentials.forEach((item) => {
      console.log(`  ${item.file}:${item.line}`);
      console.log(`    ${item.context}`);
    });
    console.log("");
    results.summary.criticalIssues += results.hardcodedCredentials.length;
  }

  // Summary
  console.log("========================================");
  console.log("SUMMARY");
  console.log("========================================");
  console.log(`Total files scanned: ${results.summary.totalFiles}`);
  console.log(`Critical issues found: ${results.summary.criticalIssues}`);

  if (results.summary.criticalIssues === 0) {
    console.log("\n✅ NO LEGACY CODE DETECTED - Safe to proceed with removal!");
  } else {
    console.log("\n❌ LEGACY CODE DETECTED - Review and migrate before removal!");
    console.log("\nNext steps:");
    console.log("1. Review all flagged files");
    console.log("2. Migrate to new provider factory pattern");
    console.log("3. Re-run scanner to verify zero legacy references");
    console.log("4. Proceed with destructive removal (Task 3.47-3.52)");
  }

  console.log("");

  // Exit with error code if issues found
  if (results.summary.criticalIssues > 0) {
    process.exit(1);
  }
}

// Main execution
const targetDir = process.argv[2] || "packages/agent-runtime/src";

console.log(`Scanning directory: ${targetDir}`);
console.log("Looking for legacy LangChain provider imports and hardcoded implementations...\n");

scanDirectory(path.resolve(targetDir));
checkLegacyFiles(path.resolve(targetDir));
printResults();
