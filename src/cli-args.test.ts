// src/cli-args.test.ts — TDD for CLI argument parsing, including the --out flag
import { test, expect, describe } from "bun:test";
import { parseArgs } from "./cli";

describe("parseArgs", () => {
  test("parses repo path and --out flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--out", "CHANGELOG.md"]);
    expect(result).toEqual({ repoPath: ".", outFile: "CHANGELOG.md" });
  });

  test("leaves outFile undefined when --out is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result).toEqual({ repoPath: ".", outFile: undefined });
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
    });
  });

  test("parses --since flag", () => {
    const result = parseArgs(["bun", "cli.ts", "--since", "v1.0.0"]);
    expect(result).toEqual({
      repoPath: ".",
      since: "v1.0.0",
      outFile: undefined,
    });
  });

  test("leaves since undefined when --since is absent", () => {
    const result = parseArgs(["bun", "cli.ts"]);
    expect(result).toEqual({
      repoPath: ".",
      since: undefined,
      outFile: undefined,
    });
  });

  test("parses --types with a single type", () => {
    const result = parseArgs(["bun", "cli.ts", "--types", "feat"]);
    expect(result.types).toEqual(["feat"]);
  });

  test("parses --types with multiple comma-separated types", () => {
    const result = parseArgs(["bun", "cli.ts", "--types", "feat,fix,docs"]);
    expect(result.types).toEqual(["feat", "fix", "docs"]);
  });

  test("trims whitespace from each type in --types", () => {
    const result = parseArgs(["bun", "cli.ts", "--types", "feat, fix , docs"]);
    expect(result.types).toEqual(["feat", "fix", "docs"]);
  });

  test("leaves types undefined when --types is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result.types).toBeUndefined();
  });
});
