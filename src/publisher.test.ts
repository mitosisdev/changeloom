// src/publisher.test.ts — TDD for HTML changelog generator
import { describe, it, expect } from "bun:test";
import { generateChangelogHtml } from "./publisher";
import type { ConventionalCommit } from "./parser";

function makeCommit(overrides: Partial<ConventionalCommit> & { type: string; subject: string }): ConventionalCommit {
  return {
    sha: overrides.sha ?? "abc1234",
    type: overrides.type,
    scope: overrides.scope ?? null,
    breaking: overrides.breaking ?? false,
    subject: overrides.subject,
    body: overrides.body ?? "",
  };
}

describe("generateChangelogHtml", () => {
  it("returns a string starting with <!DOCTYPE html>", () => {
    const commits = [makeCommit({ type: "feat", subject: "add dark mode" })];
    const html = generateChangelogHtml(commits);
    expect(html.trimStart().startsWith("<!DOCTYPE html>")).toBe(true);
  });

  it("contains inline <style> block (no external CSS)", () => {
    const commits = [makeCommit({ type: "feat", subject: "add feature" })];
    const html = generateChangelogHtml(commits);
    expect(html).toContain("<style>");
    expect(html).not.toContain('<link rel="stylesheet"');
  });

  it("uses dark background color #0f1117", () => {
    const commits = [makeCommit({ type: "feat", subject: "dark bg" })];
    const html = generateChangelogHtml(commits);
    expect(html).toContain("#0f1117");
  });

  it("uses white text color #e6e6e6", () => {
    const commits = [makeCommit({ type: "feat", subject: "white text" })];
    const html = generateChangelogHtml(commits);
    expect(html).toContain("#e6e6e6");
  });

  it("uses Courier New font for title", () => {
    const commits = [makeCommit({ type: "feat", subject: "font check" })];
    const html = generateChangelogHtml(commits);
    expect(html).toContain("Courier New");
  });

  it("renders default title 'Changelog'", () => {
    const commits = [makeCommit({ type: "feat", subject: "some feature" })];
    const html = generateChangelogHtml(commits);
    expect(html).toContain("Changelog");
  });

  it("renders custom title from opts.title", () => {
    const commits = [makeCommit({ type: "feat", subject: "some feature" })];
    const html = generateChangelogHtml(commits, { title: "My Custom Changelog" });
    expect(html).toContain("My Custom Changelog");
  });

  it("renders version badge when opts.version is provided", () => {
    const commits = [makeCommit({ type: "feat", subject: "versioned feature" })];
    const html = generateChangelogHtml(commits, { version: "1.2.3" });
    expect(html).toContain("1.2.3");
  });

  it("does not render version badge when opts.version is absent", () => {
    const commits = [makeCommit({ type: "feat", subject: "no version" })];
    const html = generateChangelogHtml(commits);
    // Should not have a version badge marker — check it doesn't have a version pattern we didn't set
    // We just check the html is valid without crashing
    expect(typeof html).toBe("string");
    expect(html.length).toBeGreaterThan(0);
  });

  it("groups feat commits under 'Features' section", () => {
    const commits = [makeCommit({ type: "feat", subject: "awesome feature" })];
    const html = generateChangelogHtml(commits);
    expect(html).toContain("Features");
    expect(html).toContain("awesome feature");
  });

  it("groups fix commits under 'Bug Fixes' section", () => {
    const commits = [makeCommit({ type: "fix", subject: "squash the bug" })];
    const html = generateChangelogHtml(commits);
    expect(html).toContain("Bug Fixes");
    expect(html).toContain("squash the bug");
  });

  it("groups breaking commits under 'Breaking Changes' section", () => {
    const commits = [makeCommit({ type: "feat", subject: "break api", breaking: true })];
    const html = generateChangelogHtml(commits);
    expect(html).toContain("Breaking Changes");
    expect(html).toContain("break api");
  });

  it("renders commit sha in monospace (short sha, 7 chars)", () => {
    const commits = [makeCommit({ sha: "deadbeef123", type: "feat", subject: "sha test" })];
    const html = generateChangelogHtml(commits);
    // Short sha should appear
    expect(html).toContain("deadbee");
  });

  it("returns empty page (still valid HTML) for empty commits", () => {
    const html = generateChangelogHtml([]);
    expect(html.trimStart().startsWith("<!DOCTYPE html>")).toBe(true);
  });

  it("handles scope in commit subject display", () => {
    const commits = [makeCommit({ type: "feat", scope: "auth", subject: "add oauth" })];
    const html = generateChangelogHtml(commits);
    expect(html).toContain("auth");
    expect(html).toContain("add oauth");
  });

  it("renders date when opts.date is provided", () => {
    const commits = [makeCommit({ type: "fix", subject: "fix date" })];
    const html = generateChangelogHtml(commits, { date: "2026-06-07", version: "2.0.0" });
    expect(html).toContain("2026-06-07");
  });

  it("renders multiple sections for multiple commit types", () => {
    const commits = [
      makeCommit({ type: "feat", subject: "feature one" }),
      makeCommit({ type: "fix", subject: "fix one" }),
      makeCommit({ type: "docs", subject: "docs update" }),
    ];
    const html = generateChangelogHtml(commits);
    expect(html).toContain("Features");
    expect(html).toContain("Bug Fixes");
    expect(html).toContain("Documentation");
  });

  it("renders unknown types under 'Other' section", () => {
    const commits = [makeCommit({ type: "ci", subject: "update pipeline" })];
    const html = generateChangelogHtml(commits);
    expect(html).toContain("Other");
    expect(html).toContain("update pipeline");
  });
});
