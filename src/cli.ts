#!/usr/bin/env bun
// src/cli.ts — changeloom CLI entrypoint
//
// Usage:
//   bun src/cli.ts [repo-path] [--version v1.2.3] [--out <file>] [--since <ref>] [--scope <name>]
//
// Runs `git log --oneline` on the given repo path (defaults to current dir),
// parses the output as conventional commits, and writes a markdown changelog.
// Output goes to stdout, or to a file when --out is given.
// When --since <ref> is given, only commits after that ref are included.
// When --scope <name> is given, only commits with that scope are included.

import { execSync } from "node:child_process";
import { parseLog } from "./parser";
import { generateChangelog } from "./generator";
import { filterByScope } from "./scope-filter";
import { toJson } from "./format-json";
import type { CommitGroup } from "./format-json";
import type { ConventionalCommit } from "./parser";

export function parseArgs(
  argv: string[],
): { repoPath: string; version?: string; outFile?: string; since?: string; scope?: string; format?: "markdown" | "json" } {
  const args = argv.slice(2); // strip "bun" and script path
  let repoPath = ".";
  let version: string | undefined;
  let outFile: string | undefined;
  let since: string | undefined;
  let scope: string | undefined;
  let format: "markdown" | "json" | undefined;

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
    } else if (args[i] === "--format" && args[i + 1]) {
      const val = args[i + 1];
      if (val === "json" || val === "markdown") format = val;
      i++;
    } else if (!args[i].startsWith("--")) {
      repoPath = args[i];
    }
  }

  return { repoPath, version, outFile, since, scope, format };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Canonical type order and labels — mirrors generator.ts
const TYPE_ORDER: Array<[string, string]> = [
  ["feat", "Features"],
  ["fix", "Bug Fixes"],
  ["docs", "Documentation"],
  ["refactor", "Refactoring"],
  ["perf", "Performance"],
  ["test", "Tests"],
  ["chore", "Chores"],
];

const KNOWN_TYPES = new Set(TYPE_ORDER.map(([t]) => t));

/** Build CommitGroup array from a flat commit list (same order as generator). */
function buildGroups(commits: ConventionalCommit[]): CommitGroup[] {
  const byType = new Map<string, ConventionalCommit[]>();
  for (const c of commits) {
    if (!byType.has(c.type)) byType.set(c.type, []);
    byType.get(c.type)!.push(c);
  }

  const groups: CommitGroup[] = [];

  for (const [type, label] of TYPE_ORDER) {
    const group = byType.get(type);
    if (!group || group.length === 0) continue;
    groups.push({
      type,
      label,
      commits: group.map((c) => ({
        hash: c.sha.slice(0, 7),
        subject: c.subject,
        ...(c.scope != null ? { scope: c.scope } : {}),
      })),
    });
  }

  // Unknown types → "Other"
  const otherCommits: ConventionalCommit[] = [];
  for (const [type, group] of byType) {
    if (!KNOWN_TYPES.has(type)) otherCommits.push(...group);
  }
  if (otherCommits.length > 0) {
    groups.push({
      type: "other",
      label: "Other",
      commits: otherCommits.map((c) => ({
        hash: c.sha.slice(0, 7),
        subject: c.subject,
        ...(c.scope != null ? { scope: c.scope } : {}),
      })),
    });
  }

  return groups;
}

async function main() {
  const { repoPath, version, outFile, since, scope, format } = parseArgs(Bun.argv);

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
  const filtered = scope ? filterByScope(commits, scope) : commits;

  if (filtered.length === 0) {
    console.error("No conventional commits found.");
    process.exit(0);
  }

  if (format === "json") {
    const groups = buildGroups(filtered);
    const output = JSON.stringify(toJson(groups, version), null, 2);
    console.log(output);
    return;
  }

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

if (import.meta.main) {
  await main();
}
