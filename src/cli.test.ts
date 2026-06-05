// src/cli.test.ts — subprocess integration test for the CLI binary
import { test, expect, describe } from "bun:test";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");

describe("CLI binary (subprocess integration)", () => {
  test("exits 0 and prints valid markdown when run against its own repo", () => {
    const result = spawnSync("bun", ["src/cli.ts", "."], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("## [Unreleased]");
    expect(result.stdout).toContain("### Features");
    expect(result.stderr).toBe("");
  });

  test("exits 0 and prints versioned header when --version is passed", () => {
    const result = spawnSync("bun", ["src/cli.ts", ".", "--version", "1.0.0"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("## [v1.0.0]");
    expect(result.stdout).not.toContain("Unreleased");
  });

  test("exits 1 with error message when given a non-existent path", () => {
    const result = spawnSync("bun", ["src/cli.ts", "/nonexistent/path"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("error:");
  });
});
