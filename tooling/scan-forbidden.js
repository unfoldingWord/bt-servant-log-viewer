#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Scans files for forbidden patterns that violate our zero-warning policy.
 * This script is run as part of lint-staged to prevent committing code with escape hatches.
 */

const FORBIDDEN_PATTERNS = [
  {
    pattern: /\/\/\s*eslint-disable/g,
    message: "eslint-disable comments are forbidden (zero-warning policy)",
  },
  {
    pattern: /@ts-ignore/g,
    message: "@ts-ignore is forbidden (use @ts-expect-error with description)",
  },
  {
    pattern: /@ts-nocheck/g,
    message: "@ts-nocheck is forbidden (fix TypeScript errors instead)",
  },
  {
    pattern: /console\.(log|debug|info|warn|error|trace)/g,
    message: "console.* is forbidden (use proper logging or remove debug statements)",
    allowInFiles: ["apps/api/"],
  },
];

function scanFile(filePath) {
  const errors = [];

  // Skip markdown files (they document forbidden patterns)
  if (filePath.endsWith(".md")) {
    return errors;
  }

  // Skip the scanner itself
  if (filePath.includes("scan-forbidden.js")) {
    return errors;
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (const forbidden of FORBIDDEN_PATTERNS) {
      // Check if this file is allowed to have this pattern
      if (
        forbidden.allowInFiles &&
        forbidden.allowInFiles.some((allowed) => filePath.includes(allowed))
      ) {
        continue;
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(forbidden.pattern);

        if (match) {
          errors.push({
            file: filePath,
            line: i + 1,
            message: forbidden.message,
            snippet: line.trim(),
          });
        }
      }
    }
  } catch (error) {
    // Silently skip files that can't be read (binary files, etc.)
    if (error.code !== "EISDIR") {
      // But report actual read errors
      // Note: We can't use console.error here due to our own rules!
      process.stderr.write(`Error reading ${filePath}: ${error.message}\n`);
    }
  }

  return errors;
}

function main() {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    process.stderr.write("Usage: scan-forbidden.js <file1> <file2> ...\n");
    process.exit(0);
  }

  let allErrors = [];

  for (const file of files) {
    const resolvedPath = resolve(file);
    const errors = scanFile(resolvedPath);
    allErrors = allErrors.concat(errors);
  }

  if (allErrors.length > 0) {
    process.stderr.write("\n❌ Forbidden patterns detected:\n\n");

    for (const error of allErrors) {
      process.stderr.write(`${error.file}:${error.line}\n`);
      process.stderr.write(`  ${error.message}\n`);
      process.stderr.write(`  > ${error.snippet}\n\n`);
    }

    process.stderr.write(
      `Found ${allErrors.length} forbidden pattern(s). Please fix before committing.\n`
    );
    process.exit(1);
  }

  process.exit(0);
}

main();
