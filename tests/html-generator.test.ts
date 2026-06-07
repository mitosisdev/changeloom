import { describe, it, expect } from "bun:test";
import { generateHtml } from "../src/html-generator";

const sampleSections = [
  {
    type: "feat",
    label: "Features",
    commits: [
      { type: "feat", scope: "cli", subject: "add --publish flag", hash: "abc123", body: null, breaking: false }
    ]
  },
  {
    type: "fix",
    label: "Bug Fixes",
    commits: [
      { type: "fix", scope: null, subject: "correct version output", hash: "def456", body: null, breaking: false }
    ]
  }
];

describe("generateHtml", () => {
  it("returns a string starting with <!DOCTYPE html>", () => {
    const html = generateHtml(sampleSections, "1.0.0");
    expect(html).toMatch(/^<!DOCTYPE html>/);
  });

  it("contains the version in the page title", () => {
    const html = generateHtml(sampleSections, "2.3.1");
    expect(html).toContain("2.3.1");
  });

  it("contains commit subjects", () => {
    const html = generateHtml(sampleSections, "1.0.0");
    expect(html).toContain("add --publish flag");
    expect(html).toContain("correct version output");
  });

  it("has dark background color in inline styles", () => {
    const html = generateHtml(sampleSections, "1.0.0");
    expect(html).toMatch(/#0d1117|#0b0d10/i);
  });

  it("is self-contained (no external script/link tags)", () => {
    const html = generateHtml(sampleSections, "1.0.0");
    expect(html).not.toContain('src="http');
    expect(html).not.toContain('href="http');
  });

  it("contains section labels", () => {
    const html = generateHtml(sampleSections, "1.0.0");
    expect(html).toContain("Features");
    expect(html).toContain("Bug Fixes");
  });
});
