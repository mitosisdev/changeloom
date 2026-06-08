// src/parser.ts — conventional commit parser for changeloom
//
// Input format: each entry is one line from `git log --oneline` style:
//   <sha> <type>[(<scope>)][!]: <subject>
//
// Multi-line commits (with body) are also handled when a full commit message
// is passed: the first line must be the header line, body follows after a
// blank line.

export interface ConventionalCommit {
  sha: string;
  type: string;
  scope: string | null;
  breaking: boolean;
  /** The description from a "BREAKING CHANGE: <description>" footer, or null if none. */
  breakingDescription: string | null;
  subject: string;
  body: string;
  /** Author name and email, e.g. "Alice <alice@example.com>". Optional — set when git log includes author info. */
  author?: string;
}

// Matches: <sha> <type>[(<scope>)][!]: <subject>
// SHA: one or more hex characters (7-char short or 40-char full)
const HEADER_RE =
  /^([0-9a-f]+) ([a-zA-Z]+)(?:\(([^)]*)\))?(!)?:\s+(.+)$/;

/**
 * Parse a single git log line (or a full commit message where the first line
 * is the header). Returns null if the message does not follow the conventional
 * commit format.
 */
export function parseCommit(input: string): ConventionalCommit | null {
  const lines = input.split("\n");
  const header = lines[0];

  const match = HEADER_RE.exec(header);
  if (!match) return null;

  const [, sha, type, scope, bang, subject] = match;

  // Body: everything after the blank line that separates header from body.
  // Find the first blank line after the header.
  let body = "";
  const blankIdx = lines.indexOf("", 1);
  if (blankIdx !== -1 && blankIdx < lines.length - 1) {
    body = lines.slice(blankIdx + 1).join("\n").trim();
  }

  // Detect BREAKING CHANGE footer: a line starting with "BREAKING CHANGE: "
  // in the body (after the blank separator). Per the conventional commits spec,
  // this line may appear anywhere in the footer block.
  let breakingDescription: string | null = null;
  const BREAKING_FOOTER_RE = /^BREAKING CHANGE:\s+(.+)$/m;
  const footerMatch = BREAKING_FOOTER_RE.exec(body);
  if (footerMatch) {
    breakingDescription = footerMatch[1].trim();
  }

  const isBreaking = bang === "!" || breakingDescription !== null;

  return {
    sha,
    type,
    scope: scope ?? null,
    breaking: isBreaking,
    breakingDescription,
    subject: subject.trim(),
    body,
  };
}

/**
 * Parse a multi-line git log output (one commit per line, `git log --oneline`
 * style). Non-conventional lines are silently skipped.
 */
export function parseLog(log: string): ConventionalCommit[] {
  if (!log.trim()) return [];

  const results: ConventionalCommit[] = [];
  for (const line of log.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const commit = parseCommit(trimmed);
    if (commit) results.push(commit);
  }
  return results;
}
