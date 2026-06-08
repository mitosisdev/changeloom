// src/author-breakdown.ts — generates a "## By Author" section for changeloom
//
// Groups commits by author name alphabetically and renders a markdown section.
// Only used when --by-author flag is passed; Markdown-only (no-op for JSON/HTML).

import type { ConventionalCommit } from "./parser";

/**
 * Generate a "## By Author" markdown section from an array of commits.
 *
 * - Commits without an `author` field are grouped under "Unknown".
 * - Authors are sorted alphabetically.
 * - Each commit appears as `- <type>: <subject> (<shortSha>)`.
 *
 * @param commits - Parsed commits (with optional `.author` field)
 * @returns Markdown string, or "" if commits is empty
 */
export function generateByAuthor(commits: ConventionalCommit[]): string {
  if (commits.length === 0) return "";

  // Group by author, preserving insertion order within each group
  const groups = new Map<string, ConventionalCommit[]>();
  for (const commit of commits) {
    const key = commit.author ?? "Unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(commit);
  }

  // Sort authors alphabetically (case-insensitive)
  const sortedAuthors = [...groups.keys()].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );

  // Render each author section
  const sections: string[] = [];
  for (const author of sortedAuthors) {
    const authorCommits = groups.get(author)!;
    const bullets = authorCommits
      .map((c) => `- ${c.type}: ${c.subject} (${c.sha.slice(0, 7)})`)
      .join("\n");
    sections.push(`### ${author}\n${bullets}`);
  }

  return "## By Author\n\n" + sections.join("\n\n");
}
