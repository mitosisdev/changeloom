// src/parser.test.ts — TDD for conventional commit parser
import { test, expect, describe } from "bun:test";
import { parseCommit, parseLog, type ConventionalCommit } from "./parser";

describe("parseCommit", () => {
  test("parses a simple feat commit with no scope", () => {
    const result = parseCommit("abc1234 feat: add login");
    expect(result).toEqual<ConventionalCommit>({
      sha: "abc1234",
      type: "feat",
      scope: null,
      breaking: false,
      breakingDescription: null,
      subject: "add login",
      body: "",
    });
  });

  test("parses a commit with scope", () => {
    const result = parseCommit("abc1234 feat(auth): add login");
    expect(result).not.toBeNull();
    expect(result!.scope).toBe("auth");
    expect(result!.type).toBe("feat");
    expect(result!.subject).toBe("add login");
    expect(result!.breaking).toBe(false);
  });

  test("parses a breaking change with ! and no scope", () => {
    const result = parseCommit("abc1234 feat!: breaking change");
    expect(result).not.toBeNull();
    expect(result!.breaking).toBe(true);
    expect(result!.scope).toBeNull();
    expect(result!.subject).toBe("breaking change");
  });

  test("parses a breaking change with ! and scope", () => {
    const result = parseCommit("abc1234 feat(api)!: breaking with scope");
    expect(result).not.toBeNull();
    expect(result!.breaking).toBe(true);
    expect(result!.scope).toBe("api");
    expect(result!.subject).toBe("breaking with scope");
  });

  test("returns null for non-conventional commit message", () => {
    const result = parseCommit("abc1234 not conventional");
    expect(result).toBeNull();
  });

  test("handles body content after blank line", () => {
    const result = parseCommit(
      "abc1234 chore: update deps\n\nDetailed body here\nand more"
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe("chore");
    expect(result!.subject).toBe("update deps");
    expect(result!.body).toContain("Detailed body");
  });

  test("works with a full 40-character SHA", () => {
    const sha = "a".repeat(40);
    const result = parseCommit(`${sha} fix: correct typo`);
    expect(result).not.toBeNull();
    expect(result!.sha).toBe(sha);
    expect(result!.type).toBe("fix");
    expect(result!.subject).toBe("correct typo");
  });
});

describe("BREAKING CHANGE footer detection", () => {
  test("sets breaking=true when footer contains BREAKING CHANGE:", () => {
    const result = parseCommit(
      "abc1234 feat: add new api\n\nBREAKING CHANGE: removed old endpoint"
    );
    expect(result).not.toBeNull();
    expect(result!.breaking).toBe(true);
  });

  test("captures BREAKING CHANGE description from footer", () => {
    const result = parseCommit(
      "abc1234 feat: add new api\n\nBREAKING CHANGE: removed old endpoint"
    );
    expect(result).not.toBeNull();
    expect(result!.breakingDescription).toBe("removed old endpoint");
  });

  test("sets breaking=true for BREAKING CHANGE with body before footer", () => {
    const result = parseCommit(
      "abc1234 refactor: restructure auth\n\nThis is the body text.\n\nBREAKING CHANGE: auth config format changed"
    );
    expect(result).not.toBeNull();
    expect(result!.breaking).toBe(true);
    expect(result!.breakingDescription).toBe("auth config format changed");
  });

  test("bang ! also sets breaking=true (existing, regression check)", () => {
    const result = parseCommit("abc1234 feat!: new breaking thing");
    expect(result).not.toBeNull();
    expect(result!.breaking).toBe(true);
  });

  test("bang ! without footer sets breakingDescription to null", () => {
    const result = parseCommit("abc1234 feat!: new breaking thing");
    expect(result).not.toBeNull();
    expect(result!.breakingDescription).toBeNull();
  });

  test("non-breaking commit has breakingDescription of null", () => {
    const result = parseCommit("abc1234 feat: normal feature");
    expect(result).not.toBeNull();
    expect(result!.breaking).toBe(false);
    expect(result!.breakingDescription).toBeNull();
  });
});

describe("parseLog", () => {
  test("parses multiple conventional commits from a log string", () => {
    const log = "abc1234 feat: a\nbcd5678 fix: b";
    const results = parseLog(log);
    expect(results).toHaveLength(2);
    expect(results[0].type).toBe("feat");
    expect(results[1].type).toBe("fix");
  });

  test("skips non-conventional lines", () => {
    const log = "abc1234 not conventional\nbcd5678 feat: good";
    const results = parseLog(log);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("feat");
    expect(results[0].sha).toBe("bcd5678");
  });

  test("returns empty array for empty string", () => {
    const results = parseLog("");
    expect(results).toHaveLength(0);
  });
});
