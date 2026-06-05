#!/usr/bin/env bun
// src/cli.ts — changeloom CLI entrypoint
//
// Usage:
//   bun src/cli.ts [repo-path] [--version v1.2.3]
//
// Runs `git log --pretty=format:"%H %s" --no-merges` on the given repo path
// (defaults to current dir), parses the output as conventional commits,
// prints the markdown changelog to stdout, and writes CHANGELOG.md to the
// target repo directory.

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseLog } from "./parser";
import { generateChangelog } from "./generator";

function parseArgs(argv: string[]): { repoPath: string; version?: string } {
  const args = argv.slice(2); // strip "bun" and script path
  let repoPath = ".";
  let version: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--version" && args[i + 1]) {
      version = args[i + 1].replace(/^v/, ""); // normalize "v1.2.3" → "1.2.3"
      i++;
    } else if (!args[i].startsWith("--")) {
      repoPath = args[i];
    }
  }

  return { repoPath, version };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const { repoPath, version } = parseArgs(Bun.argv);
const resolvedPath = resolve(repoPath);

let gitLog: string;
try {
  gitLog = execSync('git log --pretty=format:"%H %s" --no-merges', {
    cwd: resolvedPath,
    encoding: "utf8",
  });
} catch (err) {
  console.error(`error: could not run git log in '${resolvedPath}'`);
  process.exit(1);
}

const commits = parseLog(gitLog);

if (commits.length === 0) {
  console.error("No conventional commits found.");
  process.exit(0);
}

const changelog = generateChangelog(commits, {
  version,
  date: version ? today() : undefined,
});

// Print to stdout
console.log(changelog);

// Write CHANGELOG.md to the target repo
const changelogPath = join(resolvedPath, "CHANGELOG.md");
writeFileSync(changelogPath, changelog + "\n", "utf8");
