// src/scope-filter.test.ts — TDD for scope-based commit filtering
import { test, expect, describe } from "bun:test";
import { filterByScope } from "./scope-filter";
import type { ConventionalCommit } from "./parser";

function commit(
  type: string,
  subject: string,
  sha = "abc1234",
  scope: string | null = null,
): ConventionalCommit {
  return { sha, type, scope, breaking: false, subject, body: "" };
}

describe("filterByScope", () => {
  test("returns all commits when scope is undefined", () => {
    const commits = [
      commit("feat", "add login", "sha001", "auth"),
      commit("fix", "fix token", "sha002", "api"),
      commit("chore", "update deps", "sha003", null),
    ];
    expect(filterByScope(commits, undefined)).toHaveLength(3);
  });

  test("returns only commits matching the given scope", () => {
    const commits = [
      commit("feat", "add login", "sha001", "auth"),
      commit("fix", "fix token", "sha002", "api"),
      commit("feat", "add endpoint", "sha003", "api"),
    ];
    const result = filterByScope(commits, "api");
    expect(result).toHaveLength(2);
    expect(result[0].subject).toBe("fix token");
    expect(result[1].subject).toBe("add endpoint");
  });

  test("excludes commits with no scope when scope filter is set", () => {
    const commits = [
      commit("feat", "add login", "sha001", "auth"),
      commit("chore", "update deps", "sha002", null),
    ];
    const result = filterByScope(commits, "auth");
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("add login");
  });

  test("returns empty array when no commits match scope", () => {
    const commits = [
      commit("feat", "add login", "sha001", "auth"),
      commit("fix", "fix token", "sha002", "auth"),
    ];
    const result = filterByScope(commits, "api");
    expect(result).toHaveLength(0);
  });

  test("returns empty array for empty input", () => {
    expect(filterByScope([], "api")).toHaveLength(0);
  });

  test("scope matching is case-sensitive", () => {
    const commits = [
      commit("feat", "add login", "sha001", "Auth"),
      commit("fix", "fix token", "sha002", "auth"),
    ];
    const result = filterByScope(commits, "auth");
    expect(result).toHaveLength(1);
    expect(result[0].sha).toBe("sha002");
  });

  test("returns all commits when scope is null (no filter)", () => {
    const commits = [
      commit("feat", "add login", "sha001", "auth"),
      commit("fix", "fix token", "sha002", null),
    ];
    expect(filterByScope(commits, null)).toHaveLength(2);
  });
});
