// src/type-colors.test.ts — TDD for per-commit-type bullet coloring in --publish HTML
//
// Spec: "Each commit type gets a distinct color (feat=blue, fix=red, chore=gray, etc.)"
// The existing html.ts colored every bullet with a single accent color. These tests
// drive the addition of per-type color classes + matching CSS rules.

import { describe, test, expect } from "bun:test";
import { buildChangelogHtml, TYPE_COLORS } from "./html";
import type { ChangelogJsonOutput } from "./json-formatter";

function makeChangelog(overrides: Partial<ChangelogJsonOutput> = {}): ChangelogJsonOutput {
  return {
    version: "1.0.0",
    sections: [],
    ...overrides,
  };
}

const multiTypeChangelog = makeChangelog({
  sections: [
    {
      type: "feat",
      label: "Features",
      commits: [{ sha: "aaa1111", subject: "add login", scope: "auth" }],
    },
    {
      type: "fix",
      label: "Bug Fixes",
      commits: [{ sha: "bbb2222", subject: "fix crash", scope: null }],
    },
    {
      type: "chore",
      label: "Chores",
      commits: [{ sha: "ccc3333", subject: "bump deps", scope: null }],
    },
  ],
});

// ── per-type CSS classes on commit items ─────────────────────────────────────

describe("per-type bullet color classes", () => {
  test("feat commits carry a commit-item--feat class", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain("commit-item--feat");
  });

  test("fix commits carry a commit-item--fix class", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain("commit-item--fix");
  });

  test("chore commits carry a commit-item--chore class", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain("commit-item--chore");
  });
});

// ── matching CSS rules in the inline <style> block ───────────────────────────

describe("per-type CSS color rules", () => {
  test("style block defines a feat bullet color (blue)", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain(".commit-item--feat .commit-bullet");
    expect(html).toContain(TYPE_COLORS.feat);
  });

  test("style block defines a fix bullet color (red)", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain(".commit-item--fix .commit-bullet");
    expect(html).toContain(TYPE_COLORS.fix);
  });

  test("style block defines a chore bullet color (gray)", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain(".commit-item--chore .commit-bullet");
    expect(html).toContain(TYPE_COLORS.chore);
  });

  test("feat is blue, fix is red, chore is gray — distinct values", () => {
    expect(TYPE_COLORS.feat).toBe("#58a6ff");
    expect(TYPE_COLORS.fix).toBe("#f85149");
    expect(TYPE_COLORS.chore).toBe("#8b949e");
    const vals = [TYPE_COLORS.feat, TYPE_COLORS.fix, TYPE_COLORS.chore];
    expect(new Set(vals).size).toBe(3);
  });
});

// ── coloring does not break existing structure ───────────────────────────────

describe("per-type coloring does not break existing structure", () => {
  test("HTML is still self-contained (no external URLs)", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).not.toMatch(/https?:\/\//);
  });

  test("HTML still contains all commit subjects", () => {
    const html = buildChangelogHtml(multiTypeChangelog, {});
    expect(html).toContain("add login");
    expect(html).toContain("fix crash");
    expect(html).toContain("bump deps");
  });

  test("unknown type falls back to the default bullet color without error", () => {
    const cl = makeChangelog({
      sections: [
        {
          type: "other",
          label: "Other",
          commits: [{ sha: "ddd4444", subject: "misc thing", scope: null }],
        },
      ],
    });
    const html = buildChangelogHtml(cl, {});
    expect(html).toContain("misc thing");
    expect(html).toContain("commit-item");
  });
});
