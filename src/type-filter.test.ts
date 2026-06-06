// src/type-filter.test.ts — TDD for filterByTypes()
import { describe, test, expect } from "bun:test";
import { filterByTypes } from "./type-filter";
import type { ConventionalCommit } from "./parser";

function makeCommit(type: string, sha = "abc1234"): ConventionalCommit {
  return { sha, type, scope: null, breaking: false, subject: "test", body: "" };
}

describe("filterByTypes", () => {
  const commits: ConventionalCommit[] = [
    makeCommit("feat", "aaa0001"),
    makeCommit("fix", "bbb0002"),
    makeCommit("chore", "ccc0003"),
    makeCommit("docs", "ddd0004"),
    makeCommit("refactor", "eee0005"),
    makeCommit("feat", "fff0006"),
  ];

  test("returns all commits when types list is empty", () => {
    expect(filterByTypes(commits, [])).toEqual(commits);
  });

  test("filters to a single type", () => {
    const result = filterByTypes(commits, ["feat"]);
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.type === "feat")).toBe(true);
  });

  test("filters to multiple types", () => {
    const result = filterByTypes(commits, ["feat", "fix"]);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.type)).toEqual(["feat", "fix", "feat"]);
  });

  test("returns empty array when no commits match", () => {
    const result = filterByTypes(commits, ["perf"]);
    expect(result).toHaveLength(0);
  });

  test("is case-sensitive — 'Feat' does not match 'feat'", () => {
    const result = filterByTypes(commits, ["Feat"]);
    expect(result).toHaveLength(0);
  });

  test("preserves order of original commits", () => {
    const result = filterByTypes(commits, ["chore", "feat"]);
    expect(result.map((c) => c.sha)).toEqual(["aaa0001", "ccc0003", "fff0006"]);
  });

  test("handles empty commits array", () => {
    expect(filterByTypes([], ["feat"])).toEqual([]);
  });
});
