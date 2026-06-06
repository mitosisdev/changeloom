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

  test("parses --format json flag", () => {
    const result = parseArgs(["bun", "cli.ts", "--format", "json"]);
    expect(result.format).toBe("json");
  });

  test("leaves format undefined when --format is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result.format).toBeUndefined();
  });

  test("parses --format json alongside --version and --out", () => {
    const result = parseArgs([
      "bun",
      "cli.ts",
      ".",
      "--format",
      "json",
      "--version",
      "v2.0.0",
      "--out",
      "out.json",
    ]);
    expect(result).toEqual({
      repoPath: ".",
      format: "json",
      version: "2.0.0",
      outFile: "out.json",
    });
  });
});
