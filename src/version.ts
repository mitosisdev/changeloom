// src/version.ts — git semver tag detection for changeloom
//
// Detects the nearest semver tag reachable from HEAD in a given repo path.
// Used by the changelog generator to produce version-aware section headers
// like "## v1.2.3 (2026-06-05)" instead of "## [Unreleased]".

import { execSync } from "child_process";

export interface VersionRange {
  /** Nearest semver tag reachable from HEAD, or null if none found */
  from: string | null;
  /** Always "HEAD" — used as the upper bound in git log filtering */
  to: string;
}

/**
 * Shell executor type — injectable for testing.
 * Runs a command in the given cwd and returns trimmed stdout,
 * or throws if the command exits non-zero.
 */
export type ShellExecutor = (cmd: string, cwd: string) => string;

/**
 * Default shell executor using Node's execSync.
 */
export const defaultExec: ShellExecutor = (cmd: string, cwd: string): string => {
  return execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
};

/**
 * Returns the nearest semver tag reachable from HEAD in the given repo path,
 * or null if no tags are found.
 *
 * Runs: git describe --tags --abbrev=0
 *
 * @param repoPath - Absolute path to the git repository root
 * @param exec - Shell executor (injectable for testing)
 */
export async function getLatestTag(
  repoPath: string,
  exec: ShellExecutor = defaultExec,
): Promise<string | null> {
  try {
    const tag = exec("git describe --tags --abbrev=0", repoPath);
    return tag.length > 0 ? tag : null;
  } catch {
    // Command fails when there are no tags reachable from HEAD
    return null;
  }
}

/**
 * Returns a version range suitable for use in git log filtering:
 *   { from: <nearest semver tag or null>, to: "HEAD" }
 *
 * When `from` is null there are no tags — the caller should log the full
 * history up to HEAD (no lower bound).
 *
 * @param repoPath - Absolute path to the git repository root
 * @param exec - Shell executor (injectable for testing)
 */
export async function getVersionRange(
  repoPath: string,
  exec: ShellExecutor = defaultExec,
): Promise<VersionRange> {
  const from = await getLatestTag(repoPath, exec);
  return { from, to: "HEAD" };
}
