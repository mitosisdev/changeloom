// src/generator.ts — changelog markdown generator for changeloom
//
// Takes an array of ConventionalCommit objects (from parser.ts) and renders
// a clean markdown changelog grouped by type.

import type { ConventionalCommit } from "./parser";

export interface ChangelogOptions {
  /** If provided, renders "## [v<version>]" instead of "## [Unreleased]" */
  version?: string;
  /** ISO date string (e.g. "2026-06-05") to append to the version header */
  date?: string;
}

// Ordered list of known types with their display names.
// Commits with types not in this map fall under "Other".
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

/**
 * Generate a markdown changelog from an array of parsed conventional commits.
 *
 * @param commits - Parsed commits from parseLog() or parseCommit()
 * @param options - Optional: version string and date for the release header
 * @returns Markdown string, or "" if commits is empty
 */
export function generateChangelog(
  commits: ConventionalCommit[],
  options: ChangelogOptions = {},
): string {
  if (commits.length === 0) return "";

  // Build header line
  let header: string;
  if (options.version) {
    header = `## [v${options.version}]`;
    if (options.date) {
      header += ` — ${options.date}`;
    }
  } else {
    header = "## [Unreleased]";
  }

  // Group commits by type — preserve insertion order within each group
  const groups = new Map<string, ConventionalCommit[]>();
  for (const commit of commits) {
    const key = commit.type;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(commit);
  }

  // Build sections in the canonical type order
  const sections: string[] = [];

  // Known types in order
  for (const [type, label] of TYPE_ORDER) {
    const group = groups.get(type);
    if (!group || group.length === 0) continue;
    const bullets = group.map((c) => `- ${c.subject}`).join("\n");
    sections.push(`### ${label}\n${bullets}`);
  }

  // Unknown types → Other (in insertion order)
  const otherCommits: ConventionalCommit[] = [];
  for (const [type, group] of groups) {
    if (!KNOWN_TYPES.has(type)) {
      otherCommits.push(...group);
    }
  }
  if (otherCommits.length > 0) {
    const bullets = otherCommits.map((c) => `- ${c.subject}`).join("\n");
    sections.push(`### Other\n${bullets}`);
  }

  if (sections.length === 0) return header;

  // Format: header, blank line, sections separated by blank lines
  return header + "\n\n" + sections.join("\n\n");
}
