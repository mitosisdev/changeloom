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

// ──────────────────────────────────────────────────────────────────────────────
// JSON output tests
// ──────────────────────────────────────────────────────────────────────────────
import { generateChangelogJson, type ChangelogJson } from "./generator";

describe("generateChangelogJson", () => {
  describe("top-level shape", () => {
    test("returns version null when no version provided", () => {
      const out = generateChangelogJson([commit("feat", "add login")]);
      expect(out.version).toBeNull();
    });

    test("returns version string when version provided", () => {
      const out = generateChangelogJson([commit("feat", "add login")], {
        version: "1.2.3",
      });
      expect(out.version).toBe("1.2.3");
    });

    test("returns date null when no date provided", () => {
      const out = generateChangelogJson([commit("feat", "add login")]);
      expect(out.date).toBeNull();
    });

    test("returns date string when date provided", () => {
      const out = generateChangelogJson([commit("feat", "add login")], {
        version: "1.0.0",
        date: "2026-06-06",
      });
      expect(out.date).toBe("2026-06-06");
    });

    test("returns empty groups array for empty commits", () => {
      const out = generateChangelogJson([]);
      expect(out.groups).toEqual([]);
    });
  });

  describe("groups structure", () => {
    test("feat commits produce a Features group", () => {
      const out = generateChangelogJson([commit("feat", "add login", "abc1234")]);
      expect(out.groups).toHaveLength(1);
      expect(out.groups[0].label).toBe("Features");
      expect(out.groups[0].type).toBe("feat");
    });

    test("fix commits produce a Bug Fixes group", () => {
      const out = generateChangelogJson([commit("fix", "fix typo", "abc1234")]);
      expect(out.groups[0].label).toBe("Bug Fixes");
      expect(out.groups[0].type).toBe("fix");
    });

    test("unknown types produce an Other group", () => {
      const out = generateChangelogJson([commit("ci", "add workflow", "abc1234")]);
      expect(out.groups[0].label).toBe("Other");
      expect(out.groups[0].type).toBe("other");
    });

    test("entries have correct fields", () => {
      const out = generateChangelogJson([
        commit("feat", "add login", "abc1234", "auth", false),
      ]);
      const entry = out.groups[0].entries[0];
      expect(entry.sha).toBe("abc1234");
      expect(entry.subject).toBe("add login");
      expect(entry.scope).toBe("auth");
      expect(entry.breaking).toBe(false);
    });

    test("null scope passes through as null", () => {
      const out = generateChangelogJson([commit("feat", "add login", "abc1234")]);
      expect(out.groups[0].entries[0].scope).toBeNull();
    });

    test("multiple types produce multiple groups in canonical order", () => {
      const commits = [
        commit("fix", "fix bug", "sha001"),
        commit("feat", "add thing", "sha002"),
        commit("chore", "update deps", "sha003"),
      ];
      const out = generateChangelogJson(commits);
      expect(out.groups.map((g) => g.type)).toEqual(["feat", "fix", "chore"]);
    });

    test("full JSON structure matches snapshot", () => {
      const commits = [
        commit("feat", "add login", "abc0001", "auth"),
        commit("fix", "fix token refresh", "abc0002", "auth"),
        commit("chore", "update deps", "abc0003", null),
      ];
      const out = generateChangelogJson(commits);
      expect(out).toEqual<ChangelogJson>({
        version: null,
        date: null,
        groups: [
          {
            type: "feat",
            label: "Features",
            entries: [
              { sha: "abc0001", subject: "add login", scope: "auth", breaking: false },
            ],
          },
          {
            type: "fix",
            label: "Bug Fixes",
            entries: [
              { sha: "abc0002", subject: "fix token refresh", scope: "auth", breaking: false },
            ],
          },
          {
            type: "chore",
            label: "Chores",
            entries: [
              { sha: "abc0003", subject: "update deps", scope: null, breaking: false },
            ],
          },
        ],
      });
    });
  });
});
