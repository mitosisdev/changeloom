import { describe, it, expect, afterEach } from "bun:test";
import { readFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { buildChangelogHtml } from "./html";
import { generateChangelogJson } from "./json-formatter";
import { parseLog } from "./parser";

const rootDir = join(import.meta.dir, "..");
const pkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"));
const cliFirstLine = readFileSync(join(rootDir, "src/cli.ts"), "utf-8").split("\n")[0];

// ── npm publish config ────────────────────────────────────────────────────────

describe("npm publish config", () => {
  it('package.json has name "changeloom"', () => {
    expect(pkg.name).toBe("changeloom");
  });

  it("package.json has bin.changeloom", () => {
    expect(pkg.bin).toBeDefined();
    expect(pkg.bin["changeloom"]).toBeDefined();
  });

  it('package.json has files array containing "src/"', () => {
    expect(Array.isArray(pkg.files)).toBe(true);
    expect(pkg.files).toContain("src/");
  });

  it('package.json does NOT have "private": true', () => {
    expect(pkg.private).not.toBe(true);
  });

  it('src/cli.ts first line starts with "#!/usr/bin/env bun"', () => {
    expect(cliFirstLine.startsWith("#!/usr/bin/env bun")).toBe(true);
  });
});

// ── --publish HTML output: structure ─────────────────────────────────────────

describe("--publish HTML output: structure", () => {
  const gitLog = [
    "abc1234 feat(auth): add login page",
    "def5678 fix: resolve crash on startup",
    "abc9012 feat!: new API design",
  ].join("\n");

  const commits = parseLog(gitLog);
  const jsonData = generateChangelogJson(commits, { version: "1.0.0", date: "2026-06-08" });

  it("produces a ChangelogJsonOutput with correct version", () => {
    expect(jsonData.version).toBe("1.0.0");
  });

  it("produces sections containing feat and fix groups", () => {
    const types = jsonData.sections.map((s) => s.type);
    expect(types).toContain("feat");
    expect(types).toContain("fix");
  });

  it("buildChangelogHtml returns valid HTML string from generateChangelogJson output", () => {
    const html = buildChangelogHtml(jsonData, { projectName: "myproject" });
    expect(typeof html).toBe("string");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("HTML contains the project name", () => {
    const html = buildChangelogHtml(jsonData, { projectName: "myproject" });
    expect(html).toContain("myproject");
  });

  it("HTML contains the version", () => {
    const html = buildChangelogHtml(jsonData, { projectName: "myproject" });
    expect(html).toContain("1.0.0");
  });

  it("HTML contains commit subjects from all sections", () => {
    const html = buildChangelogHtml(jsonData, {});
    expect(html).toContain("add login page");
    expect(html).toContain("resolve crash on startup");
  });

  it("HTML contains commit sha short codes", () => {
    const html = buildChangelogHtml(jsonData, {});
    expect(html).toContain("abc1234");
    expect(html).toContain("def5678");
  });

  it("HTML hoists breaking change commit above regular sections", () => {
    // generateChangelogJson strips the `breaking` field, so we build
    // the data manually (as html.test.ts does) to exercise the hoisting path.
    const { buildChangelogHtml: buildHtml } = require("./html");
    const changelogWithBreaking = {
      version: "1.0.0",
      sections: [
        {
          type: "feat",
          label: "Features",
          commits: [
            { sha: "ghi9012", subject: "new API design", scope: null, breaking: true },
            { sha: "abc1234", subject: "add login page", scope: "auth" },
          ],
        },
        {
          type: "fix",
          label: "Bug Fixes",
          commits: [{ sha: "def5678", subject: "resolve crash on startup", scope: null }],
        },
      ],
    };
    const html = buildHtml(changelogWithBreaking, {});
    const breakingIdx = html.indexOf("Breaking Changes");
    const featIdx = html.indexOf("Features");
    expect(breakingIdx).toBeGreaterThan(-1);
    expect(breakingIdx).toBeLessThan(featIdx);
  });
});

// ── --publish HTML output: dark theme & self-contained ───────────────────────

describe("--publish HTML output: dark theme and self-contained", () => {
  const commits = parseLog("abc0001 feat: add thing");
  const jsonData = generateChangelogJson(commits);

  it("uses dark background color #0d1117", () => {
    const html = buildChangelogHtml(jsonData, {});
    expect(html).toContain("#0d1117");
  });

  it("uses text color #c9d1d9", () => {
    const html = buildChangelogHtml(jsonData, {});
    expect(html).toContain("#c9d1d9");
  });

  it("uses accent color #58a6ff", () => {
    const html = buildChangelogHtml(jsonData, {});
    expect(html).toContain("#58a6ff");
  });

  it("contains inline <style> block — no external stylesheets", () => {
    const html = buildChangelogHtml(jsonData, {});
    expect(html).toContain("<style");
    expect(html).not.toMatch(/<link[^>]*stylesheet/);
  });

  it("contains no external http/https URLs", () => {
    const html = buildChangelogHtml(jsonData, {});
    expect(html).not.toMatch(/https?:\/\//);
  });

  it("does not include any <script src=", () => {
    const html = buildChangelogHtml(jsonData, {});
    expect(html).not.toContain('<script src=');
  });
});

// ── --publish file I/O: writing changelog.html to disk ───────────────────────

describe("--publish file I/O", () => {
  const outFile = join(rootDir, "_test_publish_output.html");

  afterEach(() => {
    if (existsSync(outFile)) unlinkSync(outFile);
  });

  it("writes a non-empty changelog.html to the given path", async () => {
    const commits = parseLog("abc0001 feat: add thing\ndef0002 fix: fix other thing");
    const jsonData = generateChangelogJson(commits, { version: "2.0.0" });
    const html = buildChangelogHtml(jsonData, { projectName: "test-proj" });

    await Bun.write(outFile, html);

    expect(existsSync(outFile)).toBe(true);
    const written = readFileSync(outFile, "utf-8");
    expect(written).toContain("<!DOCTYPE html>");
    expect(written).toContain("test-proj");
    expect(written).toContain("2.0.0");
    expect(written.length).toBeGreaterThan(500);
  });

  it("written HTML contains commit data from parsed git log", async () => {
    const commits = parseLog("aaa1111 feat(api): add endpoint\nbbb2222 fix: patch memory leak");
    const jsonData = generateChangelogJson(commits);
    const html = buildChangelogHtml(jsonData, {});

    await Bun.write(outFile, html);

    const written = readFileSync(outFile, "utf-8");
    expect(written).toContain("add endpoint");
    expect(written).toContain("patch memory leak");
    expect(written).toContain("aaa1111");
    expect(written).toContain("bbb2222");
  });

  it("written HTML is self-contained with no external URLs", async () => {
    const commits = parseLog("abc0001 feat: add thing");
    const jsonData = generateChangelogJson(commits);
    const html = buildChangelogHtml(jsonData, {});

    await Bun.write(outFile, html);

    const written = readFileSync(outFile, "utf-8");
    expect(written).not.toMatch(/https?:\/\//);
    expect(written).toContain("<style");
  });
});

// ── --publish respects filters (scope, types) ────────────────────────────────

describe("--publish respects scope and types filters", () => {
  it("scope filter limits commits in JSON data fed to HTML", () => {
    // Simulate what CLI does: filter before calling generateChangelogJson.
    // SHAs must be valid hex characters only.
    const { filterByScope } = require("./scope-filter");
    const commits = parseLog(
      "abc0001 feat(auth): add login\ndef0002 feat(payments): add checkout\nabc0003 fix(auth): fix token",
    );
    const authOnly = filterByScope(commits, "auth");
    const jsonData = generateChangelogJson(authOnly);
    const html = buildChangelogHtml(jsonData, {});

    expect(html).toContain("add login");
    expect(html).toContain("fix token");
    expect(html).not.toContain("add checkout");
  });

  it("types filter limits commit types in JSON data fed to HTML", () => {
    const { filterByTypes } = require("./type-filter");
    const commits = parseLog(
      "abc0001 feat: add login\ndef0002 fix: fix crash\nghi0003 chore: update deps",
    );
    const featOnly = filterByTypes(commits, ["feat"]);
    const jsonData = generateChangelogJson(featOnly);
    const html = buildChangelogHtml(jsonData, {});

    expect(html).toContain("add login");
    expect(html).not.toContain("fix crash");
    expect(html).not.toContain("update deps");
  });
});

// ── --publish parseArgs flag ──────────────────────────────────────────────────

describe("parseArgs --publish flag", () => {
  it("parses --publish with no value → defaults to 'changelog.html'", async () => {
    const { parseArgs } = await import("./cli");
    const result = parseArgs(["bun", "cli.ts", "--publish"]);
    expect(result.publish).toBe("changelog.html");
  });

  it("parses --publish with explicit path", async () => {
    const { parseArgs } = await import("./cli");
    const result = parseArgs(["bun", "cli.ts", "--publish", "dist/changelog.html"]);
    expect(result.publish).toBe("dist/changelog.html");
  });

  it("publish is undefined when --publish is absent", async () => {
    const { parseArgs } = await import("./cli");
    const result = parseArgs(["bun", "cli.ts"]);
    expect(result.publish).toBeUndefined();
  });

  it("--publish does not consume a following --flag as its value", async () => {
    const { parseArgs } = await import("./cli");
    const result = parseArgs(["bun", "cli.ts", "--publish", "--version", "1.0.0"]);
    expect(result.publish).toBe("changelog.html");
    expect(result.version).toBe("1.0.0");
  });

  it("--publish coexists with --version, --scope, and --types", async () => {
    const { parseArgs } = await import("./cli");
    const result = parseArgs([
      "bun",
      "cli.ts",
      ".",
      "--publish",
      "out.html",
      "--version",
      "2.0.0",
      "--scope",
      "api",
      "--types",
      "feat,fix",
    ]);
    expect(result.publish).toBe("out.html");
    expect(result.version).toBe("2.0.0");
    expect(result.scope).toBe("api");
    expect(result.types).toEqual(["feat", "fix"]);
  });
});
