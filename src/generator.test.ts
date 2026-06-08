// src/generator.test.ts — TDD for changelog generator
import { test, expect, describe } from "bun:test";
import { generateChangelog, type ChangelogOptions } from "./generator";
import type { ConventionalCommit } from "./parser";

function commit(
  type: string,
  subject: string,
  sha = "abc1234",
  scope: string | null = null,
  breaking = false,
  breakingDescription: string | null = null,
): ConventionalCommit {
  return { sha, type, scope, breaking, subject, body: "", breakingDescription };
}

describe("generateChangelog", () => {
  describe("section headers", () => {
    test("uses ## [Unreleased] header by default", () => {
      const out = generateChangelog([commit("feat", "add something")]);
      expect(out).toContain("## [Unreleased]");
    });

    test("uses versioned header when version is provided", () => {
      const out = generateChangelog([commit("feat", "add something")], {
        version: "1.2.3",
        date: "2026-06-05",
      });
      expect(out).toContain("## [v1.2.3] — 2026-06-05");
      expect(out).not.toContain("Unreleased");
    });

    test("uses version without date when date is omitted", () => {
      const out = generateChangelog([commit("feat", "add something")], {
        version: "1.0.0",
      });
      expect(out).toContain("## [v1.0.0]");
      expect(out).not.toContain("Unreleased");
    });
  });

  describe("type grouping", () => {
    test("renders feat commits under ### Features", () => {
      const out = generateChangelog([commit("feat", "add login")]);
      expect(out).toContain("### Features");
      expect(out).toContain("- add login");
    });

    test("renders fix commits under ### Bug Fixes", () => {
      const out = generateChangelog([commit("fix", "correct typo")]);
      expect(out).toContain("### Bug Fixes");
      expect(out).toContain("- correct typo");
    });

    test("renders chore commits under ### Chores", () => {
      const out = generateChangelog([commit("chore", "update deps")]);
      expect(out).toContain("### Chores");
      expect(out).toContain("- update deps");
    });

    test("renders docs commits under ### Documentation", () => {
      const out = generateChangelog([commit("docs", "improve readme")]);
      expect(out).toContain("### Documentation");
      expect(out).toContain("- improve readme");
    });

    test("renders refactor commits under ### Refactoring", () => {
      const out = generateChangelog([commit("refactor", "extract helper")]);
      expect(out).toContain("### Refactoring");
      expect(out).toContain("- extract helper");
    });

    test("renders test commits under ### Tests", () => {
      const out = generateChangelog([commit("test", "add unit tests")]);
      expect(out).toContain("### Tests");
      expect(out).toContain("- add unit tests");
    });

    test("renders perf commits under ### Performance", () => {
      const out = generateChangelog([commit("perf", "cache responses")]);
      expect(out).toContain("### Performance");
      expect(out).toContain("- cache responses");
    });

    test("renders unknown types under ### Other", () => {
      const out = generateChangelog([commit("ci", "add workflow")]);
      expect(out).toContain("### Other");
      expect(out).toContain("- add workflow");
    });
  });

  describe("skipping empty sections", () => {
    test("skips sections with no commits", () => {
      const out = generateChangelog([commit("feat", "add thing")]);
      expect(out).not.toContain("### Bug Fixes");
      expect(out).not.toContain("### Chores");
      expect(out).not.toContain("### Documentation");
    });

    test("renders multiple sections when both present", () => {
      const commits = [
        commit("feat", "add animated GIF export", "abc0001"),
        commit("fix", "fix cyclesRun count", "abc0002"),
      ];
      const out = generateChangelog(commits);
      expect(out).toContain("### Features");
      expect(out).toContain("- add animated GIF export");
      expect(out).toContain("### Bug Fixes");
      expect(out).toContain("- fix cyclesRun count");
    });
  });

  describe("commit rendering", () => {
    test("each commit appears as a bullet with short sha", () => {
      const out = generateChangelog([commit("feat", "add login", "abc1234")]);
      expect(out).toMatch(/^- add login \(abc1234\)$/m);
    });

    test("multiple commits appear as separate bullets with hashes", () => {
      const commits = [
        commit("feat", "add login", "sha0001"),
        commit("feat", "add signup", "sha0002"),
      ];
      const out = generateChangelog(commits);
      expect(out).toMatch(/^- add login \(sha0001\)$/m);
      expect(out).toMatch(/^- add signup \(sha0002\)$/m);
    });

    test("long sha is truncated to 7 chars in bullet", () => {
      const fullSha = "abcdef1234567890abcdef1234567890abcdef12";
      const out = generateChangelog([commit("fix", "trim sha", fullSha)]);
      expect(out).toMatch(/^- trim sha \(abcdef1\)$/m);
    });

    test("returns empty string for empty commits array", () => {
      const out = generateChangelog([]);
      expect(out).toBe("");
    });
  });

  describe("section ordering", () => {
    test("Features appear before Bug Fixes", () => {
      const commits = [
        commit("fix", "a fix", "sha001"),
        commit("feat", "a feature", "sha002"),
      ];
      const out = generateChangelog(commits);
      const featIdx = out.indexOf("### Features");
      const fixIdx = out.indexOf("### Bug Fixes");
      expect(featIdx).toBeLessThan(fixIdx);
    });

    test("Bug Fixes appear before Chores", () => {
      const commits = [
        commit("chore", "update deps", "sha001"),
        commit("fix", "a fix", "sha002"),
      ];
      const out = generateChangelog(commits);
      const fixIdx = out.indexOf("### Bug Fixes");
      const choreIdx = out.indexOf("### Chores");
      expect(fixIdx).toBeLessThan(choreIdx);
    });
  });

  describe("full output format", () => {
    test("matches expected markdown structure with short shas", () => {
      const commits = [
        commit("feat", "add animated GIF export", "abc0012"),
        commit("feat", "parse git log into typed commits", "abc0003"),
        commit("fix", "fix cyclesRun to count sessions not PRs", "abc0014"),
      ];
      const out = generateChangelog(commits);
      const expected = [
        "## [Unreleased]",
        "",
        "### Features",
        "- add animated GIF export (abc0012)",
        "- parse git log into typed commits (abc0003)",
        "",
        "### Bug Fixes",
        "- fix cyclesRun to count sessions not PRs (abc0014)",
      ].join("\n");
      expect(out).toBe(expected);
    });
  });

  describe("breaking changes section", () => {
    test("omits ## Breaking Changes section when no breaking commits exist", () => {
      const out = generateChangelog([
        commit("feat", "add login"),
        commit("fix", "fix typo"),
      ]);
      expect(out).not.toContain("## Breaking Changes");
    });

    test("includes ## Breaking Changes section when bang-style breaking commit exists", () => {
      const out = generateChangelog([
        commit("feat", "remove old api", "abc1234", null, true, null),
      ]);
      expect(out).toContain("## Breaking Changes");
    });

    test("includes ## Breaking Changes section when BREAKING CHANGE footer present", () => {
      const out = generateChangelog([
        commit("feat", "add new api", "abc1234", null, true, "old endpoint removed"),
      ]);
      expect(out).toContain("## Breaking Changes");
      expect(out).toContain("old endpoint removed");
    });

    test("## Breaking Changes section appears BEFORE ## [Unreleased] header sections", () => {
      const out = generateChangelog([
        commit("feat", "new api", "abc0001", null, true, "old api removed"),
        commit("feat", "add login", "abc0002"),
      ]);
      const breakingIdx = out.indexOf("## Breaking Changes");
      const featIdx = out.indexOf("### Features");
      expect(breakingIdx).toBeGreaterThanOrEqual(0);
      expect(featIdx).toBeGreaterThanOrEqual(0);
      expect(breakingIdx).toBeLessThan(featIdx);
    });

    test("breaking commit with description renders description as bullet", () => {
      const out = generateChangelog([
        commit("feat", "new api", "abc0001", null, true, "old api removed"),
      ]);
      expect(out).toContain("- old api removed");
    });

    test("breaking commit without description renders subject as bullet in breaking section", () => {
      const out = generateChangelog([
        commit("feat", "remove old api", "abc0001", null, true, null),
      ]);
      expect(out).toContain("## Breaking Changes");
      expect(out).toContain("- remove old api");
    });

    test("breaking commit still appears in its type section too", () => {
      const out = generateChangelog([
        commit("feat", "remove old api", "abc0001", null, true, null),
      ]);
      expect(out).toContain("## Breaking Changes");
      expect(out).toContain("### Features");
    });

    test("exact output format with breaking change and regular commits", () => {
      const commits = [
        commit("feat", "new api", "abc0001", null, true, "old api removed"),
        commit("feat", "add login", "abc0002"),
        commit("fix", "fix typo", "abc0003"),
      ];
      const out = generateChangelog(commits);
      const expected = [
        "## [Unreleased]",
        "",
        "## Breaking Changes",
        "- old api removed (abc0001)",
        "",
        "### Features",
        "- new api (abc0001)",
        "- add login (abc0002)",
        "",
        "### Bug Fixes",
        "- fix typo (abc0003)",
      ].join("\n");
      expect(out).toBe(expected);
    });

    test("multiple breaking commits all listed in breaking section", () => {
      const commits = [
        commit("feat", "new api", "abc0001", null, true, "old api removed"),
        commit("refactor", "restructure config", "abc0002", null, true, "config format changed"),
      ];
      const out = generateChangelog(commits);
      expect(out).toContain("- old api removed");
      expect(out).toContain("- config format changed");
      const lines = out.split("\n");
      const bIdx = lines.findIndex(l => l === "## Breaking Changes");
      expect(bIdx).toBeGreaterThanOrEqual(0);
      // both breaking bullets should appear before any type section
      const firstSectionIdx = lines.findIndex(l => l.startsWith("### "));
      const bullet1 = lines.findIndex(l => l.includes("old api removed"));
      const bullet2 = lines.findIndex(l => l.includes("config format changed"));
      expect(bullet1).toBeLessThan(firstSectionIdx);
      expect(bullet2).toBeLessThan(firstSectionIdx);
    });
  });

  describe("scope rendering", () => {
    test("scoped commit bullet includes scope prefix", () => {
      const out = generateChangelog([
        commit("feat", "add login", "abc1234", "auth"),
      ]);
      expect(out).toMatch(/^- \(auth\): add login \(abc1234\)$/m);
    });

    test("unscoped commit bullet omits scope prefix", () => {
      const out = generateChangelog([
        commit("feat", "add login", "abc1234", null),
      ]);
      expect(out).toMatch(/^- add login \(abc1234\)$/m);
    });

    test("breaking scoped commit includes scope in bullet", () => {
      const out = generateChangelog([
        commit("feat", "breaking change", "abc1234", "api", true),
      ]);
      expect(out).toMatch(/^- \(api\): breaking change \(abc1234\)$/m);
    });

    test("mixed scoped and unscoped commits in same section", () => {
      const commits = [
        commit("fix", "fix token refresh", "sha0001", "auth"),
        commit("fix", "correct typo", "sha0002", null),
      ];
      const out = generateChangelog(commits);
      expect(out).toMatch(/^- \(auth\): fix token refresh \(sha0001\)$/m);
      expect(out).toMatch(/^- correct typo \(sha0002\)$/m);
    });

    test("full output format with scoped commits", () => {
      const commits = [
        commit("feat", "add login", "abc0001", "auth"),
        commit("fix", "fix token refresh", "abc0002", "auth"),
        commit("chore", "update deps", "abc0003", null),
      ];
      const out = generateChangelog(commits);
      const expected = [
        "## [Unreleased]",
        "",
        "### Features",
        "- (auth): add login (abc0001)",
        "",
        "### Bug Fixes",
        "- (auth): fix token refresh (abc0002)",
        "",
        "### Chores",
        "- update deps (abc0003)",
      ].join("\n");
      expect(out).toBe(expected);
    });
  });
});
