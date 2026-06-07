// src/format-json.test.ts — TDD for JSON output formatter
import { test, expect, describe } from "bun:test";
import { toJson } from "./format-json";
import type { CommitGroup } from "./format-json";

describe("toJson", () => {
  const groups: CommitGroup[] = [
    {
      type: "feat",
      label: "Features",
      commits: [
        { hash: "abc1234", subject: "add --format json flag", scope: "cli" },
      ],
    },
    {
      type: "fix",
      label: "Bug Fixes",
      commits: [
        { hash: "def5678", subject: "handle empty commit list", scope: null },
      ],
    },
  ];

  test("returns object with version and groups", () => {
    const result = toJson(groups, "1.2.3");
    expect(result.version).toBe("1.2.3");
    expect(result.groups).toHaveLength(2);
  });

  test("omits version field when not provided", () => {
    const result = toJson(groups);
    expect(result.version).toBeUndefined();
  });

  test("group shape matches spec", () => {
    const result = toJson(groups, "1.0.0");
    const feat = result.groups[0];
    expect(feat.type).toBe("feat");
    expect(feat.label).toBe("Features");
    expect(feat.commits).toHaveLength(1);
  });

  test("commit with scope includes scope field", () => {
    const result = toJson(groups, "1.0.0");
    const commit = result.groups[0].commits[0];
    expect(commit.hash).toBe("abc1234");
    expect(commit.subject).toBe("add --format json flag");
    expect(commit.scope).toBe("cli");
  });

  test("commit with null scope omits scope field", () => {
    const result = toJson(groups, "1.0.0");
    const commit = result.groups[1].commits[0];
    expect(commit.hash).toBe("def5678");
    expect(commit.subject).toBe("handle empty commit list");
    expect(commit.scope).toBeUndefined();
  });

  test("empty groups returns empty array", () => {
    const result = toJson([], "1.0.0");
    expect(result.groups).toEqual([]);
  });

  test("serializes cleanly to JSON string", () => {
    const result = toJson(groups, "1.2.3");
    const json = JSON.stringify(result);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe("1.2.3");
    expect(parsed.groups[0].type).toBe("feat");
  });
});
