// src/cli.test.ts — TDD for changeloom CLI
import { test, expect, describe } from "bun:test";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "..");
const CLI = resolve(import.meta.dir, "cli.ts");

describe("CLI", () => {
  test("produces non-empty markdown changelog when run on changeloom's own repo", () => {
    // Run the CLI against the changeloom repo itself
    const output = execSync(`bun ${CLI} ${REPO}`, { encoding: "utf8" });
    expect(output.trim().length).toBeGreaterThan(0);
    // Must contain valid markdown changelog markers
    expect(output).toMatch(/##\s+\[/);
  });

  test("writes CHANGELOG.md to the target repo", () => {
    const changelogPath = join(REPO, "CHANGELOG.md");

    // Clean up any pre-existing file to make the test deterministic
    if (existsSync(changelogPath)) {
      rmSync(changelogPath);
    }

    execSync(`bun ${CLI} ${REPO}`, { encoding: "utf8" });

    expect(existsSync(changelogPath)).toBe(true);
    const content = readFileSync(changelogPath, "utf8");
    expect(content.trim().length).toBeGreaterThan(0);
    expect(content).toMatch(/##\s+\[/);
  });

  test("stdout matches CHANGELOG.md content", () => {
    const changelogPath = join(REPO, "CHANGELOG.md");

    const output = execSync(`bun ${CLI} ${REPO}`, { encoding: "utf8" });
    const fileContent = readFileSync(changelogPath, "utf8");

    expect(output.trim()).toBe(fileContent.trim());
  });

  test("uses --pretty=format with full SHA format (no-merges)", () => {
    // The output should contain 7-char short SHAs (sliced from full SHAs by generator)
    const output = execSync(`bun ${CLI} ${REPO}`, { encoding: "utf8" });
    // Short SHAs appear in parentheses at end of bullet lines
    expect(output).toMatch(/\([0-9a-f]{7}\)/);
  });
});
