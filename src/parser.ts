// src/parser.ts — conventional commit parser.
//
// Parses git log output (single message strings or multi-message logs separated
// by "---commit---") into typed ConventionalCommit objects.
//
// Spec: https://www.conventionalcommits.org/en/v1.0.0/

export interface ConventionalCommit {
  type: string;
  scope: string | null;
  subject: string;
  breaking: boolean;
}

// Regex for the conventional commit first line:
//   <type>[(<scope>)][!]: <subject>
const HEADER_RE = /^([a-zA-Z]+)(?:\(([^)]+)\))?(!)?\s*:\s*(.+)$/;

// Footer token for breaking changes per spec.
const BREAKING_FOOTER_RE = /^BREAKING[ -]CHANGE\s*[:!]/m;

/**
 * Parse a single commit message string into a ConventionalCommit, or null if
 * it doesn't match the conventional commit format.
 *
 * The input may be just the subject line, or a full multi-line message body
 * (the first line is the header; a "BREAKING CHANGE:" footer anywhere in the
 * body also marks the commit as breaking).
 */
export function parseCommit(message: string): ConventionalCommit | null {
  if (!message) return null;

  // The header is always the first line.
  const firstLine = message.split("\n")[0]!.trim();
  const match = HEADER_RE.exec(firstLine);
  if (!match) return null;

  const [, type, scope, bang, subject] = match;

  // Breaking if "!" present on the header line OR "BREAKING CHANGE:" in footer.
  const breaking = bang === "!" || BREAKING_FOOTER_RE.test(message);

  return {
    type: type!,
    scope: scope ?? null,
    subject: subject!.trim(),
    breaking,
  };
}

/**
 * Parse a git log string containing one or more commit messages.
 *
 * Commits are separated by the "---commit---" sentinel (produced by
 * `git log --format="%B%n---commit---"`). Any entry that doesn't match the
 * conventional commit format is silently skipped.
 */
export function parseLog(log: string): ConventionalCommit[] {
  if (!log.trim()) return [];

  const entries = log.split("---commit---");
  const results: ConventionalCommit[] = [];

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const commit = parseCommit(trimmed);
    if (commit) results.push(commit);
  }

  return results;
}
