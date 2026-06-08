// src/latest-tag.ts — detect the latest git tag and resolve the --unreleased "from" ref

import { execSync } from "node:child_process";

/**
 * Returns the most recent tag in the given repository, or "" if the repo has no
 * tags. Uses `git describe --tags --abbrev=0`, which resolves to the nearest tag
 * reachable from HEAD. Any failure (no tags, not a repo) is treated as "no tag".
 */
export function detectLatestTag(repoPath: string): string {
  try {
    return execSync("git describe --tags --abbrev=0", {
      cwd: repoPath,
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Decide the effective `from` ref for the --unreleased workflow.
 *
 *  - An explicit --from always wins (--from and --unreleased are mutually
 *    exclusive; the explicit flag takes precedence).
 *  - Otherwise use the detected latest tag.
 *  - If no tag was detected (empty string), return undefined so the caller
 *    falls back to showing all commits.
 */
export function resolveUnreleasedFrom(
  explicitFrom: string | undefined,
  latestTag: string,
): string | undefined {
  if (explicitFrom !== undefined) {
    return explicitFrom;
  }
  return latestTag === "" ? undefined : latestTag;
}
