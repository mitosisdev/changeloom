// src/author-breakdown.test.ts — TDD for generateByAuthor
import { test, expect, describe } from "bun:test";
import { generateByAuthor } from "./author-breakdown";
import type { ConventionalCommit } from "./parser";

function commit(
  type: string,
  subject: string,
  sha = "abc1234",
  author?: string,
): ConventionalCommit {
  return { sha, type, scope: null, breaking: false, breakingDescription: null, subject, body: "", author };
}

describe("generateByAuthor", () => {
  test("returns empty string for empty commits array", () => {
    expect(generateByAuthor([])).toBe("");
  });

  test("renders ## By Author section header", () => {
    const out = generateByAuthor([commit("feat", "add login", "abc1234", "Alice <alice@example.com>")]);
    expect(out).toContain("## By Author");
  });

  test("renders author as ### subsection", () => {
    const out = generateByAuthor([commit("feat", "add login", "abc1234", "Alice <alice@example.com>")]);
    expect(out).toContain("### Alice <alice@example.com>");
  });

  test("renders commit as bullet with subject and short sha", () => {
    const out = generateByAuthor([commit("feat", "add login", "abc1234", "Alice <alice@example.com>")]);
    expect(out).toMatch(/^- feat: add login \(abc1234\)$/m);
  });

  test("groups multiple commits by the same author under one subsection", () => {
    const commits = [
      commit("feat", "add login", "abc1234", "Alice <alice@example.com>"),
      commit("fix", "typo", "def5678", "Alice <alice@example.com>"),
    ];
    const out = generateByAuthor(commits);
    const aliceIdx = out.indexOf("### Alice <alice@example.com>");
    expect(aliceIdx).toBeGreaterThanOrEqual(0);
    // Alice section should appear only once
    expect(out.indexOf("### Alice", aliceIdx + 1)).toBe(-1);
    expect(out).toMatch(/^- feat: add login \(abc1234\)$/m);
    expect(out).toMatch(/^- fix: typo \(def5678\)$/m);
  });

  test("sorts authors alphabetically", () => {
    const commits = [
      commit("feat", "add login", "abc1234", "Zara <zara@example.com>"),
      commit("docs", "update readme", "ghi9012", "Bob <bob@example.com>"),
      commit("fix", "typo", "def5678", "Alice <alice@example.com>"),
    ];
    const out = generateByAuthor(commits);
    const aliceIdx = out.indexOf("### Alice");
    const bobIdx = out.indexOf("### Bob");
    const zaraIdx = out.indexOf("### Zara");
    expect(aliceIdx).toBeLessThan(bobIdx);
    expect(bobIdx).toBeLessThan(zaraIdx);
  });

  test("separates multiple author sections with a blank line", () => {
    const commits = [
      commit("feat", "add login", "abc1234", "Alice <alice@example.com>"),
      commit("docs", "update readme", "ghi9012", "Bob <bob@example.com>"),
    ];
    const out = generateByAuthor(commits);
    // Should have two ### sections
    expect(out).toContain("### Alice <alice@example.com>");
    expect(out).toContain("### Bob <bob@example.com>");
    // Sections separated by blank line
    expect(out).toContain("\n\n###");
  });

  test("falls back to 'Unknown' for commits with no author", () => {
    const out = generateByAuthor([commit("feat", "add login", "abc1234")]);
    expect(out).toContain("### Unknown");
  });

  test("uses only first 7 chars of sha in bullet", () => {
    const fullSha = "abcdef1234567890abcdef1234567890abcdef12";
    const out = generateByAuthor([commit("fix", "trim sha", fullSha, "Alice <alice@example.com>")]);
    expect(out).toMatch(/^- fix: trim sha \(abcdef1\)$/m);
  });
});
