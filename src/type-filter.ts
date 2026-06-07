// src/type-filter.ts — filter commits by type for changeloom
import type { ConventionalCommit } from "./parser";

/**
 * Returns commits whose type matches one of the given types (case-insensitive).
 *
 * - types=[] → returns all commits unchanged (no filter applied)
 * - types=['feat','fix'] → returns only commits with type 'feat' or 'fix'
 */
export function filterByTypes(
  commits: ConventionalCommit[],
  types: string[],
): ConventionalCommit[] {
  if (types.length === 0) return commits;
  const lowerTypes = types.map((t) => t.toLowerCase());
  return commits.filter((c) => lowerTypes.includes(c.type.toLowerCase()));
}
