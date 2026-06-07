#!/usr/bin/env bun
// src/cli.ts — changeloom CLI entrypoint
//
// Usage:
//   bun src/cli.ts [repo-path] [--version v1.2.3] [--out <file>] [--since <ref>] [--scope <name>] [--types feat,fix] [--format json]
//
// Runs `git log --oneline` on the given repo path (defaults to current dir),
// parses the output as conventional commits, and writes a markdown changelog.
// Output goes to stdout, or to a file when --out is given.
// When --since <ref> is given, only commits after that ref are included.
// When --scope <name> is given, only commits with that scope are included.
// When --types feat,fix is given, only commits with those types are included.
// When --format json is given, outputs structured JSON instead of Markdown.

import { execSync } from "node:child_process";
import { parseLog } from "./parser";
import { generateChangelog } from "./generator";
import { generateChangelogJson } from "./json-formatter";
import { generateChangelogHtml } from "./publisher";
import { filterByScope } from "./scope-filter";
import { filterByTypes } from "./type-filter";

export function parseArgs(
  argv: string[],
): { repoPath: string; version?: string; outFile?: string; since?: string; scope?: string; types: string[]; format?: string; publish?: boolean } {
  const args = argv.slice(2); // strip "bun" and script path
  let repoPath = ".";
  let version: string | undefined;
  let outFile: string | undefined;
  let since: string | undefined;
  let scope: string | undefined;
  let types: string[] = [];
  let format: string | undefined;
  let publish: boolean | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--version" && args[i + 1]) {
      version = args[i + 1].replace(/^v/, ""); // normalize "v1.2.3" → "1.2.3"
      i++;
    } else if (args[i] === "--out" && args[i + 1]) {
      outFile = args[i + 1];
      i++;
    } else if (args[i] === "--since" && args[i + 1]) {
      since = args[i + 1];
      i++;
    } else if (args[i] === "--scope" && args[i + 1]) {
      scope = args[i + 1];
      i++;
    } else if (args[i] === "--types" && args[i + 1]) {
      types = args[i + 1].split(",").map((t) => t.trim()).filter(Boolean);
      i++;
    } else if (args[i] === "--format" && args[i + 1]) {
      format = args[i + 1];
      i++;
    } else if (args[i] === "--publish") {
      publish = true;
    } else if (!args[i].startsWith("--")) {
      repoPath = args[i];
    }
  }

  return { repoPath, version, outFile, since, scope, types, format, publish };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const { repoPath, version, outFile, since, scope, types, format, publish } = parseArgs(Bun.argv);

  let gitLog: string;
  try {
    const gitCmd = since
      ? `git log --oneline ${since}..HEAD`
      : "git log --oneline";
    gitLog = execSync(gitCmd, {
      cwd: repoPath,
      encoding: "utf8",
    });
  } catch (err) {
    console.error(`error: could not run git log in '${repoPath}'`);
    process.exit(1);
  }

  const commits = parseLog(gitLog);
  const scopeFiltered = scope ? filterByScope(commits, scope) : commits;
  const filtered = filterByTypes(scopeFiltered, types);

  if (filtered.length === 0) {
    console.error("No conventional commits found.");
    process.exit(0);
  }

  if (publish) {
    const htmlContent = generateChangelogHtml(filtered, {
      version,
      date: version ? today() : undefined,
    });
    const dest = outFile ?? "changelog.html";
    await Bun.write(dest, htmlContent + "\n");
    console.error(`changelog written to ${dest}`);
  } else if (format === "json") {
    const jsonData = generateChangelogJson(filtered, {
      version,
      date: version ? today() : undefined,
    });
    const output = JSON.stringify(jsonData, null, 2);
    if (outFile) {
      await Bun.write(outFile, output + "\n");
      console.error(`changelog written to ${outFile}`);
    } else {
      console.log(output);
    }
  } else {
    const changelog = generateChangelog(filtered, {
      version,
      date: version ? today() : undefined,
    });

    if (outFile) {
      await Bun.write(outFile, changelog + "\n");
      console.error(`changelog written to ${outFile}`);
    } else {
      console.log(changelog);
    }
  }
}

if (import.meta.main) {
  await main();
}
