// src/html.test.ts — TDD for --publish HTML generation
import { describe, test, expect } from "bun:test";
import { buildChangelogHtml } from "./html";
import type { HtmlConfig } from "./html";
import type { ChangelogJsonOutput } from "./json-formatter";

// Helper to build a minimal ChangelogJsonOutput
function makeChangelog(overrides: Partial<ChangelogJsonOutput> = {}): ChangelogJsonOutput {
  return {
    version: "unreleased",
    sections: [],
    ...overrides,
  };
}

// ── empty changelog ───────────────────────────────────────────────────────────

describe("buildChangelogHtml — empty changelog", () => {
  test("returns a non-empty HTML string", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    expect(typeof html).toBe("string");
    expect(html.length).toBeGreaterThan(0);
  });

  test("contains <!DOCTYPE html>", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    expect(html).toContain("<!DOCTYPE html>");
  });

  test("contains <html> tag", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    expect(html).toMatch(/<html/);
  });

  test("contains <head> and <body> tags", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    expect(html).toContain("<head>");
    expect(html).toContain("<body>");
  });

  test("contains closing </html> tag", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    expect(html).toContain("</html>");
  });

  test("has no commit entries when sections are empty", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    // No list items should be present
    expect(html).not.toContain("<li");
  });
});

// ── project name / version header ────────────────────────────────────────────

describe("buildChangelogHtml — header", () => {
  test("renders 'Changelog' as page title when no project name given", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    expect(html).toContain("Changelog");
  });

  test("renders provided project name in header", () => {
    const html = buildChangelogHtml(makeChangelog(), { projectName: "myapp" });
    expect(html).toContain("myapp");
  });

  test("renders version when present", () => {
    const html = buildChangelogHtml(makeChangelog({ version: "1.2.3" }), {});
    expect(html).toContain("1.2.3");
  });

  test("renders 'Unreleased' when version is 'unreleased'", () => {
    const html = buildChangelogHtml(makeChangelog({ version: "unreleased" }), {});
    expect(html).toContain("Unreleased");
  });
});

// ── Features section ──────────────────────────────────────────────────────────

describe("buildChangelogHtml — Features section", () => {
  const changelog = makeChangelog({
    sections: [
      {
        type: "feat",
        label: "Features",
        commits: [
          { sha: "abc1234", subject: "add login", scope: null },
          { sha: "def5678", subject: "add signup", scope: "auth" },
        ],
      },
    ],
  });

  test("renders 'Features' section header", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).toContain("Features");
  });

  test("renders commit subject", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).toContain("add login");
  });

  test("renders commit sha", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).toContain("abc1234");
  });

  test("renders scoped commit with scope prefix", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).toContain("auth");
    expect(html).toContain("add signup");
  });

  test("renders commit entries as list items", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).toContain("<li");
  });
});

// ── Bug Fixes section ─────────────────────────────────────────────────────────

describe("buildChangelogHtml — Bug Fixes section", () => {
  const changelog = makeChangelog({
    sections: [
      {
        type: "fix",
        label: "Bug Fixes",
        commits: [
          { sha: "aaa1111", subject: "fix crash on startup", scope: null },
        ],
      },
    ],
  });

  test("renders 'Bug Fixes' section header", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).toContain("Bug Fixes");
  });

  test("renders fix commit subject", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).toContain("fix crash on startup");
  });

  test("renders fix commit sha", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).toContain("aaa1111");
  });
});

// ── Breaking Changes section ──────────────────────────────────────────────────

describe("buildChangelogHtml — Breaking Changes", () => {
  const changelog = makeChangelog({
    sections: [
      {
        type: "feat",
        label: "Features",
        commits: [
          { sha: "bbb2222", subject: "new API design", scope: null, breaking: true },
          { sha: "ccc3333", subject: "normal feature", scope: null },
        ],
      },
      {
        type: "fix",
        label: "Bug Fixes",
        commits: [
          { sha: "ddd4444", subject: "fix regression", scope: null },
        ],
      },
    ],
  });

  test("renders Breaking Changes section when breaking commits exist", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).toContain("Breaking Changes");
  });

  test("breaking subject appears in Breaking Changes", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).toContain("new API design");
  });

  test("Breaking Changes appears before Features in output", () => {
    const html = buildChangelogHtml(changelog, {});
    const breakingIdx = html.indexOf("Breaking Changes");
    const featuresIdx = html.indexOf("Features");
    expect(breakingIdx).toBeLessThan(featuresIdx);
  });
});

// ── Self-contained (no external URLs) ────────────────────────────────────────

describe("buildChangelogHtml — self-contained", () => {
  const changelog = makeChangelog({
    sections: [
      {
        type: "feat",
        label: "Features",
        commits: [{ sha: "aaa0001", subject: "add thing", scope: null }],
      },
    ],
  });

  test("contains no http:// or https:// external URLs in link/script/style tags", () => {
    const html = buildChangelogHtml(changelog, {});
    // Check that no external resources are loaded
    expect(html).not.toMatch(/https?:\/\//);
  });

  test("contains inline <style> block", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).toContain("<style");
  });

  test("does not contain any <script src=", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).not.toContain('<script src=');
  });

  test("does not contain any <link rel=\"stylesheet\"", () => {
    const html = buildChangelogHtml(changelog, {});
    expect(html).not.toMatch(/<link[^>]*stylesheet/);
  });
});

// ── Dark theme colors present ─────────────────────────────────────────────────

describe("buildChangelogHtml — dark theme", () => {
  test("uses dark background color #0d1117", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    expect(html).toContain("#0d1117");
  });

  test("uses text color #c9d1d9", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    expect(html).toContain("#c9d1d9");
  });

  test("uses accent color #58a6ff", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    expect(html).toContain("#58a6ff");
  });

  test("uses section header color #f0f6fc", () => {
    const html = buildChangelogHtml(makeChangelog(), {});
    expect(html).toContain("#f0f6fc");
  });
});

// ── parseArgs --publish flag ──────────────────────────────────────────────────

describe("parseArgs --publish flag", () => {
  test("parses --publish with no value → defaults to 'changelog.html'", async () => {
    const { parseArgs } = await import("./cli");
    const result = parseArgs(["bun", "cli.ts", "--publish"]);
    expect(result.publish).toBe("changelog.html");
  });

  test("parses --publish with custom path", async () => {
    const { parseArgs } = await import("./cli");
    const result = parseArgs(["bun", "cli.ts", "--publish", "dist/out.html"]);
    expect(result.publish).toBe("dist/out.html");
  });

  test("publish is undefined when --publish is absent", async () => {
    const { parseArgs } = await import("./cli");
    const result = parseArgs(["bun", "cli.ts", "."]);
    expect(result.publish).toBeUndefined();
  });

  test("--publish coexists with --version and --scope", async () => {
    const { parseArgs } = await import("./cli");
    const result = parseArgs([
      "bun",
      "cli.ts",
      ".",
      "--publish",
      "out.html",
      "--version",
      "1.0.0",
      "--scope",
      "auth",
    ]);
    expect(result.publish).toBe("out.html");
    expect(result.version).toBe("1.0.0");
    expect(result.scope).toBe("auth");
  });
});
