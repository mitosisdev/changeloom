// src/generator.test.ts — TDD for changelog generator
import { test, expect, describe } from "bun:test";
import { generateChangelog, generateChangelogJson, type ChangelogOptions } from "./generator";
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

describe("generateChangelogJson", () => {
  describe("basic structure", () => {
    test("returns object with sections array", () => {
      const out = generateChangelogJson([commit("feat", "add login", "abc1234", "auth")]);
      expect(out).toHaveProperty("sections");
      expect(Array.isArray(out.sections)).toBe(true);
    });

    test("returns empty sections for empty commits", () => {
      const out = generateChangelogJson([]);
      expect(out.sections).toEqual([]);
    });

    test("omits version and date by default", () => {
      const out = generateChangelogJson([commit("feat", "add login")]);
      expect(out).not.toHaveProperty("version");
      expect(out).not.toHaveProperty("date");
    });

    test("includes version when provided", () => {
      const out = generateChangelogJson([commit("feat", "add login")], { version: "1.2.3" });
      expect(out.version).toBe("1.2.3");
    });

    test("includes date when provided", () => {
      const out = generateChangelogJson([commit("feat", "add login")], { version: "1.2.3", date: "2026-06-06" });
      expect(out.date).toBe("2026-06-06");
    });
  });

  describe("sections shape", () => {
    test("section has type, label, and commits fields", () => {
      const out = generateChangelogJson([commit("feat", "add login", "abc1234")]);
      const section = out.sections[0];
      expect(section).toHaveProperty("type");
      expect(section).toHaveProperty("label");
      expect(section).toHaveProperty("commits");
    });

    test("feat commits grouped under Features section", () => {
      const out = generateChangelogJson([commit("feat", "add login", "abc1234")]);
      const featSection = out.sections.find((s: { type: string }) => s.type === "feat");
      expect(featSection).toBeDefined();
      expect(featSection!.label).toBe("Features");
    });

    test("fix commits grouped under Bug Fixes section", () => {
      const out = generateChangelogJson([commit("fix", "correct typo", "abc1234")]);
      const fixSection = out.sections.find((s: { type: string }) => s.type === "fix");
      expect(fixSection).toBeDefined();
      expect(fixSection!.label).toBe("Bug Fixes");
    });

    test("unknown types grouped under Other section", () => {
      const out = generateChangelogJson([commit("ci", "add workflow", "abc1234")]);
      const otherSection = out.sections.find((s: { type: string }) => s.type === "other");
      expect(otherSection).toBeDefined();
      expect(otherSection!.label).toBe("Other");
    });
  });

  describe("commit entries", () => {
    test("commit entry has sha, description fields", () => {
      const out = generateChangelogJson([commit("feat", "add login", "abc1234")]);
      const entry = out.sections[0].commits[0];
      expect(entry).toHaveProperty("sha");
      expect(entry).toHaveProperty("description");
    });

    test("sha is truncated to 7 chars", () => {
      const fullSha = "abcdef1234567890abcdef1234567890abcdef12";
      const out = generateChangelogJson([commit("feat", "add login", fullSha)]);
      expect(out.sections[0].commits[0].sha).toBe("abcdef1");
    });

    test("description matches subject", () => {
      const out = generateChangelogJson([commit("feat", "add login flow", "abc1234")]);
      expect(out.sections[0].commits[0].description).toBe("add login flow");
    });

    test("scope is included when present", () => {
      const out = generateChangelogJson([commit("feat", "add login", "abc1234", "auth")]);
      expect(out.sections[0].commits[0].scope).toBe("auth");
    });

    test("scope is absent when not present", () => {
      const out = generateChangelogJson([commit("feat", "add login", "abc1234", null)]);
      expect(out.sections[0].commits[0]).not.toHaveProperty("scope");
    });
  });

  describe("section ordering", () => {
    test("feat section appears before fix section", () => {
      const commits = [
        commit("fix", "a fix", "sha001"),
        commit("feat", "a feature", "sha002"),
      ];
      const out = generateChangelogJson(commits);
      const featIdx = out.sections.findIndex((s: { type: string }) => s.type === "feat");
      const fixIdx = out.sections.findIndex((s: { type: string }) => s.type === "fix");
      expect(featIdx).toBeLessThan(fixIdx);
    });
  });

  describe("full JSON structure", () => {
    test("matches expected JSON shape with version and date", () => {
      const commits = [
        commit("feat", "add login flow", "abc1234", "auth"),
        commit("fix", "correct typo", "def5678", null),
      ];
      const out = generateChangelogJson(commits, { version: "1.2.3", date: "2026-06-06" });
      expect(out).toEqual({
        version: "1.2.3",
        date: "2026-06-06",
        sections: [
          {
            type: "feat",
            label: "Features",
            commits: [{ sha: "abc1234", scope: "auth", description: "add login flow" }],
          },
          {
            type: "fix",
            label: "Bug Fixes",
            commits: [{ sha: "def5678", description: "correct typo" }],
          },
        ],
      });
    });
  });
});
