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

  .filter-bar {
    margin-bottom: 2rem;
  }

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .filter-row:last-child {
    margin-bottom: 0;
  }

  .filter-label {
    color: ${COLORS.textMuted};
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 0.25rem;
  }

  .filter-btn {
    background-color: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    color: ${COLORS.text};
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 500;
    padding: 0.3rem 0.75rem;
    border-radius: 2rem;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
  }

  .filter-btn:hover {
    border-color: ${COLORS.accent};
    color: ${COLORS.accent};
  }

  .filter-btn.is-active {
    background-color: ${COLORS.accent};
    border-color: ${COLORS.accent};
    color: ${COLORS.bg};
  }

  .commit-item.is-hidden,
  .section.is-hidden {
    display: none;
  }

  .section--authors .author-group {
    margin-bottom: 1.25rem;
  }

  .section--authors .author-group:last-child {
    margin-bottom: 0;
  }

  .author-name {
    color: ${COLORS.accent};
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
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
  // data-scope lets the client-side scope filter target individual items.
  const scopeAttr = scope ? ` data-scope="${scope}"` : "";

  return [
    `      <li class="commit-item"${scopeAttr}>`,
    `        <span class="commit-bullet">•</span>`,
    scope ? `        <span class="commit-scope">(${scope}):</span>` : "",
    `        <span class="commit-subject">${subject}</span>`,
    `        <span class="commit-sha">${sha}</span>`,
    `      </li>`,
  ].filter(Boolean).join("\n");
}

/**
 * Render the optional "By Author" section: all commits grouped by contributor.
 * Each author becomes a sub-group; each commit renders as "<type>: <subject>"
 * with its short sha. Returns "" when there are no author groups.
 */
function renderByAuthorSection(
  authors: ChangelogJsonOutput["authors"],
): string {
  if (!authors || authors.length === 0) return "";

  const groups = authors
    .map((group) => {
      const name = escapeHtml(group.author);
      const items = group.commits
        .map((c) => {
          const sha = escapeHtml(c.sha);
          const subject = escapeHtml(c.subject);
          const typePrefix = c.type ? `${escapeHtml(c.type)}: ` : "";
          return [
            `        <li class="commit-item">`,
            `          <span class="commit-bullet">•</span>`,
            `          <span class="commit-subject">${typePrefix}${subject}</span>`,
            `          <span class="commit-sha">${sha}</span>`,
            `        </li>`,
          ].join("\n");
        })
        .join("\n");
      return [
        `      <div class="author-group">`,
        `        <h3 class="author-name">${name}</h3>`,
        `        <ul class="commit-list">`,
        items,
        `        </ul>`,
        `      </div>`,
      ].join("\n");
    })
    .join("\n");

  return `
    <section class="section section--authors" data-type="authors">
      <h2 class="section-header">By Author</h2>
${groups}
    </section>`;
}

/**
 * Build the client-side filter bar (type + optional scope) and the vanilla JS
 * that wires it up. Returns empty strings when there's nothing to filter.
 *
 * Type buttons are derived from the sections present (plus a "Breaking Changes"
 * button when breaking commits exist, and an "All" reset). Scope buttons are
 * derived from the distinct scopes across all commits, and the scope row is
 * omitted entirely when no commit carries a scope.
 */
function buildFilterBar(
  changelog: ChangelogJsonOutput,
  hasBreaking: boolean,
): { bar: string; script: string } {
  const hasContent = changelog.sections.some((s) => s.commits.length > 0);
  if (!hasContent) return { bar: "", script: "" };

  // ── type buttons ──────────────────────────────────────────────────────────
  // Breaking is rendered first so its label "Breaking Changes" precedes the
  // regular type labels — keeping the breaking-before-features ordering intact.
  const typeButtons: string[] = [
    `        <button type="button" class="filter-btn is-active" data-filter-type="all">All</button>`,
  ];
  if (hasBreaking) {
    typeButtons.push(
      `        <button type="button" class="filter-btn" data-filter-type="breaking">Breaking Changes</button>`,
    );
  }
  for (const section of changelog.sections) {
    if (section.commits.length === 0) continue;
    typeButtons.push(
      `        <button type="button" class="filter-btn" data-filter-type="${escapeHtml(
        section.type,
      )}">${escapeHtml(section.label)}</button>`,
    );
  }

  // ── scope buttons ─────────────────────────────────────────────────────────
  const scopes: string[] = [];
  const seen = new Set<string>();
  for (const section of changelog.sections) {
    for (const commit of section.commits) {
      if (commit.scope && !seen.has(commit.scope)) {
        seen.add(commit.scope);
        scopes.push(commit.scope);
      }
    }
  }

  let scopeRow = "";
  if (scopes.length > 0) {
    const scopeButtons = [
      `        <span class="filter-label">Scope</span>`,
      `        <button type="button" class="filter-btn is-active" data-filter-scope="all">All scopes</button>`,
      ...scopes.map(
        (s) =>
          `        <button type="button" class="filter-btn" data-filter-scope="${escapeHtml(
            s,
          )}">${escapeHtml(s)}</button>`,
      ),
    ];
    scopeRow = `
      <div class="filter-row">
${scopeButtons.join("\n")}
      </div>`;
  }

  const bar = `
    <nav class="filter-bar" aria-label="Changelog filters">
      <div class="filter-row">
        <span class="filter-label">Type</span>
${typeButtons.join("\n")}
      </div>${scopeRow}
    </nav>`;

  // ── embedded vanilla JS ─────────────────────────────────────────────────────
  // No external dependencies, no network calls — pure DOM manipulation.
  // Two independent filters (type + scope) combine: a section is shown only if
  // its type matches the active type AND it contains at least one visible commit
  // under the active scope.
  const script = `
  <script>
    (function () {
      var typeFilter = "all";
      var scopeFilter = "all";
      var sections = Array.prototype.slice.call(document.querySelectorAll(".section"));

      function apply() {
        sections.forEach(function (section) {
          var sectionType = section.getAttribute("data-type");
          var typeMatch = typeFilter === "all" || sectionType === typeFilter;

          var items = Array.prototype.slice.call(section.querySelectorAll(".commit-item"));
          var visibleCount = 0;
          items.forEach(function (item) {
            var itemScope = item.getAttribute("data-scope");
            var scopeMatch = scopeFilter === "all" || itemScope === scopeFilter;
            if (scopeMatch) {
              item.classList.remove("is-hidden");
              visibleCount++;
            } else {
              item.classList.add("is-hidden");
            }
          });

          if (typeMatch && visibleCount > 0) {
            section.classList.remove("is-hidden");
          } else {
            section.classList.add("is-hidden");
          }
        });
      }

      function wire(attr, setter) {
        var buttons = Array.prototype.slice.call(document.querySelectorAll("[" + attr + "]"));
        buttons.forEach(function (btn) {
          btn.addEventListener("click", function () {
            setter(btn.getAttribute(attr));
            buttons.forEach(function (b) { b.classList.remove("is-active"); });
            btn.classList.add("is-active");
            apply();
          });
        });
      }

      wire("data-filter-type", function (v) { typeFilter = v; });
${scopes.length > 0 ? `      wire("data-filter-scope", function (v) { scopeFilter = v; });\n` : ""}      apply();
    })();
  </script>`;

  return { bar, script };
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
    <section class="section section--breaking" data-type="breaking">
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
    <section class="section" data-type="${escapeHtml(section.type)}">
      <h2 class="section-header">${escapeHtml(section.label)}</h2>
      <ul class="commit-list">
${items}
      </ul>
    </section>`;
    })
    .join("\n");

  // Optional By Author section (rendered after the type-based sections).
  const byAuthorSection = renderByAuthorSection(changelog.authors);

  // Empty state
  const hasContent = changelog.sections.some((s) => s.commits.length > 0);
  const emptyState = !hasContent
    ? `    <p class="empty-state">No entries in this changelog.</p>`
    : "";

  const pageTitle = config.projectName
    ? `${escapeHtml(projectName)} — Changelog`
    : "Changelog";

  // Client-side filter bar (type + optional scope) and the JS that drives it.
  const { bar: filterBar, script: filterScript } = buildFilterBar(
    changelog,
    breakingCommits.length > 0,
  );

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
${filterBar}
${breakingSection}
${regularSections}
${byAuthorSection}
${emptyState}
    </main>
    <footer>
      Generated by <strong>changeloom</strong>
    </footer>
  </div>
${filterScript}
</body>
</html>`;
}
