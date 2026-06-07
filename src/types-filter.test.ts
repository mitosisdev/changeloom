// src/types-filter.test.ts — TDD for filterByTypes
import { test, expect, describe } from "bun:test";
import { filterByTypes } from "./types-filter";
import type { ConventionalCommit } from "./parser";

function commit(
  type: string,
  subject: string,
  sha = "abc1234",
): ConventionalCommit {
  return { sha, type, scope: null, breaking: false, subject, body: "" };
}

const mixed = [
  commit("feat", "add login", "sha0001"),
  commit("fix", "correct typo", "sha0002"),
  commit("docs", "update readme", "sha0003"),
  commit("chore", "bump deps", "sha0004"),
  commit("feat", "add signup", "sha0005"),
];

describe("filterByTypes", () => {
  test("empty types array returns all commits unchanged", () => {
    const result = filterByTypes(mixed, []);
    expect(result).toEqual(mixed);
  });

  test("types=['feat'] returns only feat commits", () => {
    const result = filterByTypes(mixed, ["feat"]);
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.type === "feat")).toBe(true);
    expect(result.map((c) => c.sha)).toEqual(["sha0001", "sha0005"]);
  });

  test("types=['feat','fix'] returns feat and fix commits, excludes others", () => {
    const result = filterByTypes(mixed, ["feat", "fix"]);
    expect(result).toHaveLength(3);
    const types = result.map((c) => c.type);
    expect(types).toContain("feat");
    expect(types).toContain("fix");
    expect(types).not.toContain("docs");
    expect(types).not.toContain("chore");
  });

  test("types=['FEAT'] matches commits with type='feat' (case-insensitive)", () => {
    const result = filterByTypes(mixed, ["FEAT"]);
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.type === "feat")).toBe(true);
  });

  test("no matching commits returns empty array", () => {
    const result = filterByTypes(mixed, ["refactor"]);
    expect(result).toHaveLength(0);
  });

  test("filters correctly from a mixed-type list preserving order", () => {
    const commits = [
      commit("fix", "fix A", "sha001"),
      commit("feat", "feat B", "sha002"),
      commit("docs", "docs C", "sha003"),
      commit("fix", "fix D", "sha004"),
    ];
    const result = filterByTypes(commits, ["fix"]);
    expect(result).toHaveLength(2);
    expect(result[0].sha).toBe("sha001");
    expect(result[1].sha).toBe("sha004");
  });
});
