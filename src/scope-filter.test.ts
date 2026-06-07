// src/scope-filter.test.ts — TDD for scope-based commit filtering
import { test, expect, describe } from "bun:test";
import { filterByScope } from "./scope-filter";
import type { ConventionalCommit } from "./parser";

function commit(
  scope: string | null,
  subject = "some subject",
  sha = "abc1234",
  type = "feat",
): ConventionalCommit {
  return { sha, type, scope, breaking: false, subject, body: "" };
}

describe("filterByScope", () => {
  test("empty scope string returns all commits unchanged", () => {
    const commits = [
      commit("auth"),
      commit("api"),
      commit(null),
    ];
    const result = filterByScope(commits, "");
    expect(result).toEqual(commits);
    expect(result).toHaveLength(3);
  });

  test("scope='auth' matches commit with scope='auth'", () => {
    const commits = [commit("auth")];
    const result = filterByScope(commits, "auth");
    expect(result).toHaveLength(1);
    expect(result[0].scope).toBe("auth");
  });

  test("scope='auth' does NOT match commit with scope='api'", () => {
    const commits = [commit("api")];
    const result = filterByScope(commits, "auth");
    expect(result).toHaveLength(0);
  });

  test("scope='AUTH' matches commit with scope='auth' (case-insensitive)", () => {
    const commits = [commit("auth")];
    const result = filterByScope(commits, "AUTH");
    expect(result).toHaveLength(1);
    expect(result[0].scope).toBe("auth");
  });

  test("scope='auth' does NOT match commit with scope=null", () => {
    const commits = [commit(null)];
    const result = filterByScope(commits, "auth");
    expect(result).toHaveLength(0);
  });

  test("filters correctly from a mixed list", () => {
    const commits = [
      commit("auth", "add login", "sha0001"),
      commit("api", "new endpoint", "sha0002"),
      commit(null, "update deps", "sha0003"),
      commit("auth", "fix token refresh", "sha0004"),
      commit("Auth", "logout route", "sha0005"),
    ];
    const result = filterByScope(commits, "auth");
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.sha)).toEqual(["sha0001", "sha0004", "sha0005"]);
  });
});
