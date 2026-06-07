// src/publisher.ts — HTML changelog generator for changeloom
//
// Generates a self-contained, dark-styled changelog.html from ConventionalCommit[].
// No external dependencies — all CSS is inlined.

import type { ConventionalCommit } from "./parser";

export interface PublishOptions {
  /** Release version string (e.g. "1.2.3") */
  version?: string;
  /** ISO date string (e.g. "2026-06-07") */
  date?: string;
  /** Page title (defaults to "Changelog") */
  title?: string;
}

// Ordered list of known types with display names and header colors.
const TYPE_ORDER: Array<[string, string, string]> = [
  ["feat", "Features", "#4ade80"],          // green
  ["fix", "Bug Fixes", "#f87171"],           // red
  ["docs", "Documentation", "#60a5fa"],      // blue
  ["refactor", "Refactoring", "#c084fc"],    // purple
  ["perf", "Performance", "#fb923c"],        // orange
  ["test", "Tests", "#facc15"],              // yellow
  ["chore", "Chores", "#94a3b8"],            // slate
];

const KNOWN_TYPES = new Set(TYPE_ORDER.map(([t]) => t));

const BREAKING_COLOR = "#f43f5e"; // rose

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSection(label: string, color: string, commits: ConventionalCommit[]): string {
  const items = commits.map((c) => {
    const shortSha = c.sha.slice(0, 7);
    const scope = c.scope ? `<span class="scope">(${escapeHtml(c.scope)})</span> ` : "";
    return `      <li><span class="sha">${escapeHtml(shortSha)}</span> ${scope}${escapeHtml(c.subject)}</li>`;
  }).join("\n");

  return `    <section class="section">
      <h2 class="section-title" style="color: ${color};">${escapeHtml(label)}</h2>
      <ul>
${items}
      </ul>
    </section>`;
}

/**
 * Generate a self-contained HTML changelog page from parsed conventional commits.
 *
 * @param commits - Parsed commits from parseLog() or parseCommit()
 * @param opts - Optional: version, date, title for the page header
 * @returns Full HTML string with inline CSS, no external dependencies
 */
export function generateChangelogHtml(commits: ConventionalCommit[], opts: PublishOptions = {}): string {
  const title = opts.title ?? "Changelog";

  // Build header section
  let headerHtml = `    <h1 class="title">${escapeHtml(title)}</h1>`;
  if (opts.version || opts.date) {
    const versionText = opts.version ? `v${escapeHtml(opts.version)}` : "";
    const dateText = opts.date ? escapeHtml(opts.date) : "";
    const meta = [versionText, dateText].filter(Boolean).join(" &mdash; ");
    headerHtml += `\n    <div class="meta">${meta}</div>`;
  }

  // Group commits
  const breaking: ConventionalCommit[] = [];
  const groups = new Map<string, ConventionalCommit[]>();

  for (const c of commits) {
    if (c.breaking) breaking.push(c);
    const key = c.type;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  // Build content sections
  const sections: string[] = [];

  // Breaking changes first
  if (breaking.length > 0) {
    sections.push(renderSection("Breaking Changes", BREAKING_COLOR, breaking));
  }

  // Known types in order
  for (const [type, label, color] of TYPE_ORDER) {
    const group = groups.get(type);
    if (!group || group.length === 0) continue;
    sections.push(renderSection(label, color, group));
  }

  // Unknown types → Other
  const otherCommits: ConventionalCommit[] = [];
  for (const [type, group] of groups) {
    if (!KNOWN_TYPES.has(type)) {
      otherCommits.push(...group);
    }
  }
  if (otherCommits.length > 0) {
    sections.push(renderSection("Other", "#94a3b8", otherCommits));
  }

  const contentHtml = sections.length > 0
    ? sections.join("\n")
    : `    <p class="empty">No entries found.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0f1117;
      color: #e6e6e6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #2a2d3a;
    }

    .title {
      font-family: "Courier New", Courier, monospace;
      font-size: 24px;
      font-weight: bold;
      color: #e6e6e6;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .meta {
      font-size: 14px;
      color: #6b7280;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 0.75rem;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid #2a2d3a;
    }

    ul {
      list-style: none;
      padding: 0;
    }

    li {
      padding: 0.35rem 0;
      font-size: 15px;
      color: #e6e6e6;
      border-bottom: 1px solid #1a1d26;
    }

    li:last-child {
      border-bottom: none;
    }

    .sha {
      font-family: "Courier New", Courier, monospace;
      font-size: 12px;
      color: #4b5563;
      background: #1a1d26;
      padding: 1px 5px;
      border-radius: 3px;
      margin-right: 6px;
    }

    .scope {
      color: #6b7280;
      font-size: 13px;
    }

    .empty {
      color: #4b5563;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
${headerHtml}
    </div>
${contentHtml}
  </div>
</body>
</html>`;
}
