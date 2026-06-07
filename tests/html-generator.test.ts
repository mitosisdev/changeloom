// tests/html-generator.test.ts — TDD tests for generateHtml()
import { test, expect, describe } from "bun:test";
import { generateHtml } from "../src/html-generator";
import type { ConventionalCommit } from "../src/parser";

// Sample entries for tests
const sampleEntries: ConventionalCommit[] = [
  {
    sha: "abc1234",
    type: "feat",
    scope: "auth",
    breaking: false,
    subject: "add OAuth2 login",
    body: "",
  },
  {
    sha: "def5678",
    type: "fix",
    scope: null,
    breaking: false,
    subject: "correct token expiry",
    body: "",
  },
  {
    sha: "ghi9012",
    type: "chore",
    scope: "deps",
    breaking: false,
    subject: "bump bun to 1.3",
    body: "",
  },
];

describe("generateHtml", () => {
  test("returns a string starting with <!DOCTYPE html>", () => {
    const html = generateHtml(sampleEntries);
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i);
  });

  test("contains <title>Changelog</title>", () => {
    const html = generateHtml(sampleEntries);
    expect(html).toContain("<title>Changelog</title>");
  });

  test("contains commit type labels (Features, Bug Fixes)", () => {
    const html = generateHtml(sampleEntries);
    expect(html).toContain("Features");
    expect(html).toContain("Bug Fixes");
  });

  test("contains the commit subjects from entries", () => {
    const html = generateHtml(sampleEntries);
    expect(html).toContain("add OAuth2 login");
    expect(html).toContain("correct token expiry");
    expect(html).toContain("bump bun to 1.3");
  });

  test("contains dark background CSS color #0b0d10", () => {
    const html = generateHtml(sampleEntries);
    expect(html).toContain("#0b0d10");
  });

  test("contains purple accent color #8A2BE2 (case-insensitive)", () => {
    const html = generateHtml(sampleEntries);
    expect(html.toLowerCase()).toContain("#8a2be2");
  });

  test("is self-contained — no external CDN links", () => {
    const html = generateHtml(sampleEntries);
    // Should not reference external URLs for stylesheets or scripts
    expect(html).not.toMatch(/https?:\/\/[^"']*\.(css|js)/i);
    // No link[rel=stylesheet] pointing anywhere external
    expect(html).not.toMatch(/rel=["']stylesheet["'][^>]*href=["']https?:/i);
    expect(html).not.toMatch(/src=["']https?:/i);
  });

  test("contains inline <style> block (self-contained CSS)", () => {
    const html = generateHtml(sampleEntries);
    expect(html).toContain("<style>");
    expect(html).toContain("</style>");
  });

  test("scoped commit shows scope badge in output", () => {
    const html = generateHtml(sampleEntries);
    // 'auth' scope should appear somewhere
    expect(html).toContain("auth");
  });

  test("returns empty-safe output for empty entries", () => {
    const html = generateHtml([]);
    // Should still return a valid HTML shell
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i);
    expect(html).toContain("<title>Changelog</title>");
  });

  test("contains sha short-form for entries", () => {
    const html = generateHtml(sampleEntries);
    // short sha = first 7 chars
    expect(html).toContain("abc1234");
    expect(html).toContain("def5678");
  });
});
