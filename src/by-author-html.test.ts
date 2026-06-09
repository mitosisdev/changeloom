// src/by-author-html.test.ts — TDD for --by-author in HTML (--publish) output
//
// The markdown path is covered by author-breakdown.test.ts. These tests cover
// the HTML rendering path: when --by-author is requested alongside --publish,
// the generated HTML must include a "By Author" section grouping all commits
// by contributor, after the type-based sections.

import { describe, test, expect } from "bun:test";
import { buildChangelogHtml } from "./html";
import { generateChangelogJson } from "./json-formatter";
import type { ConventionalCommit } from "./parser";

function commit(
  type: string,
  subject: string,
  sha = "abc1234",
  author?: string,
): ConventionalCommit {
  return { sha, type, scope: null, breaking: false, breakingDescription: null, subject, body: "", author };
}

// ── json-formatter: authors breakdown ─────────────────────────────────────────

describe("generateChangelogJson — byAuthor option", () => {
  test("does NOT include an authors breakdown by default", () => {
    const json = generateChangelogJson([
      commit("feat", "add widget", "abc1234", "Alice <alice@example.com>"),
    ]);
    expect(json.authors).toBeUndefined();
  });

  test("includes an authors breakdown when byAuthor is true", () => {
    const json = generateChangelogJson(
      [commit("feat", "add widget", "abc1234", "Alice <alice@example.com>")],
      { byAuthor: true },
    );
    expect(json.authors).toBeDefined();
    expect(json.authors!.length).toBe(1);
    expect(json.authors![0].author).toBe("Alice <alice@example.com>");
    expect(json.authors![0].commits.length).toBe(1);
  });

  test("groups multiple commits by the same author", () => {
    const json = generateChangelogJson(
      [
        commit("feat", "add login", "abc1234", "Alice <alice@example.com>"),
        commit("fix", "typo", "def5678", "Alice <alice@example.com>"),
      ],
      { byAuthor: true },
    );
    expect(json.authors!.length).toBe(1);
    expect(json.authors![0].commits.length).toBe(2);
  });

  test("sorts authors alphabetically", () => {
    const json = generateChangelogJson(
      [
        commit("feat", "z", "abc1234", "Zara <zara@example.com>"),
        commit("fix", "a", "def5678", "Alice <alice@example.com>"),
        commit("docs", "b", "ghi9012", "Bob <bob@example.com>"),
      ],
      { byAuthor: true },
    );
    expect(json.authors!.map((a) => a.author)).toEqual([
      "Alice <alice@example.com>",
      "Bob <bob@example.com>",
      "Zara <zara@example.com>",
    ]);
  });

  test("falls back to 'Unknown' for commits with no author", () => {
    const json = generateChangelogJson([commit("feat", "x", "abc1234")], {
      byAuthor: true,
    });
    expect(json.authors![0].author).toBe("Unknown");
  });
});

// ── HTML rendering ─────────────────────────────────────────────────────────────

describe("buildChangelogHtml — By Author section", () => {
  test("does NOT render a By Author section when authors is absent", () => {
    const json = generateChangelogJson([
      commit("feat", "add widget", "abc1234", "Alice <alice@example.com>"),
    ]);
    const html = buildChangelogHtml(json, {});
    expect(html).not.toContain("By Author");
  });

  test("renders a By Author section when authors is present", () => {
    const json = generateChangelogJson(
      [commit("feat", "add widget", "abc1234", "Alice <alice@example.com>")],
      { byAuthor: true },
    );
    const html = buildChangelogHtml(json, {});
    expect(html).toContain("By Author");
  });

  test("renders each author as a sub-section heading", () => {
    const json = generateChangelogJson(
      [
        commit("feat", "add login", "abc1234", "Alice <alice@example.com>"),
        commit("chore", "update deps", "def5678", "Bob <bob@example.com>"),
      ],
      { byAuthor: true },
    );
    const html = buildChangelogHtml(json, {});
    expect(html).toContain("Alice &lt;alice@example.com&gt;");
    expect(html).toContain("Bob &lt;bob@example.com&gt;");
  });

  test("renders each author's commit subjects under their section", () => {
    const json = generateChangelogJson(
      [
        commit("feat", "add login", "abc1234", "Alice <alice@example.com>"),
        commit("chore", "update deps", "def5678", "Bob <bob@example.com>"),
      ],
      { byAuthor: true },
    );
    const html = buildChangelogHtml(json, {});
    expect(html).toContain("add login");
    expect(html).toContain("update deps");
  });

  test("escapes HTML in author names", () => {
    const json = generateChangelogJson(
      [commit("feat", "x", "abc1234", "<script>alert(1)</script>")],
      { byAuthor: true },
    );
    const html = buildChangelogHtml(json, {});
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("By Author section appears AFTER the type-based sections", () => {
    const json = generateChangelogJson(
      [commit("feat", "add widget", "abc1234", "Alice <alice@example.com>")],
      { byAuthor: true },
    );
    const html = buildChangelogHtml(json, {});
    const featuresIdx = html.indexOf("Features");
    const byAuthorIdx = html.indexOf("By Author");
    expect(featuresIdx).toBeGreaterThanOrEqual(0);
    expect(byAuthorIdx).toBeGreaterThan(featuresIdx);
  });
});
