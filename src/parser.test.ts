// src/parser.test.ts — TDD-first tests for the conventional commit parser.
import { describe, it, expect } from "bun:test";
import { parseCommit, parseLog } from "./parser";

describe("parseCommit", () => {
  it("parses feat with scope", () => {
    const result = parseCommit("feat(scope): subject");
    expect(result).toEqual({ type: "feat", scope: "scope", subject: "subject", breaking: false });
  });

  it("parses fix with no scope", () => {
    const result = parseCommit("fix: no scope");
    expect(result).toEqual({ type: "fix", scope: null, subject: "no scope", breaking: false });
  });

  it("parses breaking change via ! marker", () => {
    const result = parseCommit("feat!: breaking change");
    expect(result).toEqual({ type: "feat", scope: null, subject: "breaking change", breaking: true });
  });

  it("parses breaking change via ! with scope", () => {
    const result = parseCommit("feat(api)!: breaking change with scope");
    expect(result).toEqual({ type: "feat", scope: "api", subject: "breaking change with scope", breaking: true });
  });

  it("parses BREAKING CHANGE footer as breaking", () => {
    const result = parseCommit("feat: add thing\n\nBREAKING CHANGE: old API removed");
    expect(result).not.toBeNull();
    expect(result!.breaking).toBe(true);
    expect(result!.type).toBe("feat");
    expect(result!.subject).toBe("add thing");
  });

  it("returns null for non-conventional commits (no colon)", () => {
    expect(parseCommit("update some stuff")).toBeNull();
    expect(parseCommit("WIP")).toBeNull();
    expect(parseCommit("")).toBeNull();
  });

  it("handles other conventional types", () => {
    expect(parseCommit("chore: bump deps")).toEqual({ type: "chore", scope: null, subject: "bump deps", breaking: false });
    expect(parseCommit("docs(readme): fix typo")).toEqual({ type: "docs", scope: "readme", subject: "fix typo", breaking: false });
    expect(parseCommit("refactor(core): simplify logic")).toEqual({ type: "refactor", scope: "core", subject: "simplify logic", breaking: false });
  });
});

describe("parseLog", () => {
  it("parses a multi-commit log string with separator", () => {
    const log = [
      "feat(auth): add login flow",
      "---commit---",
      "fix: patch null deref",
      "---commit---",
      "not a conventional commit",
      "---commit---",
      "chore: update deps",
    ].join("\n");

    const results = parseLog(log);
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ type: "feat", scope: "auth", subject: "add login flow", breaking: false });
    expect(results[1]).toEqual({ type: "fix", scope: null, subject: "patch null deref", breaking: false });
    expect(results[2]).toEqual({ type: "chore", scope: null, subject: "update deps", breaking: false });
  });

  it("returns empty array when no conventional commits", () => {
    const log = "WIP\n---commit---\nfixing things\n---commit---\n";
    expect(parseLog(log)).toEqual([]);
  });

  it("handles empty string", () => {
    expect(parseLog("")).toEqual([]);
  });

  it("handles log without separator (single commit)", () => {
    const log = "feat: single commit";
    const results = parseLog(log);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ type: "feat", scope: null, subject: "single commit", breaking: false });
  });
});
