#!/usr/bin/env bun
// src/cli.ts — changeloom CLI entrypoint
//
// Usage:
//   bun src/cli.ts [repo-path] [--version v1.2.3] [--out <file>] [--since <ref>] [--scope <name>] [--publish]
//
// Runs `git log --oneline` on the given repo path (defaults to current dir),
// parses the output as conventional commits, and writes a markdown changelog.
// Output goes to stdout, or to a file when --out is given.
// When --since <ref> is given, only commits after that ref are included.
// When --scope <name> is given, only commits with that scope are included.
// When --publish is given, writes a self-contained changelog.html with dark styling.

import { execSync } from "node:child_process";
import { parseLog } from "./parser";
import { generateChangelog } from "./generator";
import { filterByScope } from "./scope-filter";
import { generateHtml, type SectionEntry } from "./html-generator";

export function parseArgs(
  argv: string[],
): { repoPath: string; version?: string; outFile?: string; since?: string; scope?: string; publish: boolean } {
  const args = argv.slice(2); // strip "bun" and script path
  let repoPath = ".";
  let version: string | undefined;
  let outFile: string | undefined;
  let since: string | undefined;
  let scope: string | undefined;
  let publish = false;

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
    } else if (args[i] === "--publish") {
      publish = true;
    } else if (!args[i].startsWith("--")) {
      repoPath = args[i];
    }
  }

  return { repoPath, version, outFile, since, scope, publish };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// TYPE_ORDER mirrors the canonical order in generator.ts so HTML sections render consistently.
const HTML_TYPE_ORDER: Array<[string, string]> = [
  ["feat", "Features"],
  ["fix", "Bug Fixes"],
  ["docs", "Documentation"],
  ["refactor", "Refactoring"],
  ["perf", "Performance"],
  ["test", "Tests"],
  ["chore", "Chores"],
];
const HTML_KNOWN_TYPES = new Set(HTML_TYPE_ORDER.map(([t]) => t));

async function main() {
  const { repoPath, version, outFile, since, scope, publish } = parseArgs(Bun.argv);

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

  if (publish) {
    // Build sections for the HTML generator
    const groups = new Map<string, typeof filtered>();
    for (const c of filtered) {
      if (!groups.has(c.type)) groups.set(c.type, []);
      groups.get(c.type)!.push(c);
    }

    const sections: SectionEntry[] = [];

    // Known types in canonical order
    for (const [type, label] of HTML_TYPE_ORDER) {
      const group = groups.get(type);
      if (!group || group.length === 0) continue;
      sections.push({
        type,
        label,
        commits: group.map((c) => ({
          type: c.type,
          scope: c.scope,
          subject: c.subject,
          hash: c.sha,
          body: c.body || null,
          breaking: c.breaking,
        })),
      });
    }

    // Unknown types → Other
    const otherCommits = filtered.filter((c) => !HTML_KNOWN_TYPES.has(c.type));
    if (otherCommits.length > 0) {
      sections.push({
        type: "other",
        label: "Other",
        commits: otherCommits.map((c) => ({
          type: c.type,
          scope: c.scope,
          subject: c.subject,
          hash: c.sha,
          body: c.body || null,
          breaking: c.breaking,
        })),
      });
    }

    const html = generateHtml(sections, version ?? "Unreleased");
    const htmlFile = "changelog.html";
    await Bun.write(htmlFile, html + "\n");
    console.error(`changelog written to ${htmlFile}`);
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
