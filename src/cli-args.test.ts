// src/cli-args.test.ts — TDD for CLI argument parsing, including --out, --since, --scope, --types flags
import { test, expect, describe } from "bun:test";
import { parseArgs } from "./cli";

describe("parseArgs", () => {
  test("parses repo path and --out flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--out", "CHANGELOG.md"]);
    expect(result).toEqual({ repoPath: ".", outFile: "CHANGELOG.md", scope: undefined, types: [] });
  });

  test("leaves outFile undefined when --out is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result).toEqual({ repoPath: ".", outFile: undefined, scope: undefined, types: [] });
  });

  test("parses --version and --out together", () => {
    const result = parseArgs([
      "bun",
      "cli.ts",
      ".",
      "--version",
      "v1.0.0",
      "--out",
      "out.md",
    ]);
    expect(result).toEqual({
      repoPath: ".",
      version: "1.0.0",
      outFile: "out.md",
      scope: undefined,
      types: [],
    });
  });

  test("parses --since flag", () => {
    const result = parseArgs(["bun", "cli.ts", "--since", "v1.0.0"]);
    expect(result).toEqual({
      repoPath: ".",
      since: "v1.0.0",
      outFile: undefined,
      scope: undefined,
      types: [],
    });
  });

  test("leaves since undefined when --since is absent", () => {
    const result = parseArgs(["bun", "cli.ts"]);
    expect(result).toEqual({
      repoPath: ".",
      since: undefined,
      outFile: undefined,
      scope: undefined,
      types: [],
    });
  });

  test("parses --scope flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--scope", "auth"]);
    expect(result).toEqual({
      repoPath: ".",
      outFile: undefined,
      scope: "auth",
      types: [],
    });
  });

  test("leaves scope undefined when --scope is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result.scope).toBeUndefined();
  });

  test("parses --scope with --since and --out together", () => {
    const result = parseArgs([
      "bun",
      "cli.ts",
      ".",
      "--since",
      "v1.0.0",
      "--scope",
      "api",
      "--out",
      "out.md",
    ]);
    expect(result).toEqual({
      repoPath: ".",
      since: "v1.0.0",
      scope: "api",
      outFile: "out.md",
      types: [],
    });
  });

  test("parses --types flag with single type", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--types", "feat"]);
    expect(result.types).toEqual(["feat"]);
  });

  test("parses --types flag with comma-separated types", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--types", "feat,fix"]);
    expect(result.types).toEqual(["feat", "fix"]);
  });

  test("parses --types with multiple types including spaces after comma", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--types", "feat, fix, chore"]);
    expect(result.types).toEqual(["feat", "fix", "chore"]);
  });

  test("types defaults to empty array when --types is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result.types).toEqual([]);
  });

  test("parses --types combined with --scope and --since", () => {
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
    ]);
    expect(result).toEqual({
      repoPath: ".",
      since: "v1.0.0",
      scope: "auth",
      types: ["feat", "fix"],
      outFile: undefined,
    });
  });

  // --tag flag tests
  test("parses --tag with two tags (v1.0.0..v1.1.0)", () => {
    const result = parseArgs(["bun", "cli.ts", "--tag", "v1.0.0..v1.1.0"]);
    expect(result.tag).toEqual({ from: "v1.0.0", to: "v1.1.0" });
  });

  test("parses --tag with HEAD as target (v1.0.0..HEAD)", () => {
    const result = parseArgs(["bun", "cli.ts", "--tag", "v1.0.0..HEAD"]);
    expect(result.tag).toEqual({ from: "v1.0.0", to: "HEAD" });
  });

  test("defaults to HEAD when to-ref is omitted (v1.0.0..)", () => {
    const result = parseArgs(["bun", "cli.ts", "--tag", "v1.0.0.."]);
    expect(result.tag).toEqual({ from: "v1.0.0", to: "HEAD" });
  });

  test("tag is undefined when --tag is absent", () => {
    const result = parseArgs(["bun", "cli.ts"]);
    expect(result.tag).toBeUndefined();
  });

  test("throws on malformed --tag missing ..", () => {
    expect(() => parseArgs(["bun", "cli.ts", "--tag", "v1.0.0"])).toThrow(
      '--tag: expected format "v1.0.0..v1.1.0" or "v1.0.0..HEAD"',
    );
  });

  test("parses --tag combined with --scope and --types", () => {
    const result = parseArgs([
      "bun",
      "cli.ts",
      ".",
      "--tag",
      "v1.0.0..v2.0.0",
      "--scope",
      "api",
      "--types",
      "feat,fix",
    ]);
    expect(result.tag).toEqual({ from: "v1.0.0", to: "v2.0.0" });
    expect(result.scope).toBe("api");
    expect(result.types).toEqual(["feat", "fix"]);
  });
});
