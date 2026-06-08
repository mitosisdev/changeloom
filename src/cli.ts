#!/usr/bin/env bun
// src/cli.ts — changeloom CLI entrypoint
//
// Usage:
//   bun src/cli.ts [repo-path] [--version v1.2.3] [--out <file>] [--since <ref>] [--scope <name>] [--types feat,fix] [--format json] [--publish [path]] [--by-author]
//
// Runs `git log` on the given repo path (defaults to current dir),
// parses the output as conventional commits, and writes a markdown changelog.
// Output goes to stdout, or to a file when --out is given.
// When --since <ref> is given, only commits after that ref are included.
// When --scope <name> is given, only commits with that scope are included.
// When --types feat,fix is given, only commits with those types are included.
// When --format json is given, outputs structured JSON instead of Markdown.
// When --publish [path] is given, writes a dark-themed self-contained changelog.html.
// When --by-author is given, appends a ## By Author section (Markdown only; no-op with --format json).

import { execSync } from "node:child_process";
import { parseLog } from "./parser";
import { generateChangelog } from "./generator";
import { generateChangelogJson } from "./json-formatter";
import { buildChangelogHtml } from "./html";
import { filterByScope } from "./scope-filter";
import { filterByTypes } from "./type-filter";
import { buildTagRange } from "./tag-range";
import { generateByAuthor } from "./author-breakdown";

export function parseArgs(
  argv: string[],
): { repoPath: string; version?: string; outFile?: string; since?: string; scope?: string; types: string[]; format?: string; from?: string; to?: string; publish?: string; byAuthor?: boolean } {
  const args = argv.slice(2); // strip "bun" and script path
  let repoPath = ".";
  let version: string | undefined;
  let outFile: string | undefined;
  let since: string | undefined;
  let scope: string | undefined;
  let types: string[] = [];
  let format: string | undefined;
  let from: string | undefined;
  let to: string | undefined;
  let publish: string | undefined;
  let byAuthor: boolean | undefined;

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
    } else if (args[i] === "--from" && args[i + 1]) {
      from = args[i + 1];
      i++;
    } else if (args[i] === "--to" && args[i + 1]) {
      to = args[i + 1];
      i++;
    } else if (args[i] === "--publish") {
      // --publish accepts an optional path argument.
      // If the next token is absent or starts with "--", default to "changelog.html".
      if (args[i + 1] && !args[i + 1].startsWith("--")) {
        publish = args[i + 1];
        i++;
      } else {
        publish = "changelog.html";
      }
    } else if (args[i] === "--by-author") {
      byAuthor = true;
    } else if (!args[i].startsWith("--")) {
      repoPath = args[i];
    }
  }

  return { repoPath, version, outFile, since, scope, types, format, from, to, publish, byAuthor };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const { repoPath, version, outFile, since, scope, types, format, from, to, publish, byAuthor } = parseArgs(Bun.argv);

  // Validate --from / --to tags exist in the repo before running git log
  let range: string | undefined;
  try {
    range = buildTagRange(from, to);
  } catch (err) {
    console.error(`error: ${(err as Error).message}`);
    process.exit(1);
  }

  if (from !== undefined) {
    try {
      execSync(`git rev-parse --verify "${from}"`, { cwd: repoPath, encoding: "utf8", stdio: "pipe" });
    } catch {
      console.error(`error: tag or ref '${from}' does not exist in the repository`);
      process.exit(1);
    }
  }

  if (to !== undefined) {
    try {
      execSync(`git rev-parse --verify "${to}"`, { cwd: repoPath, encoding: "utf8", stdio: "pipe" });
    } catch {
      console.error(`error: tag or ref '${to}' does not exist in the repository`);
      process.exit(1);
    }
  }

  let gitLog: string;
  // When --by-author is requested, use a tab-delimited format to capture author info:
  //   <sha> <subject>\t<author name> <email>
  // Otherwise, use the standard --oneline format.
  const needsAuthor = byAuthor && format !== "json";
  const logFormat = needsAuthor
    ? `--pretty=format:"%h %s\t%an <%ae>"`
    : "--oneline";
  try {
    const gitCmd = range
      ? `git log ${logFormat} ${range}`
      : since
      ? `git log ${logFormat} ${since}..HEAD`
      : `git log ${logFormat}`;
    gitLog = execSync(gitCmd, {
      cwd: repoPath,
      encoding: "utf8",
    });
  } catch (err) {
    console.error(`error: could not run git log in '${repoPath}'`);
    process.exit(1);
  }

  // If we captured author info (tab-delimited lines), split it out before parsing.
  let authorMap: Map<string, string> | undefined;
  let logForParsing = gitLog;
  if (needsAuthor) {
    authorMap = new Map<string, string>();
    const lines = gitLog.split("\n").filter(Boolean);
    const commitLines: string[] = [];
    for (const line of lines) {
      const tabIdx = line.indexOf("\t");
      if (tabIdx !== -1) {
        const commitPart = line.slice(0, tabIdx);
        const authorPart = line.slice(tabIdx + 1);
        commitLines.push(commitPart);
        // Key by the sha (first token of commitPart)
        const sha = commitPart.split(" ")[0];
        if (sha) authorMap.set(sha, authorPart);
      } else {
        commitLines.push(line);
      }
    }
    logForParsing = commitLines.join("\n");
  }

  const rawCommits = parseLog(logForParsing);
  // Attach author info when available
  const commits = authorMap
    ? rawCommits.map((c) => ({
        ...c,
        author: authorMap!.get(c.sha) ?? authorMap!.get(c.sha.slice(0, 7)),
      }))
    : rawCommits;
  const scopeFiltered = scope ? filterByScope(commits, scope) : commits;
  const filtered = filterByTypes(scopeFiltered, types);

  if (filtered.length === 0) {
    console.error("No conventional commits found.");
    process.exit(0);
  }

  if (publish !== undefined) {
    // --publish mode: generate a self-contained dark-themed HTML file
    const jsonData = generateChangelogJson(filtered, {
      version,
      date: version ? today() : undefined,
    });
    const html = buildChangelogHtml(jsonData, {});
    await Bun.write(publish, html);
    console.error(`Wrote ${publish}`);
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

    // Append ## By Author section when --by-author flag is set (Markdown only).
    const byAuthorSection = byAuthor ? generateByAuthor(filtered) : "";
    const output = byAuthorSection
      ? changelog + "\n\n" + byAuthorSection
      : changelog;

    if (outFile) {
      await Bun.write(outFile, output + "\n");
      console.error(`changelog written to ${outFile}`);
    } else {
      console.log(output);
    }
  }
}

if (import.meta.main) {
  await main();
}
