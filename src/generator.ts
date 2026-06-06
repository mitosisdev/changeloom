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

  // Format a single commit as a bullet.
  // With scope:    "- (scope): <subject> (<shortSha>)"
  // Without scope: "- <subject> (<shortSha>)"
  function bullet(c: ConventionalCommit): string {
    const shortSha = c.sha.slice(0, 7);
    const prefix = c.scope ? `(${c.scope}): ` : "";
    return `- ${prefix}${c.subject} (${shortSha})`;
  }

  // Build sections in the canonical type order
  const sections: string[] = [];

  // Known types in order
  for (const [type, label] of TYPE_ORDER) {
    const group = groups.get(type);
    if (!group || group.length === 0) continue;
    const bullets = group.map(bullet).join("\n");
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
    const bullets = otherCommits.map(bullet).join("\n");
    sections.push(`### Other\n${bullets}`);
  }

  if (sections.length === 0) return header;

  // Format: header, blank line, sections separated by blank lines
  return header + "\n\n" + sections.join("\n\n");
}

// ─── JSON output ─────────────────────────────────────────────────────────────

export interface ChangelogJsonEntry {
  sha: string;
  subject: string;
  scope: string | null;
  breaking: boolean;
}

export interface ChangelogJsonGroup {
  /** Canonical commit type key (e.g. "feat", "fix") or "other" for unknowns */
  type: string;
  /** Human-readable section label (e.g. "Features", "Bug Fixes") */
  label: string;
  entries: ChangelogJsonEntry[];
}

export interface ChangelogJson {
  version: string | null;
  date: string | null;
  groups: ChangelogJsonGroup[];
}

/**
 * Generate a structured JSON changelog from an array of parsed conventional
 * commits. The JSON mirrors the same grouping logic as generateChangelog().
 *
 * @param commits - Parsed commits from parseLog() or parseCommit()
 * @param options - Optional: version string and date for the release header
 * @returns ChangelogJson object (always returns an object, even for 0 commits)
 */
export function generateChangelogJson(
  commits: ConventionalCommit[],
  options: ChangelogOptions = {},
): ChangelogJson {
  const version = options.version ?? null;
  const date = options.date ?? null;

  if (commits.length === 0) {
    return { version, date, groups: [] };
  }

  // Group commits by type — preserve insertion order within each group
  const groups = new Map<string, ConventionalCommit[]>();
  for (const commit of commits) {
    if (!groups.has(commit.type)) groups.set(commit.type, []);
    groups.get(commit.type)!.push(commit);
  }

  const toEntry = (c: ConventionalCommit): ChangelogJsonEntry => ({
    sha: c.sha,
    subject: c.subject,
    scope: c.scope,
    breaking: c.breaking,
  });

  const resultGroups: ChangelogJsonGroup[] = [];

  // Known types in canonical order
  for (const [type, label] of TYPE_ORDER) {
    const group = groups.get(type);
    if (!group || group.length === 0) continue;
    resultGroups.push({ type, label, entries: group.map(toEntry) });
  }

  // Unknown types → "other" group (in insertion order)
  const otherCommits: ConventionalCommit[] = [];
  for (const [type, group] of groups) {
    if (!KNOWN_TYPES.has(type)) {
      otherCommits.push(...group);
    }
  }
  if (otherCommits.length > 0) {
    resultGroups.push({ type: "other", label: "Other", entries: otherCommits.map(toEntry) });
  }

  return { version, date, groups: resultGroups };
}
