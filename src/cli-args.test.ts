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

  test("parses --scope flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--scope", "api"]);
    expect(result).toEqual({ repoPath: ".", scope: "api" });
  });

  test("leaves scope undefined when --scope is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result.scope).toBeUndefined();
  });

  test("parses --scope with --out together", () => {
    const result = parseArgs([
      "bun",
      "cli.ts",
      ".",
      "--scope",
      "auth",
      "--out",
      "auth-changelog.md",
    ]);
    expect(result).toEqual({
      repoPath: ".",
      scope: "auth",
      outFile: "auth-changelog.md",
    });
  });

  test("parses --scope with --version together", () => {
    const result = parseArgs([
      "bun",
      "cli.ts",
      ".",
      "--scope",
      "ui",
      "--version",
      "v2.0.0",
    ]);
    expect(result).toEqual({
      repoPath: ".",
      scope: "ui",
      version: "2.0.0",
    });
  });
});
