// src/format-json.test.ts — TDD for --format json flag
import { test, expect, describe } from "bun:test";
import { parseArgs } from "./cli";
import { generateChangelogJson } from "./json-formatter";
import type { ConventionalCommit } from "./parser";

// Helper to build a ConventionalCommit
function commit(
  type: string,
  subject: string,
  sha = "abc1234",
  scope: string | null = null,
  breaking = false,
): ConventionalCommit {
  return { sha, type, scope, breaking, subject, body: "" };
}

// ── parseArgs ────────────────────────────────────────────────────────────────

describe("parseArgs --format", () => {
  test("parses --format json", () => {
    const result = parseArgs(["bun", "cli.ts", "--format", "json"]);
    expect(result.format).toBe("json");
  });

  test("format is undefined when --format is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result.format).toBeUndefined();
  });

  test("parses --format json combined with --types and --scope", () => {
    const result = parseArgs([
      "bun",
      "cli.ts",
      ".",
      "--format",
      "json",
      "--types",
      "feat,fix",
      "--scope",
      "auth",
    ]);
    expect(result.format).toBe("json");
    expect(result.types).toEqual(["feat", "fix"]);
    expect(result.scope).toBe("auth");
  });
});

// ── generateChangelogJson ────────────────────────────────────────────────────

describe("generateChangelogJson", () => {
  describe("top-level fields", () => {
    test("version is 'unreleased' when no version provided", () => {
      const result = generateChangelogJson([commit("feat", "add something")]);
      expect(result.version).toBe("unreleased");
    });

    test("version is the provided version string", () => {
      const result = generateChangelogJson([commit("feat", "add something")], {
        version: "1.2.3",
      });
      expect(result.version).toBe("1.2.3");
    });

    test("date field is present when provided", () => {
      const result = generateChangelogJson([commit("feat", "add something")], {
        version: "1.0.0",
        date: "2026-06-07",
      });
      expect(result.date).toBe("2026-06-07");
    });

    test("date field is YYYY-MM-DD format when set", () => {
      const result = generateChangelogJson([commit("feat", "add something")], {
        date: "2026-06-07",
      });
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("sections structure", () => {
    test("returns sections array", () => {
      const result = generateChangelogJson([commit("feat", "add login")]);
      expect(Array.isArray(result.sections)).toBe(true);
    });

    test("feat commits produce a section with type=feat label=Features", () => {
      const result = generateChangelogJson([commit("feat", "add login", "abc1234")]);
      const section = result.sections.find((s) => s.type === "feat");
      expect(section).toBeDefined();
      expect(section!.label).toBe("Features");
    });

    test("fix commits produce a section with type=fix label=Bug Fixes", () => {
      const result = generateChangelogJson([commit("fix", "fix crash", "abc1234")]);
      const section = result.sections.find((s) => s.type === "fix");
      expect(section).toBeDefined();
      expect(section!.label).toBe("Bug Fixes");
    });

    test("only non-empty sections are included", () => {
      const result = generateChangelogJson([commit("feat", "add login")]);
      const types = result.sections.map((s) => s.type);
      expect(types).toContain("feat");
      expect(types).not.toContain("fix");
      expect(types).not.toContain("chore");
    });

    test("multiple sections present when multiple types exist", () => {
      const commits = [
        commit("feat", "add feature", "sha0001"),
        commit("fix", "fix bug", "sha0002"),
      ];
      const result = generateChangelogJson(commits);
      const types = result.sections.map((s) => s.type);
      expect(types).toContain("feat");
      expect(types).toContain("fix");
    });
  });

  describe("commit entries", () => {
    test("commit entry has sha (7-char short), subject, scope fields", () => {
      const result = generateChangelogJson([
        commit("feat", "add login", "abc1234def", null),
      ]);
      const entry = result.sections[0].commits[0];
      expect(entry.sha).toBe("abc1234"); // 7-char short sha
      expect(entry.subject).toBe("add login");
      expect(entry.scope).toBeNull();
    });

    test("long sha is truncated to 7 chars", () => {
      const fullSha = "abcdef1234567890abcdef1234567890abcdef12";
      const result = generateChangelogJson([commit("fix", "trim sha", fullSha)]);
      expect(result.sections[0].commits[0].sha).toBe("abcdef1");
    });

    test("scoped commit has scope set", () => {
      const result = generateChangelogJson([
        commit("feat", "add login", "abc1234", "auth"),
      ]);
      expect(result.sections[0].commits[0].scope).toBe("auth");
    });

    test("unscoped commit has scope: null", () => {
      const result = generateChangelogJson([
        commit("feat", "add login", "abc1234", null),
      ]);
      expect(result.sections[0].commits[0].scope).toBeNull();
    });

    test("multiple commits appear in same section", () => {
      const commits = [
        commit("feat", "add login", "sha0001"),
        commit("feat", "add signup", "sha0002"),
      ];
      const result = generateChangelogJson(commits);
      const featSection = result.sections.find((s) => s.type === "feat")!;
      expect(featSection.commits).toHaveLength(2);
    });
  });

  describe("empty input", () => {
    test("returns version unreleased and empty sections for no commits", () => {
      const result = generateChangelogJson([]);
      expect(result.version).toBe("unreleased");
      expect(result.sections).toEqual([]);
    });
  });

  describe("full JSON structure", () => {
    test("matches expected structure", () => {
      const commits = [
        commit("feat", "add login", "abc0001", "auth"),
        commit("fix", "fix crash", "abc0002", null),
      ];
      const result = generateChangelogJson(commits, {
        version: "1.0.0",
        date: "2026-06-07",
      });
      expect(result).toEqual({
        version: "1.0.0",
        date: "2026-06-07",
        sections: [
          {
            type: "feat",
            label: "Features",
            commits: [{ sha: "abc0001", subject: "add login", scope: "auth" }],
          },
          {
            type: "fix",
            label: "Bug Fixes",
            commits: [{ sha: "abc0002", subject: "fix crash", scope: null }],
          },
        ],
      });
    });
  });
});

// ── backward compatibility ───────────────────────────────────────────────────

describe("default format is markdown (backward compat)", () => {
  test("parseArgs without --format leaves format undefined", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--types", "feat"]);
    expect(result.format).toBeUndefined();
  });

  test("existing parseArgs flags still work without --format", () => {
    const result = parseArgs([
      "bun",
      "cli.ts",
      ".",
      "--since",
      "v1.0.0",
      "--scope",
      "auth",
      "--types",
      "feat,fix",
      "--out",
      "out.md",
    ]);
    expect(result.since).toBe("v1.0.0");
    expect(result.scope).toBe("auth");
    expect(result.types).toEqual(["feat", "fix"]);
    expect(result.outFile).toBe("out.md");
    expect(result.format).toBeUndefined();
  });
});
