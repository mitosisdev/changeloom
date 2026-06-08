// src/html.ts — dark-themed self-contained HTML changelog generator for changeloom
//
// Takes a ChangelogJsonOutput (from json-formatter.ts) and renders a complete,
// self-contained HTML file. No external CSS/JS dependencies — everything inline.

import type { ChangelogJsonOutput, ChangelogJsonCommit } from "./json-formatter";

export interface HtmlConfig {
  /** Project name shown in the page header. Defaults to "Changelog". */
  projectName?: string;
}

// Dark GitHub-style theme colors
const COLORS = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "#30363d",
  text: "#c9d1d9",
  textMuted: "#8b949e",
  accent: "#58a6ff",
  sectionHeader: "#f0f6fc",
  breaking: "#f85149",
  breakingBg: "#1f0d0d",
  scope: "#3fb950",
} as const;

const INLINE_STYLES = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: ${COLORS.bg};
    color: ${COLORS.text};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    padding: 2rem 1rem;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
  }

  header {
    border-bottom: 1px solid ${COLORS.border};
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }

  h1 {
    color: ${COLORS.sectionHeader};
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .version-badge {
    display: inline-block;
    background-color: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    color: ${COLORS.accent};
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    margin-top: 0.5rem;
  }

  .section {
    margin-bottom: 2rem;
  }

  .section-header {
    color: ${COLORS.sectionHeader};
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid ${COLORS.border};
  }

  .section--breaking .section-header {
    color: ${COLORS.breaking};
    border-bottom-color: ${COLORS.breaking};
  }

  .section--breaking {
    background-color: ${COLORS.breakingBg};
    border: 1px solid ${COLORS.breaking};
    border-radius: 6px;
    padding: 1rem 1.25rem;
    margin-bottom: 2rem;
  }

  .commit-list {
    list-style: none;
    padding: 0;
  }

  .commit-item {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid ${COLORS.border};
    flex-wrap: wrap;
  }

  .commit-item:last-child {
    border-bottom: none;
  }

  .commit-bullet {
    color: ${COLORS.accent};
    flex-shrink: 0;
  }

  .commit-scope {
    color: ${COLORS.scope};
    font-size: 0.85rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .commit-subject {
    color: ${COLORS.text};
    flex: 1;
    min-width: 0;
  }

  .commit-sha {
    color: ${COLORS.textMuted};
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  .empty-state {
    color: ${COLORS.textMuted};
    font-style: italic;
    padding: 2rem 0;
    text-align: center;
  }

  footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid ${COLORS.border};
    color: ${COLORS.textMuted};
    font-size: 0.8rem;
    text-align: center;
  }
`.trim();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderCommitItem(commit: ChangelogJsonCommit & { breaking?: boolean }): string {
  const sha = escapeHtml(commit.sha);
  const subject = escapeHtml(commit.subject);
  const scope = commit.scope ? escapeHtml(commit.scope) : null;

  return [
    `      <li class="commit-item">`,
    `        <span class="commit-bullet">•</span>`,
    scope ? `        <span class="commit-scope">(${scope}):</span>` : "",
    `        <span class="commit-subject">${subject}</span>`,
    `        <span class="commit-sha">${sha}</span>`,
    `      </li>`,
  ].filter(Boolean).join("\n");
}

/**
 * Build a self-contained dark-themed HTML changelog from a ChangelogJsonOutput.
 *
 * @param changelog - Structured changelog data from generateChangelogJson()
 * @param config    - Optional config: projectName
 * @returns Complete HTML string — no external dependencies
 */
export function buildChangelogHtml(
  changelog: ChangelogJsonOutput,
  config: HtmlConfig,
): string {
  const projectName = config.projectName ?? "Changelog";
  const versionDisplay =
    changelog.version === "unreleased" ? "Unreleased" : changelog.version;

  // Collect all breaking commits across all sections
  const breakingCommits: (ChangelogJsonCommit & { breaking?: boolean })[] = [];
  for (const section of changelog.sections) {
    for (const commit of section.commits) {
      const c = commit as ChangelogJsonCommit & { breaking?: boolean };
      if (c.breaking) {
        breakingCommits.push(c);
      }
    }
  }

  // Build breaking changes section HTML (hoisted to top)
  let breakingSection = "";
  if (breakingCommits.length > 0) {
    const items = breakingCommits.map(renderCommitItem).join("\n");
    breakingSection = `
    <section class="section section--breaking">
      <h2 class="section-header">Breaking Changes</h2>
      <ul class="commit-list">
${items}
      </ul>
    </section>`;
  }

  // Build regular sections HTML
  const regularSections = changelog.sections
    .map((section) => {
      const items = section.commits.map(renderCommitItem).join("\n");
      return `
    <section class="section">
      <h2 class="section-header">${escapeHtml(section.label)}</h2>
      <ul class="commit-list">
${items}
      </ul>
    </section>`;
    })
    .join("\n");

  // Empty state
  const hasContent = changelog.sections.some((s) => s.commits.length > 0);
  const emptyState = !hasContent
    ? `    <p class="empty-state">No entries in this changelog.</p>`
    : "";

  const pageTitle = config.projectName
    ? `${escapeHtml(projectName)} — Changelog`
    : "Changelog";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
${INLINE_STYLES}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(projectName)}</h1>
      <span class="version-badge">${escapeHtml(versionDisplay)}</span>
    </header>
    <main>
${breakingSection}
${regularSections}
${emptyState}
    </main>
    <footer>
      Generated by <strong>changeloom</strong>
    </footer>
  </div>
</body>
</html>`;
}
