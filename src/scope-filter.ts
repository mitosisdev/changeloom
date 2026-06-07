// src/scope-filter.ts — filter commits by scope for changeloom
import type { ConventionalCommit } from "./parser";

/**
 * Returns commits whose scope matches the given scope string (case-insensitive).
 *
 * - scope="" → returns all commits unchanged (no filter applied)
 * - commit.scope===null → does NOT match any non-empty scope string
 */
export function filterByScope(
  commits: ConventionalCommit[],
  scope: string,
): ConventionalCommit[] {
  if (scope === "") return commits;
  const lower = scope.toLowerCase();
  return commits.filter(
    (c) => c.scope !== null && c.scope.toLowerCase() === lower,
  );
}
