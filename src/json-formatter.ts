// src/json-formatter.ts — JSON changelog formatter for changeloom
//
// Produces a structured JSON representation of the changelog, grouped by
// commit type. Used when --format json is passed to the CLI.

import type { ConventionalCommit } from "./parser";

export interface ChangelogJsonOptions {
  /** If provided, used as the version field; otherwise "unreleased" */
  version?: string;
  /** ISO date string (e.g. "2026-06-07") */
  date?: string;
  /**
   * When true, populate the `authors` breakdown on the output (commits grouped
   * by contributor, authors sorted alphabetically). Off by default to keep the
   * default JSON output backward-compatible.
   */
  byAuthor?: boolean;
}

export interface ChangelogJsonCommit {
  sha: string;
  subject: string;
  scope: string | null;
  /** The commit type (feat, fix, …). Present on commits inside an author group. */
  type?: string;
}

export interface ChangelogJsonSection {
  type: string;
  label: string;
  commits: ChangelogJsonCommit[];
}

export interface ChangelogJsonAuthorGroup {
  /** Author name and email, e.g. "Alice <alice@example.com>", or "Unknown". */
  author: string;
  commits: ChangelogJsonCommit[];
}

export interface ChangelogJsonOutput {
  version: string;
  date?: string;
  sections: ChangelogJsonSection[];
  /**
   * Per-contributor breakdown of all commits. Only present when the caller
   * passes `byAuthor: true`. Authors are sorted alphabetically.
   */
  authors?: ChangelogJsonAuthorGroup[];
}

// Ordered list of known types with their display names (same order as markdown generator).
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
 * Generate a structured JSON changelog from an array of parsed conventional commits.
 *
 * @param commits - Parsed commits from parseLog() or parseCommit()
 * @param options - Optional: version string and date for the release header
 * @returns Plain object suitable for JSON.stringify()
 */
export function generateChangelogJson(
  commits: ConventionalCommit[],
  options: ChangelogJsonOptions = {},
): ChangelogJsonOutput {
  const result: ChangelogJsonOutput = {
    version: options.version ?? "unreleased",
    sections: [],
  };

  if (options.date) result.date = options.date;

  if (commits.length === 0) return result;

  // Group commits by type — preserve insertion order within each group
  const groups = new Map<string, ConventionalCommit[]>();
  for (const commit of commits) {
    const key = commit.type;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(commit);
  }

  function mapCommit(c: ConventionalCommit): ChangelogJsonCommit {
    return {
      sha: c.sha.slice(0, 7),
      subject: c.subject,
      scope: c.scope,
    };
  }

  // Known types in canonical order
  for (const [type, label] of TYPE_ORDER) {
    const group = groups.get(type);
    if (!group || group.length === 0) continue;
    result.sections.push({
      type,
      label,
      commits: group.map(mapCommit),
    });
  }

  // Unknown types → Other (in insertion order)
  const otherCommits: ConventionalCommit[] = [];
  for (const [type, group] of groups) {
    if (!KNOWN_TYPES.has(type)) {
      otherCommits.push(...group);
    }
  }
  if (otherCommits.length > 0) {
    result.sections.push({
      type: "other",
      label: "Other",
      commits: otherCommits.map(mapCommit),
    });
  }

  // Optional per-author breakdown. Groups ALL commits (regardless of type) by
  // contributor, falling back to "Unknown" for commits with no author, and
  // sorts authors alphabetically (case-insensitive) for stable output.
  if (options.byAuthor) {
    const authorGroups = new Map<string, ConventionalCommit[]>();
    for (const commit of commits) {
      const key = commit.author ?? "Unknown";
      if (!authorGroups.has(key)) authorGroups.set(key, []);
      authorGroups.get(key)!.push(commit);
    }
    const sortedAuthors = [...authorGroups.keys()].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );
    result.authors = sortedAuthors.map((author) => ({
      author,
      commits: authorGroups.get(author)!.map((c) => ({
        ...mapCommit(c),
        type: c.type,
      })),
    }));
  }

  return result;
}
