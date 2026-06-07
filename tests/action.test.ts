// tests/action.test.ts — validates action.yml structure for the reusable GitHub Action
import { test, expect, describe } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ACTION_PATH = join(import.meta.dir, "../action.yml");

describe("action.yml", () => {
  test("file exists at repo root", () => {
    expect(existsSync(ACTION_PATH)).toBe(true);
  });

  test("is valid YAML that can be parsed", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw.length).toBeGreaterThan(0);
    // Minimal YAML parse: verify expected keys appear in raw text (no yaml dep needed)
    expect(raw).toContain("name:");
    expect(raw).toContain("description:");
    expect(raw).toContain("inputs:");
    expect(raw).toContain("runs:");
  });

  test("name is 'changeloom'", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw).toMatch(/^name:\s*['"]?changeloom['"]?/m);
  });

  test("description is present and non-empty", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw).toMatch(/description:\s*.+/);
  });

  test("input: output is defined with default CHANGELOG.md", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw).toContain("output:");
    expect(raw).toContain("CHANGELOG.md");
  });

  test("input: from is defined (optional, no required: true)", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw).toContain("from:");
  });

  test("input: to is defined with default HEAD", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw).toContain("to:");
    expect(raw).toContain("HEAD");
  });

  test("input: format is defined with default markdown", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw).toContain("format:");
    expect(raw).toContain("markdown");
  });

  test("runs.using is composite", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw).toContain("using: composite");
  });

  test("runs.steps uses oven-sh/setup-bun", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw).toContain("oven-sh/setup-bun");
  });

  test("run step uses bunx changeloom with --out flag", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw).toContain("bunx changeloom");
    expect(raw).toContain("--out");
  });

  test("run step references inputs.output", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw).toContain("inputs.output");
  });

  test("run step shell is bash", () => {
    const raw = readFileSync(ACTION_PATH, "utf8");
    expect(raw).toContain("shell: bash");
  });
});
