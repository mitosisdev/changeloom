// src/scope-filter.ts — scope-based commit filtering for changeloom
//
// Provides filterByScope() — filters an array of ConventionalCommit objects
// to only include commits matching the given scope. When scope is null or
// undefined, all commits are returned unchanged.

import type { ConventionalCommit } from "./parser";

/**
 * Filter an array of parsed commits by scope.
 *
 * @param commits - Array of parsed conventional commits
 * @param scope   - Scope string to filter by (e.g. "api"), or null/undefined
 *                  to return all commits unfiltered.
 * @returns Filtered array — only commits whose scope exactly matches `scope`.
 *          When `scope` is null or undefined, the original array is returned.
 */
export function filterByScope(
  commits: ConventionalCommit[],
  scope: string | null | undefined,
): ConventionalCommit[] {
  if (scope == null) return commits;
  return commits.filter((c) => c.scope === scope);
}
