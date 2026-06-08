// src/html-filter.test.ts — TDD for interactive client-side filter buttons in --publish HTML output
//
// These tests exercise the interactive filter bar added on top of the static
// changelog HTML: type buttons (feat, fix, chore, ...), an "All" button, an
// optional scope filter, and the embedded vanilla JS that wires them up.
// Everything must stay self-contained (no CDN / external URLs / <script src>).

import { describe, test, expect } from "bun:test";
import { buildChangelogHtml } from "./html";
import type { ChangelogJsonOutput } from "./json-formatter";

function makeChangelog(overrides: Partial<ChangelogJsonOutput> = {}): ChangelogJsonOutput {
  return {
    version: "unreleased",
    sections: [],
    ...overrides,
  };
}

const multiTypeChangelog = makeChangelog({
  version: "1.0.0",
  sections: [
    {
      type: "feat",
      label: "Features",
      commits: [
        { sha: "abc1234", subject: "add login page", scope: "auth" },
        { sha: "abc5678", subject: "add dashboard", scope: "ui" },
      ],
    },
    {
      type: "fix",
      label: "Bug Fixes",
      commits: [{ sha: "def1234", subject: "resolve crash", scope: "auth" }],
    },
    {
      type: "chore",
      label: "Chores",
      commits: [{ sha: "fed4321", subject: "bump deps", scope: null }],
    },
  ],
});

// ── filter bar presence ───────────────────────────────────────────────────────

describe("interactive filter bar — presence", () => {
  test("renders a filter bar element when content exists", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain('class="filter-bar"');
  });

  test("does NOT render a filter bar when the changelog is empty", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    expect(html).not.toContain('class="filter-bar"');
  });

  test("renders an 'All' button to reset the filter", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toMatch(/data-filter-type="all"/);
  });
});

// ── one type button per present type ──────────────────────────────────────────

describe("interactive filter bar — type buttons", () => {
  test("renders a button for each type present in the data", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain('data-filter-type="feat"');
    expect(html).toContain('data-filter-type="fix"');
    expect(html).toContain('data-filter-type="chore"');
  });

  test("does NOT render a type button for a type absent from the data", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    // 'perf' is a known type but has no commits here
    expect(html).not.toContain('data-filter-type="perf"');
  });

  test("type buttons show the human-readable section label", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    // The Features label text should appear inside a filter button context
    expect(html).toMatch(/data-filter-type="feat"[^>]*>\s*Features/);
  });
});

// ── sections carry data-type so JS can target them ────────────────────────────

describe("interactive filter bar — sections are filterable", () => {
  test("each rendered section carries a data-type attribute matching its type", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain('data-type="feat"');
    expect(html).toContain('data-type="fix"');
    expect(html).toContain('data-type="chore"');
  });
});

// ── breaking changes filterable ───────────────────────────────────────────────

describe("interactive filter bar — breaking changes", () => {
  const withBreaking = makeChangelog({
    version: "2.0.0",
    sections: [
      {
        type: "feat",
        label: "Features",
        commits: [
          { sha: "bbb2222", subject: "new API design", scope: null, breaking: true },
          { sha: "ccc3333", subject: "normal feature", scope: null },
        ],
      },
    ],
  });

  test("renders a breaking filter button when breaking commits exist", () => {
    const html = buildChangelogHtml(withBreaking, {});
    expect(html).toContain('data-filter-type="breaking"');
  });

  test("breaking section carries data-type=\"breaking\"", () => {
    const html = buildChangelogHtml(withBreaking, {});
    expect(html).toContain('data-type="breaking"');
  });
});

// ── scope filter ──────────────────────────────────────────────────────────────

describe("interactive filter bar — scope filter", () => {
  test("renders scope buttons for each distinct scope present", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain('data-filter-scope="auth"');
    expect(html).toContain('data-filter-scope="ui"');
  });

  test("renders an 'All scopes' reset button when scopes exist", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toMatch(/data-filter-scope="all"/);
  });

  test("does NOT render a scope filter when no commit has a scope", () => {
    const noScope = makeChangelog({
      sections: [
        {
          type: "feat",
          label: "Features",
          commits: [{ sha: "aaa0001", subject: "add thing", scope: null }],
        },
      ],
    });
    const html = buildChangelogHtml(noScope, {});
    expect(html).not.toContain("data-filter-scope");
  });

  test("commit items carry a data-scope attribute so JS can target them", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain('data-scope="auth"');
    expect(html).toContain('data-scope="ui"');
  });
});

// ── embedded JS wiring ────────────────────────────────────────────────────────

describe("interactive filter bar — embedded vanilla JS", () => {
  test("includes an inline <script> block (no src attribute)", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain("<script>");
    expect(html).not.toContain("<script src=");
  });

  test("the JS references data-filter-type for type filtering logic", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain("data-filter-type");
  });

  test("the JS attaches click handlers (addEventListener)", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain("addEventListener");
  });

  test("stays self-contained — no external http/https URLs even with the script", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).not.toMatch(/https?:\/\//);
  });
});
