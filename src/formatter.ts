// src/formatter.ts — Markdown changelog formatter for ConventionalCommit[]

/**
 * A conventional commit. Compatible with the parser PR #1 ConventionalCommit shape.
 * If src/parser.ts is present and exports ConventionalCommit, this inline definition
 * is structurally compatible with it.
 */
export interface ConventionalCommit {
  type: string;
  scope?: string;
  breaking: boolean;
  subject: string;
}

/** Map from commit type → section heading. */
const TYPE_TO_SECTION: Record<string, string> = {
  feat: "Added",
  fix: "Fixed",
  refactor: "Changed",
  perf: "Changed",
  style: "Changed",
  deprecated: "Removed",
  security: "Security",
};

/** Canonical section display order (Breaking Changes always first). */
const SECTION_ORDER = ["Added", "Fixed", "Changed", "Removed", "Security", "Other"];

/**
 * Format an array of ConventionalCommits into a Markdown changelog string.
 *
 * @param commits   Array of parsed conventional commits.
 * @param version   Optional version string, e.g. "1.0.0".
 * @param date      Optional date string, e.g. "2026-06-03". Only used when version is provided.
 * @returns         Markdown string, or "" for empty input.
 */
export function formatChangelog(
  commits: ConventionalCommit[],
  version?: string,
  date?: string,
): string {
  if (commits.length === 0) return "";

  // Build header line
  let header: string;
  if (version) {
    header = date ? `## [${version}] — ${date}` : `## [${version}]`;
  } else {
    header = "## Unreleased";
  }

  // Separate breaking and non-breaking; group all by section
  const breaking: ConventionalCommit[] = [];
  const sections: Record<string, ConventionalCommit[]> = {};

  for (const commit of commits) {
    if (commit.breaking) {
      breaking.push(commit);
    }
    const section = TYPE_TO_SECTION[commit.type] ?? "Other";
    if (!sections[section]) sections[section] = [];
    sections[section].push(commit);
  }

  // Render a single commit as a Markdown list item
  const renderItem = (c: ConventionalCommit): string =>
    c.scope ? `- **${c.scope}:** ${c.subject}` : `- ${c.subject}`;

  const lines: string[] = [header, ""];

  // Breaking changes section (always at top if any)
  if (breaking.length > 0) {
    lines.push("### ⚠ Breaking Changes", "");
    for (const c of breaking) lines.push(renderItem(c));
    lines.push("");
  }

  // Remaining sections in canonical order
  for (const sectionName of SECTION_ORDER) {
    const items = sections[sectionName];
    if (!items || items.length === 0) continue;
    lines.push(`### ${sectionName}`, "");
    for (const c of items) lines.push(renderItem(c));
    lines.push("");
  }

  // Trim trailing blank line
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}
