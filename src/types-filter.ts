// src/types-filter.ts — filter commits by type for the --types CLI flag

import type { ConventionalCommit } from "./parser";

/**
 * Returns commits whose type is in the given types array (case-insensitive).
 * If types is empty, returns all commits unchanged (no filter applied).
 */
export function filterByTypes(
  commits: ConventionalCommit[],
  types: string[],
): ConventionalCommit[] {
  if (types.length === 0) return commits;
  const normalized = types.map((t) => t.toLowerCase());
  return commits.filter((c) => normalized.includes(c.type.toLowerCase()));
}
