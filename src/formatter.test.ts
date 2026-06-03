// src/formatter.test.ts — TDD tests for formatChangelog
import { describe, expect, it } from "bun:test";
import { formatChangelog } from "./formatter.js";

// Compatible local type (mirrors parser PR #1 ConventionalCommit shape)
interface ConventionalCommit {
  type: string;
  scope?: string;
  breaking: boolean;
  subject: string;
}

describe("formatChangelog", () => {
  it("returns empty string for empty input", () => {
    expect(formatChangelog([])).toBe("");
  });

  it("returns unreleased header when no version given", () => {
    const commits: ConventionalCommit[] = [
      { type: "feat", breaking: false, subject: "add login" },
    ];
    const result = formatChangelog(commits);
    expect(result).toContain("## Unreleased");
  });

  it("returns versioned header when version provided", () => {
    const commits: ConventionalCommit[] = [
      { type: "feat", breaking: false, subject: "add login" },
    ];
    const result = formatChangelog(commits, "1.0.0", "2026-06-03");
    expect(result).toContain("## [1.0.0] — 2026-06-03");
  });

  it("groups feat commits under Added", () => {
    const commits: ConventionalCommit[] = [
      { type: "feat", breaking: false, subject: "add login" },
      { type: "feat", breaking: false, subject: "add logout" },
    ];
    const result = formatChangelog(commits);
    expect(result).toContain("### Added");
    expect(result).toContain("- add login");
    expect(result).toContain("- add logout");
  });

  it("groups fix commits under Fixed", () => {
    const commits: ConventionalCommit[] = [
      { type: "fix", breaking: false, subject: "fix null pointer" },
    ];
    const result = formatChangelog(commits);
    expect(result).toContain("### Fixed");
    expect(result).toContain("- fix null pointer");
  });

  it("groups refactor, perf, style commits under Changed", () => {
    const commits: ConventionalCommit[] = [
      { type: "refactor", breaking: false, subject: "extract helper" },
      { type: "perf", breaking: false, subject: "cache results" },
      { type: "style", breaking: false, subject: "fix indentation" },
    ];
    const result = formatChangelog(commits);
    expect(result).toContain("### Changed");
    expect(result).toContain("- extract helper");
    expect(result).toContain("- cache results");
    expect(result).toContain("- fix indentation");
  });

  it("groups deprecated commits under Removed", () => {
    const commits: ConventionalCommit[] = [
      { type: "deprecated", breaking: false, subject: "remove old API" },
    ];
    const result = formatChangelog(commits);
    expect(result).toContain("### Removed");
    expect(result).toContain("- remove old API");
  });

  it("groups security commits under Security", () => {
    const commits: ConventionalCommit[] = [
      { type: "security", breaking: false, subject: "patch XSS vulnerability" },
    ];
    const result = formatChangelog(commits);
    expect(result).toContain("### Security");
    expect(result).toContain("- patch XSS vulnerability");
  });

  it("groups unknown types under Other", () => {
    const commits: ConventionalCommit[] = [
      { type: "chore", breaking: false, subject: "update deps" },
      { type: "docs", breaking: false, subject: "update readme" },
    ];
    const result = formatChangelog(commits);
    expect(result).toContain("### Other");
    expect(result).toContain("- update deps");
    expect(result).toContain("- update readme");
  });

  it("renders scope in bold before subject", () => {
    const commits: ConventionalCommit[] = [
      { type: "feat", scope: "auth", breaking: false, subject: "add OAuth" },
    ];
    const result = formatChangelog(commits);
    expect(result).toContain("- **auth:** add OAuth");
  });

  it("renders commit without scope as plain subject", () => {
    const commits: ConventionalCommit[] = [
      { type: "fix", breaking: false, subject: "fix crash" },
    ];
    const result = formatChangelog(commits);
    expect(result).toContain("- fix crash");
    // Should NOT have bold prefix
    expect(result).not.toContain("- **");
  });

  it("puts breaking changes at top under Breaking Changes section", () => {
    const commits: ConventionalCommit[] = [
      { type: "feat", breaking: true, subject: "new auth flow", scope: "auth" },
      { type: "fix", breaking: false, subject: "fix crash" },
    ];
    const result = formatChangelog(commits);
    expect(result).toContain("### ⚠ Breaking Changes");
    const breakingIdx = result.indexOf("### ⚠ Breaking Changes");
    const fixedIdx = result.indexOf("### Fixed");
    expect(breakingIdx).toBeLessThan(fixedIdx);
    // Breaking commit also appears in its type section
    expect(result).toContain("- **auth:** new auth flow");
  });

  it("does not render empty sections", () => {
    const commits: ConventionalCommit[] = [
      { type: "feat", breaking: false, subject: "add feature" },
    ];
    const result = formatChangelog(commits);
    expect(result).not.toContain("### Fixed");
    expect(result).not.toContain("### Changed");
    expect(result).not.toContain("### Removed");
    expect(result).not.toContain("### Security");
    expect(result).not.toContain("### Other");
  });

  it("handles multiple types mixed together correctly", () => {
    const commits: ConventionalCommit[] = [
      { type: "feat", breaking: false, subject: "add search" },
      { type: "fix", scope: "db", breaking: false, subject: "fix deadlock" },
      { type: "refactor", breaking: false, subject: "simplify parser" },
      { type: "chore", breaking: false, subject: "bump deps" },
      { type: "security", breaking: false, subject: "patch CVE-2026-001" },
    ];
    const result = formatChangelog(commits);
    expect(result).toContain("### Added");
    expect(result).toContain("### Fixed");
    expect(result).toContain("### Changed");
    expect(result).toContain("### Security");
    expect(result).toContain("### Other");
    expect(result).toContain("- add search");
    expect(result).toContain("- **db:** fix deadlock");
    expect(result).toContain("- simplify parser");
    expect(result).toContain("- bump deps");
    expect(result).toContain("- patch CVE-2026-001");
  });

  it("version header without date omits date part", () => {
    const commits: ConventionalCommit[] = [
      { type: "feat", breaking: false, subject: "add thing" },
    ];
    const result = formatChangelog(commits, "2.0.0");
    expect(result).toContain("## [2.0.0]");
    expect(result).not.toContain("—");
  });
});
