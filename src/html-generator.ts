// src/html-generator.ts — HTML changelog generator for changeloom
//
// Generates a self-contained, dark-styled changelog.html from parsed commits.
// No external dependencies — all CSS is inlined.

import type { ConventionalCommit } from "./parser";

// Ordered list of known types with their display names (mirrors generator.ts)
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEntry(c: ConventionalCommit): string {
  const shortSha = c.sha.slice(0, 7);
  const scopeBadge = c.scope
    ? `<span class="scope">${escapeHtml(c.scope)}</span>`
    : "";
  const breakingBadge = c.breaking ? `<span class="breaking">BREAKING</span>` : "";
  return `
      <li class="entry">
        ${scopeBadge}${breakingBadge}
        <span class="subject">${escapeHtml(c.subject)}</span>
        <span class="sha">${escapeHtml(shortSha)}</span>
      </li>`;
}

function renderSection(label: string, commits: ConventionalCommit[]): string {
  const items = commits.map(renderEntry).join("");
  return `
    <section class="type-section">
      <h2 class="type-header">${escapeHtml(label)}</h2>
      <ul class="entries">${items}
      </ul>
    </section>`;
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0b0d10;
    color: #e2e8f0;
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
    border-bottom: 2px solid #8A2BE2;
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }

  header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.02em;
  }

  header .subtitle {
    color: #94a3b8;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .type-section {
    margin-bottom: 2rem;
  }

  .type-header {
    font-size: 1.1rem;
    font-weight: 600;
    color: #8A2BE2;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-left: 3px solid #8A2BE2;
    padding-left: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .entries {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .entry {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    background: #13161c;
    border: 1px solid #1e2330;
    flex-wrap: wrap;
  }

  .entry:hover {
    border-color: #8A2BE2;
  }

  .scope {
    display: inline-block;
    background: #1e1040;
    color: #a78bfa;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    border: 1px solid #3b2080;
    flex-shrink: 0;
  }

  .breaking {
    display: inline-block;
    background: #3b0d0d;
    color: #f87171;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    border: 1px solid #7f1d1d;
    flex-shrink: 0;
  }

  .subject {
    flex: 1;
    color: #e2e8f0;
    min-width: 0;
  }

  .sha {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 0.75rem;
    color: #64748b;
    flex-shrink: 0;
  }

  .empty {
    color: #64748b;
    font-style: italic;
    text-align: center;
    padding: 3rem 0;
  }

  footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid #1e2330;
    color: #475569;
    font-size: 0.8rem;
    text-align: center;
  }

  footer a {
    color: #8A2BE2;
    text-decoration: none;
  }
`;

/**
 * Generate a self-contained HTML changelog from parsed conventional commits.
 *
 * @param entries - Parsed commits from parseLog() or parseCommit()
 * @returns Full HTML string — can be written directly to a .html file
 */
export function generateHtml(entries: ConventionalCommit[]): string {
  const now = new Date().toISOString().slice(0, 10);

  let bodyContent: string;

  if (entries.length === 0) {
    bodyContent = `<p class="empty">No conventional commits found.</p>`;
  } else {
    // Group commits by type
    const groups = new Map<string, ConventionalCommit[]>();
    for (const commit of entries) {
      const key = commit.type;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(commit);
    }

    const sections: string[] = [];

    // Known types in canonical order
    for (const [type, label] of TYPE_ORDER) {
      const group = groups.get(type);
      if (!group || group.length === 0) continue;
      sections.push(renderSection(label, group));
    }

    // Unknown types → Other
    const otherCommits: ConventionalCommit[] = [];
    for (const [type, group] of groups) {
      if (!KNOWN_TYPES.has(type)) {
        otherCommits.push(...group);
      }
    }
    if (otherCommits.length > 0) {
      sections.push(renderSection("Other", otherCommits));
    }

    bodyContent = sections.join("\n");
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Changelog</title>
  <style>${CSS}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Changelog</h1>
      <p class="subtitle">Generated by <strong>changeloom</strong> on ${escapeHtml(now)}</p>
    </header>
    <main>
${bodyContent}
    </main>
    <footer>
      Generated by <a href="https://github.com/mitosisdev/changeloom">changeloom</a>
    </footer>
  </div>
</body>
</html>`;
}
