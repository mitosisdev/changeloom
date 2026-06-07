// src/publisher.ts — HTML changelog publisher for changeloom
//
// Takes an array of ConventionalCommit objects and renders a beautiful,
// self-contained one-page changelog.html with dark styling.
// No external dependencies — all CSS is inlined.

import type { ConventionalCommit } from "./parser";

export interface PublishOptions {
  /** If provided, renders "v<version>" as the release title instead of "Unreleased" */
  version?: string;
}

// Ordered list of known types with their display names (mirrors generator.ts ordering).
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

/** Escape HTML special characters for safe insertion into HTML content. */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generate a self-contained HTML changelog page from an array of parsed
 * conventional commits.
 *
 * @param commits - Parsed commits from parseLog() or parseCommit()
 * @param options - Optional: version string for the release header
 * @returns Full HTML string, or "" if commits is empty
 */
export function generateHtml(
  commits: ConventionalCommit[],
  options: PublishOptions = {},
): string {
  if (commits.length === 0) return "";

  const versionLabel = options.version ? `v${options.version}` : "Unreleased";
  const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  // Group commits by type — preserve insertion order within each group
  const groups = new Map<string, ConventionalCommit[]>();
  for (const commit of commits) {
    const key = commit.type;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(commit);
  }

  /** Render a single commit as a styled card `<li>`. */
  function commitCard(c: ConventionalCommit): string {
    const shortSha = c.sha.slice(0, 7);
    const scopeTag = c.scope
      ? `<span class="scope">${esc(c.scope)}</span>`
      : "";
    const breakingBadge = c.breaking
      ? `<span class="breaking">BREAKING</span>`
      : "";
    return `
        <li class="commit-card">
          ${breakingBadge}${scopeTag}
          <span class="subject">${esc(c.subject)}</span>
          <code class="sha">${esc(shortSha)}</code>
        </li>`;
  }

  // Build HTML sections in canonical type order
  const sectionParts: string[] = [];

  for (const [type, label] of TYPE_ORDER) {
    const group = groups.get(type);
    if (!group || group.length === 0) continue;
    sectionParts.push(`
      <section class="type-section">
        <h2 class="type-heading">${esc(label)}</h2>
        <ul class="commit-list">
          ${group.map(commitCard).join("")}
        </ul>
      </section>`);
  }

  // Unknown types → "Other"
  const otherCommits: ConventionalCommit[] = [];
  for (const [type, group] of groups) {
    if (!KNOWN_TYPES.has(type)) {
      otherCommits.push(...group);
    }
  }
  if (otherCommits.length > 0) {
    sectionParts.push(`
      <section class="type-section">
        <h2 class="type-heading">Other</h2>
        <ul class="commit-list">
          ${otherCommits.map(commitCard).join("")}
        </ul>
      </section>`);
  }

  const sectionsHtml = sectionParts.join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Changelog — ${esc(versionLabel)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: #0b0d10;
      color: #c9d1d9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 780px;
      margin: 0 auto;
    }

    header {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid #21262d;
      padding-bottom: 1.5rem;
    }

    .version-badge {
      display: inline-block;
      background-color: #1f6feb;
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.2rem 0.65rem;
      border-radius: 2rem;
      letter-spacing: 0.03em;
      margin-bottom: 0.75rem;
    }

    h1.changelog-title {
      font-size: 2rem;
      font-weight: 700;
      color: #f0f6fc;
      letter-spacing: -0.02em;
    }

    .type-section {
      margin-bottom: 2rem;
    }

    h2.type-heading {
      font-size: 1.1rem;
      font-weight: 600;
      color: #58a6ff;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 0.75rem;
      border-left: 3px solid #1f6feb;
      padding-left: 0.6rem;
    }

    .commit-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .commit-card {
      background-color: #161b22;
      border: 1px solid #21262d;
      border-radius: 6px;
      padding: 0.65rem 0.9rem;
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .commit-card:hover {
      border-color: #388bfd;
    }

    .scope {
      background-color: #0d419d;
      color: #79c0ff;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.1rem 0.45rem;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .breaking {
      background-color: #6e1616;
      color: #ffa198;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.1rem 0.45rem;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      flex-shrink: 0;
    }

    .subject {
      color: #e6edf3;
      flex: 1;
      min-width: 0;
    }

    code.sha {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 0.78rem;
      color: #8b949e;
      background-color: #21262d;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      flex-shrink: 0;
      margin-left: auto;
    }

    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #21262d;
      font-size: 0.78rem;
      color: #6e7681;
      text-align: center;
    }

    footer a {
      color: #58a6ff;
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="version-badge">${esc(versionLabel)}</div>
      <h1 class="changelog-title">Changelog</h1>
    </header>

    <main>
      ${sectionsHtml}
    </main>

    <footer>
      Generated by <a href="https://github.com/mitosisdev/changeloom">changeloom</a>
      on ${esc(generatedAt)}
    </footer>
  </div>
</body>
</html>
`;
}
