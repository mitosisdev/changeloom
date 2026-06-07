// src/cli-args.test.ts — TDD for CLI argument parsing, including --out, --since, --scope flags
import { test, expect, describe } from "bun:test";
import { parseArgs } from "./cli";

describe("parseArgs", () => {
  test("parses repo path and --out flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--out", "CHANGELOG.md"]);
    expect(result).toEqual({ repoPath: ".", outFile: "CHANGELOG.md", scope: undefined });
  });

  test("leaves outFile undefined when --out is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result).toEqual({ repoPath: ".", outFile: undefined, scope: undefined });
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
    });
  });

  test("parses --since flag", () => {
    const result = parseArgs(["bun", "cli.ts", "--since", "v1.0.0"]);
    expect(result).toEqual({
      repoPath: ".",
      since: "v1.0.0",
      outFile: undefined,
      scope: undefined,
    });
  });

  test("leaves since undefined when --since is absent", () => {
    const result = parseArgs(["bun", "cli.ts"]);
    expect(result).toEqual({
      repoPath: ".",
      since: undefined,
      outFile: undefined,
      scope: undefined,
    });
  });

  test("parses --scope flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--scope", "auth"]);
    expect(result).toEqual({
      repoPath: ".",
      outFile: undefined,
      scope: "auth",
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
    });
  });
});
