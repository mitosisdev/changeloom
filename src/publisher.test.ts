// src/publisher.test.ts — TDD for --publish HTML generator
import { test, expect, describe } from "bun:test";
import { generateHtml } from "./publisher";
import type { ConventionalCommit } from "./parser";

function commit(
  type: string,
  subject: string,
  sha = "abc1234",
  scope: string | null = null,
  breaking = false,
): ConventionalCommit {
  return { sha, type, scope, breaking, subject, body: "" };
}

describe("generateHtml", () => {
  describe("valid HTML structure", () => {
    test("output starts with <!DOCTYPE html>", () => {
      const commits = [commit("feat", "add new feature")];
      const html = generateHtml(commits);
      expect(html.trim()).toMatch(/^<!DOCTYPE html>/i);
    });

    test("output contains <html> tag", () => {
      const commits = [commit("feat", "add new feature")];
      const html = generateHtml(commits);
      expect(html).toContain("<html");
    });

    test("output contains <body> tag", () => {
      const commits = [commit("feat", "add new feature")];
      const html = generateHtml(commits);
      expect(html).toContain("<body");
    });

    test("output contains closing </html>", () => {
      const commits = [commit("feat", "add new feature")];
      const html = generateHtml(commits);
      expect(html).toContain("</html>");
    });

    test("output contains <head> with <style> block", () => {
      const commits = [commit("feat", "add new feature")];
      const html = generateHtml(commits);
      expect(html).toContain("<head");
      expect(html).toContain("<style");
      expect(html).toContain("</style>");
    });

    test("is a single self-contained string with no external CSS or JS dependencies", () => {
      const commits = [commit("feat", "add feature"), commit("fix", "fix bug")];
      const html = generateHtml(commits);
      // No external stylesheet <link> tags
      expect(html).not.toMatch(/<link[^>]+href=["']https?:\/\//i);
      // No external <script src="..."> tags
      expect(html).not.toMatch(/<script[^>]+src=["']https?:\/\//i);
    });
  });

  describe("dark styling", () => {
    test("contains dark background color in <style> block", () => {
      const commits = [commit("feat", "add new feature")];
      const html = generateHtml(commits);
      // Should contain a dark hex color for background (e.g. #0b0d10, #0d1117, #111, etc.)
      expect(html).toMatch(/#[0-9a-fA-F]{3,6}/);
      // The style block must exist and contain background
      expect(html).toMatch(/background(-color)?:\s*#[0-9a-fA-F]{3,6}/);
    });

    test("inline CSS only — no <link rel=stylesheet>", () => {
      const commits = [commit("feat", "add feature")];
      const html = generateHtml(commits);
      expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet["']/i);
    });
  });

  describe("section headings by commit type", () => {
    test("contains 'Features' heading when feat commits present", () => {
      const commits = [commit("feat", "add animated export")];
      const html = generateHtml(commits);
      expect(html).toContain("Features");
    });

    test("contains 'Bug Fixes' heading when fix commits present", () => {
      const commits = [commit("fix", "patch null deref")];
      const html = generateHtml(commits);
      expect(html).toContain("Bug Fixes");
    });

    test("contains 'Chores' heading when chore commits present", () => {
      const commits = [commit("chore", "update deps")];
      const html = generateHtml(commits);
      expect(html).toContain("Chores");
    });

    test("does NOT include 'Bug Fixes' heading when no fix commits", () => {
      const commits = [commit("feat", "add feature")];
      const html = generateHtml(commits);
      expect(html).not.toContain("Bug Fixes");
    });

    test("includes multiple section headings when multiple types present", () => {
      const commits = [
        commit("feat", "add feature"),
        commit("fix", "fix crash"),
        commit("chore", "tidy up"),
      ];
      const html = generateHtml(commits);
      expect(html).toContain("Features");
      expect(html).toContain("Bug Fixes");
      expect(html).toContain("Chores");
    });
  });

  describe("commit messages in output", () => {
    test("each commit subject appears in the HTML", () => {
      const commits = [
        commit("feat", "add animated GIF export"),
        commit("fix", "patch memory leak in parser"),
      ];
      const html = generateHtml(commits);
      expect(html).toContain("add animated GIF export");
      expect(html).toContain("patch memory leak in parser");
    });

    test("commit with scope shows scope in output", () => {
      const commits = [commit("feat", "add OAuth", "abc1234", "auth")];
      const html = generateHtml(commits);
      expect(html).toContain("auth");
      expect(html).toContain("add OAuth");
    });

    test("short sha appears in output", () => {
      const commits = [commit("feat", "add feature", "abc1234567")];
      const html = generateHtml(commits);
      // First 7 chars of sha
      expect(html).toContain("abc1234");
    });
  });

  describe("version header", () => {
    test("shows version in header when version provided", () => {
      const commits = [commit("feat", "add feature")];
      const html = generateHtml(commits, { version: "1.2.3" });
      expect(html).toContain("1.2.3");
    });

    test("shows 'Unreleased' when no version provided", () => {
      const commits = [commit("feat", "add feature")];
      const html = generateHtml(commits);
      expect(html).toContain("Unreleased");
    });
  });

  describe("footer with generation timestamp", () => {
    test("contains a generation timestamp in footer", () => {
      const commits = [commit("feat", "add feature")];
      const html = generateHtml(commits);
      // Should contain "Generated" text and a date-like string
      expect(html).toMatch(/[Gg]enerat/);
      // Should contain a year (current or nearby)
      expect(html).toMatch(/202[0-9]/);
    });
  });

  describe("edge cases", () => {
    test("returns empty string for empty commits array", () => {
      const html = generateHtml([]);
      expect(html).toBe("");
    });

    test("unknown commit types fall under 'Other'", () => {
      const commits = [commit("wip", "work in progress")];
      const html = generateHtml(commits);
      expect(html).toContain("Other");
      expect(html).toContain("work in progress");
    });
  });
});
