// src/cli.test.ts — subprocess-based tests for the changeloom CLI
import { test, expect, describe } from "bun:test";
import { join } from "node:path";

const CLI = join(import.meta.dir, "cli.ts");
const REPO_ROOT = join(import.meta.dir, "..");

describe("changeloom CLI", () => {
  test("running against the repo directory produces output with a version header", () => {
    const result = Bun.spawnSync(["bun", CLI, REPO_ROOT], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = result.stdout.toString();
    // Must contain either [Unreleased] or a version header like [v1.2.3]
    expect(stdout).toMatch(/## \[(Unreleased|v\d+\.\d+\.\d+)/);
    expect(result.exitCode).toBe(0);
  });

  test("--version flag produces a versioned header", () => {
    const result = Bun.spawnSync(["bun", CLI, REPO_ROOT, "--version", "1.0.0"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = result.stdout.toString();
    expect(stdout).toContain("## [v1.0.0]");
    expect(result.exitCode).toBe(0);
  });

  test("invalid repo path exits non-zero and prints to stderr", () => {
    const result = Bun.spawnSync(["bun", CLI, "/tmp/nonexistent-repo-xyz"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).not.toBe(0);
    const stderr = result.stderr.toString();
    expect(stderr.length).toBeGreaterThan(0);
  });

  test("output contains at least the scaffold commit entry", () => {
    const result = Bun.spawnSync(["bun", CLI, REPO_ROOT], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = result.stdout.toString();
    // The scaffold commit 2af19fc must appear in the changelog
    expect(stdout).toContain("2af19fc");
    expect(result.exitCode).toBe(0);
  });
});
