// src/type-filter.ts — filter conventional commits by type
import type { ConventionalCommit } from "./parser";

/**
 * Filter a list of commits to only those whose type appears in the given
 * types array. When types is empty, all commits are returned unchanged.
 */
export function filterByTypes(
  commits: ConventionalCommit[],
  types: string[],
): ConventionalCommit[] {
  if (types.length === 0) return commits;
  const typeSet = new Set(types);
  return commits.filter((c) => typeSet.has(c.type));
}
