// src/cli-args.test.ts — TDD for CLI argument parsing, including --out, --since, --scope, --publish flags
import { test, expect, describe } from "bun:test";
import { parseArgs } from "./cli";

describe("parseArgs", () => {
  test("parses repo path and --out flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--out", "CHANGELOG.md"]);
    expect(result).toEqual({ repoPath: ".", outFile: "CHANGELOG.md", scope: undefined, publish: false });
  });

  test("leaves outFile undefined when --out is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result).toEqual({ repoPath: ".", outFile: undefined, scope: undefined, publish: false });
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
      publish: false,
    });
  });

  test("parses --scope flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--scope", "auth"]);
    expect(result).toEqual({
      repoPath: ".",
      outFile: undefined,
      scope: "auth",
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
      publish: false,
    });
  });

  test("parses --publish flag", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--publish"]);
    expect(result.publish).toBe(true);
  });

  test("publish defaults to false when --publish is absent", () => {
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result.publish).toBe(false);
  });

  test("parses --publish combined with --version", () => {
    const result = parseArgs(["bun", "cli.ts", ".", "--version", "1.2.3", "--publish"]);
    expect(result.publish).toBe(true);
    expect(result.version).toBe("1.2.3");
  });
});
