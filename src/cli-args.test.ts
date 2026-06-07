// src/cli-args.test.ts — TDD for CLI argument parsing, including --out, --since, --scope, --types, --publish flags
import { test, expect, describe } from "bun:test";
import { parseArgs } from "./cli";

describe("parseArgs", () => {
  test("parses repo path and --out flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--out", "CHANGELOG.md"]);
    expect(result).toEqual({ repoPath: ".", outFile: "CHANGELOG.md", scope: undefined, types: [], publish: false });
  });

  test("leaves outFile undefined when --out is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result).toEqual({ repoPath: ".", outFile: undefined, scope: undefined, types: [], publish: false });
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
      publish: false,
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
      publish: false,
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
      publish: false,
    });
  });

  test("parses --scope flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--scope", "auth"]);
    expect(result).toEqual({
      repoPath: ".",
      outFile: undefined,
      scope: "auth",
      types: [],
      publish: false,
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
      publish: false,
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
      publish: false,
    });
  });

  // --publish flag tests
  test("parses --publish flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--publish"]);
    expect(result.publish).toBe(true);
  });

  test("publish defaults to false when --publish is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result.publish).toBe(false);
  });

  test("parses --publish combined with --version and --out", () => {
    const result = parseArgs([
      "bun",
      "cli.ts",
      ".",
      "--version",
      "v2.0.0",
      "--publish",
      "--out",
      "custom.html",
    ]);
    expect(result).toEqual({
      repoPath: ".",
      version: "2.0.0",
      outFile: "custom.html",
      scope: undefined,
      types: [],
      publish: true,
    });
  });

  test("parses --publish combined with --since", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--since", "v1.0.0", "--publish"]);
    expect(result.publish).toBe(true);
    expect(result.since).toBe("v1.0.0");
  });
});
