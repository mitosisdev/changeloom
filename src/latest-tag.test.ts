// src/latest-tag.test.ts — TDD for latest-tag detection + --unreleased resolution
import { test, expect, describe } from "bun:test";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectLatestTag, resolveUnreleasedFrom } from "./latest-tag";

/**
 * resolveUnreleasedFrom is the pure decision function:
 * given the user's explicit --from and the detected latest tag, decide the
 * effective `from` to use when --unreleased is requested.
 *
 *  - explicit --from always wins (mutual exclusivity: --from beats --unreleased)
 *  - otherwise use the detected latest tag
 *  - if no tag detected (empty string), return undefined → show all commits
 */
describe("resolveUnreleasedFrom", () => {
  test("returns the latest tag when no explicit --from is given", () => {
    expect(resolveUnreleasedFrom(undefined, "v1.2.0")).toBe("v1.2.0");
  });

  test("explicit --from wins over the detected tag", () => {
    expect(resolveUnreleasedFrom("v1.0.0", "v1.2.0")).toBe("v1.0.0");
  });

  test("returns undefined when no tag is detected (fallback to all commits)", () => {
    expect(resolveUnreleasedFrom(undefined, "")).toBeUndefined();
  });

  test("explicit --from wins even when no tag detected", () => {
    expect(resolveUnreleasedFrom("v0.9.0", "")).toBe("v0.9.0");
  });
});

describe("detectLatestTag (integration against real git repos)", () => {
  function initRepo(): string {
    const dir = mkdtempSync(join(tmpdir(), "changeloom-latesttag-"));
    const run = (cmd: string) =>
      execSync(cmd, { cwd: dir, stdio: "pipe", encoding: "utf8" });
    run("git init -q");
    run('git config user.email "t@example.com"');
    run('git config user.name "Test"');
    run("git commit -q --allow-empty -m 'feat: first'");
    return dir;
  }

  test("returns empty string when the repo has no tags", () => {
    const dir = initRepo();
    try {
      expect(detectLatestTag(dir)).toBe("");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("returns the most recent tag when tags exist", () => {
    const dir = initRepo();
    const run = (cmd: string) =>
      execSync(cmd, { cwd: dir, stdio: "pipe", encoding: "utf8" });
    try {
      run("git tag v1.0.0");
      run("git commit -q --allow-empty -m 'feat: second'");
      run("git tag v1.1.0");
      expect(detectLatestTag(dir)).toBe("v1.1.0");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
