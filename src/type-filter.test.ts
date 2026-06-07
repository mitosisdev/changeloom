// src/type-filter.test.ts — TDD for type-based commit filtering
import { test, expect, describe } from "bun:test";
import { filterByTypes } from "./type-filter";
import type { ConventionalCommit } from "./parser";

function commit(
  type: string,
  subject = "some subject",
  sha = "abc1234",
  scope: string | null = null,
): ConventionalCommit {
  return { sha, type, scope, breaking: false, subject, body: "" };
}

describe("filterByTypes", () => {
  test("empty types array returns all commits unchanged (no filter)", () => {
    const commits = [
      commit("feat"),
      commit("fix"),
      commit("chore"),
    ];
    const result = filterByTypes(commits, []);
    expect(result).toEqual(commits);
    expect(result).toHaveLength(3);
  });

  test("single type 'feat' returns only feat commits", () => {
    const commits = [
      commit("feat", "add login", "sha0001"),
      commit("fix", "fix bug", "sha0002"),
      commit("chore", "cleanup", "sha0003"),
    ];
    const result = filterByTypes(commits, ["feat"]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("feat");
    expect(result[0].sha).toBe("sha0001");
  });

  test("multiple types ['feat', 'fix'] returns feat AND fix commits", () => {
    const commits = [
      commit("feat", "add login", "sha0001"),
      commit("fix", "fix bug", "sha0002"),
      commit("chore", "cleanup", "sha0003"),
      commit("docs", "update readme", "sha0004"),
      commit("fix", "another fix", "sha0005"),
    ];
    const result = filterByTypes(commits, ["feat", "fix"]);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.sha)).toEqual(["sha0001", "sha0002", "sha0005"]);
  });

  test("no match returns empty array", () => {
    const commits = [
      commit("chore"),
      commit("docs"),
      commit("refactor"),
    ];
    const result = filterByTypes(commits, ["feat", "fix"]);
    expect(result).toHaveLength(0);
  });

  test("case-insensitive: 'FEAT' matches commit with type 'feat'", () => {
    const commits = [
      commit("feat", "add feature", "sha0001"),
      commit("fix", "fix something", "sha0002"),
    ];
    const result = filterByTypes(commits, ["FEAT"]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("feat");
  });

  test("case-insensitive: mixed case types match correctly", () => {
    const commits = [
      commit("feat", "feature one", "sha0001"),
      commit("Fix", "fix one", "sha0002"),
      commit("CHORE", "chore one", "sha0003"),
    ];
    const result = filterByTypes(commits, ["Feat", "FIX"]);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.sha)).toEqual(["sha0001", "sha0002"]);
  });

  test("filters correctly from a larger mixed list", () => {
    const commits = [
      commit("feat", "new feature", "sha0001"),
      commit("fix", "bug fix", "sha0002"),
      commit("chore", "deps", "sha0003"),
      commit("feat", "another feature", "sha0004"),
      commit("test", "add tests", "sha0005"),
      commit("ci", "update ci", "sha0006"),
    ];
    const result = filterByTypes(commits, ["feat", "fix"]);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.sha)).toEqual(["sha0001", "sha0002", "sha0004"]);
  });
});
