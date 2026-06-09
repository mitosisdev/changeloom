// tests/changelog-workflow.test.ts
//
// Verifies the self-generated CHANGELOG CI workflow exists and is wired
// correctly. changeloom generates its own changelog on every push to main —
// maximum dogfood. These checks assert the workflow structure without pulling
// in a YAML parser (the repo has none), using targeted content matching.

import { describe, test, expect } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const workflowPath = join(import.meta.dir, "../.github/workflows/generate-changelog.yml");

describe("self-generated CHANGELOG workflow", () => {
  test("workflow file exists", () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  const yml = existsSync(workflowPath)
    ? readFileSync(workflowPath, "utf-8")
    : "";

  test("triggers on push to main", () => {
    expect(yml).toMatch(/on:/);
    expect(yml).toMatch(/push:/);
    expect(yml).toMatch(/branches:\s*\[\s*main\s*\]/);
  });

  test("ignores CHANGELOG.md path to avoid an infinite commit loop", () => {
    expect(yml).toMatch(/paths-ignore:/);
    expect(yml).toMatch(/CHANGELOG\.md/);
  });

  test("checks out full history (fetch-depth: 0)", () => {
    expect(yml).toMatch(/actions\/checkout@v\d+/);
    expect(yml).toMatch(/fetch-depth:\s*0/);
  });

  test("sets up bun", () => {
    expect(yml).toMatch(/oven-sh\/setup-bun@v\d+/);
  });

  test("installs dependencies with bun", () => {
    expect(yml).toMatch(/bun install/);
  });

  test("runs changeloom against itself to generate CHANGELOG.md", () => {
    expect(yml).toMatch(/bun (run )?src\/cli\.ts( \.)? --out CHANGELOG\.md/);
  });

  test("grants contents: write permission for pushing", () => {
    expect(yml).toMatch(/permissions:/);
    expect(yml).toMatch(/contents:\s*write/);
  });

  test("commits and pushes only when CHANGELOG.md changed", () => {
    expect(yml).toMatch(/git diff --quiet/);
    expect(yml).toMatch(/git config user\.email/);
    expect(yml).toMatch(/git commit/);
    expect(yml).toMatch(/git push/);
    expect(yml).toMatch(/\[skip ci\]/);
  });
});
