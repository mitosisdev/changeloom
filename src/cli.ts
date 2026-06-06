#!/usr/bin/env bun
// src/cli.ts — changeloom CLI entrypoint
//
// Usage:
//   bun src/cli.ts [repo-path] [--version v1.2.3] [--out <file>] [--format json]
//
// Runs `git log --oneline` on the given repo path (defaults to current dir),
// parses the output as conventional commits, and writes a markdown changelog.
// Output goes to stdout, or to a file when --out is given.
// When --format json is given, outputs structured JSON instead of Markdown.

import { execSync } from "node:child_process";
import { parseLog } from "./parser";
import { generateChangelog, generateChangelogJson } from "./generator";

export function parseArgs(
  argv: string[],
): { repoPath: string; version?: string; outFile?: string; format?: string } {
  const args = argv.slice(2); // strip "bun" and script path
  let repoPath = ".";
  let version: string | undefined;
  let outFile: string | undefined;
  let format: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--version" && args[i + 1]) {
      version = args[i + 1].replace(/^v/, ""); // normalize "v1.2.3" → "1.2.3"
      i++;
    } else if (args[i] === "--out" && args[i + 1]) {
      outFile = args[i + 1];
      i++;
    } else if (args[i] === "--format" && args[i + 1]) {
      format = args[i + 1];
      i++;
    } else if (!args[i].startsWith("--")) {
      repoPath = args[i];
    }
  }

  return { repoPath, version, outFile, format };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const { repoPath, version, outFile, format } = parseArgs(Bun.argv);

  let gitLog: string;
  try {
    gitLog = execSync("git log --oneline", {
      cwd: repoPath,
      encoding: "utf8",
    });
  } catch (err) {
    console.error(`error: could not run git log in '${repoPath}'`);
    process.exit(1);
  }

  const commits = parseLog(gitLog);

  if (commits.length === 0) {
    console.error("No conventional commits found.");
    process.exit(0);
  }

  const opts = {
    version,
    date: version ? today() : undefined,
  };

  let output: string;
  if (format === "json") {
    output = JSON.stringify(generateChangelogJson(commits, opts), null, 2);
  } else {
    output = generateChangelog(commits, opts);
  }

  if (outFile) {
    await Bun.write(outFile, output + "\n");
    console.error(`changelog written to ${outFile}`);
  } else {
    console.log(output);
  }
}

if (import.meta.main) {
  await main();
}
