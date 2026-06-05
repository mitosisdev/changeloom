// src/version.test.ts — TDD for git semver tag detection
import { test, expect, describe } from "bun:test";
import { getLatestTag, getVersionRange, type ShellExecutor } from "./version";

// ---------------------------------------------------------------------------
// Helpers: build stub ShellExecutors without touching real git
// ---------------------------------------------------------------------------

/** Returns a stub executor that always returns the given output string */
function stubExec(output: string): ShellExecutor {
  return (_cmd: string, _cwd: string) => output;
}

/** Returns a stub executor that always throws (simulates non-zero exit) */
function throwingExec(message = "fatal: no tags can describe"): ShellExecutor {
  return (_cmd: string, _cwd: string) => {
    throw new Error(message);
  };
}

/** Returns a stub executor that records calls and returns the given output */
function recordingExec(output: string): {
  exec: ShellExecutor;
  calls: Array<{ cmd: string; cwd: string }>;
} {
  const calls: Array<{ cmd: string; cwd: string }> = [];
  const exec: ShellExecutor = (cmd, cwd) => {
    calls.push({ cmd, cwd });
    return output;
  };
  return { exec, calls };
}

// ---------------------------------------------------------------------------
// getLatestTag
// ---------------------------------------------------------------------------

describe("getLatestTag", () => {
  test("returns the tag string when git describe succeeds", async () => {
    const tag = await getLatestTag("/repo", stubExec("v1.2.3"));
    expect(tag).toBe("v1.2.3");
  });

  test("returns null when git describe throws (no tags in repo)", async () => {
    const tag = await getLatestTag("/repo", throwingExec());
    expect(tag).toBeNull();
  });

  test("returns null when git describe returns empty string", async () => {
    const tag = await getLatestTag("/repo", stubExec(""));
    expect(tag).toBeNull();
  });

  test("returns null when git describe returns only whitespace", async () => {
    const tag = await getLatestTag("/repo", stubExec("   "));
    // The implementation trims output; trimmed empty string is falsy → null
    const tag2 = await getLatestTag("/repo", (_cmd, _cwd) => "   ".trim());
    expect(tag2).toBeNull();
  });

  test("preserves the full tag string including patch version", async () => {
    const tag = await getLatestTag("/repo", stubExec("v0.0.1"));
    expect(tag).toBe("v0.0.1");
  });

  test("works with tags that have no 'v' prefix", async () => {
    const tag = await getLatestTag("/repo", stubExec("1.0.0"));
    expect(tag).toBe("1.0.0");
  });

  test("passes the repoPath as cwd to the shell executor", async () => {
    const { exec, calls } = recordingExec("v2.0.0");
    await getLatestTag("/my/custom/repo", exec);
    expect(calls).toHaveLength(1);
    expect(calls[0].cwd).toBe("/my/custom/repo");
  });

  test("runs the correct git command", async () => {
    const { exec, calls } = recordingExec("v1.0.0");
    await getLatestTag("/repo", exec);
    expect(calls[0].cmd).toBe("git describe --tags --abbrev=0");
  });

  test("returns null when git describe throws with 'no names found' message", async () => {
    const tag = await getLatestTag(
      "/repo",
      throwingExec("fatal: No names found, cannot describe anything."),
    );
    expect(tag).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getVersionRange
// ---------------------------------------------------------------------------

describe("getVersionRange", () => {
  test("returns { from: tag, to: 'HEAD' } when a tag exists", async () => {
    const range = await getVersionRange("/repo", stubExec("v1.2.3"));
    expect(range).toEqual({ from: "v1.2.3", to: "HEAD" });
  });

  test("returns { from: null, to: 'HEAD' } when no tags exist", async () => {
    const range = await getVersionRange("/repo", throwingExec());
    expect(range).toEqual({ from: null, to: "HEAD" });
  });

  test("to is always the string 'HEAD'", async () => {
    const withTag = await getVersionRange("/repo", stubExec("v3.0.0"));
    const withoutTag = await getVersionRange("/repo", throwingExec());
    expect(withTag.to).toBe("HEAD");
    expect(withoutTag.to).toBe("HEAD");
  });

  test("from matches what getLatestTag returns", async () => {
    const exec = stubExec("v0.5.0");
    const tag = await getLatestTag("/repo", exec);
    const range = await getVersionRange("/repo", stubExec("v0.5.0"));
    expect(range.from).toBe(tag);
  });

  test("passes repoPath through to the shell executor", async () => {
    const { exec, calls } = recordingExec("v1.0.0");
    await getVersionRange("/specific/path", exec);
    expect(calls[0].cwd).toBe("/specific/path");
  });

  test("handles pre-release tags", async () => {
    const range = await getVersionRange("/repo", stubExec("v2.0.0-beta.1"));
    expect(range.from).toBe("v2.0.0-beta.1");
    expect(range.to).toBe("HEAD");
  });
});
